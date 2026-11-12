import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Trophy, RotateCcw, PlusCircle, CheckCircle2, XCircle, Download } from "lucide-react";
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

const GRADES = [
  { min: 100, label: "QUIZVERSE MASTER", color: "var(--color-px-yellow)", border: "#ffb800" },
  { min: 80,  label: "HIGH ACHIEVER",     color: "var(--color-px-green)",  border: "#00e676" },
  { min: 60,  label: "GOOD EFFORT",       color: "var(--color-px-blue)",   border: "#3d9bff" },
  { min: 0,   label: "NOVICE SCHOLAR",    color: "var(--color-px-dim)",    border: "#3a3a4a" },
] as const;

export const ResultScreen: React.FC<ResultScreenProps> = ({
  score, correctCount, totalQuestions, history, onRetry, onNewQuiz,
}) => {
  const pct = Math.round((correctCount / totalQuestions) * 100);
  const grade = GRADES.find(g => pct >= g.min) ?? GRADES[GRADES.length - 1];

  useEffect(() => {
    if (pct >= 60) {
      sounds.playVictory();
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
    }
  }, [pct]);

  const handleDownload = () => {
    const lines = [
      "MAX QUIZVERSE SUMMARY",
      "=====================",
      `Score  : ${score} PTS`,
      `Result : ${correctCount}/${totalQuestions} (${pct}%)`,
      `Rank   : ${grade.label}`,
      `Date   : ${new Date().toLocaleString()}`,
      "",
      "REVIEW",
      "------",
      ...history.flatMap((item, i) => [
        `Q${i + 1}. ${item.question}`,
        `  Your answer   : ${item.selectedOptionText} [${item.isCorrect ? "CORRECT" : "WRONG"}]`,
        `  Correct answer: ${item.correctAnswerText}`,
        item.explanation ? `  Explanation   : ${item.explanation}` : "",
        "",
      ]),
      "Keep learning! - Max Quizverse",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-lg mx-auto min-h-screen flex flex-col justify-between px-4 py-6 gap-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <Trophy className="w-10 h-10 text-[var(--color-px-yellow)]" strokeWidth={2} />
        <h2 className="text-sm tracking-widest uppercase text-[var(--color-px-text)]">Quiz Complete</h2>

        {/* Score card */}
        <div
          className="card-px w-full py-5 px-4 text-center"
          style={{ borderColor: grade.border }}
        >
          <div className="text-4xl tracking-widest" style={{ color: grade.color }}>{score}</div>
          <div className="text-[9px] mt-1 text-[var(--color-px-dim)]">POINTS</div>
          <div className="text-[8px] mt-3 tracking-widest uppercase" style={{ color: grade.color }}>
            {grade.label}
          </div>
          <div className="text-[9px] mt-2 text-[var(--color-px-text)]">
            {correctCount} / {totalQuestions} correct ({pct}%)
          </div>
        </div>
      </div>

      {/* Review */}
      <div className="flex flex-col gap-2">
        <div className="text-[8px] uppercase tracking-widest text-[var(--color-px-dim)] px-1">
          Answer Review
        </div>
        {history.map((item, idx) => (
          <div
            key={idx}
            className="card-px px-3 py-2.5 flex items-start gap-2"
            style={{ borderColor: item.isCorrect ? "#00e676" : "#ff3d57" }}
          >
            {item.isCorrect
              ? <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--color-px-green)]" strokeWidth={2} />
              : <XCircle className="w-4 h-4 shrink-0 text-[var(--color-px-red)]" strokeWidth={2} />
            }
            <div className="flex flex-col gap-1 text-[8px] min-w-0">
              <span className="text-[var(--color-px-text)] leading-relaxed">Q{idx + 1}. {item.question}</span>
              {!item.isCorrect && (
                <>
                  <span className="text-[var(--color-px-red)]">✗ {item.selectedOptionText}</span>
                  <span className="text-[var(--color-px-green)]">✓ {item.correctAnswerText}</span>
                </>
              )}
              {item.explanation && (
                <span className="text-[var(--color-px-dim)] mt-0.5 leading-loose">{item.explanation}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pb-2">
        <button onClick={handleDownload} className="btn-px w-full py-3 justify-center">
          <Download className="w-3.5 h-3.5" strokeWidth={2} />
          DOWNLOAD SUMMARY (.TXT)
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onRetry}
            className="btn-px py-3 justify-center"
            style={{ borderColor: "var(--color-px-green)" }}
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
            RETRY
          </button>
          <button onClick={onNewQuiz} className="btn-px py-3 justify-center">
            <PlusCircle className="w-3.5 h-3.5" strokeWidth={2} />
            NEW QUIZ
          </button>
        </div>
      </div>
    </div>
  );
};
