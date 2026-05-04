/**
 * GET  /api/admin/reports/profiles?status=pending&limit=50&offset=0
 * PATCH /api/admin/reports/profiles  { reportId, action, adminNote? }
 *   actions: dismiss | warn_user | suspend_account | ban_account
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminAuth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAdmin = await getAdminUser(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'pending';
  const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10));
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const rows = await query<{
    id: string;
    reported_user_id: string; reported_name: string; reported_email: string; reported_username: string | null;
    reporter_name: string | null; reporter_email: string | null;
    reason: string; description: string | null; status: string;
    admin_note: string | null; created_at: string; reviewed_at: string | null;
  }>(
    `SELECT
       r.id, r.reported_user_id,
       target.name AS reported_name, target.email AS reported_email, target.username AS reported_username,
       rep.name AS reporter_name, rep.email AS reporter_email,
       r.reason, r.description, r.status, r.admin_note,
       TO_CHAR(r.created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
       TO_CHAR(r.reviewed_at, 'YYYY-MM-DD HH24:MI') AS reviewed_at
     FROM profile_reports r
     JOIN users target ON target.id = r.reported_user_id
     LEFT JOIN users rep ON rep.id = r.reporter_id
     WHERE r.status = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [status, limit, offset],
  );

  const countRow = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM profile_reports WHERE status = $1`,
    [status],
  );

  return NextResponse.json({
    reports: rows.rows,
    total: parseInt(countRow.rows[0]?.count ?? '0', 10),
  });
}

export async function PATCH(req: NextRequest) {
  const isAdmin = await getAdminUser(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminUser = process.env.ADMIN_USERNAME ?? 'admin';
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const { reportId, action, adminNote } = body ?? {};

  if (!reportId || typeof reportId !== 'string')
    return NextResponse.json({ error: 'reportId required.' }, { status: 400 });
  if (!['dismiss', 'warn_user', 'suspend_account', 'ban_account'].includes(action as string))
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });

  const reportRow = await query<{ id: string; reported_user_id: string }>(
    `SELECT id, reported_user_id FROM profile_reports WHERE id = $1`,
    [reportId],
  );
  const report = reportRow.rows[0];
  if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

  const statusMap: Record<string, string> = {
    dismiss:          'dismissed',
    warn_user:        'warned',
    suspend_account:  'suspended',
    ban_account:      'banned',
  };
  const newStatus = statusMap[action as string];

  await query(
    `UPDATE profile_reports SET status=$1, reviewed_by=$2, reviewed_at=NOW(), admin_note=$3 WHERE id=$4`,
    [newStatus, adminUser, adminNote ?? null, reportId],
  );

  if (action === 'suspend_account') {
    await query(
      `UPDATE users SET suspended_at=NOW(), suspend_reason=$1 WHERE id=$2`,
      [adminNote ?? 'Suspended after user report.', report.reported_user_id],
    );
  }

  if (action === 'ban_account') {
    await query(
      `UPDATE users SET is_banned=true, banned_at=NOW(), ban_reason=$1, suspended_at=NULL WHERE id=$2`,
      [adminNote ?? 'Banned after user report.', report.reported_user_id],
    );
  }

  if (action === 'warn_user') {
    await query(
      `INSERT INTO user_warnings (user_id, issued_by, reason, severity)
       VALUES ($1, $2, $3, 'medium')`,
      [report.reported_user_id, adminUser, adminNote ?? 'Warning issued after user report.'],
    );
  }

  return NextResponse.json({ ok: true });
}
