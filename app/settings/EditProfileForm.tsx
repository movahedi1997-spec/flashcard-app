'use client';

/**
 * EditProfileForm — profile editing section in /settings.
 *
 * Allows the user to update: display name, username (public slug),
 * bio, and avatar URL.
 */

import { useState } from 'react';
import { Check, Loader2, ExternalLink } from 'lucide-react';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

interface Props {
  initialName:      string;
  initialUsername:  string | null;
  initialBio:       string | null;
  initialAvatarUrl: string | null;
}

export default function EditProfileForm({
  initialName,
  initialUsername,
  initialBio,
  initialAvatarUrl,
}: Props) {
  const [name,      setName]      = useState(initialName      ?? '');
  const [username,  setUsername]  = useState(initialUsername   ?? '');
  const [bio,       setBio]       = useState(initialBio        ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl  ?? '');

  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetchWithRefresh('/api/account/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:      name.trim()      || undefined,
          username:  username.trim()  || '',
          bio:       bio.trim()       || '',
          avatarUrl: avatarUrl.trim() || '',
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Failed to save profile.');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  const profileUrl = username.trim()
    ? `/creators/${username.trim().toLowerCase()}`
    : null;

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Display name */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Display name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Username */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Username
          <span className="ml-1 normal-case font-normal text-gray-400">(used in your public profile URL)</span>
        </label>
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-xs text-gray-400 sm:text-sm sm:flex-shrink-0">/creators/</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your-username"
            maxLength={30}
            pattern="[a-zA-Z0-9_-]{3,30}"
            title="3–30 characters: letters, numbers, hyphens, underscores"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View profile
          </a>
        )}
      </div>

      {/* Bio */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Bio
          <span className="ml-1 normal-case font-normal text-gray-400">({bio.length}/300)</span>
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell people about yourself…"
          rows={3}
          maxLength={300}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 resize-none focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Avatar URL */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Avatar URL
          <span className="ml-1 normal-case font-normal text-gray-400">(paste a direct image link)</span>
        </label>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {avatarUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={avatarUrl}
            alt="Avatar preview"
            className="mt-2 h-12 w-12 rounded-full object-cover border border-gray-100"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
      >
        {saving  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> :
         saved   ? <><Check   className="h-4 w-4" /> Saved!</> :
                   'Save profile'}
      </button>
    </form>
  );
}
