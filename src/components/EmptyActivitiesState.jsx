import React from 'react';

/**
 * ============================================================================
 * 1. SINGLE STICKER ILLUSTRATION (ActivityStickerIllustration)
 * ============================================================================
 * Preserves the character asset (magnifying glass, question mark, face, outfit)
 * and overlays a modern Feedback Pad with ticks (✓), crosses (✕), star ratings,
 * and floating sticker badges.
 * Used primarily by the standard EmptyActivitiesState screen.
 */
export const ActivityStickerIllustration = ({
  className = "w-44 h-36 sm:w-52 sm:h-44",
  darkMode = false
}) => {
  return (
    <div
      className={`relative select-none transition-transform duration-300 hover:scale-105 flex items-center justify-center ${className}`}
    >
      {/* Soft Ambient Radial Background Glow */}
      <div
        className={`absolute inset-0 rounded-full blur-3xl pointer-events-none transition-opacity duration-300 ${
          darkMode ? "bg-sky-500/20" : "bg-sky-400/12"
        }`}
      />

      {/* SVG Canvas aligned 1:1 with the 554x554 base asset */}
      <svg
        viewBox="0 0 554 445"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm select-none"
      >
        <defs>
          {/* Pad Backboard Gradient */}
          <linearGradient id="padBoardGrad" x1="110" y1="200" x2="315" y2="385" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={darkMode ? "#0f172a" : "#1e3a8a"} />
            <stop offset="50%" stopColor={darkMode ? "#1e293b" : "#2563eb"} />
            <stop offset="100%" stopColor={darkMode ? "#0284c7" : "#0284c7"} />
          </linearGradient>

          {/* Chrome Clip Gradient */}
          <linearGradient id="clipMetalGrad" x1="180" y1="190" x2="245" y2="215" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={darkMode ? "#475569" : "#f1f5f9"} />
            <stop offset="30%" stopColor={darkMode ? "#64748b" : "#94a3b8"} />
            <stop offset="60%" stopColor={darkMode ? "#94a3b8" : "#f8fafc"} />
            <stop offset="85%" stopColor={darkMode ? "#475569" : "#64748b"} />
            <stop offset="100%" stopColor={darkMode ? "#334155" : "#cbd5e1"} />
          </linearGradient>

          {/* Gold Star Gradient */}
          <linearGradient id="goldStarGrad" x1="0" y1="0" x2="14" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          {/* Score Bar Gradient */}
          <linearGradient id="metricBarGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="60%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          {/* Floating Sticker Die-cut Drop Shadow */}
          <filter id="stickerShadowSingle" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#0f172a" floodOpacity={darkMode ? "0.6" : "0.16"} />
          </filter>

          {/* Pad Base Shadow */}
          <filter id="padShadowSingle" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#0f172a" floodOpacity={darkMode ? "0.6" : "0.2"} />
          </filter>

          {/* Key out white background of raster PNG in Dark Mode */}
          <filter id="darkCharFilter" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      -2.2 -2.2 -2.2 6.2 0"
            />
          </filter>
        </defs>

        {/* 1. Face & skin backplates strictly inside contours in dark mode */}
        {darkMode && (
          <g>
            {/* Unified Head, Face, Ear & Neck fill — trimmed strictly within outlines */}
            <path
              d="M 306 100
                 C 306 85, 320 80, 342 80
                 C 353 80, 355 95, 354 110
                 C 353 118, 354 128, 351 132
                 C 346 136, 336 134, 336 138
                 L 336 150
                 L 323 150
                 L 323 134
                 C 312 130, 306 120, 306 100 Z"
              fill="#ffffff"
            />
            {/* Left Hand */}
            <ellipse cx="202" cy="192" rx="14" ry="10" fill="#ffffff" />
            {/* Right Hand */}
            <circle cx="308" cy="225" r="9" fill="#ffffff" />
          </g>
        )}

        {/* 2. Character Asset */}
        <image
          href="/no-activities.png"
          x="0"
          y="0"
          width="554"
          height="554"
          preserveAspectRatio="xMidYMin meet"
          filter={darkMode ? "url(#darkCharFilter)" : undefined}
        />

        {/* 3. Masks to cleanly conceal legacy folder graphic in Light Mode */}
        {!darkMode && (
          <g>
            <rect x="42" y="80" width="168" height="135" rx="16" fill="#ffffff" />
            <path
              d="M 100 200 
                 C 100 190, 110 190, 120 190 
                 L 315 190 
                 C 325 190, 325 200, 325 210 
                 L 325 385 
                 C 325 395, 315 395, 305 395 
                 L 100 395 
                 C 90 395, 90 385, 90 375 Z"
              fill="#ffffff"
            />
          </g>
        )}

        {/* 3. Slanted Feedback Clipboard Form */}
        <g transform="rotate(-3 210 295)" filter="url(#padShadowSingle)">
          {/* Clipboard Backboard */}
          <rect
            x="106"
            y="200"
            width="208"
            height="180"
            rx="16"
            fill="url(#padBoardGrad)"
            stroke={darkMode ? "#38bdf8" : "rgba(255,255,255,0.22)"}
            strokeWidth={darkMode ? "1.2" : "1"}
          />
          <rect
            x="108"
            y="202"
            width="204"
            height="176"
            rx="14"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.2"
          />

          {/* Form Paper Sheet */}
          <rect
            x="118"
            y="214"
            width="184"
            height="154"
            rx="10"
            fill={darkMode ? "#0f172a" : "#ffffff"}
            stroke={darkMode ? "#334155" : "#e2e8f0"}
            strokeWidth="1.2"
          />

          {/* Form Header */}
          <rect x="130" y="224" width="82" height="9" rx="4.5" fill={darkMode ? "rgba(56,189,248,0.2)" : "#e0e7ff"} />
          
          {/* Star Rating Badge */}
          <g transform="translate(242, 222)">
            <rect x="0" y="0" width="48" height="15" rx="7.5" fill={darkMode ? "#1e293b" : "#fef3c7"} stroke={darkMode ? "#f59e0b" : "#fbbf24"} strokeWidth="1" />
            <path
              d="M 9 3.5 L 10.2 6.5 L 13.5 7 L 11 9.2 L 11.5 12.2 L 9 10.8 L 6.5 12.2 L 7 9.2 L 4.5 7 L 7.8 6.5 Z"
              fill="url(#goldStarGrad)"
            />
            <text x="17" y="11" fontFamily="sans-serif" fontSize="9" fontWeight="700" fill={darkMode ? "#fbbf24" : "#b45309"}>
              5.0 ★
            </text>
          </g>

          <line x1="130" y1="240" x2="290" y2="240" stroke={darkMode ? "#334155" : "#f1f5f9"} strokeWidth="1.2" />

          {/* Row 1: Checkmark Criteria */}
          <g transform="translate(130, 246)">
            <circle cx="9" cy="9" r="9" fill={darkMode ? "#064e3b" : "#d1fae5"} stroke="#10b981" strokeWidth="1.4" />
            <path d="M 5.5 9 L 8 11.5 L 12.5 6" stroke={darkMode ? "#34d399" : "#059669"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="25" y="4" width="98" height="5" rx="2.5" fill={darkMode ? "#cbd5e1" : "#334155"} />
            <rect x="25" y="11" width="65" height="3.5" rx="1.75" fill={darkMode ? "#64748b" : "#94a3b8"} />
          </g>

          {/* Row 2: Cross Criteria */}
          <g transform="translate(130, 269)">
            <circle cx="9" cy="9" r="9" fill={darkMode ? "#881337" : "#ffe4e6"} stroke="#f43f5e" strokeWidth="1.4" />
            <path d="M 6 6 L 12 12 M 12 6 L 6 12" stroke={darkMode ? "#fb7185" : "#e11d48"} strokeWidth="2.2" strokeLinecap="round" />
            <rect x="25" y="4" width="88" height="5" rx="2.5" fill={darkMode ? "#cbd5e1" : "#334155"} />
            <rect x="25" y="11" width="55" height="3.5" rx="1.75" fill={darkMode ? "#64748b" : "#94a3b8"} />
          </g>

          {/* Row 3: Checkmark Criteria */}
          <g transform="translate(130, 292)">
            <circle cx="9" cy="9" r="9" fill={darkMode ? "#064e3b" : "#d1fae5"} stroke="#10b981" strokeWidth="1.4" />
            <path d="M 5.5 9 L 8 11.5 L 12.5 6" stroke={darkMode ? "#34d399" : "#059669"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="25" y="4" width="105" height="5" rx="2.5" fill={darkMode ? "#cbd5e1" : "#334155"} />
            <rect x="25" y="11" width="75" height="3.5" rx="1.75" fill={darkMode ? "#64748b" : "#94a3b8"} />
          </g>

          {/* Row 4: Star Bar */}
          <g transform="translate(130, 315)">
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                transform={`translate(${i * 14}, 0)`}
                d="M 6 1 L 7.6 4.6 L 11.2 5 L 8.6 7.6 L 9.3 11.2 L 6 9.4 L 2.7 11.2 L 3.4 7.6 L 0.8 5 L 4.4 4.6 Z"
                fill="url(#goldStarGrad)"
              />
            ))}
            <rect x="78" y="3" width="78" height="5.5" rx="2.75" fill={darkMode ? "#334155" : "#f1f5f9"} />
            <rect x="78" y="3" width="58" height="5.5" rx="2.75" fill="url(#metricBarGrad)" />
          </g>

          {/* Row 5: Comment Strip */}
          <g transform="translate(130, 335)">
            <rect x="0" y="0" width="160" height="24" rx="6" fill={darkMode ? "#1e293b" : "#f8fafc"} stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="1" />
            <circle cx="10" cy="9" r="2.5" fill="#38bdf8" />
            <rect x="18" y="7" width="128" height="3.5" rx="1.75" fill={darkMode ? "#94a3b8" : "#64748b"} />
            <rect x="18" y="14" width="94" height="3" rx="1.5" fill={darkMode ? "#64748b" : "#cbd5e1"} />
          </g>

          {/* Metallic Clip */}
          <rect x="176" y="192" width="68" height="22" rx="6" fill="#0f172a" opacity="0.35" />
          <rect x="176" y="190" width="68" height="22" rx="6" fill="url(#clipMetalGrad)" />
          <circle cx="210" cy="198" r="4" fill={darkMode ? "#1e293b" : "#334155"} />
          <circle cx="210" cy="198" r="2" fill={darkMode ? "#64748b" : "#94a3b8"} />
          <line x1="182" y1="192" x2="238" y2="192" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* 4. Floating Badges */}
        <g transform="translate(56, 156) rotate(-10)" filter="url(#stickerShadowSingle)">
          <circle cx="19" cy="19" r="19" fill={darkMode ? "#1e293b" : "#ffffff"} stroke={darkMode ? "#334155" : "none"} strokeWidth={darkMode ? "1.5" : "0"} />
          <circle cx="19" cy="19" r="15.5" fill="#10b981" />
          <path d="M 12 19 L 17 24 L 26 13" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g transform="translate(130, 158) rotate(12)" filter="url(#stickerShadowSingle)">
          <circle cx="18" cy="18" r="18" fill={darkMode ? "#1e293b" : "#ffffff"} stroke={darkMode ? "#334155" : "none"} strokeWidth={darkMode ? "1.5" : "0"} />
          <circle cx="18" cy="18" r="14.5" fill="#f43f5e" />
          <path d="M 12 12 L 24 24 M 24 12 L 12 24" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </g>

        <g transform="translate(58, 86) rotate(-6)" filter="url(#stickerShadowSingle)">
          <rect x="0" y="0" width="102" height="48" rx="14" fill={darkMode ? "#1e293b" : "#ffffff"} stroke={darkMode ? "#334155" : "#e0e7ff"} strokeWidth="1.5" />
          <path d="M 36 48 L 44 56 L 48 48 Z" fill={darkMode ? "#1e293b" : "#ffffff"} />
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              transform={`translate(${18 + i * 16}, 11)`}
              d="M 6 1 L 7.6 4.6 L 11.2 5 L 8.6 7.6 L 9.3 11.2 L 6 9.4 L 2.7 11.2 L 3.4 7.6 L 0.8 5 L 4.4 4.6 Z"
              fill="url(#goldStarGrad)"
            />
          ))}
          <rect x="18" y="29" width="66" height="4" rx="2" fill={darkMode ? "#64748b" : "#94a3b8"} />
        </g>
      </svg>
    </div>
  );
};

