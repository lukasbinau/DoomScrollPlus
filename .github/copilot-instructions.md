# DoomScroll+ — AI Agent Context

## Overview

**DoomScroll+** is a TikTok-style doom-scroll study app for Algorithms & Data Structures coursework. Users swipe vertically through study cards (summaries, flashcards, quizzes, code blocks, diagrams, step-by-step visualizations). It includes a "brainrot mode" that splits the screen with gameplay/satisfying videos on top and study cards on the bottom.

- **Live URL**: https://lukasbinau.github.io/DoomScrollPlus/
- **GitHub Repo**: `lukasbinau/DoomScrollPlus` (public, `main` branch)
- **Personal project** — no tests, no CI lint, no strict open-source concerns.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19 |
| Language | TypeScript | ~5.7 |
| Bundler | Vite | 6 |
| Styling | Tailwind CSS | 3 |
| Math rendering | KaTeX | 0.16+ |
| Diagrams | Mermaid.js | 11.13+ |
| Code highlighting | Prism.js | 1.30+ |
| Content generation | Anthropic Claude SDK | 0.80+ (devDep) |
| PDF parsing | pdf-parse + mammoth | devDep |
| Deployment | GitHub Pages via GitHub Actions | Node 20 |

### Key Config

- **Vite base path**: `base: '/DoomScrollPlus/'` in `vite.config.ts`
- **Tailwind**: `darkMode: 'class'`, permanently dark mode (class always applied)
- **Mermaid** is code-split via `manualChunks` in Vite rollup config
- **PWA**: `public/manifest.json` + `public/sw.js` (network-first with cache fallback)

---

## Project Structure

```
DoomScroll+/
├── .env                          # ANTHROPIC_API_KEY (gitignored)
├── .github/workflows/deploy.yml  # GitHub Pages deployment (push to main)
├── index.html                    # Entry HTML (dark class on <html>)
├── package.json                  # Scripts: dev, build, preview, process
├── vite.config.ts                # Base path, mermaid chunk splitting
├── tailwind.config.js            # Content paths, dark mode class
├── postcss.config.js
├── tsconfig.json
│
├── public/
│   ├── data/cards.json           # 830 study cards (all content)
│   ├── videos/                   # Brainrot videos (~12MB total, 10 files)
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker
│   └── favicon.svg
│
├── src/
│   ├── main.tsx                  # Entry point, KaTeX/Prism CSS imports, SW registration
│   ├── App.tsx                   # Root component, state management, layout
│   ├── index.css                 # Tailwind directives, snap-scroll CSS, brainrot CSS
│   │
│   ├── types/
│   │   └── card.ts               # Card, CardType, UserState, content interfaces
│   │
│   ├── hooks/
│   │   ├── useFeed.ts            # Spaced repetition feed algorithm
│   │   └── useLocalStorage.ts    # localStorage state hook
│   │
│   └── components/
│       ├── CardViewer.tsx         # Vertical swipe/snap navigation, touch handling
│       ├── BrainrotPlayer.tsx     # Video player cycling through VIDEOS array
│       ├── SideDrawer.tsx         # Course/subject navigation drawer
│       ├── MathText.tsx           # KaTeX inline/block math renderer
│       ├── ComplexityChart.tsx    # SVG complexity comparison chart
│       ├── ProgressBar.tsx        # Study progress indicator
│       ├── InstallPrompt.tsx      # PWA install prompt (Android native + iOS instructions)
│       ├── SubjectFilter.tsx      # (Legacy, replaced by SideDrawer)
│       ├── ThemeToggle.tsx        # (Legacy, dark mode is now permanent)
│       │
│       └── cards/                 # One component per card type
│           ├── SummaryCard.tsx
│           ├── BulletsCard.tsx
│           ├── FlashCard.tsx      # CSS 3D flip animation
│           ├── QuizCard.tsx       # Interactive multiple choice
│           ├── DiagramCard.tsx    # Mermaid diagram rendering
│           ├── CodeCard.tsx       # Prism.js syntax highlighting
│           └── StepsCard.tsx      # Step-by-step visual walkthrough
│
├── scripts/                      # Content generation scripts (run with tsx)
│   ├── process-content.ts        # Process PDFs → cards via Claude API
│   ├── process-book.ts           # Process CLRS textbook chapters
│   ├── generate-visual-cards.ts  # Generate diagram/code/steps cards
│   ├── update-math-notation.ts   # Fix math notation in cards
│   ├── fix-math-nesting.ts       # Fix nested KaTeX issues
│   ├── fix-nesting.cjs           # Additional nesting fixes
│   ├── fix-quiz-math.cjs         # Fix math in quiz options
│   ├── check-math.cjs            # Validate math notation
│   └── check-quiz-math.cjs       # Validate quiz math
│
├── input/                        # Raw PDFs for processing (gitignored)
└── EducationalContentAlgorithmsAndDataStructures/  # Source materials (gitignored)
```

