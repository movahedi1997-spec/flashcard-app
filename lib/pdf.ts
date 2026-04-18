export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic require prevents pdf-parse from reading its test file at build time
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  return data.text.trim();
}
