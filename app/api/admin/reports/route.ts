/**
 * GET /api/admin/reports?status=pending&limit=50&offset=0
 * PATCH /api/admin/reports  Body: { reportId, action: 'dismiss'|'remove_deck'|'warn_user', adminNote? }
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
    id: string; deck_id: string; deck_title: string; deck_owner_name: string;
    deck_owner_email: string; reporter_name: string | null; reporter_email: string | null;
    reason: string; details: string | null; status: string;
    admin_note: string | null; created_at: string; reviewed_at: string | null;
  }>(
    `SELECT
       r.id, r.deck_id,
       d.title AS deck_title,
       owner.name AS deck_owner_name, owner.email AS deck_owner_email,
       rep.name AS reporter_name, rep.email AS reporter_email,
       r.reason, r.details, r.status, r.admin_note,
       TO_CHAR(r.created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
       TO_CHAR(r.reviewed_at, 'YYYY-MM-DD HH24:MI') AS reviewed_at
     FROM deck_reports r
     JOIN decks d ON d.id = r.deck_id
     JOIN users owner ON owner.id = d.user_id
     LEFT JOIN users rep ON rep.id = r.reporter_id
     WHERE r.status = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [status, limit, offset],
  );

  const countRow = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM deck_reports WHERE status = $1`,
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
  if (!['dismiss', 'remove_deck', 'warn_user'].includes(action as string))
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });

  const reportRow = await query<{ id: string; deck_id: string; reporter_id: string | null }>(
    `SELECT id, deck_id, reporter_id FROM deck_reports WHERE id = $1`,
    [reportId],
  );
  const report = reportRow.rows[0];
  if (!report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });

  const newStatus = action === 'dismiss' ? 'dismissed' : 'removed';

  await query(
    `UPDATE deck_reports SET status=$1, reviewed_by=$2, reviewed_at=NOW(), admin_note=$3 WHERE id=$4`,
    [newStatus, adminUser, adminNote ?? null, reportId],
  );

  if (action === 'remove_deck') {
    await query(`UPDATE decks SET is_public = false WHERE id = $1`, [report.deck_id]);
  }

  return NextResponse.json({ ok: true });
}