---

## Architecture & Data Flow

### Card Data Model

Cards are stored in `public/data/cards.json` — a flat JSON array of 830 cards. Each card:

```typescript
interface Card {
  id: string;           // Unique identifier
  type: CardType;       // 'summary' | 'bullets' | 'flashcard' | 'quiz' | 'diagram' | 'code' | 'steps'
  course: string;       // e.g. "Algorithms & Data Structures"
  subject: string;      // e.g. "Binary Search Trees"
  title: string;        // Card title
  content: Content;     // Type-specific content (varies by CardType)
  source: string;       // Source material reference
  createdAt: string;    // ISO date string
}
```

Content types: `SummaryContent`, `BulletsContent`, `FlashcardContent`, `QuizContent`, `DiagramContent`, `CodeContent`, `StepsContent` — all defined in `src/types/card.ts`.

### State Management

- **No external state lib** — all React `useState` + custom hooks
- **`useLocalStorage`** hook persists to `localStorage`:
  - `ds-user-state` → `Record<string, UserCardState>` (seen, learned, bookmarked per card)
  - `ds-brainrot` → `boolean` (brainrot mode toggle)
- **`useFeed`** hook: spaced-repetition algorithm that groups cards into never-seen / stale (>1hr) / recent tiers, shuffles within tiers. Caches result to prevent re-shuffle on mere `lastSeen` updates.

### Navigation & Touch Handling

- **CardViewer.tsx**: CSS `translateY` transforms for vertical snap navigation
  - Touch: `touchstart` → `touchmove` (preventDefault unless inside `.scrollable-touch`) → `touchend`
  - Only renders current ± 1 cards in DOM (virtual rendering)
  - Bottom action buttons: "Learned" (bottom-left), "Save/Bookmark" (bottom-right)
- **SideDrawer**: Slide-in drawer with course → subject hierarchy, search, bookmarks filter, progress bar

### Brainrot Mode

- Toggle: 🧠 button (top-right), state in `useLocalStorage('ds-brainrot')`
- When active:
  - Root div gets class `brainrot`
  - Top 40dvh: `<BrainrotPlayer />` — cycles through `public/videos/` files
  - Bottom 60dvh: study cards (via CSS `.brainrot .snap-container { height: 60dvh }`)
- **BrainrotPlayer.tsx**: Random start index, sequential advancement on video end. `autoPlay`, `muted`, `playsInline`, no loop. Uses `import.meta.env.BASE_URL` for paths.

### Math Rendering

- **MathText** component: Parses `$...$` (inline) and `$$...$$` (block) delimiters
- Renders via KaTeX's `renderToString`
- Used throughout card components for math-heavy content

---

## Build & Deploy

```bash
# Development
npm run dev          # Vite dev server

# Production build
npm run build        # tsc -b && vite build → outputs to dist/

# Preview production build
npm run preview

# Content generation (requires ANTHROPIC_API_KEY in .env)
npm run process      # tsx scripts/process-content.ts
```

### Deployment

Automatic via GitHub Actions on push to `main`:

1. `npm ci`
2. `npm run build`
3. Upload `dist/` as GitHub Pages artifact
4. Deploy to GitHub Pages

Workflow file: `.github/workflows/deploy.yml`

---

## External Tools Used

### Content Generation (scripts/)

- **Anthropic Claude API** (`@anthropic-ai/sdk`): Generates study cards from PDF content
- **pdf-parse**: Extracts text from course PDFs
- **mammoth**: Extracts text from DOCX files
- **tsx**: TypeScript script runner for content generation scripts

### Video Content (Brainrot Mode)

