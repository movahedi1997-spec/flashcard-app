/**
 * POST /api/admin/users/[id]
 * Body: { action: 'warn'|'ban'|'unban'|'police_report', reason?, severity?, reportId? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminAuth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const isAdmin = await getAdminUser(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminUser = process.env.ADMIN_USERNAME ?? 'admin';
  const userId = params.id;

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { action, reason, severity, reportId } = body ?? {};

  const userRow = await query<{
    id: string; name: string; email: string; is_banned: boolean;
    registration_ip: string | null; last_known_ip: string | null; phone_number: string | null;
    created_at: string;
  }>(
    `SELECT id, name, email, COALESCE(is_banned,false) AS is_banned,
            registration_ip, last_known_ip, phone_number,
            TO_CHAR(created_at,'YYYY-MM-DD HH24:MI') AS created_at
     FROM users WHERE id = $1`,
    [userId],
  );
  const user = userRow.rows[0];
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  if (action === 'warn') {
    if (!reason) return NextResponse.json({ error: 'reason required.' }, { status: 400 });
    const sev = ['low','medium','high'].includes(severity as string) ? severity : 'low';
    await query(
      `INSERT INTO user_warnings (user_id, issued_by, reason, severity, report_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, adminUser, reason, sev, reportId ?? null],
    );

    // Auto-escalation: 3+ warnings in 90 days → auto-ban (EU DSA Art. 23)
    const recentWarnings = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM user_warnings
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '90 days'`,
      [userId],
    );
    const warnCount = parseInt(recentWarnings.rows[0]?.count ?? '0', 10);
    if (warnCount >= 3 && !user.is_banned) {
      await query(
        `UPDATE users SET is_banned=true, banned_at=NOW(), ban_reason=$1 WHERE id=$2`,
        ['Auto-banned: 3 warnings in 90 days (EU DSA Art. 23)', userId],
      );
      await query(
        `INSERT INTO user_ban_log (user_id, action, issued_by, reason, ip_at_time)
         VALUES ($1,'ban',$2,$3,$4)`,
        [userId, 'system', 'Auto: DSA Art.23 threshold reached', user.last_known_ip],
      );
    }
    return NextResponse.json({ ok: true, autoEscalated: warnCount >= 3 });
  }

  if (action === 'ban') {
    await query(
      `UPDATE users SET is_banned=true, banned_at=NOW(), ban_reason=$1 WHERE id=$2`,
      [reason ?? 'Manual ban by admin', userId],
    );
    await query(
      `INSERT INTO user_ban_log (user_id, action, issued_by, reason, ip_at_time)
       VALUES ($1,'ban',$2,$3,$4)`,
      [userId, adminUser, reason ?? null, user.last_known_ip],
    );
    return NextResponse.json({ ok: true });
  }

  if (action === 'unban') {
    await query(
      `UPDATE users SET is_banned=false, banned_at=NULL, ban_reason=NULL WHERE id=$1`,
      [userId],
    );
    await query(
      `INSERT INTO user_ban_log (user_id, action, issued_by, reason, ip_at_time)
       VALUES ($1,'unban',$2,$3,NULL)`,
      [userId, adminUser, reason ?? 'Unbanned by admin'],
    );
    return NextResponse.json({ ok: true });
  }

  if (action === 'police_report') {
    // Return structured data for police report — never stored, generated on demand
    const [warnings, banLog, decks] = await Promise.all([
      query<{ reason: string; severity: string; created_at: string; issued_by: string }>(
        `SELECT reason, severity, TO_CHAR(created_at,'YYYY-MM-DD HH24:MI') AS created_at, issued_by
         FROM user_warnings WHERE user_id=$1 ORDER BY created_at DESC`,
        [userId],
      ),
      query<{ action: string; reason: string | null; created_at: string }>(
        `SELECT action, reason, TO_CHAR(created_at,'YYYY-MM-DD HH24:MI') AS created_at
         FROM user_ban_log WHERE user_id=$1 ORDER BY created_at DESC`,
        [userId],
      ),
      query<{ title: string; created_at: string; is_public: boolean }>(
        `SELECT title, TO_CHAR(created_at,'YYYY-MM-DD') AS created_at, is_public
         FROM decks WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
        [userId],
      ),
    ]);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      subject: {
        id:               user.id,
        name:             user.name,
        email:            user.email,
        registrationIp:   user.registration_ip,
        lastKnownIp:      user.last_known_ip,
        phoneNumber:      user.phone_number,
        accountCreated:   user.created_at,
        isBanned:         user.is_banned,
      },
      warnings:   warnings.rows,
      banHistory: banLog.rows,
      decks:      decks.rows,
    });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
