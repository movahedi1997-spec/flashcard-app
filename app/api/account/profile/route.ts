/**
 * PATCH /api/account/profile
 *
 * Updates the authenticated user's public profile fields.
 *
 * Body (all optional):
 *   { name?, username?, bio?, avatarUrl? }
 *
 * Rules:
 *   - username must be 3–30 chars, alphanumeric + hyphens/underscores only
 *   - username uniqueness validated (case-insensitive)
 *   - bio max 300 chars
 *   - name max 80 chars
 *
 * Response 200: { user: { id, name, username, bio, avatarUrl } }
 * Response 400: validation error
 * Response 409: username already taken
 * Response 401: not authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,30}$/;

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { name, username, bio, avatarUrl, phoneNumber } = body as {
    name?:        string;
    username?:    string;
    bio?:         string;
    avatarUrl?:   string;
    phoneNumber?: string;
  };

  // ── Validation ────────────────────────────────────────────────────────────

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 80) {
      return NextResponse.json({ error: 'Name must be 1–80 characters.' }, { status: 400 });
    }
  }

  if (username !== undefined && username !== null && username !== '') {
    if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3–30 characters: letters, numbers, hyphens, underscores only.' },
        { status: 400 },
      );
    }

    // Case-insensitive uniqueness check (excluding current user)
    const existing = await query<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2`,
      [username, user.userId],
    );
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 });
    }
  }

  if (bio !== undefined && bio !== null) {
    if (typeof bio !== 'string' || bio.length > 300) {
      return NextResponse.json({ error: 'Bio must be 300 characters or fewer.' }, { status: 400 });
    }
  }

  // ── Build update ─────────────────────────────────────────────────────────

  const setClauses: string[] = ['updated_at = NOW()'];
  const values: unknown[]    = [];

  if (name !== undefined) {
    values.push(name.trim());
    setClauses.push(`name = $${values.length}`);
  }
  if (username !== undefined) {
    values.push(username || null); // empty string → NULL (remove username)
    setClauses.push(`username = $${values.length}`);
  }
  if (bio !== undefined) {
    values.push(bio || null);
    setClauses.push(`bio = $${values.length}`);
  }
  if (avatarUrl !== undefined) {
    values.push(avatarUrl || null);
    setClauses.push(`avatar_url = $${values.length}`);
  }
  if (phoneNumber !== undefined) {
    const cleaned = phoneNumber?.trim() ?? '';
    if (cleaned && !/^\+?[\d\s\-().]{7,20}$/.test(cleaned)) {
      return NextResponse.json({ error: 'Invalid phone number format.' }, { status: 400 });
    }
    values.push(cleaned || null);
    setClauses.push(`phone_number = $${values.length}`);
  }

  if (setClauses.length === 1) {
    // Only updated_at — nothing to do
    return NextResponse.json({ error: 'No fields provided.' }, { status: 400 });
  }

  values.push(user.userId);

  try {
    const result = await query<{
      id: string; name: string; username: string | null;
      bio: string | null; avatar_url: string | null;
    }>(
      `UPDATE users SET ${setClauses.join(', ')}
         WHERE id = $${values.length}
         RETURNING id, name, username, bio, avatar_url`,
      values,
    );

    const updated = result.rows[0];

    return NextResponse.json({
      user: {
        id:        updated.id,
        name:      updated.name,
        username:  updated.username,
        bio:       updated.bio,
        avatarUrl: updated.avatar_url,
      },
    });
  } catch (err) {
    console.error('[PATCH /api/account/profile]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
