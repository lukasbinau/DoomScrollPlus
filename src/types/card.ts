export interface SummaryContent {
  text: string;
}

export interface BulletsContent {
  points: string[];
}

export interface FlashcardContent {
  question: string;
  answer: string;
}

export interface QuizContent {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface DiagramContent {
  mermaid: string;
  caption: string;
}

export interface CodeContent {
  code: string;
  language: string;
  explanation: string;
}

export interface StepsContent {
  steps: Array<{
    visual: string;
    label: string;
  }>;
  summary: string;
}

export type CardType = 'summary' | 'bullets' | 'flashcard' | 'quiz' | 'diagram' | 'code' | 'steps';

export interface Card {
  id: string;
  type: CardType;
  course: string;
  subject: string;
  title: string;
  content: SummaryContent | BulletsContent | FlashcardContent | QuizContent | DiagramContent | CodeContent | StepsContent;
  source: string;
  createdAt: string;
}

export interface UserCardState {
  lastSeen?: number;
  learned?: boolean;
  bookmarked?: boolean;
  quizCorrect?: boolean;
}

export type UserState = Record<string, UserCardState>;
