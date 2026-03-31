const path = require('path');
const d = require(path.resolve(__dirname, '../public/data/cards.json'));

// Cards with any $ in content
const withMath = d.filter(c => {
  const s = JSON.stringify(c.content) + ' ' + (c.title || '');
  return s.includes('$');
});
console.log('Cards with $:', withMath.length);

// Cards with broken nesting: $$, $...\$, $O(\$
const broken = d.filter(c => {
  const s = JSON.stringify(c.content) + ' ' + (c.title || '');
  return s.includes('\\$') || s.includes('$$');
});
console.log('Cards with nesting issues:', broken.length);

// Show 5 broken examples
broken.slice(0, 5).forEach((c, i) => {
  const text = c.type === 'summary' ? c.content.text :
               c.type === 'bullets' ? c.content.points.join(' | ') :
               c.type === 'flashcard' ? c.content.question + ' -> ' + c.content.answer :
               c.content.question;
  console.log('\n[' + i + '] ' + c.type + ': ' + c.title);
  console.log('  ' + text.substring(0, 300));
});
