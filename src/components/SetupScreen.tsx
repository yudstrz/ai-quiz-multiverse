import React, { useState } from "react";
import { Upload, Sparkles, Play, Bot, Globe, Zap, HelpCircle, Gamepad2, FileText, BookOpen, Palette } from "lucide-react";
import { AvatarConfig, GameMode, DifficultyLevel, Language } from "../types";
import { parseDocumentFile } from "../utils/documentParser";
import { PWAInstallButton } from "./PWAInstallButton";

interface SetupScreenProps {
  onGenerateAI: (sourceText: string, questionCount: number, difficulty: DifficultyLevel, language: Language) => Promise<void>;
  onUsePreset: (category: string) => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  avatarConfig: AvatarConfig;
  setAvatarConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  questionCount: number;
  setQuestionCount: (count: number) => void;
  difficulty: DifficultyLevel;
  setDifficulty: (difficulty: DifficultyLevel) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  isLoading: boolean;
  showToast: (msg: string, type?: "error" | "success" | "info") => void;
}

// ── Shared pixel select class ───────────────────────────────────────────────
const PX_SELECT =
  "w-full px-2 py-2 text-[9px] bg-[var(--color-px-surface)] text-[var(--color-px-text)] " +
  "border-2 border-[var(--color-px-border)] focus:outline-none focus:border-[var(--color-px-blue)] " +
  "cursor-pointer appearance-none";

const MODES: { value: GameMode; label: string; hint: string }[] = [
  { value: "normal",  label: "📋 NORMAL QUIZ",    hint: "Classic options — tap to pick" },
  { value: "runner",  label: "🏎️  DROP RUNNER",    hint: "Catch falling answer in 4 lanes" },
  { value: "flappy",  label: "🕊️  FLAPPY QUIZ",    hint: "Fly up/down into answer blocks" },
  { value: "dash",    label: "🏃 DASH JUMP",       hint: "Jump over/into answer obstacles" },
  { value: "shooter", label: "🚀 SPACE SHOOTER",   hint: "Move lanes & shoot laser blasts" },
];