/**
 * ============================================================================
 * 2. PANORAMIC 3-STICKER ILLUSTRATION (ReviewFeedbackPadIllustration)
 * ============================================================================
 * Specially designed panoramic 3-sticker layout matching the website brand palette:
 * - STICKER 1 (Left): Interactive Feedback Console (Slanted outward -7°, bottom corner anchored)
 * - STICKER 2 (Center Hero): Elevated Evaluation Matrix Tablet (Arched with rubric switches, radar, & 5.0 rosette)
 * - STICKER 3 (Right): Impact & Achievement Console (Slanted outward +8.5°, bottom corner anchored, 3D trophy & chart)
 * - Ambient background aura and sparkles
 */
export const ReviewFeedbackPadIllustration = ({
  className = "w-full h-full max-w-4xl",
  darkMode = false
}) => {
  return (
    <svg
      viewBox="0 0 860 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} select-none transition-transform duration-300 hover:scale-[1.01]`}
    >
      <defs>
        {/* Soft Ambient Radial Backdrop */}
        <radialGradient id="panoramicHubAura" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor={darkMode ? "rgba(56, 189, 248, 0.24)" : "rgba(14, 165, 233, 0.14)"} />
          <stop offset="55%" stopColor={darkMode ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.05)"} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        {/* Card Surface Gradients */}
        <linearGradient id="cardBgLeft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={darkMode ? "#1e293b" : "#ffffff"} />
          <stop offset="100%" stopColor={darkMode ? "#0f172a" : "#f0f9ff"} />
        </linearGradient>

        <linearGradient id="cardBgCenter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={darkMode ? "#1e293b" : "#ffffff"} />
          <stop offset="100%" stopColor={darkMode ? "#0f172a" : "#f0fdf4"} />
        </linearGradient>

        <linearGradient id="cardBgRight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={darkMode ? "#1e293b" : "#ffffff"} />
          <stop offset="100%" stopColor={darkMode ? "#0f172a" : "#f5f3ff"} />
        </linearGradient>

        {/* Theme Accent Gradients */}
        <linearGradient id="panSkyGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        <linearGradient id="panEmeraldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <linearGradient id="panIndigoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>

        <linearGradient id="panGoldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Shadows & Glow Filters */}
        <filter id="stickerShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0f172a" floodOpacity={darkMode ? "0.55" : "0.13"} />
        </filter>

        <filter id="heroShadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="12" stdDeviation="15" floodColor="#0f172a" floodOpacity={darkMode ? "0.65" : "0.18"} />
        </filter>

        <filter id="goldGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#f59e0b" floodOpacity={darkMode ? "0.45" : "0.24"} />
        </filter>

        <filter id="cyanGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#38bdf8" floodOpacity={darkMode ? "0.5" : "0.28"} />
        </filter>

        <filter id="indigoGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#6366f1" floodOpacity={darkMode ? "0.5" : "0.28"} />
        </filter>
      </defs>

      {/* Ambient Backdrop Glow */}
      <ellipse cx="430" cy="125" rx="400" ry="115" fill="url(#panoramicHubAura)" />

      {/* ── 1. STICKER 1: WIDE INTERACTIVE FEEDBACK CONSOLE (Left Flank) ── */}
      <g transform="translate(112, 18) rotate(-7, 260, 218) scale(0.82)" filter="url(#stickerShadow)">
        {/* Capsule Base */}
        <path
          d="M 32 0 L 228 0 C 246 0, 260 14, 260 32 L 260 186 C 260 204, 246 218, 228 218 L 48 218 C 28 218, 14 204, 14 186 L 14 32 C 14 14, 28 0, 48 0 Z"
          fill="url(#cardBgLeft)"
          stroke={darkMode ? "#38bdf8" : "#bae6fd"}
          strokeWidth="2.4"
        />

        {/* Top Header Tag & Reaction Hub */}
        <g transform="translate(24, 14)">
          <rect x="0" y="0" width="86" height="22" rx="11" fill={darkMode ? "rgba(56,189,248,0.2)" : "#e0f2fe"} />
          <circle cx="12" cy="11" r="4" fill="#0284c7" />
          <text x="22" y="14.5" fill={darkMode ? "#38bdf8" : "#0369a1"} fontSize="9.5" fontWeight="800" fontFamily="system-ui, sans-serif" letterSpacing="0.06em">
            FEEDBACK
          </text>

          {/* 3 Reaction Pills */}
          <g transform="translate(94, 0)">
            <rect x="0" y="0" width="24" height="22" rx="11" fill={darkMode ? "#0f172a" : "#fef3c7"} stroke="#fde68a" strokeWidth="1" />
            <path transform="translate(7, 5)" d="M 5 0.5 L 6.2 3.5 L 9.5 3.8 L 7 6 L 7.8 9.2 L 5 7.5 L 2.2 9.2 L 3 6 L 0.5 3.8 L 3.8 3.5 Z" fill="url(#panGoldGrad)" />

            <rect x="28" y="0" width="24" height="22" rx="11" fill={darkMode ? "#0f172a" : "#e0f2fe"} stroke="#bae6fd" strokeWidth="1" />
            <g transform="translate(34, 5)">
              <path d="M 0 2 C 0 1, 1 0, 2 0 L 10 0 C 11 0, 12 1, 12 2 L 12 7 C 12 8, 11 9, 10 9 L 3 9 L 1 11 L 1.5 9 L 0 9 Z" fill="#0284c7" />
            </g>

            <rect x="56" y="0" width="24" height="22" rx="11" fill={darkMode ? "#0f172a" : "#dcfce7"} stroke="#a7f3d0" strokeWidth="1" />
            <g transform="translate(63, 5)">
              <path d="M 1 4 L 1 9 L 0 9 L 0 4 Z M 3 9 L 7 9 C 8 9, 8.5 8.5, 8.5 7.5 L 9 4 C 9 3.5, 8.5 3, 7.5 3 L 5 3 L 5.5 1 C 5.5 0.5, 5 0, 4.5 0 L 3 3 Z" fill="#059669" />
            </g>
          </g>

          {/* Verified Check Badge */}
          <circle cx="212" cy="11" r="11" fill="#10b981" />
          <path d="M 207 11 L 210.5 14.5 L 217 8" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Circular Score Meter & Waveform Hub */}
        <g transform="translate(24, 46)">
          {/* Radial 4.9 Score Meter */}
          <circle cx="36" cy="36" r="34" fill={darkMode ? "#0f172a" : "#f8fafc"} stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="4" />
          <circle
            cx="36"
            cy="36"
            r="34"
            fill="none"
            stroke="url(#panSkyGrad)"
            strokeWidth="5"
            strokeDasharray="213"
            strokeDashoffset="24"
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
          />
          <text x="36" y="34" fill={darkMode ? "#ffffff" : "#0f172a"} fontSize="15" fontWeight="900" fontFamily="system-ui, sans-serif" textAnchor="middle">
            4.9
          </text>
          <text x="36" y="47" fill="#0284c7" fontSize="8" fontWeight="800" fontFamily="system-ui, sans-serif" textAnchor="middle" letterSpacing="0.04em">
            SCORE
          </text>

          {/* Soundwave Feedback Equalizer */}
          <g transform="translate(86, 6)">
            <rect x="0" y="0" width="132" height="58" rx="8" fill={darkMode ? "#0f172a" : "#f8fafc"} stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="1" />
            
            {/* 5 Star Mini Track */}
            <g transform="translate(12, 9)">
              {[0, 1, 2, 3, 4].map((i) => (
                <path
                  key={i}
                  transform={`translate(${i * 22}, 0)`}
                  d="M 6 0.5 L 7.5 4.5 L 12 4.8 L 8.5 7.8 L 9.5 12 L 6 9.8 L 2.5 12 L 3.5 7.8 L 0 4.8 L 4.5 4.5 Z"
                  fill="url(#panGoldGrad)"
                />
              ))}
            </g>

            {/* Soundwave EQ Bars */}
            <g transform="translate(14, 28)">
              {[
                { x: 4, h: 14, y: 8, grad: "url(#panSkyGrad)" },
                { x: 19, h: 22, y: 0, grad: "url(#panSkyGrad)" },
                { x: 34, h: 17, y: 5, grad: "url(#panEmeraldGrad)" },
                { x: 49, h: 24, y: -2, grad: "url(#panGoldGrad)" },
                { x: 64, h: 19, y: 3, grad: "url(#panEmeraldGrad)" },
                { x: 79, h: 22, y: 0, grad: "url(#panSkyGrad)" },
                { x: 94, h: 13, y: 9, grad: "url(#panSkyGrad)" }
              ].map((b, i) => (
                <g key={i}>
                  <rect x={b.x} y={b.y} width="6" height={b.h} rx="3" fill={b.grad} />
                  <circle cx={b.x + 3} cy={b.y} r="2" fill="#ffffff" opacity="0.8" />
                </g>
              ))}
            </g>
          </g>
        </g>

        {/* Triple Interactive Sliders */}
        <g transform="translate(24, 126)">
          {/* Slider 1: Sky Theme */}
          <rect x="0" y="4" width="218" height="7" rx="3.5" fill={darkMode ? "#334155" : "#e2e8f0"} />
          <rect x="0" y="4" width="202" height="7" rx="3.5" fill="url(#panSkyGrad)" />
          <circle cx="202" cy="7.5" r="7.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.8" filter="url(#cyanGlow)" />
          <circle cx="202" cy="7.5" r="2.5" fill="#0284c7" />

          {/* Slider 2: Emerald Theme */}
          <rect x="0" y="22" width="218" height="7" rx="3.5" fill={darkMode ? "#334155" : "#e2e8f0"} />
          <rect x="0" y="22" width="190" height="7" rx="3.5" fill="url(#panEmeraldGrad)" />
          <circle cx="190" cy="25.5" r="7.5" fill="#ffffff" stroke="#059669" strokeWidth="2.8" filter="url(#cyanGlow)" />
          <circle cx="190" cy="25.5" r="2.5" fill="#059669" />

          {/* Slider 3: Indigo Theme */}
          <rect x="0" y="40" width="218" height="7" rx="3.5" fill={darkMode ? "#334155" : "#e2e8f0"} />
          <rect x="0" y="40" width="180" height="7" rx="3.5" fill="url(#panIndigoGrad)" />
          <circle cx="180" cy="43.5" r="7.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2.8" filter="url(#indigoGlow)" />
          <circle cx="180" cy="43.5" r="2.5" fill="#4f46e5" />
        </g>

        {/* Bottom Star Rating Ribbon */}
        <g transform="translate(48, 184)" filter="url(#goldGlow)">
          <rect x="0" y="0" width="164" height="22" rx="11" fill="#ffffff" stroke="#fbbf24" strokeWidth="1.6" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              transform={`translate(${16 + i * 26}, 4)`}
              d="M 6 0.5 L 7.5 4.5 L 12 4.8 L 8.5 7.8 L 9.5 12 L 6 9.8 L 2.5 12 L 3.5 7.8 L 0 4.8 L 4.5 4.5 Z"
              fill="url(#panGoldGrad)"
            />
          ))}
          <circle cx="148" cy="11" r="4" fill="#10b981" />
        </g>
      </g>

      {/* ── 2. STICKER 3: WIDE IMPACT & GROWTH ACHIEVEMENTS (Right Flank) ── */}
      <g transform="translate(548, 18) rotate(8.5, 0, 218) scale(0.82)" filter="url(#stickerShadow)">
        {/* Card Body */}
        <path
          d="M 32 0 L 228 0 C 246 0, 260 14, 260 32 L 260 186 C 260 204, 246 218, 228 218 L 32 218 C 14 218, 0 204, 0 186 L 0 32 C 0 14, 14 0, 32 0 Z"
          fill="url(#cardBgRight)"
          stroke={darkMode ? "#818cf8" : "#c7d2fe"}
          strokeWidth="2.4"
        />

        {/* Top Header Tag */}
        <g transform="translate(20, 14)">
          <rect x="0" y="0" width="94" height="22" rx="11" fill={darkMode ? "rgba(99,102,241,0.2)" : "#ede9fe"} />
          <circle cx="12" cy="11" r="4" fill="#4f46e5" />
          <text x="24" y="14.5" fill={darkMode ? "#a5b4fc" : "#4338ca"} fontSize="9.5" fontWeight="800" fontFamily="system-ui, sans-serif" letterSpacing="0.06em">
            IMPACT
          </text>

          {/* Excellence Spark */}
          <g transform="translate(196, 0)">
            <circle cx="11" cy="11" r="11" fill="#f59e0b" />
            <path transform="translate(6, 6)" d="M 5 0.5 L 6.2 3.5 L 9.5 3.8 L 7 6 L 7.8 9.2 L 5 7.5 L 2.2 9.2 L 3 6 L 0.5 3.8 L 3.8 3.5 Z" fill="#ffffff" />
          </g>
        </g>

        {/* Donut Ring & 3D Trophy */}
        <g transform="translate(20, 44)">
          {/* Donut Progress */}
          <circle cx="36" cy="36" r="34" fill={darkMode ? "#0f172a" : "#f8fafc"} stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="4" />
          <circle
            cx="36"
            cy="36"
            r="34"
            fill="none"
            stroke="url(#panIndigoGrad)"
            strokeWidth="5"
            strokeDasharray="213"
            strokeDashoffset="22"
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
          />
          <text x="36" y="34" fill={darkMode ? "#ffffff" : "#0f172a"} fontSize="14" fontWeight="900" fontFamily="system-ui, sans-serif" textAnchor="middle">
            98%
          </text>
          <text x="36" y="47" fill="#4f46e5" fontSize="7.5" fontWeight="800" fontFamily="system-ui, sans-serif" textAnchor="middle" letterSpacing="0.05em">
            INDEX
          </text>

          {/* 3D Golden Achievement Trophy */}
          <g transform="translate(96, -6)" filter="url(#goldGlow)">
            <circle cx="56" cy="42" r="38" fill={darkMode ? "rgba(251,191,36,0.15)" : "#fef3c7"} stroke="#fde68a" strokeWidth="1.5" />
            <path d="M 40 24 L 72 24 L 72 44 C 72 54, 40 54, 40 44 Z" fill="url(#panGoldGrad)" stroke="#d97706" strokeWidth="1.5" />
            <path d="M 33 29 C 26 29, 26 42, 40 42" stroke="#d97706" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 79 29 C 86 29, 86 42, 72 42" stroke="#d97706" strokeWidth="3" fill="none" strokeLinecap="round" />
            <rect x="52" y="54" width="8" height="7" fill="#d97706" />
            <rect x="44" y="61" width="24" height="6" rx="2.5" fill="#b45309" />
            <path transform="translate(50, 30)" d="M 6 0.5 L 7.5 4.5 L 12 4.8 L 8.5 7.8 L 9.5 12 L 6 9.8 L 2.5 12 L 3.5 7.8 L 0 4.8 L 4.5 4.5 Z" fill="#ffffff" />
          </g>
        </g>

        {/* 5-Bar Ascending Growth Histogram */}
        <g transform="translate(20, 124)">
          <rect x="0" y="0" width="220" height="52" rx="8" fill={darkMode ? "#1e293b" : "#f8fafc"} stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="1" />
          <line x1="12" y1="44" x2="208" y2="44" stroke={darkMode ? "#475569" : "#cbd5e1"} strokeWidth="1.2" />

          <rect x="22" y="30" width="20" height="14" rx="3.5" fill="url(#panSkyGrad)" />
          <rect x="60" y="24" width="20" height="20" rx="3.5" fill="url(#panSkyGrad)" />
          <rect x="98" y="17" width="20" height="27" rx="3.5" fill="url(#panIndigoGrad)" />
          <rect x="136" y="11" width="20" height="33" rx="3.5" fill="url(#panEmeraldGrad)" />
          <rect x="174" y="5" width="20" height="39" rx="3.5" fill="url(#panGoldGrad)" />

          {/* Golden Growth Trendline */}
          <path
            d="M 32 28 Q 78 20, 108 15 T 184 3"
            stroke="#f59e0b"
            strokeWidth="2.8"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="184" cy="3" r="4" fill="#f59e0b" />
          <circle cx="184" cy="3" r="2" fill="#ffffff" />
        </g>

        {/* Achievement Ribbon */}
        <g transform="translate(44, 184)" filter="url(#indigoGlow)">
          <rect x="0" y="0" width="168" height="22" rx="11" fill="url(#panIndigoGrad)" />
          <text x="84" y="15" fill="#ffffff" fontSize="9.5" fontWeight="800" fontFamily="system-ui, sans-serif" textAnchor="middle" letterSpacing="0.06em">
            TOP 1% EXCELLENCE
          </text>
        </g>
      </g>

      {/* ── 3. STICKER 2: ELEVATED EVALUATION TABLET (Center Hero) ── */}
      <g transform="translate(325, 18) scale(0.86)" filter="url(#heroShadow)">
        {/* Arched Tablet Base */}
        <path
          d="M 32 0 L 228 0 C 246 0, 260 14, 260 32 L 260 196 C 260 214, 246 228, 228 228 L 32 228 C 14 228, 0 214, 0 196 L 0 32 C 0 14, 14 0, 32 0 Z"
          fill="url(#cardBgCenter)"
          stroke={darkMode ? "#34d399" : "#a7f3d0"}
          strokeWidth="3"
        />

        {/* Top Emerald Header */}
        <path
          d="M 2 32 C 2 15, 15 2, 32 2 L 228 2 C 245 2, 258 15, 258 32 L 258 42 L 2 42 Z"
          fill={darkMode ? "#064e3b" : "#047857"}
        />

        {/* Graduation Cap */}
        <g transform="translate(22, 11)">
          <path d="M 12 6 L 24 1 L 36 6 L 24 11 Z" fill="#ffffff" />
          <path d="M 17 8.5 L 17 15 C 17 18.5, 31 18.5, 31 15 L 31 8.5" fill="#ffffff" />
          <circle cx="24" cy="6" r="2" fill="#fbbf24" />
        </g>
        
        {/* Evaluation Header Pill */}
        <g transform="translate(90, 10)">
          <rect x="0" y="0" width="80" height="22" rx="11" fill="rgba(255,255,255,0.2)" stroke="#ffffff" strokeWidth="1" />
          <circle cx="12" cy="11" r="4" fill="#34d399" />
          <text x="46" y="15" fill="#ffffff" fontSize="9.5" fontWeight="800" fontFamily="system-ui, sans-serif" textAnchor="middle" letterSpacing="0.08em">
            EVALUATION
          </text>
        </g>

        {/* Lightbulb Spark */}
        <g transform="translate(224, 13)">
          <circle cx="8" cy="8" r="7" fill="#fbbf24" />
          <path d="M 6 12 L 10 12 L 9 15 L 7 15 Z" fill="#ffffff" />
          <path d="M 8 3 L 8 1 M 13 4 L 14 2 M 3 4 L 2 2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* 3 Toggle Switch Checklist Rows */}
        <g transform="translate(18, 54)">
          <g transform="translate(0, 0)">
            <rect x="0" y="2" width="30" height="16" rx="8" fill="#10b981" />
            <circle cx="21" cy="10" r="6" fill="#ffffff" />
            <rect x="38" y="4" width="92" height="5" rx="2.5" fill={darkMode ? "#e2e8f0" : "#1e293b"} />
            <rect x="38" y="12" width="66" height="4" rx="2" fill={darkMode ? "#64748b" : "#94a3b8"} />
          </g>

          <g transform="translate(0, 24)">
            <rect x="0" y="2" width="30" height="16" rx="8" fill="#10b981" />
            <circle cx="21" cy="10" r="6" fill="#ffffff" />
            <rect x="38" y="4" width="84" height="5" rx="2.5" fill={darkMode ? "#e2e8f0" : "#1e293b"} />
            <rect x="38" y="12" width="56" height="4" rx="2" fill={darkMode ? "#64748b" : "#94a3b8"} />
          </g>

          <g transform="translate(0, 48)">
            <rect x="0" y="2" width="30" height="16" rx="8" fill="#10b981" />
            <circle cx="21" cy="10" r="6" fill="#ffffff" />
            <rect x="38" y="4" width="96" height="5" rx="2.5" fill={darkMode ? "#e2e8f0" : "#1e293b"} />
            <rect x="38" y="12" width="72" height="4" rx="2" fill={darkMode ? "#64748b" : "#94a3b8"} />
          </g>
        </g>

        {/* Skill Polygon Radar Ring */}
        <g transform="translate(164, 52)">
          <circle cx="42" cy="38" r="34" fill={darkMode ? "#0f172a" : "#f8fafc"} stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="3" />
          <circle
            cx="42"
            cy="38"
            r="34"
            fill="none"
            stroke="url(#panEmeraldGrad)"
            strokeWidth="4"
            strokeDasharray="213"
            strokeDashoffset="26"
            strokeLinecap="round"
            transform="rotate(-90 42 38)"
          />
          <polygon
            points="42,14 66,24 58,54 26,54 18,24"
            fill="rgba(52, 211, 153, 0.28)"
            stroke="#10b981"
            strokeWidth="1.8"
          />
          <polygon
            points="42,22 58,28 52,48 32,48 26,28"
            fill="rgba(56, 189, 248, 0.35)"
            stroke="#0284c7"
            strokeWidth="1.5"
          />
          <circle cx="42" cy="14" r="2.5" fill="#34d399" />
          <circle cx="66" cy="24" r="2.5" fill="#34d399" />
          <circle cx="58" cy="54" r="2.5" fill="#34d399" />
          <circle cx="26" cy="54" r="2.5" fill="#34d399" />
          <circle cx="18" cy="24" r="2.5" fill="#34d399" />
        </g>

        {/* Master Slider Track */}
        <g transform="translate(18, 134)">
          <rect x="0" y="0" width="224" height="46" rx="8" fill={darkMode ? "#1e293b" : "#f8fafc"} stroke={darkMode ? "#334155" : "#e2e8f0"} strokeWidth="1.2" />
          
          <line x1="20" y1="23" x2="204" y2="23" stroke={darkMode ? "#475569" : "#cbd5e1"} strokeWidth="6" strokeLinecap="round" />
          <line x1="20" y1="23" x2="178" y2="23" stroke="url(#panEmeraldGrad)" strokeWidth="6" strokeLinecap="round" />
          
          <circle cx="20" cy="23" r="5" fill="#10b981" />
          <circle cx="85" cy="23" r="5" fill="#10b981" />
          <circle cx="150" cy="23" r="5" fill="#10b981" />

          <circle cx="178" cy="23" r="10" fill="#ffffff" stroke="#059669" strokeWidth="3.5" filter="url(#goldGlow)" />
          <circle cx="178" cy="23" r="3.5" fill="#059669" />
        </g>

        {/* 5.0 ★ Rosette Medal */}
        <g transform="translate(90, 192)" filter="url(#goldGlow)">
          <rect x="0" y="0" width="80" height="26" rx="13" fill="url(#panGoldGrad)" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="14" cy="13" r="7" fill="#ffffff" />
          <path d="M 11 13 L 13.5 15.5 L 17.5 10.5" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="28" y="17" fill="#78350f" fontSize="11" fontWeight="900" fontFamily="system-ui, sans-serif">
            5.0 ★
          </text>
        </g>
      </g>

      {/* ── 4. AMBIENT SPARKLES ── */}
      <path
        transform="translate(18, 115)"
        d="M 6 0 L 7.5 4.5 L 12 6 L 7.5 7.5 L 6 12 L 4.5 7.5 L 0 6 L 4.5 4.5 Z"
        fill="#38bdf8"
        opacity="0.85"
      />
      <circle cx="28" cy="175" r="3" fill="#fbbf24" opacity="0.9" />

      <path
        transform="translate(830, 115)"
        d="M 6 0 L 7.5 4.5 L 12 6 L 7.5 7.5 L 6 12 L 4.5 7.5 L 0 6 L 4.5 4.5 Z"
        fill="#10b981"
        opacity="0.85"
      />
      <circle cx="820" cy="55" r="3" fill="#fbbf24" opacity="0.9" />
      <circle cx="838" cy="175" r="2.5" fill="#fbbf24" opacity="0.85" />
    </svg>
  );
};

