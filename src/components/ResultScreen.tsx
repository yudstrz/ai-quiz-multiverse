import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Trophy,
  RotateCcw,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  BookOpen
} from "lucide-react";
import { HistoryItem } from "../types";
import { sounds } from "../utils/soundEffects";

interface ResultScreenProps {
  score: number;
  correctCount: number;
  totalQuestions: number;
  history: HistoryItem[];
  onRetry: () => void;
  onNewQuiz: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  score,
  correctCount,
  totalQuestions,
  history,
  onRetry,
  onNewQuiz,
}) => {
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  useEffect(() => {
    if (percentage >= 60) {
      sounds.playVictory();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [percentage]);

  let gradeBadge = "Novice Scholar";
  let gradeColor = "text-blue-400 bg-blue-500/10 border-blue-500/30";

  if (percentage === 100) {
    gradeBadge = "🏆 Multiverse Master!";
    gradeColor = "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  } else if (percentage >= 80) {
    gradeBadge = "🌟 High Achiever";
    gradeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  } else if (percentage >= 60) {
    gradeBadge = "👍 Good Effort";
    gradeColor = "text-purple-400 bg-purple-500/10 border-purple-500/30";
  }

  return (
    <div className="w-full max-w-xl mx-auto min-h-screen p-4 md:p-6 flex flex-col justify-start bg-slate-950 text-white animate-fadeIn space-y-5">
      {/* Top Banner */}
      <div className="text-center space-y-2 mt-2">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${gradeColor}`}
        >
          <Award className="w-4 h-4" />
          <span>{gradeBadge}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400">
          Quiz Completed!
        </h1>
        <p className="text-xs text-slate-400">Simulation & Knowledge Assessment Finished</p>
      </div>

      {/* Score Summary Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-center shadow-2xl space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Final Score</p>
        <div className="text-5xl font-black text-yellow-400 font-mono tracking-tight">
          {score}
        </div>

        <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-800 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Trophy className="w-4 h-4" />
            <span>{correctCount} / {totalQuestions} Correct</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="text-indigo-300">
            <span>Accuracy: {percentage}%</span>
          </div>
        </div>
      </div>

      {/* Per-Question Evaluation List */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-blue-400" />
          Full Review & AI Explanations
        </h2>

        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
          {history.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border backdrop-blur-sm space-y-2 text-xs ${
                item.isCorrect
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : "bg-red-950/20 border-red-500/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-white leading-snug">
                  Q{idx + 1}. {item.question}
                </span>
                {item.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
              </div>

              {!item.isCorrect && (
                <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                  <p className="text-red-300">Your answer: {item.selectedOptionText}</p>
                  <p className="text-emerald-300 font-bold">
                    Correct answer: {item.correctAnswerText}
                  </p>
                </div>
              )}

              {item.explanation && (
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 text-slate-300 text-[11px] leading-relaxed flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>{item.explanation}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2 pb-6">
        <button
          onClick={onRetry}
          className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-emerald-600/30 transition-transform active:scale-98 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry Quiz</span>
        </button>

        <button
          onClick={onNewQuiz}
          className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs md:text-sm border border-slate-700 shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-blue-400" />
          <span>New Quiz</span>
        </button>
      </div>
    </div>
  );
};
