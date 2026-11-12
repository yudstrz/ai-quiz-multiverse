import React, { useEffect, useState } from "react";
import { Volume2, VolumeX, ArrowLeft, Trophy, Flame } from "lucide-react";

interface GameUIOverlayProps {
  score: number;
  currentIndex: number;
  totalQuestions: number;
  questionText: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onReset: () => void;
  streak?: number;
}

export const GameUIOverlay: React.FC<GameUIOverlayProps> = ({
  score,
  currentIndex,
  totalQuestions,
  questionText,
  soundEnabled,
  onToggleSound,
  onReset,
  streak = 0,
}) => {
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    if (displayScore === score) return;
    const step = Math.ceil((score - displayScore) / 5);
    const t = setTimeout(() => setDisplayScore(p => Math.min(score, p + step)), 40);
    return () => clearTimeout(t);
  }, [score, displayScore]);

  const pct = Math.round(((currentIndex + 1) / Math.max(1, totalQuestions)) * 100);

  return (
    <div className="w-full flex flex-col gap-2 px-3 pt-3 pb-1 select-none">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between gap-2 max-w-xl mx-auto w-full">
        {/* Back */}
        <button
          type="button"
          onClick={onReset}
          className="btn-px text-[10px] gap-1.5 px-3 py-2"
          title="Menu"
          aria-label="Return to menu"
        >
          <ArrowLeft className="w-3 h-3" strokeWidth={2} />
          <span className="hidden sm:inline">MENU</span>
        </button>

        {/* Score + Streak */}
        <div className="flex items-center gap-2">
          <div className="card-px flex items-center gap-2 px-3 py-1.5 text-[10px]">
            <Trophy className="w-3.5 h-3.5 text-[var(--color-px-yellow)]" strokeWidth={2} />
            <span className="text-[var(--color-px-dim)]">PTS</span>
            <span className="text-[var(--color-px-yellow)] font-bold">{displayScore}</span>
          </div>

          {streak >= 2 && (
            <div
              className="card-px flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] border-[var(--color-px-amber)]!"
              aria-label={`${streak}x streak`}
            >
              <Flame className="w-3.5 h-3.5 text-[var(--color-px-amber)]" strokeWidth={2} />
              <span className="text-[var(--color-px-amber)]">{streak}x</span>
            </div>
          )}

          <div className="card-px flex items-center gap-1.5 px-3 py-1.5 text-[10px]">
            <span className="text-[var(--color-px-blue)]">
              {Math.min(currentIndex + 1, totalQuestions)}/{totalQuestions}
            </span>
          </div>
        </div>

        {/* Sound */}
        <button
          type="button"
          onClick={onToggleSound}
          className="btn-px px-3 py-2"
          title={soundEnabled ? "Mute" : "Unmute"}
          aria-label={soundEnabled ? "Mute sound" : "Enable sound"}
        >
          {soundEnabled
            ? <Volume2 className="w-3.5 h-3.5 text-[var(--color-px-green)]" strokeWidth={2} />
            : <VolumeX className="w-3.5 h-3.5 text-[var(--color-px-dim)]" strokeWidth={2} />
          }
        </button>
      </div>

      {/* ── Progress bar (solid, pixel style) ── */}
      <div className="w-full max-w-xl mx-auto h-2 bg-[var(--color-px-surface)] border border-[var(--color-px-border)]">
        <div
          className="h-full bg-[var(--color-px-blue)] transition-all duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* ── Question box ── */}
      {questionText && (
        <div className="card-px w-full max-w-lg mx-auto px-4 py-3 text-center border-[var(--color-px-blue)]!">
          <p className="text-[9px] sm:text-[10px] leading-loose text-[var(--color-px-text)]">
            {questionText}
          </p>
        </div>
      )}
    </div>
  );
};
