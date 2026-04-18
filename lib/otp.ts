import { randomInt } from 'crypto';
import { query } from './db';
import type { OtpPurpose } from './email';

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

// DB-backed rate limit: max `limit` OTPs per user+purpose within `windowMs`
export async function checkOtpRateLimit(
  userId: string,
  purpose: OtpPurpose,
  limit = 5,
  windowMs = 10 * 60 * 1000,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const since = new Date(Date.now() - windowMs);
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM otp_codes
     WHERE user_id = $1 AND purpose = $2 AND created_at > $3`,
    [userId, purpose, since],
  );
  const count = parseInt(result.rows[0]?.count ?? '0', 10);
  if (count >= limit) {
    return { allowed: false, retryAfter: Math.ceil(windowMs / 1000) };
  }
  return { allowed: true };
}

export async function storeAndSendOtp(
  userId: string,
  purpose: OtpPurpose,
  to: string,
  name: string,
): Promise<string> {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Invalidate previous unused codes for same user + purpose
  await query(
    `UPDATE otp_codes SET used_at = NOW()
     WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL`,
    [userId, purpose],
  );

  await query(
    `INSERT INTO otp_codes (user_id, code, purpose, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, code, purpose, expiresAt],
  );

  // Lazy import to keep the module light
  const { sendOtpEmail } = await import('./email');
  await sendOtpEmail({ to, name, code, purpose });

  return code;
}

export async function verifyOtp(
  userId: string,
  code: string,
  purpose: OtpPurpose,
): Promise<{ valid: boolean; error?: string }> {
  const result = await query<{ id: string; expires_at: string }>(
    `SELECT id, expires_at FROM otp_codes
     WHERE user_id = $1 AND code = $2 AND purpose = $3 AND used_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId, code, purpose],
  );

  if ((result.rowCount ?? 0) === 0) {
    return { valid: false, error: 'Ungültiger Code.' };
  }

  const otp = result.rows[0];
  if (new Date(otp.expires_at) < new Date()) {
    return { valid: false, error: 'Code abgelaufen. Bitte einen neuen anfordern.' };
  }

  await query(`UPDATE otp_codes SET used_at = NOW() WHERE id = $1`, [otp.id]);
  return { valid: true };
}
