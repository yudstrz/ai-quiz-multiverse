import React, { useState } from "react";
import {
  AvatarConfig,
  GameMode,
  GameState,
  QuestionItem,
  HistoryItem,
  DifficultyLevel,
  Language,
} from "./types";
import { SetupScreen } from "./components/SetupScreen";
import { GameUIOverlay } from "./components/GameUIOverlay";
import { NormalQuizView } from "./components/NormalQuizView";
import { GameCanvasView } from "./components/GameCanvasView";
import { ResultScreen } from "./components/ResultScreen";
import { NotificationToast } from "./components/NotificationToast";

import { DEFAULT_PRESETS } from "./utils/presets";

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    correctAnswers: 0,
    currentIndex: 0,
    questions: [],
    history: [],
    isFinished: false,
    isPlaying: false,
    soundEnabled: true,
    streak: 0,
    maxStreak: 0,
  });

  const [gameMode, setGameMode] = useState<GameMode>("normal");
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>({
    shape: "hexagon",
    color: "#3b82f6",
    face: "(•‿•)",
    emojiChar: "👽",
  });
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [language, setLanguage] = useState<Language>("English");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"error" | "success" | "info">("error");

  const showToast = (
    msg: string,
    type: "error" | "success" | "info" = "error"
  ) => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Start playing with a list of questions
  const launchQuizGame = (questions: QuestionItem[]) => {
    setGameState({
      score: 0,
      correctAnswers: 0,
      currentIndex: 0,
      questions,
      history: [],
      isFinished: false,
      isPlaying: true,
      soundEnabled: true,
      streak: 0,
      maxStreak: 0,
    });
  };

  // Call Server API to generate AI quiz from text notes
  const handleGenerateAI = async (
    sourceText: string,
    numQuestions: number,
    diff: DifficultyLevel = difficulty,
    lang: Language = language
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText,
          questionCount: numQuestions,
          difficulty: diff,
          language: lang,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isMissingKey) {
          showToast(
            "Gemini API key missing on server. Using fallback trivia preset.",
            "info"
          );
          handleUsePreset("general");
          return;
        }
        throw new Error(data.error || "Failed to generate AI quiz");
      }

      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions were generated.");
      }

      showToast("AI Quiz created successfully!", "success");
      launchQuizGame(data.questions);
    } catch (err: unknown) {
      console.error("AI Generation error:", err);
      const msg = err instanceof Error ? err.message : "AI Generation failed. Loading demo preset.";
      showToast(msg, "error");
      // Fallback
      handleUsePreset("general");
    } finally {
      setIsLoading(false);
    }
  };

  // Load preset quiz locally to support offline play
  const handleUsePreset = async (category: string) => {
    setIsLoading(true);
    try {
      const presetQuestions = DEFAULT_PRESETS[category as keyof typeof DEFAULT_PRESETS] || DEFAULT_PRESETS.general;
      if (presetQuestions && presetQuestions.length > 0) {
        launchQuizGame(presetQuestions);
      } else {
        showToast("Failed to load preset quiz", "error");
      }
    } catch {
      showToast("Error loading preset", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Record answer result
  const handleAnswerResult = (
    isCorrect: boolean,
    selectedOptionText: string
  ) => {
    setGameState((prev) => {
      const currentQ = prev.questions[prev.currentIndex];
      // compute new streak value
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const newMaxStreak = Math.max(prev.maxStreak, newStreak);
      // points: base 100 for correct, plus 20 per combo after first correct
      const pointsEarned = isCorrect ? 100 + Math.max(0, newStreak - 1) * 20 : 0;
      const newHistoryItem: HistoryItem = {
        question: currentQ.question,
        isCorrect,
        selectedOptionText,
        correctAnswerText: currentQ.options[currentQ.answer],
        explanation: currentQ.explanation,
        pointsEarned,
        streakAtAnswer: newStreak,
      };

      const nextIndex = prev.currentIndex + 1;
      const isFinished = nextIndex >= prev.questions.length;

      return {
        ...prev,
        score: prev.score + pointsEarned,
        correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
        currentIndex: nextIndex,
        history: [...prev.history, newHistoryItem],
        streak: newStreak,
        maxStreak: newMaxStreak,
        isFinished,
        isPlaying: !isFinished,
      };
    });
  };

  const handleRetry = () => {
    setGameState((prev) => ({
      ...prev,
      score: 0,
      correctAnswers: 0,
      currentIndex: 0,
      history: [],
      isFinished: false,
      isPlaying: true,
    }));
  };

  const handleResetToSetup = () => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      isFinished: false,
    }));
  };

  const toggleSound = () => {
    setGameState((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  const currentQuestion = gameState.questions[gameState.currentIndex];

  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col" style={{ background: "var(--color-px-bg)", color: "var(--color-px-text)" }}>
      <NotificationToast message={toastMessage} type={toastType} />

      {/* Screen 1: Setup / Home */}
      {!gameState.isPlaying && !gameState.isFinished && (
        <SetupScreen
          onGenerateAI={handleGenerateAI}
          onUsePreset={handleUsePreset}
          gameMode={gameMode}
          setGameMode={setGameMode}
          avatarConfig={avatarConfig}
          setAvatarConfig={setAvatarConfig}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          language={language}
          setLanguage={setLanguage}
          isLoading={isLoading}
          showToast={showToast}
        />
      )}

      {/* Screen 2: Active Playing Screen */}
      {gameState.isPlaying && !gameState.isFinished && currentQuestion && (
        <div className="flex-1 flex flex-col items-center justify-between min-h-screen py-2">
          <GameUIOverlay
            score={gameState.score}
            currentIndex={gameState.currentIndex}
            totalQuestions={gameState.questions.length}
            questionText={currentQuestion.question}
            soundEnabled={gameState.soundEnabled}
            onToggleSound={toggleSound}
            onReset={handleResetToSetup}
            streak={gameState.streak}
          />

          <div className="w-full flex-1 flex items-center justify-center py-2">
            {gameMode === "normal" ? (
              <NormalQuizView
                question={currentQuestion}
                onSelectOption={handleAnswerResult}
                streak={gameState.streak}
              />
            ) : (
              <GameCanvasView
                gameMode={gameMode}
                question={currentQuestion}
                avatarConfig={avatarConfig}
                onAnswerResult={handleAnswerResult}
                soundEnabled={gameState.soundEnabled}
                streak={gameState.streak}
              />
            )}
          </div>
        </div>
      )}

      {/* Screen 3: Results & Evaluation */}
      {gameState.isFinished && (
        <ResultScreen
          score={gameState.score}
          correctCount={gameState.correctAnswers}
          totalQuestions={gameState.questions.length}
          history={gameState.history}
          onRetry={handleRetry}
          onNewQuiz={handleResetToSetup}
        />
      )}
    </div>
  );
}
