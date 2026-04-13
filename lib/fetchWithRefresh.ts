'use client';

/**
 * lib/fetchWithRefresh.ts
 *
 * A drop-in replacement for fetch() in client components that transparently
 * handles access token expiry.
 *
 * Flow:
 *   1. Make the request normally.
 *   2. If the server returns 401, POST /api/auth/refresh to rotate the token pair.
 *   3. If refresh succeeds, retry the original request once with the new cookie.
 *   4. If refresh fails (expired / revoked refresh token), redirect to /login.
 *
 * Why this matters:
 *   The access token (cookie `token`) expires after 15 minutes. Without this
 *   wrapper, any API call made after 15 minutes of inactivity will silently fail
 *   with 401. This wrapper makes the expiry invisible to the user as long as
 *   their refresh token (30 days) is still valid.
 *
 * Usage — drop-in for fetch():
 *   const res = await fetchWithRefresh('/api/decks');
 *   const res = await fetchWithRefresh('/api/cards', { method: 'POST', body: … });
 */

let _refreshing: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token.
 * Returns true if a new token pair was issued, false if the refresh token is
 * also expired or revoked (user must re-login).
 *
 * De-duplicates concurrent refresh calls so that multiple simultaneous 401s
 * only trigger one refresh round-trip.
 */
async function tryRefresh(): Promise<boolean> {
  if (_refreshing) return _refreshing;

  _refreshing = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    } finally {
      _refreshing = null;
    }
  })();

  return _refreshing;
}

/**
 * fetchWithRefresh — transparent access-token refresh for client-side API calls.
 *
 * @param input  URL string or Request (same as fetch()).
 * @param init   RequestInit options (same as fetch()).
 * @returns      The Response — either from the first attempt (non-401) or the
 *               retry after a successful token refresh.
 */
export async function fetchWithRefresh(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status !== 401) return res;

  // Access token expired — try to silently rotate it.
  const refreshed = await tryRefresh();

  if (!refreshed) {
    // Refresh token also gone — send user to login.
    // Only redirect in browser environments (not during SSR / test).
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return res; // return the original 401 so callers can handle it
  }

  // Retry with the new access token that was set in the cookie by the refresh endpoint.
  return fetch(input, init);
}
