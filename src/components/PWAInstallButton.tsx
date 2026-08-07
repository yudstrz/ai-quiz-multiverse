import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export const PWAInstallButton: React.FC<{ showToast: (msg: string, type?: "error" | "success" | "info") => void }> = ({ showToast }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running as standalone
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone);
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback for iOS or cases where prompt isn't fired
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        showToast("To install on iOS: Tap the Share button (square with arrow) and select 'Add to Home Screen'.", "info");
      } else {
        showToast("To install: Look for the install icon in your browser's address bar or open the browser menu and select 'Install app'.", "info");
      }
    }
  };

  if (isStandalone) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="absolute -top-2 right-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 rounded-full text-blue-300 text-[10px] md:text-xs font-bold transition-colors"
    >
      <Download className="w-3.5 h-3.5" />
      Install App
    </button>
  );
};
