const fs = require('fs');
const cards = JSON.parse(fs.readFileSync('public/data/cards.json', 'utf8'));

const fixes = {
  'analysis-weekplan-007': {
    options: [
      "$n^2 + 1000n$",
      "$n^3/1000$",
      "$2^n/1000000$",
      "$n(1 + n^2)$"
    ]
  },
  'clrs-ch04-007': {
    options: [
      "Case 1: $T(n) = \\Theta(n^2)$",
      "Case 2: $T(n) = \\Theta(n^2 \\log n)$",
      "Case 3: $T(n) = \\Theta(n^2)$",
      "Case 3: $T(n) = \\Theta(n^2 \\log n)$"
    ]
  },
  'clrs-ch31-006': {
    options: [
      "$O(\\min(a,b))$",
      "$O(\\sqrt{\\min(a,b)})$",
      "$O(\\log \\min(a,b))$",
      "$O(\\log(a+b))$"
    ]
  },
  'clrs-ch31-012': {
    options: [
      "$O(k \\log n)$",
      "$O(k \\log^2 n)$",
      "$O(k \\log^3 n)$",
      "$O(k^2 \\log n)$"
    ]
  }
};

let fixed = 0;
for (const card of cards) {
  if (fixes[card.id]) {
    card.content.options = fixes[card.id].options;
    fixed++;
    console.log('Fixed:', card.id, card.title);
  }
}

fs.writeFileSync('public/data/cards.json', JSON.stringify(cards, null, 2));
console.log('\nFixed', fixed, 'cards');

// Verify no more issues
const check = JSON.parse(fs.readFileSync('public/data/cards.json', 'utf8'));
const quizzes = check.filter(c => c.type === 'quiz');
let issues = 0;
quizzes.forEach(c => {
  (c.content.options || []).forEach((t, i) => {
    const d = (t.match(/\$/g) || []).length;
    if (d % 2 !== 0) { issues++; console.log('STILL BAD:', c.id, 'opt' + i, t); }
    if (/\$\$/.test(t)) { issues++; console.log('STILL BAD $$:', c.id, 'opt' + i, t); }
    if (/\\\$/.test(t)) { issues++; console.log('STILL BAD \\$:', c.id, 'opt' + i, t); }
  });
});
console.log('Remaining issues:', issues);
