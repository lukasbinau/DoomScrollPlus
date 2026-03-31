/**
 * Fix remaining broken LaTeX nesting with targeted regex.
 * Handles the specific broken patterns from the regex pass.
 */

const path = require('path');
const fs = require('fs');

const CARDS_FILE = path.resolve(__dirname, '../public/data/cards.json');

function fixNesting(text) {
  if (!text.includes('$')) return text;
  
  let result = text;
  
  // Fix $O(\$\log n$)$ → $O(\log n)$
  // Pattern: $...\$...$ where the inner \$ is a broken escape
  result = result.replace(/\$O\(\\\$\\log n\$\)\$/g, '$O(\\log n)$');
  result = result.replace(/\$O\(\\\$\\lg n\$\)\$/g, '$O(\\lg n)$');
  
  // Fix $O(n \$\log n$)$ → $O(n \log n)$
  result = result.replace(/\$O\(n\s*\\\$\\log n\$\)\$/g, '$O(n \\log n)$');
  result = result.replace(/\$O\(n\s*\\\$\\lg n\$\)\$/g, '$O(n \\lg n)$');
  
  // Fix $O(n^{k} \$\log n$)$ patterns
  result = result.replace(/\$O\(([^$]*?)\\\$\\log n\$\)\$/g, '$O($1\\log n)$');
  result = result.replace(/\$O\(([^$]*?)\\\$\\lg n\$\)\$/g, '$O($1\\lg n)$');
  
  // Fix $\$\log(...)$$ → $\log(...)$
  result = result.replace(/\$\\\$\\log\(([^$]*?)\)\$\$/g, '$\\log($1)$');
  
  // Fix standalone $\$\log n$ → $\log n$
  result = result.replace(/\$\\\$\\log n\$/g, '$\\log n$');
  
  // Fix $$n^{2}$$ → $n^2$ (double dollar to single)
  result = result.replace(/\$\$n\^\{(\d+)\}\$\$/g, '$n^$1$');
  result = result.replace(/\$\$(\d)n\^\{(\d+)\}\$\$/g, '$$1n^$2$');
  
  // Fix $O($2^n$)$ → $O(2^n)$
  result = result.replace(/\$O\(\$2\^n\$\)\$/g, '$O(2^n)$');
  
  // Fix n^{2} → n^2, n^{3} → n^3 for simple exponents (inside $ delimiters)
  result = result.replace(/(\$[^$]*?)n\^\{(\d)\}([^$]*?\$)/g, '$1n^$2$3');
  
  // Fix Ω($$n^2$$) → $\Omega(n^2)$  
  result = result.replace(/Ω\(\$\$n\^(\d)\$\$/g, '$\\Omega(n^$1)');
  result = result.replace(/Ω\(\$n\^(\d)\$/g, '$\\Omega(n^$1');
  
  // Fix Θ($$n^2$$) → $\Theta(n^2)$
  result = result.replace(/Θ\(\$\$n\^(\d)\$\$/g, '$\\Theta(n^$1)');
  result = result.replace(/Θ\(\$n\^(\d)\$/g, '$\\Theta(n^$1');
  
  // Fix $\Theta$ as title → Theta  
  result = result.replace(/^\$\\Theta\$\s/, 'Theta ');
  result = result.replace(/^\$\\Omega\$\s/, 'Omega ');
  
  // Fix split expressions: $a^2$ + $b^2$ = $c^2$ → $a^2 + b^2 = c^2$
  // Generic: merge adjacent $ expressions separated by operators
  result = result.replace(/\$([^$]+)\$\s*([+\-=×·])\s*\$([^$]+)\$/g, '$$1 $2 $3$');
  // Apply again for 3-part expressions
  result = result.replace(/\$([^$]+)\$\s*([+\-=×·])\s*\$([^$]+)\$/g, '$$1 $2 $3$');
  
  // Fix Θ( and Ω( without $ wrapping near $ content
  result = result.replace(/(?<!\$[^$]*)Θ\(([^)]+)\)(?![^$]*\$)/g, '$\\Theta($1)$');
  result = result.replace(/(?<!\$[^$]*)Ω\(([^)]+)\)(?![^$]*\$)/g, '$\\Omega($1)$');
  
  return result;
}

function processCard(card) {
  let changed = false;
  
  const fix = (val) => {
    const fixed = fixNesting(val);
    if (fixed !== val) changed = true;
    return fixed;
  };
  
  if (card.title) card.title = fix(card.title);
  
  const c = card.content;
  switch (card.type) {
    case 'summary':
      if (c.text) c.text = fix(c.text);
      break;
    case 'bullets':
      if (c.points) c.points = c.points.map(p => fix(p));
      break;
    case 'flashcard':
      if (c.question) c.question = fix(c.question);
      if (c.answer) c.answer = fix(c.answer);
      break;
    case 'quiz':
      if (c.question) c.question = fix(c.question);
      if (c.options) c.options = c.options.map(o => fix(o));
      break;
  }
  
  return changed;
}

// Run
const cards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf-8'));
let fixed = 0;
for (const card of cards) {
  if (processCard(card)) fixed++;
}
fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
console.log('Fixed', fixed, 'cards with regex cleanup.');

// Re-check
const stillBroken = cards.filter(c => {
  const s = JSON.stringify(c.content) + ' ' + (c.title || '');
  return s.includes('\\$') || s.includes('$$');
});
console.log('Cards still with nesting issues:', stillBroken.length);

if (stillBroken.length > 0) {
  stillBroken.slice(0, 5).forEach((c, i) => {
    const text = c.type === 'summary' ? c.content.text :
                 c.type === 'bullets' ? c.content.points.join(' | ') :
                 c.type === 'flashcard' ? c.content.question + ' -> ' + c.content.answer :
                 c.content.question;
    console.log('\n[' + i + '] ' + c.type + ': ' + c.title);
    console.log('  ' + text.substring(0, 300));
  });
}
