import nodemailer from 'nodemailer';

const isDev = process.env.NODE_ENV !== 'production';

const transporter = isDev
  ? null
  : nodemailer.createTransport({
      host:   process.env.SMTP_HOST   ?? 'smtp.resend.com',
      port:   parseInt(process.env.SMTP_PORT ?? '465', 10),
      secure: (process.env.SMTP_SECURE ?? 'true') === 'true',
      auth: {
        user: process.env.SMTP_USER ?? 'resend',
        pass: process.env.SMTP_PASS,
      },
    });

const FROM = process.env.SMTP_FROM ?? 'FlashcardAI <noreply@flashcardai.app>';

function otpHtml(name: string, code: string, bodyText: string, subject: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:40px 20px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:28px 32px;">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-.5px;">
        Flashcard<span style="color:#c4b5fd;">AI</span>
      </p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 6px;color:#111827;font-size:16px;font-weight:700;">${subject}</p>
      <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.6;">Hi ${name}, ${bodyText}</p>
      <div style="background:#f5f3ff;border:2px dashed #a5b4fc;border-radius:14px;padding:24px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 6px;color:#7c3aed;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;">Dein Code</p>
        <p style="margin:0;color:#4f46e5;font-size:44px;font-weight:900;letter-spacing:.22em;font-family:'Courier New',monospace;">${code}</p>
        <p style="margin:8px 0 0;color:#a78bfa;font-size:12px;">Gültig für 10 Minuten</p>
      </div>
      <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
        Falls du diese E-Mail nicht erwartet hast, kannst du sie einfach ignorieren. Dein Account ist sicher.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f3f4f6;">
      <p style="margin:0;color:#d1d5db;font-size:11px;">🇩🇪 Made in Germany · DSGVO konform · <a href="https://flashcardai.app" style="color:#d1d5db;">flashcardai.app</a></p>
    </div>
  </div>
</body>
</html>`;
}

export type OtpPurpose = 'email_verification' | 'login_2fa' | 'disable_2fa';

const SUBJECTS: Record<OtpPurpose, string> = {
  email_verification: 'E-Mail-Adresse bestätigen',
  login_2fa:          'Dein Login-Code',
  disable_2fa:        'Sicherheitscode zum Deaktivieren der 2FA',
};

const BODIES: Record<OtpPurpose, string> = {
  email_verification: 'bestätige bitte deine E-Mail-Adresse mit folgendem Code:',
  login_2fa:          'hier ist dein Sicherheitscode für den Login:',
  disable_2fa:        'gib diesen Code ein, um die Zwei-Faktor-Authentifizierung zu deaktivieren:',
};

export async function sendOtpEmail({
  to,
  name,
  code,
  purpose,
}: {
  to: string;
  name: string;
  code: string;
  purpose: OtpPurpose;
}) {
  const subject = SUBJECTS[purpose];
  const bodyText = BODIES[purpose];
  const html = otpHtml(name, code, bodyText, subject);

  if (isDev) {
    console.log(`\n📧 [DEV EMAIL] To: ${to} | Subject: ${subject}\n🔑 OTP CODE: ${code}\n`);
    return;
  }

  await transporter!.sendMail({ from: FROM, to, subject, html });
}
