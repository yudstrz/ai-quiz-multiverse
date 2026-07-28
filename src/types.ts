export type GameMode = "normal" | "runner" | "flappy" | "dash" | "shooter";

export type AvatarShape = "triangle" | "square" | "circle";

export interface AvatarConfig {
  shape: AvatarShape;
  color: string;
  face: string;
}

export interface QuestionItem {
  question: string;
  options: string[];
  answer: number; // 0, 1, 2, or 3
  explanation: string;
}

export interface HistoryItem {
  question: string;
  isCorrect: boolean;
  selectedOptionText: string;
  correctAnswerText: string;
  explanation: string;
}

export interface GameState {
  score: number;
  correctAnswers: number;
  currentIndex: number;
  questions: QuestionItem[];
  history: HistoryItem[];
  isFinished: boolean;
  isPlaying: boolean;
  soundEnabled: boolean;
}
