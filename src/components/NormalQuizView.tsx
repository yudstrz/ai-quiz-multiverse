import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { QuestionItem } from "../types";
import { sounds } from "../utils/soundEffects";

interface NormalQuizViewProps {
  question: QuestionItem;
  onSelectOption: (isCorrect: boolean, selectedOptionText: string) => void;
  streak?: number;
}

const LETTERS = ["A", "B", "C", "D"] as const;

// Solid pixel‑palette per option — no gradients
const OPTION_COLORS: { base: string; border: string }[] = [
  { base: "#1a2a4a", border: "#3d9bff" },
  { base: "#2a1a4a", border: "#9b6dff" },
  { base: "#2a1a2a", border: "#ff3d57" },
  { base: "#1a3a2a", border: "#00e676" },
];

export const NormalQuizView: React.FC<NormalQuizViewProps> = ({
  question,
  onSelectOption,
  streak = 0,
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [tid, setTid] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Reset on new question
  useEffect(() => {
    setSelected(null);
    setAnswered(false);
    if (tid) { clearTimeout(tid); setTid(null); }
  }, [question]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!answered) {
        const map: Record<string, number> = { "1": 0, a: 0, "2": 1, b: 1, "3": 2, c: 2, "4": 3, d: 3 };
        const idx = map[e.key.toLowerCase()];
        if (idx !== undefined) pick(idx);
      } else if (e.key === "Enter" && selected !== null) {
        if (tid) clearTimeout(tid);
        onSelectOption(selected === question.answer, question.options[selected]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, question, tid, selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === question.answer;
    if (correct) {
      sounds.playCorrect();
      if (streak > 0) setTimeout(() => sounds.playCombo(streak + 1), 160);
    } else {
      sounds.playWrong();
    }
    setTid(setTimeout(() => onSelectOption(correct, question.options[idx]), 2200));
  };

  return (
    <div className="w-full max-w-lg mx-auto px-3 py-2 flex flex-col gap-3 select-none">
      {/* Streak notice */}
      {streak >= 2 && (
        <div
          className="card-px flex items-center justify-center gap-2 py-1.5 text-[9px] self-center px-4 border-[var(--color-px-amber)]!"
          aria-live="polite"
        >
          🔥 <span className="text-[var(--color-px-amber)]">{streak}X STREAK</span>
        </div>
      )}

      {/* Options */}
      <div className="flex flex-col gap-2">
        {question.options.map((opt, idx) => {
          const isCorrect = idx === question.answer;
          const isSelected = selected === idx;
          const col = OPTION_COLORS[idx % OPTION_COLORS.length];

          let bg = col.base;
          let border: string = col.border;
          let textColor = "var(--color-px-text)";
          let opacity = "1";
          let translateStr = "";

          if (answered) {
            if (isCorrect) {
              bg = "#003320";
              border = "#00e676";
            } else if (isSelected) {
              bg = "#330010";
              border = "#ff3d57";
            } else {
              opacity = "0.4";
            }
          } else {
            translateStr = "hover:-translate-y-px";
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => pick(idx)}
              disabled={answered}
              aria-pressed={isSelected}
              aria-label={`Option ${LETTERS[idx]}: ${opt}`}
              className={`w-full text-left flex items-center gap-3 px-3 py-3 text-[9px] leading-relaxed
                transition-transform duration-100 active:translate-y-px shadow-px ${translateStr}`}
              style={{
                background: bg,
                border: `2px solid ${border}`,
                color: textColor,
                opacity,
                boxShadow: "2px 2px 0 #000",
                fontFamily: "var(--font-pixel)",
              }}
            >
              {/* Letter badge */}
              <span
                className="shrink-0 w-7 h-7 flex items-center justify-center text-[9px] font-bold border border-current"
                style={{ borderColor: border }}
              >
                {LETTERS[idx]}
              </span>

              <span className="flex-1 break-words [overflow-wrap:anywhere]">{opt}</span>

              {answered && isCorrect && (
                <Check className="w-4 h-4 shrink-0 text-[var(--color-px-green)]" strokeWidth={3} />
              )}
              {answered && isSelected && !isCorrect && (
                <X className="w-4 h-4 shrink-0 text-[var(--color-px-red)]" strokeWidth={3} />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && question.explanation && (
        <div
          className="card-px p-3 text-[8px] leading-loose text-[var(--color-px-dim)] border-[var(--color-px-blue)]!"
          aria-live="polite"
        >
          <span className="text-[var(--color-px-blue)] uppercase tracking-wider text-[8px]">
            💡 Explanation
          </span>
          <p className="mt-1 text-[var(--color-px-text)]">{question.explanation}</p>
          <div className="text-[7px] text-[var(--color-px-dim)] mt-2">ENTER → next</div>
        </div>
      )}
    </div>
  );
};
