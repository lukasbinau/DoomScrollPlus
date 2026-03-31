/**
 * Generate visual cards (diagram, code, steps) via Claude API.
 * 
 * Reads existing cards.json, groups by subject, and asks Claude to
 * generate diagram, code, and step-by-step cards for each subject.
 * 
 * Usage: npx tsx scripts/generate-visual-cards.ts
 * Requires: ANTHROPIC_API_KEY environment variable
 */

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

// Load .env file
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const OUTPUT_FILE = path.resolve('public/data/cards.json');
const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('Set ANTHROPIC_API_KEY environment variable');
  process.exit(1);
}

const client = new Anthropic({ apiKey: API_KEY });

interface Card {
  id: string;
  type: string;
  course: string;
  subject: string;
  title: string;
  content: unknown;
  source: string;
  createdAt: string;
}

// Subject-specific guidance for what diagrams/code/steps to generate
const SUBJECT_GUIDANCE: Record<string, string> = {
  'Search Trees': `
    - Diagrams: BST structure, 2-3 tree node types, red-black tree with colors, AVL rotations, B-tree structure
    - Code: BST insert, BST search, tree traversal (inorder), AVL rotation, red-black insert fixup
    - Steps: inserting into a BST, AVL rotation after insert, 2-3 tree split, deleting from BST
  `,
  'Graphs': `
    - Diagrams: directed vs undirected graph, adjacency list vs matrix representation, BFS tree, DFS tree with back edges, DAG example, strongly connected components
    - Code: BFS algorithm, DFS algorithm, topological sort, adjacency list representation
    - Steps: BFS traversal showing queue state, DFS traversal showing stack/discovery/finish times, topological sort process
  `,
  'Sorting & Searching': `
    - Diagrams: comparison of sorting algorithm complexities, merge sort tree, quicksort partition, binary search halving, string matching automaton
    - Code: merge sort, quicksort with partition, binary search, insertion sort, counting sort, KMP failure function
    - Steps: merge sort dividing and merging an array, quicksort partitioning, binary search narrowing, insertion sort building sorted portion
  `,
  'Shortest Paths & MST': `
    - Diagrams: weighted graph for Dijkstra, MST example (Kruskal/Prim), Bellman-Ford with negative edges, shortest path tree, flow network
    - Code: Dijkstra's algorithm, Kruskal's with union-find, Prim's algorithm, Bellman-Ford relaxation
    - Steps: Dijkstra's exploring vertices by distance, Kruskal's adding edges by weight, Prim's growing MST, Bellman-Ford relaxation rounds
  `,
  'Algorithm Analysis (Big O)': `
    - Diagrams: recursion tree for T(n)=2T(n/2)+n, master method cases flowchart, P vs NP relationship, dynamic programming subproblem DAG, amortized analysis example
    - Code: rod cutting DP, matrix chain multiplication, LCS algorithm, Strassen's matrix multiply structure, fibonacci with memoization
    - Steps: rod cutting building solution table, matrix chain parenthesization, recursion tree expansion, memoization filling table
  `,
  'Union Find': `
    - Diagrams: union-find forest before/after union, path compression effect, weighted union comparison
    - Code: union-find with path compression and union by rank, find with path compression
    - Steps: sequence of union operations showing tree growth, path compression flattening a tall tree
  `,
  'Segment Trees & Range Queries': `
    - Diagrams: segment tree structure over an array, lazy propagation tree, Fenwick/BIT structure
    - Code: segment tree build + query + update, Fenwick tree update + prefix sum
    - Steps: segment tree answering a range query (highlighting visited nodes), updating a value and propagating up
  `,
  'Stacks & Queues': `
    - Diagrams: stack LIFO structure, queue FIFO structure, linked list node chain, doubly linked list, deque structure
    - Code: stack push/pop with array, queue with circular array, linked list insert/delete, reverse a linked list
    - Steps: stack evaluating a postfix expression, queue in BFS level order, linked list insertion at position
  `,
  'Priority Queues & Heaps': `
    - Diagrams: min-heap as tree and array, max-heap structure, heap after extractMin, binomial heap
    - Code: heapify (sift-down), heap insert (sift-up), heapsort, build-heap from array
    - Steps: insert into min-heap (bubble up), extractMin (bubble down), building a heap from unsorted array
  `,
  'Peak Finding & Intro': `
    - Diagrams: 1D peak finding binary search, 2D peak finding divide-and-conquer, problem-size reduction visualization
    - Code: 1D peak finder, 2D peak finder greedy ascent
    - Steps: 1D peak finding halving the array, 2D peak finding column-by-column
  `,
};

