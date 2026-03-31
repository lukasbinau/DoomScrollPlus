/**
 * Fix broken LaTeX nesting in cards.
 * Sends cards with $ to Claude in batches to clean up notation.
 */

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

const CARDS_FILE = path.resolve('public/data/cards.json');
const BATCH_SIZE = 30;

async function fixWithClaude(
  client: Anthropic,
  cards: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const prompt = `Fix the broken LaTeX math notation in these study cards. The text has nested/double $ delimiters that need to be cleaned up.

RULES:
- Each math expression should be wrapped in exactly ONE pair of $ delimiters
- Fix nested $ like $O(\\$\\log n$)$ → $O(\\log n)$
- Fix double $$ like $$n^{2}$$ → $n^2$  (use single $ for inline)
- Fix split expressions like $a^2$ + $b^2$ = $c^2$ → $a^2 + b^2 = c^2$
- Merge adjacent math: $O($ followed by $2^n$ followed by $)$ → $O(2^n)$
- Use proper LaTeX: \\log, \\lg, \\Theta, \\Omega, \\sqrt, n^2 (not n^{2} for simple), \\frac{a}{b}
- Keep ALL non-math text exactly as-is
- Only modify "title" and fields inside "content"
- Do NOT change "type", "id", "source", "course", "subject", "createdAt"

Return ONLY the corrected JSON array. No markdown fences.

${JSON.stringify(cards, null, 2)}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16384,
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
    console.error('  JSON parse failed:', (e as Error).message);
    // Try to salvage by finding the array in the response
    const arrayMatch = responseText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        console.error('  Salvage also failed. Returning originals.');
      }
    }
    return cards;
  }
}

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
  if (!apiKey) { console.error('No ANTHROPIC_API_KEY'); process.exit(1); }

  const client = new Anthropic({ apiKey });
  const cards: Record<string, unknown>[] = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf-8'));
  console.log(`Loaded ${cards.length} cards.`);

  // Find cards with $ in content or title
  const mathCards = cards.filter(c => {
    const s = JSON.stringify(c.content) + ' ' + (c.title || '');
    return s.includes('$');
  });
  console.log(`Found ${mathCards.length} cards with LaTeX to clean up.\n`);

  if (mathCards.length === 0) { console.log('Nothing to fix.'); return; }

  const idToIndex = new Map<string, number>();
  cards.forEach((c, i) => idToIndex.set(c.id as string, i));

  // Process in batches
  const batches: Record<string, unknown>[][] = [];
  for (let i = 0; i < mathCards.length; i += BATCH_SIZE) {
    batches.push(mathCards.slice(i, i + BATCH_SIZE));
  }

  let totalFixed = 0;
  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    console.log(`Batch ${b + 1}/${batches.length} (${batch.length} cards)...`);

    try {
      const fixed = await fixWithClaude(client, batch);

      for (const fixedCard of fixed) {
        const id = fixedCard.id as string;
        const idx = idToIndex.get(id);
        if (idx !== undefined) {
          cards[idx].title = fixedCard.title;
          cards[idx].content = fixedCard.content;
          totalFixed++;
        }
      }

      // Save incrementally
      fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
      console.log(`  → Fixed ${fixed.length} cards. Saved.\n`);
    } catch (err) {
      console.error(`  Batch ${b + 1} error:`, err);
    }
  }

  console.log(`\nDone! Cleaned up ${totalFixed} cards.`);
}

main();
