import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FREE_MONTHLY_LIMIT = 49;
const PRO_MONTHLY_LIMIT  = 299;

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

const IMPROVE_SYSTEM_PROMPT = `You are an expert flashcard editor specializing in medical, pharmacy, and chemistry education.
Given an existing flashcard (front and back), improve it according to any instructions provided.
If no instructions are given, improve clarity, accuracy, and educational value.

Rules:
- Keep the same topic and concept — do not change what the card is about
- Front: concise, one clear question or concept
- Back: complete but focused — include mechanisms, key numbers, mnemonics where helpful
- Output ONLY valid JSON — no markdown, no explanation

Output format:
{"front":"...","back":"..."}`;

export async function POST(req: NextRequest) {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  let isPro = false;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId = payload.userId as string;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRow = await query<{ is_pro: boolean }>('SELECT is_pro FROM users WHERE id = $1', [userId]);
  isPro = userRow.rows[0]?.is_pro ?? false;

  // Quota check
  const month = new Date().toISOString().slice(0, 7);
  const usageRow = await query<{ count: number }>(
    'SELECT count FROM ai_regen_usage WHERE user_id = $1 AND month = $2',
    [userId, month],
  );
  const used = usageRow.rows[0]?.count ?? 0;
  const limit = isPro ? PRO_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;

  if (used >= limit) {
    return NextResponse.json(
      { error: 'Monthly improvement limit reached.', code: 'QUOTA_EXCEEDED', used, limit, remaining: 0 },
      { status: 402 },
    );
  }

  const body = await req.json() as { front: string; back: string; prompt?: string };
  const { front, back, prompt } = body;

  if (!front?.trim() && !back?.trim()) {
    return NextResponse.json({ error: 'Card content is required.' }, { status: 400 });
  }
  if (prompt && prompt.length > 350) {
    return NextResponse.json({ error: 'Prompt must be 350 characters or less.' }, { status: 400 });
  }

  const userMessage = `Improve this flashcard${prompt ? ` with these instructions: "${prompt}"` : ''}.

Current front: ${front}
Current back: ${back}`;

  let suggestedFront = front;
  let suggestedBack  = back;

  try {
    // Try Groq first
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: IMPROVE_SYSTEM_PROMPT },
        { role: 'user',   content: userMessage },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });
    const raw = completion.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as { front: string; back: string };
    if (parsed.front && parsed.back) {
      suggestedFront = parsed.front;
      suggestedBack  = parsed.back;
    }
  } catch (groqErr) {
    // Fallback to OpenRouter
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://flashcardai.app',
          'X-Title': 'FlashcardAI',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'system', content: IMPROVE_SYSTEM_PROMPT },
            { role: 'user',   content: userMessage },
          ],
          temperature: 0.4,
          response_format: { type: 'json_object' },
        }),
      });
      if (res.ok) {
        const data = await res.json() as { choices: { message: { content: string } }[] };
        const raw = data.choices[0]?.message?.content ?? '';
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as { front: string; back: string };
        if (parsed.front && parsed.back) {
          suggestedFront = parsed.front;
          suggestedBack  = parsed.back;
        }
      }
    } catch {
      console.error('[improve-card] Both Groq and OpenRouter failed', groqErr);
      return NextResponse.json({ error: 'AI improvement failed. Please try again.' }, { status: 500 });
    }
  }

  // Update quota
  await query(
    `INSERT INTO ai_regen_usage (user_id, month, count)
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id, month) DO UPDATE SET count = ai_regen_usage.count + 1`,
    [userId, month],
  );

  const newUsed = used + 1;
  return NextResponse.json({
    suggestedFront,
    suggestedBack,
    used: newUsed,
    limit,
    remaining: limit - newUsed,
  });
}