Videos are stored in `public/videos/` (~12MB total). Tools used to acquire/process them:

- **yt-dlp**: YouTube video downloader
  ```bash
  yt-dlp --no-playlist -f "best[height<=480][ext=mp4]/best[height<=480]" --download-sections "*0-20" --remux-video mp4 -o "public/videos/name.%(ext)s" "ytsearch:search query"
  ```
  Note: Exit code 1 from yt-dlp is normal even on success.

- **ffmpeg**: Video compression
  ```bash
  ffmpeg -y -i input.mp4 -t 20 -vf "scale=854:480" -c:v libx264 -crf 28 -preset fast -an output.mp4
  ```
  Settings: 480p, 20 seconds max, no audio, CRF 28.

- Both installed via `winget` (Windows). After install in same terminal session, reload PATH:
  ```powershell
  $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
  ```

### Current Video Inventory (public/videos/)

| File | Size |
|------|------|
| subway-surfers-1.mp4 | 0.4MB |
| subway-surfers-2.mp4 | 1.9MB |
| subway-surfers-3.mp4 | 3.1MB |
| neon-spiral.mp4 | 1.1MB |
| colorful-swirls.mp4 | 2.4MB |
| color-mixing.mp4 | 0.2MB |
| ink-water.mp4 | 0.2MB |
| abstract-paint.mp4 | 0.9MB |
| liquid-art.mp4 | 0.4MB |
| neon-glow.mp4 | 1.1MB |
| **Total** | **11.8MB** |

To add new videos: download/compress → place in `public/videos/` → add filename to the `VIDEOS` array in `src/components/BrainrotPlayer.tsx`.

---

## Key Patterns & Gotchas

### CSS Snap Scrolling
- `.snap-container` needs `position: relative` — cards use `absolute inset-0` positioning
- `.brainrot .snap-container` and `.brainrot .snap-card` override height to `60dvh`
- `.snap-card` default height is `100dvh`

### Touch Handling
- `touchmove` is prevented globally EXCEPT inside elements with `.scrollable-touch` class
- This enables native scroll for code blocks, long content, diagrams while keeping swipe navigation

### KaTeX
- Math delimiters: `$...$` for inline, `$$...$$` for block
- Some cards had nesting issues (math inside math) — fixed via multiple script passes
- KaTeX CSS imported in `main.tsx`

### Mermaid Diagrams
- Rendered in `DiagramCard.tsx` using `mermaid.render()`
- Code-split into its own chunk via Vite config
- Diagrams can overflow — wrapped in `.scrollable-touch` container

### PWA
- Service worker uses network-first strategy with cache fallback
- `InstallPrompt` shows once on first visit (dismissed state in localStorage)
- Detects Android (native `beforeinstallprompt`) vs iOS (manual instructions)

### GitHub Pages Constraints
- 100MB per file limit
- `base: '/DoomScrollPlus/'` required in Vite config for subdirectory deployment
- `index.html` manifest link uses `/manifest.json` (absolute), works because of Vite base rewriting

---

## localStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `ds-user-state` | `Record<string, UserCardState>` | Per-card seen/learned/bookmarked state |
| `ds-brainrot` | `boolean` | Brainrot mode toggle |
| `ds-install-dismissed` | `string` | PWA install prompt dismissed timestamp |

---

## Common Tasks

### Adding New Study Content
1. Place PDFs in `input/` directory
2. Set `ANTHROPIC_API_KEY` in `.env`
3. Run `npm run process` (or modify/run specific scripts in `scripts/`)
4. Cards append to `public/data/cards.json`
5. Build and deploy

### Adding New Card Types
1. Define content interface in `src/types/card.ts`
2. Add to `CardType` union
3. Create component in `src/components/cards/`
4. Add case to `renderCard()` switch in `CardViewer.tsx`

### Adding Brainrot Videos
1. Download with yt-dlp or from direct source
2. Compress with ffmpeg (480p, 20s, no audio, CRF 28)
3. Place in `public/videos/`
4. Add filename to `VIDEOS` array in `src/components/BrainrotPlayer.tsx`
5. Build and push

### Deploying Changes
```bash
npm run build
git add -A
git commit -m "description"
git push
```
GitHub Actions auto-deploys to Pages on push to `main`.
