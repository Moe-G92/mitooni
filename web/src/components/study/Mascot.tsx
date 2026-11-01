/*
 * The mitooni mascot: a friendly Midnight Iris squircle (the logo's shape)
 * with a face, rosy cheeks and the logo's coral flag held up in one hand.
 * It bobs gently; the motion stops for people who prefer reduced motion.
 */
export function Mascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 130" className={className} aria-hidden="true">
      <style>{`
        .mt-bob{animation:mtBob 3.2s ease-in-out infinite;transform-origin:60px 120px}
        .mt-wave{animation:mtWave 1.6s ease-in-out infinite;transform-origin:96px 62px}
        @keyframes mtBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes mtWave{0%,100%{transform:rotate(0)}50%{transform:rotate(-12deg)}}
        @media (prefers-reduced-motion: reduce){.mt-bob,.mt-wave{animation:none}}
      `}</style>
      <ellipse cx="60" cy="124" rx="34" ry="5" fill="#2B2470" opacity="0.12" />
      <g className="mt-bob">
        {/* feet */}
        <rect x="38" y="108" width="14" height="12" rx="6" fill="#2B2470" />
        <rect x="68" y="108" width="14" height="12" rx="6" fill="#2B2470" />
        {/* waving arm with the flag */}
        <g className="mt-wave">
          <path d="M96 66 Q108 52 106 34" fill="none" stroke="#2B2470" strokeWidth="9" strokeLinecap="round" />
          <line x1="106" y1="36" x2="106" y2="6" stroke="#2B2470" strokeWidth="3" strokeLinecap="round" />
          <polygon points="106,6 126,13 106,21" fill="#D92F3A" stroke="#D92F3A" strokeWidth="3" strokeLinejoin="round" />
        </g>
        {/* other arm */}
        <path d="M24 70 Q12 80 16 92" fill="none" stroke="#2B2470" strokeWidth="9" strokeLinecap="round" />
        {/* body: the logo squircle */}
        <path d="M60 22 C96 22 104 32 104 68 C104 104 96 114 60 114 C24 114 16 104 16 68 C16 32 24 22 60 22 Z" fill="#2B2470" />
        <path d="M60 30 C88 30 96 38 96 54 C80 46 40 46 24 54 C24 38 32 30 60 30 Z" fill="#3E4FC4" opacity="0.55" />
        {/* face */}
        <ellipse cx="45" cy="64" rx="8" ry="9" fill="#fff" />
        <ellipse cx="75" cy="64" rx="8" ry="9" fill="#fff" />
        <circle cx="47" cy="66" r="4" fill="#011627" />
        <circle cx="77" cy="66" r="4" fill="#011627" />
        <circle cx="48.5" cy="64" r="1.4" fill="#fff" />
        <circle cx="78.5" cy="64" r="1.4" fill="#fff" />
        <ellipse cx="35" cy="80" rx="6" ry="4" fill="#FF88DC" opacity="0.85" />
        <ellipse cx="85" cy="80" rx="6" ry="4" fill="#FF88DC" opacity="0.85" />
        <path d="M50 80 Q60 90 70 80" fill="none" stroke="#FAFF7F" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