async function generateVisualCards(
  subject: string,
  existingTitles: string[],
  course: string
): Promise<Card[]> {
  const guidance = SUBJECT_GUIDANCE[subject] || '';
  const titleList = existingTitles.slice(0, 20).join(', ');

  const prompt = `You are generating study cards for an Algorithms & Data Structures app. The subject is "${subject}".

Existing card titles for context: ${titleList}

Generate cards of three types. For the subject "${subject}", here is specific guidance on what to create:
${guidance}

IMPORTANT RULES:
1. Mermaid diagrams MUST use valid Mermaid.js syntax. Use "graph TD" for trees, "graph LR" for flows, "flowchart TD" for flowcharts
2. For tree diagrams, use simple node IDs like A, B, C and label them: A[8] --> B[3] --> C[1]  
3. DO NOT use special characters in Mermaid node labels that break parsing. No parentheses in labels - use brackets [label] only
4. Code should be real, working Python code (not pseudocode). Keep it concise (8-20 lines)
5. Step visualizations should have 3-5 steps, each with a valid Mermaid diagram showing that state
6. Use $...$ for inline math notation (KaTeX) in captions, explanations, labels
7. Each card needs a unique, descriptive title

Generate exactly this JSON array (no other text):
[
  {
    "type": "diagram",
    "title": "...",
    "content": {
      "mermaid": "graph TD\\n  A[label] --> B[label]",
      "caption": "Explanation with $math$ if relevant"
    }
  },
  {
    "type": "code", 
    "title": "...",
    "content": {
      "code": "def example():\\n    pass",
      "language": "python",
      "explanation": "What this code does"
    }
  },
  {
    "type": "steps",
    "title": "...",
    "content": {
      "steps": [
        {"visual": "graph TD\\n  ...", "label": "Step description"},
        {"visual": "graph TD\\n  ...", "label": "Step description"}
      ],
      "summary": "What we learned"
    }
  }
]

Generate ${subject === 'Peak Finding & Intro' ? '4' : '8'} cards total for "${subject}": mix of diagram (3-4), code (2-3), and steps (2-3) cards.
${subject === 'Peak Finding & Intro' ? 'Generate 1-2 diagrams, 1 code, 1 steps card.' : ''}

Return ONLY the JSON array, no markdown fences, no explanation.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('');

  // Extract JSON array
  let jsonStr = text.trim();
  // Remove markdown fences if present
  jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');

  try {
    const rawCards = JSON.parse(jsonStr) as Array<{
      type: string;
      title: string;
      content: unknown;
    }>;

    const now = new Date().toISOString();
    return rawCards.map((rc, i) => ({
      id: `visual-${subject.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${String(i + 1).padStart(3, '0')}`,
      type: rc.type,
      course,
      subject,
      title: rc.title,
      content: rc.content,
      source: 'Generated visual card',
      createdAt: now,
    }));
  } catch (e) {
    console.error(`  ✗ Failed to parse JSON for ${subject}:`, (e as Error).message);
    // Try to salvage by finding JSON array in the text
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const rawCards = JSON.parse(match[0]);
        const now = new Date().toISOString();
        return rawCards.map((rc: { type: string; title: string; content: unknown }, i: number) => ({
          id: `visual-${subject.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${String(i + 1).padStart(3, '0')}`,
          type: rc.type,
          course,
          subject,
          title: rc.title,
          content: rc.content,
          source: 'Generated visual card',
          createdAt: now,
        }));
      } catch {
        console.error(`  ✗ Salvage also failed for ${subject}`);
      }
    }
    return [];
  }
}

async function main() {
  const existingCards: Card[] = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  console.log(`Loaded ${existingCards.length} existing cards`);

  // Group existing by subject
  const bySubject: Record<string, Card[]> = {};
  for (const card of existingCards) {
    if (!bySubject[card.subject]) bySubject[card.subject] = [];
    bySubject[card.subject].push(card);
  }

  // Only process A&DS subjects (skip Sample course)
  const subjects = Object.keys(SUBJECT_GUIDANCE);
  const allNewCards: Card[] = [];

  for (const subject of subjects) {
    const subjectCards = bySubject[subject] || [];
    const course = subjectCards[0]?.course || 'Algorithms & Data Structures';
    const existingTitles = subjectCards.map(c => c.title);

    console.log(`\n📊 Generating visual cards for: ${subject} (${subjectCards.length} existing cards)`);

    try {
      const newCards = await generateVisualCards(subject, existingTitles, course);
      console.log(`  ✓ Generated ${newCards.length} cards`);
      allNewCards.push(...newCards);
    } catch (e) {
      console.error(`  ✗ Error generating for ${subject}:`, (e as Error).message);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  // Deduplicate IDs
  const usedIds = new Set(existingCards.map(c => c.id));
  for (const card of allNewCards) {
    if (usedIds.has(card.id)) {
      card.id = card.id + '-' + Math.random().toString(36).slice(2, 6);
    }
    usedIds.add(card.id);
  }

  // Merge and save
  const finalCards = [...existingCards, ...allNewCards];
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalCards, null, 2));
  console.log(`\n✅ Total cards: ${finalCards.length} (${allNewCards.length} new visual cards added)`);

  // Summary by type
  const byType: Record<string, number> = {};
  for (const c of allNewCards) {
    byType[c.type] = (byType[c.type] || 0) + 1;
  }
  console.log('By type:', byType);
}

main().catch(console.error);
