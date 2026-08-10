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
  BookOpen,
  Download
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

  const handleDownload = () => {
    let content = "=== AI MULTIVERSE QUIZ ===\n\n";
    history.forEach((item, idx) => {
      content += `Q${idx + 1}. ${item.question}\n`;
      content += `Answer: ${item.correctAnswerText}\n`;
      content += `Explanation: ${item.explanation}\n\n`;
    });
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "multiverse_quiz.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-xl mx-auto min-h-screen p-4 flex flex-col justify-between">
      <div>
        {/* Header Banner */}
        <div className="text-center mb-6 pt-4">
          <div className="inline-flex items-center justify-center p-3 bg-slate-800 rounded-full mb-3 shadow-lg shadow-indigo-500/20">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">
            Quiz Complete!
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Let's see how you did.
          </p>
        </div>

        {/* Score Card */}
        <div className={`p-5 rounded-2xl border-2 mb-6 text-center ${gradeColor} shadow-xl`}>
          <div className="text-5xl font-black mb-2 flex items-center justify-center gap-2">
            {score} <span className="text-lg font-bold opacity-70 mt-3">PTS</span>
          </div>
          <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">
            {correctCount} out of {totalQuestions} correct
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/20 rounded-full text-xs font-bold mt-1">
            <Award className="w-3.5 h-3.5" />
            <span>{gradeBadge}</span>
          </div>
        </div>

        {/* History / Review */}
        <div className="space-y-3 mb-8">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-3 px-1">
            <BookOpen className="w-4 h-4 text-blue-400" />
            Answer Review
          </h3>
          
          {history.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border ${
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
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 text-slate-300 text-[11px] leading-relaxed flex items-start gap-1.5 mt-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>{item.explanation}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-2 pb-6">
        <button
          onClick={handleDownload}
          className="w-full py-3 px-4 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl font-bold text-xs md:text-sm border border-blue-500/20 transition-transform active:scale-98 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Quiz Summary</span>
        </button>
        
        <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
};
