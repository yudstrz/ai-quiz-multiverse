import React, { useEffect, useState } from "react";
import { Volume2, VolumeX, ArrowLeft, Trophy, HelpCircle, Flame } from "lucide-react";

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
  // Animated score counter for juice
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    if (displayScore === score) return;
    const diff = score - displayScore;
    const step = Math.ceil(diff / 5);
    const timer = setTimeout(() => {
      setDisplayScore((prev) => Math.min(score, prev + step));
    }, 40);
    return () => clearTimeout(timer);
  }, [score, displayScore]);

  const progressPercent = Math.round(
    ((currentIndex + 1) / Math.max(1, totalQuestions)) * 100
  );

  return (
    <div className="w-full flex flex-col items-center justify-start space-y-2.5 px-4 pt-3 pb-1 select-none pointer-events-auto">
      {/* Top Header Bar */}
      <div className="w-full max-w-xl flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onReset}
          className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-all active:scale-95 shadow-lg flex items-center gap-1.5 text-xs font-bold"
          title="Return to Menu"
        >
          <ArrowLeft className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline">Menu</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Animated Score Badge */}
          <div className="bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-400">Score:</span>
            <span className="text-yellow-400 font-mono text-sm tracking-wide">
              {displayScore}
            </span>
          </div>

          {/* Streak Flame Badge */}
          {streak >= 2 && (
            <div className="bg-amber-950/80 border border-amber-500/50 px-2.5 py-1.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-1 text-amber-300 animate-pulse">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-mono">{streak}x</span>
            </div>
          )}

          {/* Question Counter */}
          <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 font-mono">
              {Math.min(currentIndex + 1, totalQuestions)}/{totalQuestions}
            </span>
          </div>
        </div>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-all active:scale-95 shadow-lg"
          title={soundEnabled ? "Mute Sound" : "Enable Sound"}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>

      {/* Progress Bar with Glowing Tip */}
      <div className="w-full max-w-xl h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Active Question Box */}
      {questionText && (
        <div className="w-full max-w-lg bg-slate-900/95 border-2 border-blue-500/40 rounded-2xl p-3.5 md:p-4 text-center shadow-2xl backdrop-blur-md transition-all">
          <p className="text-xs md:text-sm font-extrabold text-white leading-relaxed">
            {questionText}
          </p>
        </div>
      )}
    </div>
  );
};
