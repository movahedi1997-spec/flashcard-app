/**
 * GET /api/og?deckId=<uuid>&format=landscape|story
 *
 * Generates a social-share Open Graph image for a public deck.
 *
 * Formats:
 *   landscape  — 1200 × 630  (Twitter, WhatsApp, iMessage, Facebook)
 *   story      — 1080 × 1920 (Instagram Story, TikTok)
 *
 * Cached by the CDN via Cache-Control: public, max-age=3600, s-maxage=86400.
 * No object storage needed — Edge rendering is fast enough and the CDN cache
 * makes per-request cost negligible.
 *
 * Auth: not required. Only public decks are served (404 for private/missing).
 */

import { ImageResponse } from 'next/og';
import { NextRequest }    from 'next/server';
import { query }          from '@/lib/db';

export const runtime = 'nodejs'; // @vercel/og works in nodejs runtime too

// ── Palette — mirrors front-end PALETTES map ─────────────────────────────────

const PALETTE: Record<string, { from: string; to: string }> = {
  indigo:  { from: '#4f46e5', to: '#7c3aed' },
  emerald: { from: '#059669', to: '#0d9488' },
  amber:   { from: '#f59e0b', to: '#f97316' },
  rose:    { from: '#f43f5e', to: '#db2777' },
  sky:     { from: '#0ea5e9', to: '#06b6d4' },
};

const DEFAULT_PALETTE = PALETTE.indigo;

// ── DB row types ──────────────────────────────────────────────────────────────

interface DeckRow {
  title:        string;
  description:  string;
  emoji:        string;
  color:        string;
  subject:      string | null;
  card_count:   string;
  copy_count:   string;
  creator_name: string;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deckId = searchParams.get('deckId');
  const format = searchParams.get('format') === 'story' ? 'story' : 'landscape';

  if (!deckId) {
    return new Response('Missing deckId', { status: 400 });
  }

  // ── Fetch deck ──────────────────────────────────────────────────────────────
  let deck: DeckRow | null = null;
  try {
    const result = await query<DeckRow>(
      `SELECT d.title, d.description, d.emoji, d.color, d.subject,
              COUNT(c.id)::text AS card_count,
              COALESCE(d.copy_count, 0)::text AS copy_count,
              u.name AS creator_name
         FROM decks d
         JOIN users u ON u.id = d.user_id
         LEFT JOIN cards c ON c.deck_id = d.id
        WHERE d.id = $1 AND d.is_public = true
        GROUP BY d.id, u.name`,
      [deckId],
    );
    deck = result.rows[0] ?? null;
  } catch {
    return new Response('Internal server error', { status: 500 });
  }

  if (!deck) {
    return new Response('Deck not found', { status: 404 });
  }

  const palette  = PALETTE[deck.color] ?? DEFAULT_PALETTE;
  const cardCount = parseInt(deck.card_count, 10);
  const copyCount = parseInt(deck.copy_count, 10);

  const isStory   = format === 'story';
  const W = isStory ? 1080 : 1200;
  const H = isStory ? 1920 : 630;

  // ── Render ──────────────────────────────────────────────────────────────────

  const img = new ImageResponse(
    isStory ? (
      // ── Instagram Story (1080 × 1920) ──────────────────────────────────────
      <div
        style={{
          width: W, height: H,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(160deg, ${palette.from} 0%, ${palette.to} 100%)`,
          fontFamily: 'sans-serif',
          padding: '80px 60px',
        }}
      >
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 80 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36,
          }}>⚡</div>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 36, fontWeight: 700 }}>
            FlashcardAI
          </span>
        </div>

        {/* Big emoji */}
        <div style={{ fontSize: 160, lineHeight: 1, marginBottom: 40 }}>{deck.emoji}</div>

        {/* Title */}
        <div style={{
          color: '#fff', fontSize: 72, fontWeight: 900,
          textAlign: 'center', lineHeight: 1.1,
          marginBottom: 32, maxWidth: 900,
        }}>
          {deck.title}
        </div>

        {/* Description */}
        {deck.description && (
          <div style={{
            color: 'rgba(255,255,255,0.75)', fontSize: 40,
            textAlign: 'center', lineHeight: 1.4,
            marginBottom: 64, maxWidth: 860,
          }}>
            {deck.description.slice(0, 100)}{deck.description.length > 100 ? '…' : ''}
          </div>
        )}

        {/* Stats pills */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 80 }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)', borderRadius: 50,
            padding: '16px 36px', color: '#fff', fontSize: 36, fontWeight: 600,
          }}>
            📚 {cardCount} cards
          </div>
          {copyCount > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.2)', borderRadius: 50,
              padding: '16px 36px', color: '#fff', fontSize: 36, fontWeight: 600,
            }}>
              📋 {copyCount} copies
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{
          background: '#fff', borderRadius: 24,
          padding: '28px 64px', marginBottom: 48,
          fontSize: 44, fontWeight: 900, color: palette.from,
        }}>
          Study Free →
        </div>

        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 32 }}>
          by {deck.creator_name}
        </div>
      </div>
    ) : (
      // ── Landscape (1200 × 630) ──────────────────────────────────────────────
      <div
        style={{
          width: W, height: H,
          display: 'flex',
          background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
          fontFamily: 'sans-serif',
          padding: '0',
        }}
      >
        {/* Left: main content */}
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 56px',
        }}>
          {/* Brand */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36,
            color: 'rgba(255,255,255,0.7)', fontSize: 22, fontWeight: 600,
          }}>
            ⚡ FlashcardAI
          </div>

          {/* Title */}
          <div style={{
            color: '#fff', fontSize: 56, fontWeight: 900,
            lineHeight: 1.1, marginBottom: 20,
            maxWidth: 620,
          }}>
            {deck.title}
          </div>

          {/* Description */}
          {deck.description && (
            <div style={{
              color: 'rgba(255,255,255,0.75)', fontSize: 26,
              lineHeight: 1.4, marginBottom: 36,
              maxWidth: 600,
            }}>
              {deck.description.slice(0, 90)}{deck.description.length > 90 ? '…' : ''}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 36 }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)', borderRadius: 50,
              padding: '10px 24px', color: '#fff', fontSize: 22, fontWeight: 600,
            }}>
              📚 {cardCount} cards
            </div>
            {copyCount > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.2)', borderRadius: 50,
                padding: '10px 24px', color: '#fff', fontSize: 22, fontWeight: 600,
              }}>
                📋 {copyCount.toLocaleString()} copies
              </div>
            )}
            {deck.subject && (
              <div style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: 50,
                padding: '10px 24px', color: 'rgba(255,255,255,0.9)', fontSize: 22, fontWeight: 600,
                textTransform: 'capitalize',
              }}>
                {deck.subject}
              </div>
            )}
          </div>

          {/* Creator */}
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 20 }}>
            by {deck.creator_name}
          </div>
        </div>

        {/* Right: emoji + CTA card */}
        <div style={{
          width: 280,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.15)',
          padding: '48px 32px',
          gap: 24,
        }}>
          <div style={{ fontSize: 100, lineHeight: 1 }}>{deck.emoji}</div>
          <div style={{
            background: '#fff', borderRadius: 18,
            padding: '18px 32px', width: '100%', textAlign: 'center',
            fontSize: 26, fontWeight: 900, color: palette.from,
          }}>
            Copy Free →
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.6)', fontSize: 18, textAlign: 'center',
          }}>
            Free SRS flashcards
          </div>
        </div>
      </div>
    ),
    {
      width:  W,
      height: H,
    },
  );

  // Add aggressive CDN caching headers
  img.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
  return img;
}
