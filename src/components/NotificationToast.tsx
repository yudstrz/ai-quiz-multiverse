import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface NotificationToastProps {
  message: string | null;
  type?: "error" | "success" | "info";
}

const STYLES = {
  error:   { bg: "#1a0a0a", border: "#ff3d57", text: "#ffaaaa", Icon: AlertCircle,    iconColor: "#ff3d57" },
  success: { bg: "#0a1a0a", border: "#00e676", text: "#aaffcc", Icon: CheckCircle2,   iconColor: "#00e676" },
  info:    { bg: "#0a0a1a", border: "#3d9bff", text: "#aaccff", Icon: Info,            iconColor: "#3d9bff" },
} as const;

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, type = "error" }) => {
  if (!message) return null;
  const { bg, border, text, Icon, iconColor } = STYLES[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 max-w-[90vw] text-[9px]"
      style={{
        background: bg,
        border: `2px solid ${border}`,
        boxShadow: "2px 2px 0 #000",
        color: text,
        fontFamily: "var(--font-pixel)",
      }}
    >
      <Icon className="w-4 h-4 shrink-0" strokeWidth={2} style={{ color: iconColor }} />
      <span className="truncate">{message}</span>
    </div>
  );
};
