import React, { useState, useEffect } from "react";
import { Check, X, Sparkles, Flame } from "lucide-react";
import { QuestionItem } from "../types";
import { sounds } from "../utils/soundEffects";

interface NormalQuizViewProps {
  question: QuestionItem;
  onSelectOption: (isCorrect: boolean, selectedOptionText: string) => void;
  streak?: number;
}

export const NormalQuizView: React.FC<NormalQuizViewProps> = ({
  question,
  onSelectOption,
  streak = 0,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSelectedIndex(null);
    setHasAnswered(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [question]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasAnswered) {
        if (e.key === "1" || e.key.toLowerCase() === "a") handleOptionClick(0);
        else if (e.key === "2" || e.key.toLowerCase() === "b") handleOptionClick(1);
        else if (e.key === "3" || e.key.toLowerCase() === "c") handleOptionClick(2);
        else if (e.key === "4" || e.key.toLowerCase() === "d") handleOptionClick(3);
      } else if (e.key === "Enter" && selectedIndex !== null) {
        if (timeoutId) clearTimeout(timeoutId);
        onSelectOption(selectedIndex === question.answer, question.options[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasAnswered, question, timeoutId, selectedIndex]);

  const handleOptionClick = (index: number) => {
    if (hasAnswered) return;

    setSelectedIndex(index);
    setHasAnswered(true);

    const isCorrect = index === question.answer;
    if (isCorrect) {
      sounds.playCorrect();
      if (streak > 0) {
        setTimeout(() => sounds.playCombo(streak + 1), 160);
      }
    } else {
      sounds.playWrong();
    }

    const id = setTimeout(() => {
      onSelectOption(isCorrect, question.options[index]);
    }, 2400);
    setTimeoutId(id);
  };

  const optionLetters = ["A", "B", "C", "D"];
  const optionColors = [
    "from-blue-600/20 hover:border-blue-500",
    "from-purple-600/20 hover:border-purple-500",
    "from-pink-600/20 hover:border-pink-500",
    "from-emerald-600/20 hover:border-emerald-500",
  ];

  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-3.5 select-none">
      {/* Streak Badge Notice */}
      {streak >= 2 && (
        <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-amber-500/15 border border-amber-500/40 rounded-full text-amber-300 text-xs font-black w-fit mx-auto animate-pulse shadow-lg">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{streak}X STREAK ACTIVE!</span>
        </div>
      )}

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((optText, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrectAnswer = idx === question.answer;

          // Updated to pixel‑art minimalism: solid background, no gradients or glass‑morphism
let btnClass = "bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 shadow-md";

          if (hasAnswered) {
            if (isCorrectAnswer) {
              btnClass =
                "bg-emerald-600/95 border-emerald-400 text-white font-black shadow-lg shadow-emerald-600/40 scale-[1.01]";
            } else if (isSelected && !isCorrectAnswer) {
              btnClass =
                "bg-red-600/95 border-red-400 text-white font-black shadow-lg shadow-red-600/40";
            } else {
              btnClass = "bg-slate-900/30 border-slate-800/30 text-slate-500 opacity-50";
            }
          } else {
            btnClass += ` ${optionColors[idx % optionColors.length]}`;
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleOptionClick(idx)}
              disabled={hasAnswered}
              className={`w-full p-4 rounded-2xl border-2 font-bold text-left text-xs md:text-sm flex items-center justify-between transition-all duration-200 active:scale-98 ${btnClass}`}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="relative group">
                  <span className="w-8 h-8 rounded-xl bg-slate-950/80 border border-white/15 flex items-center justify-center font-mono text-xs text-blue-300 font-black shrink-0 shadow-inner">
                    {optionLetters[idx]}
                  </span>
                  {!hasAnswered && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] text-slate-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap hidden md:block border border-slate-700 font-mono">
                      Key {idx + 1}
                    </span>
                  )}
                </div>
                <span className="leading-snug break-words flex-1 min-w-0 [overflow-wrap:anywhere]">
                  {optText}
                </span>
              </div>

              {hasAnswered && isCorrectAnswer && (
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0 shadow-md">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}

              {hasAnswered && isSelected && !isCorrectAnswer && (
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0 shadow-md">
                  <X className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Instant Explanation Box */}
      {hasAnswered && question.explanation && (
        <div className="bg-slate-900/95 border-2 border-blue-500/40 rounded-2xl p-4 text-xs text-blue-200 space-y-1.5 shadow-2xl animate-fadeIn relative backdrop-blur-md">
          <div className="font-black flex items-center justify-between gap-1 text-blue-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="uppercase tracking-wider text-[11px]">Explanation</span>
            </div>
            <div className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 font-mono">
              Press Enter ↵
            </div>
          </div>
          <p className="leading-relaxed text-slate-300 text-xs md:text-sm">
            {question.explanation}
          </p>

          {/* Auto advance progress bar */}
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-[pulse_2s_infinite]" />
          </div>
        </div>
      )}
    </div>
  );
};
