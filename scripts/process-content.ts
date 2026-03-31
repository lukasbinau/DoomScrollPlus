/**
 * DoomScroll+ Content Pipeline
 *
 * Reads documents from the `input/` folder, extracts text,
 * sends to Claude for card generation, and outputs to public/data/cards.json.
 *
 * Usage:
 *   1. Place documents in the `input/` folder
 *   2. Set ANTHROPIC_API_KEY in .env
 *   3. Run: npm run process
 *
 * Supported formats: .pdf, .docx, .txt, .md
 */

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

// ------- Config -------
const INPUT_DIR = path.resolve('input');
const OUTPUT_FILE = path.resolve('public/data/cards.json');
const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];

// ------- Text extraction -------
async function extractText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.txt' || ext === '.md') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  if (ext === '.pdf') {
    const { PDFParse } = await import('pdf-parse');
    const buffer = new Uint8Array(fs.readFileSync(filePath));
    const pdf = new PDFParse(buffer);
    await pdf.load();
    const result = await pdf.getText();
    pdf.destroy();
    return result.text;
  }

  if (ext === '.docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

// ------- Claude card generation -------
async function generateCards(client: Anthropic, text: string, sourceFile: string) {
  const prompt = `You are a study content generator for a social-media-style learning app called DoomScroll+.

Given the following study material, generate between 5 and 15 educational cards. Follow these rules:

1. About 90% of cards should be PASSIVE (type "summary" or "bullets"):
   - "summary": A single paragraph (~2-4 sentences) that explains a key concept clearly and memorably. Like a tweet-sized explanation.
   - "bullets": A title + 3-5 bullet points covering key facts about a topic.

2. About 10% of cards should be INTERACTIVE (type "flashcard" or "quiz"):
   - "flashcard": A question on the front and a clear answer on the back.
   - "quiz": A question with exactly 4 options (A-D) and the index of the correct answer (0-3).

3. Auto-detect the subject/category (e.g., "Biology", "History", "Math", "Computer Science").
4. Each card needs a short, catchy title.
5. Keep language simple and clear — a student should understand it easily.
6. Make content genuinely useful for learning, not trivial.

Return ONLY a valid JSON array of cards in this exact format:
[
  {
    "type": "summary",
    "subject": "Biology",
    "title": "Short Title",
    "content": { "text": "Summary paragraph here." }
  },
  {
    "type": "bullets",
    "subject": "Biology",
    "title": "Topic Name",
    "content": { "points": ["Point 1", "Point 2", "Point 3"] }
  },
  {
    "type": "flashcard",
    "subject": "Biology",
    "title": "Concept Name",
    "content": { "question": "What is...?", "answer": "It is..." }
  },
  {
    "type": "quiz",
    "subject": "Biology",
    "title": "Topic Quiz",
    "content": { "question": "Which of...?", "options": ["A", "B", "C", "D"], "correctIndex": 2 }
  }
]

---
SOURCE MATERIAL:
${text.slice(0, 12000)}
---

Return ONLY the JSON array, no markdown fences, no explanation.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');

  try {
    const cards = JSON.parse(responseText);
    if (!Array.isArray(cards)) throw new Error('Response is not an array');

    // Add metadata
    const timestamp = new Date().toISOString();
    return cards.map((card: Record<string, unknown>, i: number) => ({
      ...card,
      id: `${path.basename(sourceFile, path.extname(sourceFile))}-${String(i + 1).padStart(3, '0')}`,
      source: path.basename(sourceFile),
      createdAt: timestamp,
    }));
  } catch (e) {
    console.error(`Failed to parse Claude response for ${sourceFile}:`, e);
    console.error('Raw response:', responseText.slice(0, 500));
    return [];
  }
}

// ------- Main -------
async function main() {
  // Load .env
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
      if (match) process.env[match[1]] = match[2];
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY not found. Create a .env file with:\n  ANTHROPIC_API_KEY=your-key-here');
    process.exit(1);
  }

  if (!fs.existsSync(INPUT_DIR)) {
    fs.mkdirSync(INPUT_DIR, { recursive: true });
    console.log(`Created input/ directory. Place your documents there and re-run.`);
    process.exit(0);
  }

  const files = fs.readdirSync(INPUT_DIR).filter(f =>
    SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
  );

  if (files.length === 0) {
    console.log('No supported files found in input/. Supported: .pdf, .docx, .txt, .md');
    process.exit(0);
  }

  console.log(`Found ${files.length} file(s) to process...\n`);

  const client = new Anthropic({ apiKey });

  // Load existing cards to append
  let existingCards: Record<string, unknown>[] = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existingCards = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    } catch {
      existingCards = [];
    }
  }

  const allNewCards: Record<string, unknown>[] = [];

  for (const file of files) {
    const filePath = path.join(INPUT_DIR, file);
    console.log(`Processing: ${file}`);

    try {
      const text = await extractText(filePath);
      if (text.trim().length < 50) {
        console.log(`  Skipped (too little text)\n`);
        continue;
      }

      const cards = await generateCards(client, text, file);
      console.log(`  Generated ${cards.length} cards\n`);
      allNewCards.push(...cards);

      // Write after each file so progress is saved even if a later file fails
      const existingIds = new Set(existingCards.map((c) => (c as { id: string }).id));
      const merged = [
        ...existingCards,
        ...allNewCards.filter(c => !existingIds.has((c as { id: string }).id)),
      ];
      fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2));
    } catch (err) {
      console.error(`  Error processing ${file}:`, err);
    }
  }

  console.log(`\nDone! ${allNewCards.length} new cards added. Total: ${existingCards.length + allNewCards.length} cards.`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

main();
