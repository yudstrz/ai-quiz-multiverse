import React from "react";
import { Volume2, VolumeX, ArrowLeft, Trophy, HelpCircle } from "lucide-react";

interface GameUIOverlayProps {
  score: number;
  currentIndex: number;
  totalQuestions: number;
  questionText: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onReset: () => void;
}

export const GameUIOverlay: React.FC<GameUIOverlayProps> = ({
  score,
  currentIndex,
  totalQuestions,
  questionText,
  soundEnabled,
  onToggleSound,
  onReset,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-start space-y-3 px-4 pt-3 pb-1 select-none pointer-events-auto">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between gap-2">
        <button
          onClick={onReset}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-colors shadow-lg flex items-center gap-1.5 text-xs font-bold"
          title="Return to Menu"
        >
          <ArrowLeft className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline">Menu</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Score Badge */}
          <div className="bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-400">Score:</span>
            <span className="text-yellow-400 font-mono text-sm">{score}</span>
          </div>

          {/* Question Counter */}
          <div className="bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 font-mono">
              {Math.min(currentIndex + 1, totalQuestions)} / {totalQuestions}
            </span>
          </div>
        </div>

        {/* Mute/Sound Toggle */}
        <button
          onClick={onToggleSound}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-colors shadow-lg"
          title={soundEnabled ? "Mute Sound" : "Enable Sound"}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>
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
