/**
 * DoomScroll+ Book Pipeline
 *
 * Processes a large textbook by extracting text, splitting into chapters,
 * and generating cards for each chapter mapped to existing sub-categories.
 *
 * Usage:
 *   npx tsx scripts/process-book.ts
 */

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

// ------- Config -------
const BOOK_PATH = path.resolve('input/Algorithms and datastructures/Introduction.to.Algorithms.4th.pdf');
const OUTPUT_FILE = path.resolve('public/data/cards.json');
const COURSE = 'Algorithms and Data Structures';
const TARGET_CARDS_PER_CHUNK = 12;

// Our 10 existing sub-categories
const VALID_SUBJECTS = [
  'Algorithm Analysis (Big O)',
  'Peak Finding & Intro',
  'Stacks & Queues',
  'Sorting & Searching',
  'Search Trees',
  'Priority Queues & Heaps',
  'Union Find',
  'Graphs',
  'Shortest Paths & MST',
  'Segment Trees & Range Queries',
];

// ------- Text extraction -------
async function extractFullText(): Promise<string> {
  console.log('Extracting text from book (this may take a moment)...');
  const { PDFParse } = await import('pdf-parse');
  const buffer = new Uint8Array(fs.readFileSync(BOOK_PATH));
  const pdf = new PDFParse(buffer);
  await pdf.load();
  const result = await pdf.getText();
  pdf.destroy();
  console.log(`Extracted ${result.text.length.toLocaleString()} characters.`);
  return result.text;
}

// ------- Chapter splitting -------
interface Chapter {
  number: number;
  title: string;
  text: string;
  subject: string;
}

// Map CLRS chapter numbers to our sub-categories
const chapterToSubject: Record<number, string> = {
  1: 'Algorithm Analysis (Big O)',
  2: 'Sorting & Searching',
  3: 'Algorithm Analysis (Big O)',
  4: 'Algorithm Analysis (Big O)',
  5: 'Algorithm Analysis (Big O)',
  6: 'Priority Queues & Heaps',
  7: 'Sorting & Searching',
  8: 'Sorting & Searching',
  9: 'Sorting & Searching',
  10: 'Stacks & Queues',
  11: 'Search Trees',
  12: 'Search Trees',
  13: 'Search Trees',
  14: 'Search Trees',
  15: 'Algorithm Analysis (Big O)',   // Dynamic programming
  16: 'Algorithm Analysis (Big O)',   // Greedy algorithms
  17: 'Algorithm Analysis (Big O)',   // Amortized analysis
  18: 'Search Trees',                 // B-Trees
  19: 'Priority Queues & Heaps',      // Fibonacci heaps
  20: 'Stacks & Queues',              // van Emde Boas trees
  21: 'Union Find',                   // Disjoint sets
  22: 'Graphs',                       // Elementary graph algorithms
  23: 'Shortest Paths & MST',         // Minimum spanning trees
  24: 'Shortest Paths & MST',         // Single-source shortest paths
  25: 'Shortest Paths & MST',         // All-pairs shortest paths
  26: 'Graphs',                       // Maximum flow
  27: 'Algorithm Analysis (Big O)',   // Multithreaded algorithms
  28: 'Algorithm Analysis (Big O)',   // Matrix operations
  29: 'Algorithm Analysis (Big O)',   // Linear programming
  30: 'Sorting & Searching',          // Polynomials and FFT
  31: 'Algorithm Analysis (Big O)',   // Number-theoretic algorithms
  32: 'Sorting & Searching',          // String matching
  33: 'Algorithm Analysis (Big O)',   // Computational geometry
  34: 'Algorithm Analysis (Big O)',   // NP-completeness
  35: 'Algorithm Analysis (Big O)',   // Approximation algorithms
};

function splitIntoChapters(fullText: string): Chapter[] {
  // CLRS chapters start with patterns like "1 The Role of Algorithms" or "22 Elementary Graph Algorithms"
  // We look for these boundaries
  const chapterRegex = /\n(\d{1,2})\s{1,4}([A-Z][A-Za-z\- ]+(?:\n[A-Za-z\- ]+)?)\s*\n/g;

  const matches: { index: number; num: number; title: string }[] = [];
  let match;

  while ((match = chapterRegex.exec(fullText)) !== null) {
    const num = parseInt(match[1]);
    if (num >= 1 && num <= 35) {
      matches.push({
        index: match.index,
        num,
        title: match[2].replace(/\n/g, ' ').trim(),
      });
    }
  }

  // Deduplicate — keep only the first occurrence of each chapter number
  const seen = new Set<number>();
  const unique = matches.filter(m => {
    if (seen.has(m.num)) return false;
    seen.add(m.num);
    return true;
  });

  if (unique.length < 5) {
    // Fallback: split into fixed-size chunks if chapter detection fails
    console.log(`Only found ${unique.length} chapters via regex. Falling back to chunked splitting.`);
    return splitIntoChunks(fullText);
  }

  console.log(`Found ${unique.length} chapters.`);

  const chapters: Chapter[] = [];
  for (let i = 0; i < unique.length; i++) {
    const start = unique[i].index;
    const end = i + 1 < unique.length ? unique[i + 1].index : fullText.length;
    const text = fullText.slice(start, end);
    const subject = chapterToSubject[unique[i].num] || 'Algorithm Analysis (Big O)';

    chapters.push({
      number: unique[i].num,
      title: unique[i].title,
      text,
      subject,
    });
  }

  return chapters;
}

