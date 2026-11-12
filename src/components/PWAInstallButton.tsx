import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface PWAInstallButtonProps {
  showToast: (msg: string, type?: "error" | "success" | "info") => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ showToast }) => {
  const [prompt, setPrompt] = useState<Event | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && Boolean((navigator as Record<string, unknown>).standalone))
    );
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (prompt) {
      (prompt as BeforeInstallPromptEvent).prompt();
      const { outcome } = await (prompt as BeforeInstallPromptEvent).userChoice;
      if (outcome === 'accepted') setPrompt(null);
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      showToast(
        isIOS
          ? "iOS: Share → Add to Home Screen"
          : "Look for the install icon in your browser's address bar.",
        "info"
      );
    }
  };

  if (isStandalone) return null;

  return (
    <button
      onClick={handleInstall}
      aria-label="Install app as PWA"
      className="btn-px text-[8px] px-2 py-1 gap-1"
    >
      <Download className="w-3 h-3" strokeWidth={2} />
      INSTALL
    </button>
  );
};

// Browser API type (not in lib.dom.d.ts)
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