const EMOJI_LIST = ["👽", "👻", "🤖", "🚀", "🐱", "🦁", "⚡", "🎮", "🔥", "⭐", "🍕", "💩"];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onGenerateAI, onUsePreset,
  gameMode, setGameMode,
  avatarConfig, setAvatarConfig,
  questionCount, setQuestionCount,
  difficulty, setDifficulty,
  language, setLanguage,
  isLoading, showToast,
}) => {
  const [sourceText, setSourceText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("Max file size 10 MB.", "error");
      e.target.value = "";
      return;
    }
    setIsExtracting(true);
    showToast(`Reading ${file.name}...`, "info");
    try {
      const text = await parseDocumentFile(file);
      if (!text.trim()) {
        showToast("No readable text found.", "error");
      } else {
        setSourceText(text);
        showToast("Document imported!", "success");
      }
    } catch (err: unknown) {
      showToast("Error reading document: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setIsExtracting(false);
      e.target.value = "";
    }
  };

  const handleGenerate = () => {
    if (!sourceText.trim()) { showToast("Paste notes or upload a document first!", "error"); return; }
    onGenerateAI(sourceText, questionCount, difficulty, language);
  };

  const busy = isLoading || isExtracting;
  const selectedMode = MODES.find(m => m.value === gameMode)!;

  return (
    <div
      className="w-full max-w-lg mx-auto min-h-screen flex flex-col gap-4 p-4"
      style={{ background: "var(--color-px-bg)", color: "var(--color-px-text)" }}
    >
      {/* ── Header ── */}
      <header className="flex flex-col items-center gap-2 pt-4 pb-2 text-center">
        <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-[var(--color-px-blue)] card-px px-3 py-1.5">
          <Bot className="w-3 h-3" strokeWidth={2} />
          Powered by Google Gemini AI
          <PWAInstallButton showToast={showToast} />
        </div>
        <h1 className="text-sm sm:text-base uppercase tracking-widest text-[var(--color-px-yellow)] mt-1">
          AI Quiz Multiverse
        </h1>
        <p className="text-[8px] text-[var(--color-px-dim)] max-w-xs leading-loose">
          Turn study notes into playable arcade mini-games
        </p>
      </header>

      {/* ── 1. Source Material ── */}
      <section className="card-px p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-[8px] uppercase tracking-widest text-[var(--color-px-blue)]">
            <FileText className="w-3 h-3" strokeWidth={2} />
            1. Source Material
          </label>
          <label
            className="btn-px text-[8px] px-2 py-1.5 cursor-pointer"
            aria-label="Upload document"
          >
            <Upload className="w-3 h-3" strokeWidth={2} />
            UPLOAD
            <input
              type="file"
              accept=".txt,.md,.csv,.json,.pdf,.docx"
              className="hidden"
              onChange={handleFileUpload}
              disabled={busy}
            />
          </label>
        </div>
        <textarea
          value={sourceText}
          onChange={e => setSourceText(e.target.value)}
          disabled={busy}
          placeholder="Paste study notes, article, or upload PDF/DOCX..."
          rows={5}
          aria-label="Source text"
          className="w-full text-[9px] leading-loose resize-none focus:outline-none p-2 placeholder:text-[var(--color-px-muted)]"
          style={{
            background: "var(--color-px-bg)",
            border: "2px solid var(--color-px-border)",
            color: "var(--color-px-text)",
            fontFamily: "var(--font-pixel)",
          }}
        />

        {/* Presets */}
        <div>
          <div className="text-[7px] uppercase tracking-widest text-[var(--color-px-dim)] flex items-center gap-1 mb-1.5">
            <BookOpen className="w-2.5 h-2.5" strokeWidth={2} />
            Or pick a sample topic:
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { key: "general",     label: "🌍 Trivia" },
              { key: "space",       label: "🚀 Space" },
              { key: "programming", label: "💻 Web Tech" },
            ].map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => onUsePreset(p.key)}
                disabled={busy}
                className="btn-px py-2 text-[8px] justify-center"
                aria-label={`Use ${p.label} preset`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Game Mode ── */}
      <section className="card-px p-3 flex flex-col gap-2">
        <label className="flex items-center gap-1.5 text-[8px] uppercase tracking-widest text-[var(--color-px-purple)]">
          <Gamepad2 className="w-3 h-3" strokeWidth={2} />
          2. Game Mode
        </label>
        {/* Mode cards — no native select */}
        <div className="flex flex-col gap-1">
          {MODES.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => setGameMode(m.value)}
              className="flex items-center justify-between px-3 py-2 text-[8px] text-left transition-none"
              style={{
                background: gameMode === m.value ? "var(--color-px-blue)" : "var(--color-px-surface)",
                border: `2px solid ${gameMode === m.value ? "var(--color-px-blue)" : "var(--color-px-border)"}`,
                color: gameMode === m.value ? "#000" : "var(--color-px-text)",
                boxShadow: "2px 2px 0 #000",
                fontFamily: "var(--font-pixel)",
              }}
              aria-pressed={gameMode === m.value}
            >
              <span>{m.label}</span>
              <span
                className="text-[7px]"
                style={{ opacity: 0.7 }}
              >
                {m.hint}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 3. Avatar (mini-game modes only) ── */}
      {gameMode !== "normal" && (
        <section className="card-px p-3 flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-[8px] uppercase tracking-widest text-[var(--color-px-amber)]">
            <Palette className="w-3 h-3" strokeWidth={2} />
            3. Avatar
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Shape */}
            <div className="flex flex-col gap-1">
              <span className="text-[7px] text-[var(--color-px-dim)] uppercase">Shape</span>
              <select
                value={avatarConfig.shape}
                onChange={e => setAvatarConfig(p => ({ ...p, shape: e.target.value as AvatarConfig["shape"] }))}
                className={PX_SELECT}
                aria-label="Avatar shape"
              >
                <option value="hexagon">Hexagon</option>
                <option value="square">Square</option>
                <option value="circle">Circle</option>
                <option value="emoji">Emoji</option>
              </select>
            </div>

            {avatarConfig.shape === "emoji" ? (
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-[7px] text-[var(--color-px-dim)] uppercase">Pick Emoji</span>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_LIST.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setAvatarConfig(p => ({ ...p, emojiChar: em }))}
                      className="w-8 h-8 text-base flex items-center justify-center"
                      style={{
                        border: `2px solid ${avatarConfig.emojiChar === em ? "var(--color-px-yellow)" : "var(--color-px-border)"}`,
                        background: avatarConfig.emojiChar === em ? "rgba(255,184,0,0.15)" : "var(--color-px-surface)",
                        boxShadow: "1px 1px 0 #000",
                      }}
                      aria-label={`Select emoji ${em}`}
                      aria-pressed={avatarConfig.emojiChar === em}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Color */}
                <div className="flex flex-col gap-1">
                  <span className="text-[7px] text-[var(--color-px-dim)] uppercase">Color</span>
                  <div
                    className="h-9 overflow-hidden"
                    style={{ border: "2px solid var(--color-px-border)" }}
                  >
                    <input
                      type="color"
                      value={avatarConfig.color}
                      onChange={e => setAvatarConfig(p => ({ ...p, color: e.target.value }))}
                      className="w-full h-full cursor-pointer border-0 p-0 block [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                      aria-label="Avatar color"
                    />
                  </div>
                </div>
                {/* Face */}
                <div className="flex flex-col gap-1">
                  <span className="text-[7px] text-[var(--color-px-dim)] uppercase">Face</span>
                  <select
                    value={avatarConfig.face}
                    onChange={e => setAvatarConfig(p => ({ ...p, face: e.target.value }))}
                    className={PX_SELECT}
                    aria-label="Avatar face"
                  >
                    <option value="">None</option>
                    <option value="(•‿•)">(•‿•)</option>
                    <option value="(>_<)">(›_‹)</option>
                    <option value="(⌐■_■)">(⌐■_■)</option>
                    <option value="(T_T)">(T_T)</option>
                    <option value="ʕ•ᴥ•ʔ">ʕ•ᴥ•ʔ</option>
                    <option value="(O_O)">(O_O)</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ── 4. Options row ── */}
      <section className="card-px p-3 grid grid-cols-3 gap-2">
        {/* Questions */}
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1 text-[7px] uppercase text-[var(--color-px-green)]">
            <HelpCircle className="w-2.5 h-2.5" strokeWidth={2} />
            Qty
          </label>
          <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} className={PX_SELECT} aria-label="Number of questions">
            <option value={5}>5 Qs</option>
            <option value={10}>10 Qs</option>
            <option value={15}>15 Qs</option>
          </select>
        </div>
        {/* Difficulty */}
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1 text-[7px] uppercase text-[var(--color-px-amber)]">
            <Zap className="w-2.5 h-2.5" strokeWidth={2} />
            Diff
          </label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value as DifficultyLevel)} className={PX_SELECT} aria-label="Difficulty">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        {/* Language */}
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1 text-[7px] uppercase text-[var(--color-px-blue)]">
            <Globe className="w-2.5 h-2.5" strokeWidth={2} />
            Lang
          </label>
          <select value={language} onChange={e => setLanguage(e.target.value as Language)} className={PX_SELECT} aria-label="Language">
            <option value="English">EN</option>
            <option value="Indonesian">ID</option>
            <option value="Spanish">ES</option>
            <option value="French">FR</option>
            <option value="Japanese">JP</option>
          </select>
        </div>
      </section>

      {/* ── Action buttons ── */}
      {busy ? (
        <div className="card-px flex flex-col items-center gap-2 py-5 text-[8px] text-[var(--color-px-blue)]">
          <div className="w-6 h-6 border-2 border-current border-t-transparent animate-spin" />
          GEMINI IS CRAFTING YOUR QUIZ...
        </div>
      ) : (
        <div className="flex flex-col gap-2 pb-6">
          <button
            type="button"
            onClick={handleGenerate}
            className="btn-px w-full py-4 justify-center text-[9px]"
            style={{ borderColor: "var(--color-px-yellow)", color: "var(--color-px-yellow)" }}
            aria-label="Generate AI quiz"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
            GENERATE AI QUIZ WITH GEMINI
          </button>
          <button
            type="button"
            onClick={() => onUsePreset("general")}
            className="btn-px w-full py-3 justify-center text-[9px]"
            aria-label="Play default trivia quiz"
          >
            <Play className="w-3 h-3" strokeWidth={2} />
            PLAY DEFAULT TRIVIA NOW
          </button>
        </div>
      )}

      {/* Mode hint at bottom of setup */}
      <p className="text-center text-[7px] text-[var(--color-px-dim)] pb-2">
        MODE: {selectedMode.label} — {selectedMode.hint}
      </p>
    </div>
  );
};