function splitIntoChunks(fullText: string): Chapter[] {
  // Fallback: split every ~15,000 chars
  const CHUNK_SIZE = 15000;
  const chunks: Chapter[] = [];
  for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
    const text = fullText.slice(i, i + CHUNK_SIZE);
    chunks.push({
      number: chunks.length + 1,
      title: `Section ${chunks.length + 1}`,
      text,
      subject: 'Algorithm Analysis (Big O)',
    });
  }
  return chunks;
}

// ------- Claude card generation -------
async function generateCardsForChapter(
  client: Anthropic,
  chapter: Chapter,
  cardsPerChunk: number,
): Promise<Record<string, unknown>[]> {
  // Send up to 15,000 chars of chapter content
  const textSlice = chapter.text.slice(0, 15000);

  const prompt = `You are a study content generator for a social-media-style learning app.

Generate exactly ${cardsPerChunk} educational cards from this textbook chapter. These cards are for a university course called "${COURSE}".

CARD TYPE MIX (follow strictly):
- ~40% type "summary": 2-4 sentence explanation of a key concept. Like a tweet-sized explanation.
- ~30% type "bullets": A title + 3-5 bullet points covering key facts.
- ~15% type "flashcard": A question on the front and clear answer on the back.
- ~15% type "quiz": A question with exactly 4 options and the correct answer index (0-3).

RULES:
- The "subject" field MUST be exactly: "${chapter.subject}"
- Each card needs a short, catchy title (3-7 words)
- Keep language clear — a university student should understand it easily
- Cover DIFFERENT concepts from the chapter — no repetition
- Make content genuinely useful for exam preparation
- For quiz cards, make wrong answers plausible (not obviously wrong)
- Focus on the most important concepts, theorems, and algorithms

Return ONLY a valid JSON array:
[
  {
    "type": "summary",
    "subject": "${chapter.subject}",
    "title": "Short Title",
    "content": { "text": "Summary here." }
  },
  {
    "type": "bullets",
    "subject": "${chapter.subject}",
    "title": "Topic Name",
    "content": { "points": ["Point 1", "Point 2", "Point 3"] }
  },
  {
    "type": "flashcard",
    "subject": "${chapter.subject}",
    "title": "Concept Name",
    "content": { "question": "What is...?", "answer": "It is..." }
  },
  {
    "type": "quiz",
    "subject": "${chapter.subject}",
    "title": "Topic Quiz",
    "content": { "question": "Which of...?", "options": ["A", "B", "C", "D"], "correctIndex": 2 }
  }
]

---
CHAPTER ${chapter.number}: ${chapter.title}

${textSlice}
---

Return ONLY the JSON array. No markdown fences, no explanation.`;

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
    // Strip markdown fences if present
    const cleaned = responseText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    const cards = JSON.parse(cleaned);
    if (!Array.isArray(cards)) throw new Error('Response is not an array');

    const timestamp = new Date().toISOString();
    return cards.map((card: Record<string, unknown>, i: number) => ({
      ...card,
      id: `clrs-ch${String(chapter.number).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
      course: COURSE,
      subject: chapter.subject, // enforce our mapping
      source: `Introduction.to.Algorithms.4th.pdf (Ch.${chapter.number})`,
      createdAt: timestamp,
    }));
  } catch (e) {
    console.error(`  Failed to parse response for Ch.${chapter.number}:`, e);
    console.error('  Raw:', responseText.slice(0, 300));
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
      const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
      if (m) process.env[m[1]] = m[2];
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not found. Set it in .env');
    process.exit(1);
  }

  if (!fs.existsSync(BOOK_PATH)) {
    console.error(`Book not found at: ${BOOK_PATH}`);
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  // Extract full text
  const fullText = await extractFullText();

  // Split into chapters
  const chapters = splitIntoChapters(fullText);
  console.log(`\nWill process ${chapters.length} chapters, targeting ~${TARGET_CARDS_PER_CHUNK} cards each (~${chapters.length * TARGET_CARDS_PER_CHUNK} total).\n`);

  // Show plan
  for (const ch of chapters) {
    console.log(`  Ch.${ch.number}: ${ch.title} → ${ch.subject}`);
  }
  console.log('');

  // Load existing cards
  let existingCards: Record<string, unknown>[] = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existingCards = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    } catch { existingCards = []; }
  }

  const allNewCards: Record<string, unknown>[] = [];

  for (const chapter of chapters) {
    console.log(`Processing Ch.${chapter.number}: ${chapter.title} (${chapter.text.length.toLocaleString()} chars)...`);

    try {
      const cards = await generateCardsForChapter(client, chapter, TARGET_CARDS_PER_CHUNK);
      console.log(`  → Generated ${cards.length} cards [${chapter.subject}]\n`);
      allNewCards.push(...cards);

      // Save incrementally
      const existingIds = new Set(existingCards.map((c) => (c as { id: string }).id));
      const merged = [
        ...existingCards,
        ...allNewCards.filter(c => !existingIds.has((c as { id: string }).id)),
      ];
      fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2));
    } catch (err) {
      console.error(`  Error on Ch.${chapter.number}:`, err);
    }
  }

  // Final summary
  const subjectCounts: Record<string, number> = {};
  allNewCards.forEach(c => {
    const s = (c as { subject: string }).subject;
    subjectCounts[s] = (subjectCounts[s] || 0) + 1;
  });

  console.log(`\n=== Done! Generated ${allNewCards.length} new cards ===`);
  console.log(`Total cards in file: ${existingCards.length + allNewCards.length}`);
  console.log('\nBy subject:');
  Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]).forEach(([s, n]) => {
    console.log(`  ${s}: ${n}`);
  });
}

main();
