import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface NotificationToastProps {
  message: string | null;
  type?: "error" | "success" | "info";
  onClose?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  type = "error",
}) => {
  if (!message) return null;

  const isError = type === "error";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold shadow-xl border backdrop-blur-md max-w-[90%] md:max-w-md ${
          isError
            ? "bg-red-950/90 text-red-200 border-red-500/50 shadow-red-950/50"
            : "bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-emerald-950/50"
        }`}
      >
        {isError ? (
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        )}
        <span className="truncate">{message}</span>
      </motion.div>
    </AnimatePresence>
  );
};
