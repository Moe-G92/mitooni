import { useNavigate } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { useLocale } from "../../context/LocaleContext";

interface BackButtonProps {
  to: string;
  /** Optional override: when set, Back runs this instead of navigating to `to`
   *  (e.g. a page with internal, non-URL navigation steps to unwind first). */
  onClick?: () => void;
}

export function BackButton({ to, onClick }: BackButtonProps) {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const { t, locale } = useLocale();

  return (
    <motion.button
      onClick={() => (onClick ? onClick() : navigate(to))}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      className="group relative flex items-center overflow-hidden rounded-lg flex-shrink-0"
      style={{
        minHeight: "44px",
        paddingInlineStart: "0.625rem",
        paddingInlineEnd: "0.75rem",
        background: "rgba(240,239,232,0.10)",
        border: "1px solid rgba(240,239,232,0.12)",
        cursor: "pointer",
        gap: "0.375rem",
        fontSize: "0.78rem",
        fontWeight: 600,
        color: "rgba(240,239,232,0.7)",
        whiteSpace: "nowrap",
      }}
    >
      {/* Arrow icon */}
      <motion.span
        className="flex items-center flex-shrink-0"
        style={{ color: "rgba(240,239,232,0.7)" }}
        initial={false}
        animate={{ x: 0, opacity: 0.7 }}
        whileHover={{ x: reducedMotion ? 0 : locale === "fa" ? 1 : -1, opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {locale === "fa" ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
      </motion.span>

      {/* "Back" label */}
      <motion.span
        style={{ letterSpacing: "-0.01em" }}
      >
        {t("back")}
      </motion.span>
    </motion.button>
  );
}
