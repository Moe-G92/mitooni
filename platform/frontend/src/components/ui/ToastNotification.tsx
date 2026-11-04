import { useEffect, useState } from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { useLocale } from "../../context/LocaleContext";
import type { Toast } from "../../context/ToastContext";

const VARIANT_STYLES: Record<string, { bg: string; icon: string; border: string }> = {
  info: { bg: "bg-navy/95", icon: "text-gold", border: "border-navy/20" },
  success: { bg: "bg-emerald-800/95", icon: "text-emerald-300", border: "border-emerald-600/30" },
  warning: { bg: "bg-amber-800/95", icon: "text-amber-300", border: "border-amber-600/30" },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 3600);
    return () => clearTimeout(timer);
  }, []);

  const style = VARIANT_STYLES[toast.variant] ?? VARIANT_STYLES.info;
  const Icon = toast.variant === "success" ? CheckCircle2 : toast.variant === "warning" ? AlertTriangle : Info;

  return (
    <div
      role="status"
      className={`flex items-center gap-3 rounded-2xl border ${style.border} ${style.bg} px-4 py-3 shadow-lg  transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 ${style.icon}`} />
      <span className="flex-1 text-white" style={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
        {toast.message}
      </span>
      <button
        aria-label={t("dismiss")}
        onClick={onDismiss}
        className="min-h-11 min-w-11 rounded-lg p-1 text-white/50 transition-colors hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed end-4 top-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}
