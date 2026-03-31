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

export type CardType = 'summary' | 'bullets' | 'flashcard' | 'quiz';

export interface Card {
  id: string;
  type: CardType;
  course: string;
  subject: string;
  title: string;
  content: SummaryContent | BulletsContent | FlashcardContent | QuizContent;
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
