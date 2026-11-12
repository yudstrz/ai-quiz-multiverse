export type GameMode = "normal" | "runner" | "flappy" | "dash" | "shooter";

export type DifficultyLevel = "easy" | "medium" | "hard";
export type Language = "English" | "Indonesian";
export type AvatarShape = "hexagon" | "square" | "circle" | "emoji";

export interface AvatarConfig {
  shape: AvatarShape;
  color: string;
  face: string;
  emojiChar?: string;
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
  pointsEarned?: number;
  streakAtAnswer?: number;
}

export interface GameState {
  score: number;
  correctAnswers: number;
  currentIndex: number;
  streak: number;
  maxStreak: number;
  questions: QuestionItem[];
  history: HistoryItem[];
  isFinished: boolean;
  isPlaying: boolean;
  soundEnabled: boolean;
}
