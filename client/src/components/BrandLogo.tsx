type BrandLogoProps = {
  compact?: boolean;
};

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className={`brand ${compact ? 'compact' : ''}`}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 52 52" role="img">
          <defs>
            <linearGradient id="finance-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#1f7fff" />
              <stop offset="100%" stopColor="#13b3c9" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="48" height="48" rx="14" fill="url(#finance-gradient)" />
          <circle cx="16" cy="16" r="5" fill="#ffffff" opacity="0.92" />
          <path
            d="M14 36v-7M22 36v-12M30 36v-9"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M12 31l8-6 7 2 10-9"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M35 17h4v4" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  );
}
