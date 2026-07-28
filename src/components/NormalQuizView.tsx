import React, { useState, useEffect } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { QuestionItem } from "../types";
import { sounds } from "../utils/soundEffects";

interface NormalQuizViewProps {
  question: QuestionItem;
  onSelectOption: (isCorrect: boolean, selectedOptionText: string) => void;
}

export const NormalQuizView: React.FC<NormalQuizViewProps> = ({
  question,
  onSelectOption,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    setSelectedIndex(null);
    setHasAnswered(false);
  }, [question]);

  const handleOptionClick = (index: number) => {
    if (hasAnswered) return;

    setSelectedIndex(index);
    setHasAnswered(true);

    const isCorrect = index === question.answer;
    if (isCorrect) {
      sounds.playCorrect();
    } else {
      sounds.playWrong();
    }

    setTimeout(() => {
      onSelectOption(isCorrect, question.options[index]);
    }, 1200);
  };

  const optionLetters = ["A", "B", "C", "D"];

  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-3">
      <div className="grid grid-cols-1 gap-2.5">
        {question.options.map((optText, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrectAnswer = idx === question.answer;

          let btnClass =
            "bg-slate-900/90 border-slate-800 text-white hover:bg-slate-800 hover:border-slate-700";

          if (hasAnswered) {
            if (isCorrectAnswer) {
              btnClass =
                "bg-emerald-600/90 border-emerald-400 text-white font-black shadow-lg shadow-emerald-600/30";
            } else if (isSelected && !isCorrectAnswer) {
              btnClass =
                "bg-red-600/90 border-red-400 text-white font-black shadow-lg shadow-red-600/30";
            } else {
              btnClass = "bg-slate-900/40 border-slate-800/40 text-slate-500 opacity-60";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              disabled={hasAnswered}
              className={`w-full p-4 rounded-xl border-2 font-bold text-left text-xs md:text-sm flex items-center justify-between transition-all duration-200 active:scale-98 ${btnClass}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-slate-950/60 border border-white/10 flex items-center justify-center font-mono text-xs text-blue-300 font-extrabold shrink-0">
                  {optionLetters[idx]}
                </span>
                <span className="leading-snug break-words flex-1 min-w-0 [overflow-wrap:anywhere]">
                  {optText}
                </span>
              </div>

              {hasAnswered && isCorrectAnswer && (
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}

              {hasAnswered && isSelected && !isCorrectAnswer && (
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0">
                  <X className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Instant Explanation Box */}
      {hasAnswered && question.explanation && (
        <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-3.5 text-xs text-blue-200 space-y-1 animate-fadeIn">
          <div className="font-bold flex items-center gap-1 text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explanation:</span>
          </div>
          <p className="leading-relaxed text-slate-300">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};
