/**
 * lib/ai.ts
 * Flashcard generation via Groq (primary, free) → Gemini free → Gemini paid.
 * Falls through tiers automatically on 429 / quota errors.
 */

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeneratedCard {
  front: string;
  back: string;
}

export interface GenerateResult {
  cards: GeneratedCard[];
  provider: 'groq' | 'gemini';
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

async function generateWithGemini(text: string, count: number): Promise<GenerateResult> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
  });
  const result = await model.generateContent(
    `${SYSTEM_PROMPT}\n\n${buildUserPrompt(text, count)}`,
  );
  const raw = result.response.text();
  const cards = await parseCards(raw);
  return { cards, provider: 'gemini', model: 'gemini-2.0-flash' };
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
  // Tier 1 — Groq (free)
  try {
    return await generateWithGroq(text, count);
  } catch (err) {
    if (!isRateLimitError(err)) throw err;
    console.log('[AI] Groq rate limited — falling back to Gemini');
  }

  // Tier 2 & 3 — Gemini (free tier first, then paid automatically)
  return await generateWithGemini(text, count);
}

// PDF path — always uses Gemini vision (handles text, diagrams, scanned pages)
export async function generateFlashcardsFromPdf(
  pdfBuffer: Buffer,
  count = 20,
): Promise<GenerateResult> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
  });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBuffer.toString('base64'),
      },
    },
    `${SYSTEM_PROMPT}\n\nGenerate exactly ${count} flashcards from this PDF. Include content from diagrams, charts, and images you can see — not just the text.`,
  ]);

  const raw = result.response.text();
  const cards = await parseCards(raw);
  return { cards, provider: 'gemini', model: 'gemini-2.0-flash (vision)' };
}
