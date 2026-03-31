const fs = require('fs');
const cards = JSON.parse(fs.readFileSync('public/data/cards.json', 'utf8'));
const quizzes = cards.filter(c => c.type === 'quiz');

let issues = [];

quizzes.forEach(c => {
  const opts = c.content.options || [];
  const q = c.content.question || '';
  
  // Check all text fields
  const texts = [{ field: 'question', text: q }, ...opts.map((t, i) => ({ field: 'opt' + i, text: t }))];
  
  texts.forEach(({ field, text }) => {
    // Unbalanced $
    const dollars = (text.match(/\$/g) || []).length;
    if (dollars % 2 !== 0) {
      issues.push({ id: c.id, title: c.title, field, text, issue: 'unbalanced $' });
    }
    
    // Escaped $ inside math (nested $)  
    if (/\$[^$]*\\\$/.test(text)) {
      issues.push({ id: c.id, title: c.title, field, text, issue: 'escaped $ in math' });
    }
    
    // $$ (block math) in options - probably wrong
    if (/\$\$/.test(text)) {
      issues.push({ id: c.id, title: c.title, field, text, issue: 'block math $$' });
    }
    
    // Common KaTeX errors: bare backslash commands outside $
    if (/(?<!\$)\\(?:log|Theta|Omega|sqrt|frac|cdot)/.test(text) && !/\$/.test(text)) {
      issues.push({ id: c.id, title: c.title, field, text, issue: 'LaTeX outside $' });
    }
    
    // Empty math: $$ or $ $
    if (/\$\s*\$/.test(text)) {
      issues.push({ id: c.id, title: c.title, field, text, issue: 'empty math' });
    }
  });
});

// Deduplicate by id+field
const seen = new Set();
const unique = issues.filter(i => {
  const key = i.id + i.field + i.issue;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

console.log('Total quiz cards:', quizzes.length);
console.log('Issues found:', unique.length);
unique.forEach(i => {
  console.log('\n---', i.id, i.title);
  console.log('  Field:', i.field, '| Issue:', i.issue);
  console.log('  Text:', i.text);
});
