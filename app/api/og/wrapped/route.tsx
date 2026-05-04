/**
 * GET /api/og/wrapped
 *
 * Generates a shareable study-session results image.
 *
 * Query params:
 *   template  — 1 | 2 | 3 (default: 1)
 *   again     — number
 *   hard      — number
 *   good      — number
 *   easy      — number
 *   retention — number 0–100
 *   total     — number
 *   deck      — deck name (URL-encoded)
 *   streak    — current streak days (optional)
 *
 * Returns 1200×630 PNG (landscape, no auth required — stats are in the URL).
 * Cache: 10 min (short since params encode live stats).
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const W = 1200;
const H = 630;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function gradeColor(g: string) {
  return g === 'again' ? '#ef4444'
       : g === 'hard'  ? '#f97316'
       : g === 'good'  ? '#10b981'
       :                 '#6366f1'; // easy
}

export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams;

  const template  = clamp(parseInt(p.get('template') ?? '1', 10), 1, 3);
  const again     = clamp(parseInt(p.get('again')     ?? '0', 10), 0, 9999);
  const hard      = clamp(parseInt(p.get('hard')      ?? '0', 10), 0, 9999);
  const good      = clamp(parseInt(p.get('good')      ?? '0', 10), 0, 9999);
  const easy      = clamp(parseInt(p.get('easy')      ?? '0', 10), 0, 9999);
  const retention = clamp(parseInt(p.get('retention') ?? '0', 10), 0, 100);
  const total     = clamp(parseInt(p.get('total')     ?? '0', 10), 0, 9999);
  const streak    = clamp(parseInt(p.get('streak')    ?? '0', 10), 0, 9999);
  const deckName  = (p.get('deck') ?? 'Study Session').slice(0, 60);

  const retColor  = retention >= 80 ? '#10b981' : retention >= 60 ? '#f59e0b' : '#ef4444';
  const grades    = [
    { label: 'Again', value: again, color: '#ef4444' },
    { label: 'Hard',  value: hard,  color: '#f97316' },
    { label: 'Good',  value: good,  color: '#10b981' },
    { label: 'Easy',  value: easy,  color: '#6366f1' },
  ];

  let img: ImageResponse;

  // ── Template 1: Indigo gradient — clean & bold ─────────────────────────────

  if (template === 1) {
    img = new ImageResponse(
      <div
        style={{
          width: W, height: H,
          display: 'flex',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Left panel */}
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 56px',
        }}>
          {/* Brand */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            color: 'rgba(255,255,255,0.65)', fontSize: 20, fontWeight: 600,
            marginBottom: 28,
          }}>
            ⚡ FlashcardAI · Study Results
          </div>

          {/* Deck name */}
          <div style={{
            color: '#fff', fontSize: 44, fontWeight: 900,
            lineHeight: 1.15, marginBottom: 12, maxWidth: 560,
          }}>
            {deckName}
          </div>

          {/* Total + streak */}
          <div style={{
            display: 'flex', gap: 16, marginBottom: 40,
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)', borderRadius: 50,
              padding: '8px 20px', color: '#fff', fontSize: 20, fontWeight: 600,
            }}>
              📚 {total} cards
            </div>
            {streak > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.2)', borderRadius: 50,
                padding: '8px 20px', color: '#fff', fontSize: 20, fontWeight: 600,
              }}>
                🔥 {streak}-day streak
              </div>
            )}
          </div>

          {/* Grade pills */}
          <div style={{ display: 'flex', gap: 12 }}>
            {grades.map((g) => (
              <div
                key={g.label}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 16, padding: '12px 20px',
                  minWidth: 72,
                }}
              >
                <span style={{ color: g.color, fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{g.value}</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>{g.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel: retention ring */}
        <div style={{
          width: 260,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.15)',
          padding: '48px 32px',
          gap: 16,
        }}>
          {/* SVG ring */}
          <div style={{ position: 'relative', display: 'flex' }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="12" />
              <circle
                cx="70" cy="70" r="54" fill="none"
                stroke={retColor}
                strokeWidth="12"
                strokeDasharray={`${(retention / 100) * (2 * Math.PI * 54)} ${2 * Math.PI * 54}`}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: retColor, fontSize: 30, fontWeight: 900, lineHeight: 1 }}>
                {retention}%
              </span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>retention</span>
            </div>
          </div>

          {/* Trophy */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 16, padding: '12px 24px',
            color: '#fff', fontSize: 18, fontWeight: 700,
          }}>
            🏆 Session done!
          </div>
        </div>
      </div>,
      { width: W, height: H },
    );
  }

  // ── Template 2: Dark achievement ────────────────────────────────────────────

  else if (template === 2) {
    img = new ImageResponse(
      <div
        style={{
          width: W, height: H,
          display: 'flex', flexDirection: 'column',
          background: '#0f172a',
          fontFamily: 'sans-serif',
          padding: '56px 72px',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 40,
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: 600 }}>
            ⚡ FlashcardAI
          </div>
          {streak > 0 && (
            <div style={{
              background: 'rgba(249,115,22,0.15)',
              border: '1px solid rgba(249,115,22,0.4)',
              borderRadius: 50, padding: '6px 16px',
              color: '#f97316', fontSize: 16, fontWeight: 700,
            }}>
              🔥 {streak}-day streak
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1, gap: 64, alignItems: 'center' }}>
          {/* Left */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Trophy + title */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8,
            }}>
              <div style={{
                fontSize: 64, lineHeight: 1,
              }}>🏆</div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: 600, letterSpacing: 2 }}>
                  SESSION COMPLETE
                </div>
                <div style={{ color: '#fff', fontSize: 38, fontWeight: 900, lineHeight: 1.1 }}>
                  {deckName}
                </div>
              </div>
            </div>

            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginBottom: 12 }}>
              {total} cards reviewed
            </div>

            {/* Grade bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grades.map((g) => {
                const pct = total > 0 ? Math.round((g.value / total) * 100) : 0;
                return (
                  <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, width: 42 }}>{g.label}</span>
                    <div style={{
                      flex: 1, height: 10, background: 'rgba(255,255,255,0.08)',
                      borderRadius: 6, overflow: 'hidden',
                      display: 'flex',
                    }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: g.color, borderRadius: 6,
                      }} />
                    </div>
                    <span style={{ color: g.color, fontSize: 16, fontWeight: 700, width: 32, textAlign: 'right' }}>{g.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: big retention */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24, padding: '40px 48px',
            gap: 8,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, letterSpacing: 2 }}>
              RETENTION
            </span>
            <span style={{ color: retColor, fontSize: 72, fontWeight: 900, lineHeight: 1 }}>
              {retention}%
            </span>
            <span style={{
              color: retention >= 80 ? '#10b981' : retention >= 60 ? '#f59e0b' : '#ef4444',
              fontSize: 15, fontWeight: 600,
            }}>
              {retention >= 80 ? '✓ Excellent' : retention >= 60 ? '~ Good' : '↓ Needs work'}
            </span>
          </div>
        </div>
      </div>,
      { width: W, height: H },
    );
  }

  // ── Template 3: Minimal light ────────────────────────────────────────────────

  else {
    img = new ImageResponse(
      <div
        style={{
          width: W, height: H,
          display: 'flex',
          background: '#f8fafc',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Accent bar */}
        <div style={{
          width: 8, background: 'linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%)',
        }} />

        {/* Main */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: '56px 64px',
        }}>
          {/* Brand */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 36,
          }}>
            <span style={{ color: '#94a3b8', fontSize: 18, fontWeight: 600 }}>⚡ FlashcardAI</span>
            {streak > 0 && (
              <span style={{ color: '#f97316', fontSize: 18, fontWeight: 700 }}>🔥 {streak} days</span>
            )}
          </div>

          <div style={{ display: 'flex', flex: 1, gap: 64, alignItems: 'center' }}>
            {/* Left */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ color: '#64748b', fontSize: 15, fontWeight: 600, letterSpacing: 1 }}>
                SESSION COMPLETE
              </div>
              <div style={{ color: '#1e293b', fontSize: 42, fontWeight: 900, lineHeight: 1.15, marginBottom: 8 }}>
                {deckName}
              </div>
              <div style={{ color: '#64748b', fontSize: 16, marginBottom: 28 }}>
                {total} cards · just now
              </div>

              {/* Grade grid */}
              <div style={{ display: 'flex', gap: 16 }}>
                {grades.map((g) => (
                  <div
                    key={g.label}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      background: '#fff',
                      border: `2px solid ${g.color}22`,
                      borderRadius: 16, padding: '14px 20px',
                      minWidth: 80,
                    }}
                  >
                    <span style={{ color: g.color, fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{g.value}</span>
                    <span style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{g.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: retention gauge */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 16,
            }}>
              <div style={{ position: 'relative', display: 'flex' }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="62" fill="none" stroke="#e2e8f0" strokeWidth="14" />
                  <circle
                    cx="80" cy="80" r="62" fill="none"
                    stroke={retColor}
                    strokeWidth="14"
                    strokeDasharray={`${(retention / 100) * (2 * Math.PI * 62)} ${2 * Math.PI * 62}`}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                  />
                </svg>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: retColor, fontSize: 34, fontWeight: 900, lineHeight: 1 }}>
                    {retention}%
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>retention</span>
                </div>
              </div>
              <div style={{
                background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: 50, padding: '8px 20px',
                color: '#64748b', fontSize: 15, fontWeight: 600,
              }}>
                🏆 Session done!
              </div>
            </div>
          </div>
        </div>
      </div>,
      { width: W, height: H },
    );
  }

  img.headers.set('Cache-Control', 'public, max-age=600, s-maxage=600');
  return img;
}
