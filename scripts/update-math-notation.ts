/**
 * DoomScroll+ Math Notation Updater
 *
 * Phase 1: Regex-based conversion of common math patterns to LaTeX $...$
 * Phase 2: Claude refines cards that still have math-like content without LaTeX
 *
 * Usage: npx tsx scripts/update-math-notation.ts
 */

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

const CARDS_FILE = path.resolve('public/data/cards.json');
const BATCH_SIZE = 20; // cards per Claude API call

// ============================================================
// Phase 1: Regex-based conversions
// ============================================================

// Patterns ordered from most specific to least specific to avoid double-wrapping
const regexRules: [RegExp, string | ((...args: string[]) => string)][] = [
  // Already wrapped in $ — skip (used later to detect)

  // Big-O family: O(n log n), O(n²), O(2^n), O(log n), O(1), O(n/2), etc.
  [/\bO\(([^)]+)\)/g, (_m, inner) => `$O(${texifyInner(inner)})$`],
  [/\bΘ\(([^)]+)\)/g, (_m, inner) => `$\\Theta(${texifyInner(inner)})$`],
  [/\bΩ\(([^)]+)\)/g, (_m, inner) => `$\\Omega(${texifyInner(inner)})$`],
  [/\bTheta\(([^)]+)\)/g, (_m, inner) => `$\\Theta(${texifyInner(inner)})$`],
  [/\bOmega\(([^)]+)\)/g, (_m, inner) => `$\\Omega(${texifyInner(inner)})$`],

  // Recurrences: T(n) = 2T(n/2) + n, T(n) = T(n-1) + n, etc.
  [/T\(n\)\s*=\s*([^.;,]{3,40})/g, (_m, rest) => `$T(n) = ${texifyInner(rest.trim())}$`],
  // Standalone T(n)
  [/(?<!\$[^$]*)T\(n\)(?![^$]*\$)/g, '$T(n)$'],

  // Superscript unicode: n², n³, 2ⁿ → LaTeX
  [/(\w)\²/g, '$$$1^2$$'],
  [/(\w)\³/g, '$$$1^3$$'],
  [/2ⁿ/g, '$2^n$'],

  // Common standalone expressions not already in $...$
  // n^2, n^3, 2^n, etc. (with caret)
  [/\bn\^(\d+)/g, (_m, exp) => `$n^{${exp}}$`],
  [/\b2\^n\b/g, '$2^n$'],
  [/\b2\^(\([^)]+\))/g, (_m, exp) => `$2^{${texifyInner(exp)}}$`],

  // log expressions: log n, log₂(n), log₂ n, lg n, log(n!)
  [/\blog₂\s*\(?n\)?/g, '$\\log_2 n$'],
  [/\blog₂\(([^)]+)\)/g, (_m, inner) => `$\\log_2(${texifyInner(inner)})$`],
  [/\blg\s+n\b/g, '$\\lg n$'],
  [/\blog\(n!\)/g, '$\\log(n!)$'],
  [/\blog\(([^)]+)\)/g, (_m, inner) => `$\\log(${texifyInner(inner)})$`],
  [/\blog n\b/g, '$\\log n$'],

  // n! standalone (not inside O() or parentheses already processed)
  [/\bn!\b/g, '$n!$'],

  // Square root: √n, √(2πn)
  [/√\(([^)]+)\)/g, (_m, inner) => `$\\sqrt{${texifyInner(inner)}}$`],
  [/√(\w)/g, (_m, ch) => `$\\sqrt{${ch}}$`],

  // Greek letters in prose (only standalone word-like occurrences)
  [/\bTheta\b(?!\()/g, '$\\Theta$'],
  [/\bOmega\b(?!\()/g, '$\\Omega$'],

  // Stirling: (n/e)^n
  [/\(n\/e\)\^n/g, '$(n/e)^n$'],
  [/\(n\/e\)ⁿ/g, '$(n/e)^n$'],

  // Common inequalities written as ≤, ≥
  // These are fine as-is in HTML, but wrapping key math phrases
];

/** Clean up inner content of O(), Theta(), etc. for LaTeX */
function texifyInner(s: string): string {
  return s
    .replace(/\blog\s+n/g, '\\log n')
    .replace(/\blog₂\s*n/g, '\\log_2 n')
    .replace(/\blg\s+n/g, '\\lg n')
    .replace(/n\²/g, 'n^2')
    .replace(/n\³/g, 'n^3')
    .replace(/2ⁿ/g, '2^n')
    .replace(/√n/g, '\\sqrt{n}')
    .replace(/\bn\^(\d+)/g, (_m, e) => `n^{${e}}`)
    .replace(/\bn!/g, 'n!');
}

/** Apply all regex rules to a string, avoiding double-wrapping */
function applyRegex(text: string): string {
  // Don't touch text that already has $ delimiters
  if (text.includes('$')) return text;

  let result = text;
  for (const [pattern, replacement] of regexRules) {
    if (typeof replacement === 'string') {
      result = result.replace(pattern, replacement);
    } else {
      result = result.replace(pattern, replacement as (...args: string[]) => string);
    }
  }
  return result;
}

/** Apply regex to all text fields of a card, return whether anything changed */
function processCardRegex(card: Record<string, unknown>): boolean {
  const content = card.content as Record<string, unknown>;
  let changed = false;

  const updateField = (field: string) => {
    if (typeof content[field] === 'string') {
      const before = content[field] as string;
      const after = applyRegex(before);
      if (after !== before) {
        content[field] = after;
        changed = true;
      }
    }
  };

  const updateArray = (field: string) => {
    if (Array.isArray(content[field])) {
      const arr = content[field] as string[];
      for (let i = 0; i < arr.length; i++) {
        const after = applyRegex(arr[i]);
        if (after !== arr[i]) {
          arr[i] = after;
          changed = true;
        }
      }
    }
  };

  // Also update title
  if (typeof card.title === 'string') {
    const before = card.title as string;
    const after = applyRegex(before);
    if (after !== before) { card.title = after; changed = true; }
  }

  switch (card.type) {
    case 'summary': updateField('text'); break;
    case 'bullets': updateArray('points'); break;
    case 'flashcard': updateField('question'); updateField('answer'); break;
    case 'quiz': updateField('question'); updateArray('options'); break;
  }

  return changed;
}

// ============================================================
// Phase 2: Claude refinement
// ============================================================

/** Check if card text still has un-LaTeX-ified math patterns */
function hasPotentialMath(card: Record<string, unknown>): boolean {
  const allText = JSON.stringify(card.content) + ' ' + (card.title || '');
  // If already has $, likely already processed
  if (allText.includes('$')) return false;
  // Check for remaining math-like patterns
  return /O\(|Θ|Ω|log\b|n\^|\^n|\^2|\^3|T\(n\)|\bn²|\bn³|√|recurrence|Omega|Theta|asymptot/i.test(allText);
}

async function refineWithClaude(
  client: Anthropic,
  cards: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const prompt = `You are a math notation formatter. I will give you JSON cards from a study app.
Your ONLY job: add LaTeX math delimiters ($...$) around any mathematical expressions in the text fields.

Rules:
- Wrap inline math in single $ delimiters: $O(n \\log n)$, $\\Theta(n^2)$, $T(n) = 2T(n/2) + n$
- Use \\log, \\lg, \\Theta, \\Omega, \\sqrt, \\sum, \\frac{}{} for proper LaTeX
- Do NOT change the meaning or wording of any text
- Do NOT add or remove content
- Do NOT modify the "type", "id", "source", "course", "subject", "createdAt" fields
- Only modify "title" and fields inside "content" (text, points, question, answer, options)
- Return the SAME JSON array with ONLY the math notation added

Input cards:
${JSON.stringify(cards, null, 2)}

Return ONLY the JSON array. No markdown fences, no explanation.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');

  try {
    const cleaned = responseText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    const result = JSON.parse(cleaned);
    if (!Array.isArray(result)) throw new Error('Not an array');
    return result;
  } catch (e) {
    console.error('  Failed to parse Claude response:', e);
    return cards; // Return unchanged on failure
  }
}

// ============================================================
// Main
// ============================================================

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

  const cards: Record<string, unknown>[] = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf-8'));
  console.log(`Loaded ${cards.length} cards.\n`);

  // ---- Phase 1: Regex ----
  console.log('=== Phase 1: Regex conversion ===');
  let regexChanged = 0;
  for (const card of cards) {
    if (processCardRegex(card)) regexChanged++;
  }
  console.log(`Regex updated ${regexChanged} cards.\n`);

  // Save after Phase 1
  fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
  console.log('Saved after Phase 1.\n');

  // ---- Phase 2: Claude refinement ----
  const needsClaude = cards.filter(hasPotentialMath);
  console.log(`=== Phase 2: Claude refinement (${needsClaude.length} cards with potential remaining math) ===`);

  if (needsClaude.length === 0) {
    console.log('No cards need Claude refinement. Done!');
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set. Skipping Phase 2.');
    return;
  }

  const client = new Anthropic({ apiKey });

  // Build an ID-to-index map for quick lookup
  const idToIndex = new Map<string, number>();
  cards.forEach((c, i) => idToIndex.set(c.id as string, i));

  // Process in batches
  const batches = [];
  for (let i = 0; i < needsClaude.length; i += BATCH_SIZE) {
    batches.push(needsClaude.slice(i, i + BATCH_SIZE));
  }

  let claudeUpdated = 0;
  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    console.log(`  Batch ${b + 1}/${batches.length} (${batch.length} cards)...`);

    try {
      const refined = await refineWithClaude(client, batch);

      // Merge refined cards back
      for (const refinedCard of refined) {
        const id = refinedCard.id as string;
        const idx = idToIndex.get(id);
        if (idx !== undefined) {
          // Only update content and title fields
          cards[idx].title = refinedCard.title;
          cards[idx].content = refinedCard.content;
          claudeUpdated++;
        }
      }

      // Save incrementally
      fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
    } catch (err) {
      console.error(`  Batch ${b + 1} failed:`, err);
    }
  }

  console.log(`\nClaude refined ${claudeUpdated} cards.`);
  console.log(`\n=== Done! Total: ${regexChanged} regex + ${claudeUpdated} Claude = ${regexChanged + claudeUpdated} cards updated ===`);

  // Final stats
  const withMath = cards.filter(c => JSON.stringify(c.content).includes('$') || (c.title as string).includes('$'));
  console.log(`Cards now containing LaTeX: ${withMath.length} / ${cards.length}`);
}

main();
