# DoomScroll+ 📚

A TikTok/Reels-style study app that turns your school documents into bite-sized, swipeable content cards. Doom scroll your way to better grades.

## Features

- **Full-screen vertical swipe** — snap-scroll card experience like TikTok
- **4 card types** — summaries, bullet points, flashcards (tap to flip), quizzes
- **Spaced repetition** — unseen/stale cards surface first
- **Subject filtering** — filter by auto-detected categories
- **Bookmarks** — save cards for later review
- **Mark as learned** — hide mastered content from feed
- **Progress tracking** — see how much you've covered per subject
- **Dark/Light mode** — toggle with persistence
- **PWA** — installable on your phone home screen, works offline
- **Mobile-first** — designed for phone scrolling, works on desktop too

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173/DoomScroll+/ in your browser.

## Adding Your Own Content

### 1. Set up your API key

Create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=your-key-here
```

### 2. Add documents

Place your files in the `input/` folder:
- `.pdf` — textbooks, lecture slides
- `.docx` — Word documents, essays
- `.txt` / `.md` — plain text notes

### 3. Generate cards

```bash
npm run process
```

This sends your documents to Claude, which generates study cards and saves them to `public/data/cards.json`.

### 4. Deploy

Push to GitHub and the GitHub Actions workflow will automatically deploy to GitHub Pages.

Or build manually:

```bash
npm run build
```

## Tech Stack

- **React 19** + TypeScript
- **Vite 6** — fast dev server and builds
- **Tailwind CSS 3** — utility-first styling
- **Anthropic Claude** (claude-3.5-haiku) — content generation
- **GitHub Pages** — free static hosting

## Project Structure

```
src/
  App.tsx              — root layout, state management
  components/
    CardViewer.tsx     — snap-scroll container + action buttons
    SubjectFilter.tsx  — subject pills + search
    ProgressBar.tsx    — learned/seen progress
    ThemeToggle.tsx    — dark/light switch
    cards/
      SummaryCard.tsx  — paragraph summary
      BulletsCard.tsx  — bullet points
      FlashCard.tsx    — flip-to-reveal
      QuizCard.tsx     — multiple choice
  hooks/
    useFeed.ts         — spaced repetition + filtering
    useLocalStorage.ts — persistent state
  types/
    card.ts            — TypeScript interfaces
public/
  data/cards.json      — generated content
  manifest.json        — PWA manifest
  sw.js                — service worker
scripts/
  process-content.ts   — CLI document → card pipeline
```