/**
 * ============================================================================
 * 3. CAROUSEL EMPTY STATE WRAPPER (ActivityCarouselEmptyState)
 * ============================================================================
 * Framed card wrapper displaying the panoramic 3-sticker illustration in carousels.
 */
export const ActivityCarouselEmptyState = ({
  darkMode = false,
  className = "",
  style = {}
}) => {
  return (
    <div
      className={`w-full max-w-full mx-auto rounded-2xl overflow-hidden transition-all duration-300 flex items-center justify-center p-4 sm:p-6 ${
        darkMode
          ? "border border-sky-400/40 bg-gray-800/80 shadow-[0_0_2px_rgba(56,189,248,0.55),0_8px_20px_-4px_rgba(0,0,0,0.5)]"
          : "border border-sky-200/90 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.06)]"
      } ${className}`}
      style={{ height: '350px', minHeight: '350px', ...style }}
    >
      <ReviewFeedbackPadIllustration
        className="w-full h-full max-h-[290px] max-w-4xl object-contain"
        darkMode={darkMode}
      />
    </div>
  );
};

/**
 * Dedicated single-sticker Empty State for Faculty Activity Carousel
 */
export const FacultyCarouselEmptyState = ({
  darkMode = false,
  className = "",
  onUploadClick = null,
  style = {}
}) => {
  return (
    <div
      className={`w-full max-w-full mx-auto rounded-2xl overflow-hidden transition-all duration-300 flex flex-col items-center justify-center p-6 text-center ${
        darkMode
          ? "border border-sky-400/40 bg-gray-800/80 shadow-[0_0_2px_rgba(56,189,248,0.55),0_8px_20px_-4px_rgba(0,0,0,0.5)]"
          : "border border-sky-200/90 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.06)]"
      } ${className}`}
      style={{ height: '340px', minHeight: '340px', ...style }}
    >
      <ActivityStickerIllustration
        className="w-36 h-28 sm:w-40 sm:h-32 mb-2"
        darkMode={darkMode}
      />
      <h3 className={`text-base sm:text-lg font-bold tracking-tight mb-1 ${darkMode ? "text-white" : "text-slate-800"}`}>
        No Activities Uploaded Yet
      </h3>
      <p className={`text-xs sm:text-sm max-w-md mx-auto mb-3 ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
        Upload an innovative teaching activity to begin collecting feedback from your students.
      </p>
      {onUploadClick && (
        <button
          onClick={onUploadClick}
          className="px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm text-white bg-sky-600 hover:bg-sky-700 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Upload Activity
        </button>
      )}
    </div>
  );
};

/**
 * ============================================================================
 * 4. STANDARD REUSABLE EMPTY STATE COMPONENT (EmptyActivitiesState)
 * ============================================================================
 * Used on full pages such as "All Activities" & "Student Feedback".
 */
export const EmptyActivitiesState = ({
  title = "No activities found",
  description = "",
  darkMode = false,
  actionButton = null,
  className = "",
  stickerClassName = "w-44 h-36 sm:w-52 sm:h-44",
  bordered = true,
  titleClassName = ""
}) => {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center text-center transition-all duration-300 ${
        bordered
          ? darkMode
            ? "py-8 px-6 rounded-3xl border bg-gray-800/60 border-gray-700/70 shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
            : "py-8 px-6 rounded-3xl border bg-white/90 border-slate-200/90 shadow-[0_8px_24px_rgba(2,132,199,0.06)]"
          : "border-0 shadow-none bg-transparent py-3 px-2"
      } ${className}`}
    >
      {/* Illustrated Graphic in Center */}
      <div className="relative mb-2 flex items-center justify-center mx-auto text-center w-full">
        <ActivityStickerIllustration className={stickerClassName} darkMode={darkMode} />
      </div>

      {/* Minimal Title */}
      {title ? (
        <h3
          className={`tracking-tight text-center ${
            titleClassName
              ? titleClassName
              : darkMode
              ? "text-lg sm:text-xl font-bold text-white"
              : "text-lg sm:text-xl font-bold text-slate-800"
          } ${description ? 'mb-2' : ''}`}
        >
          {title}
        </h3>
      ) : null}

      {/* Optional Description */}
      {description ? (
        <p
          className={`text-sm sm:text-base max-w-md mx-auto leading-relaxed mb-4 ${
            darkMode ? "text-gray-400" : "text-slate-500"
          }`}
        >
          {description}
        </p>
      ) : null}

      {/* Optional Action Button */}
      {actionButton ? (
        <div className="pt-1">
          {actionButton}
        </div>
      ) : null}
    </div>
  );
};

export default EmptyActivitiesState;
