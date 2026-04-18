/**
 * lib/ai.ts
 * Flashcard generation via Groq (primary, free) → OpenRouter Gemini 2.0 Flash (fallback + PDF vision).
 * Falls through tiers automatically on 429 / quota errors.
 */

import Groq from 'groq-sdk';

export interface GeneratedCard {
  front: string;
  back: string;
}

export interface GenerateResult {
  cards: GeneratedCard[];
  provider: 'groq' | 'openrouter';
  model: string;
}

const SYSTEM_PROMPT = `You are an expert flashcard creator specializing in medical, pharmacy, and chemistry education.
Given study material, generate high-quality flashcards for spaced repetition learning.

Rules:
- Each flashcard must have a clear, specific FRONT (question/term/concept) and BACK (answer/definition/explanation)
- Front: concise — one concept, one question
- Back: complete but focused — include mechanisms, key numbers, mnemonics where helpful
- Prioritize high-yield facts: definitions, mechanisms, drug classes, reactions, clinical pearls
- Do NOT generate duplicate cards
- Do NOT include trivial or overly broad questions
- Output ONLY valid JSON — no markdown, no explanation

Output format:
{"cards":[{"front":"...","back":"..."},{"front":"...","back":"..."}]}`;

function buildUserPrompt(text: string, count: number): string {
  return `Generate exactly ${count} flashcards from the following study material.\n\n${text.slice(0, 12000)}`;
}

async function parseCards(raw: string): Promise<GeneratedCard[]> {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const json = JSON.parse(cleaned) as { cards: GeneratedCard[] };
  if (!Array.isArray(json.cards)) throw new Error('Invalid response shape');
  return json.cards.filter(
    (c) => typeof c.front === 'string' && typeof c.back === 'string' && c.front && c.back,
  );
}

async function generateWithGroq(text: string, count: number): Promise<GenerateResult> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildUserPrompt(text, count) },
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });
  const raw = completion.choices[0]?.message?.content ?? '';
  const cards = await parseCards(raw);
  return { cards, provider: 'groq', model: 'llama-3.3-70b-versatile' };
}

async function generateWithOpenRouter(text: string, count: number): Promise<GenerateResult> {
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
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: buildUserPrompt(text, count) },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }
  const data = await res.json() as { choices: { message: { content: string } }[] };
  const raw = data.choices[0]?.message?.content ?? '';
  const cards = await parseCards(raw);
  return { cards, provider: 'openrouter', model: 'gemini-2.0-flash' };
}

function isRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('429') || msg.includes('rate') || msg.includes('quota') || msg.includes('limit');
  }
  return false;
}

export async function generateFlashcards(
  text: string,
  count = 20,
): Promise<GenerateResult> {
  // Tier 1 — Groq (free, fast)
  try {
    return await generateWithGroq(text, count);
  } catch (err) {
    if (!isRateLimitError(err)) throw err;
    console.log('[AI] Groq rate limited — falling back to OpenRouter');
  }

  // Tier 2 — OpenRouter Gemini 2.0 Flash
  return await generateWithOpenRouter(text, count);
}

// PDF path — OpenRouter Gemini 2.0 Flash vision (handles text, diagrams, scanned pages)
export async function generateFlashcardsFromPdf(
  pdfBuffer: Buffer,
  count = 20,
): Promise<GenerateResult> {
  const base64 = pdfBuffer.toString('base64');
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
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:application/pdf;base64,${base64}` },
            },
            {
              type: 'text',
              text: `${SYSTEM_PROMPT}\n\nGenerate exactly ${count} flashcards from this PDF. Include content from diagrams, charts, and images you can see — not just the text.`,
            },
          ],
        },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }
  const data = await res.json() as { choices: { message: { content: string } }[] };
  const raw = data.choices[0]?.message?.content ?? '';
  const cards = await parseCards(raw);
  return { cards, provider: 'openrouter', model: 'gemini-2.0-flash (vision)' };
}
