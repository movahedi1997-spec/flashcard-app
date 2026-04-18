import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const ALLOWED  = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
};

export async function POST(req: NextRequest) {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId = payload.userId as string;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('avatar');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP or GIF allowed' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 6 MB limit' }, { status: 400 });
  }

  const ext      = EXT_MAP[file.type];
  const filename = `${userId}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  const avatarUrl = `/uploads/avatars/${filename}`;
  await query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, userId]);

  return NextResponse.json({ avatarUrl });
}
