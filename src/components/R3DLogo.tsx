import React from 'react';

interface R3DLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
  glow?: boolean;
}

export default function R3DLogo({
  size = 'md',
  showText = true,
  className = '',
  glow = true,
}: R3DLogoProps) {
  // Dimension mapping
  const dimensions = {
    sm: { width: 44, height: showText ? 48 : 34 },
    md: { width: 64, height: showText ? 68 : 50 },
    lg: { width: 96, height: showText ? 104 : 76 },
    xl: { width: 140, height: showText ? 150 : 110 },
    '2xl': { width: 200, height: showText ? 215 : 155 },
  };

  const currentDim = dimensions[size] || dimensions.md;

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{
        filter: glow
          ? 'drop-shadow(0 0 16px rgba(6, 182, 212, 0.45)) drop-shadow(0 0 2px rgba(255, 255, 255, 0.3))'
          : 'none',
      }}
    >
      <svg
        viewBox="0 0 320 330"
        width={currentDim.width}
        height={currentDim.height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
      >
        <defs>
          {/* Metallic Silver Chrome Gradients */}
          <linearGradient id="r3d-chrome-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="75%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          <linearGradient id="r3d-chrome-bevel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#CBD5E1" />
            <stop offset="65%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          <linearGradient id="r3d-chrome-dark" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="40%" stopColor="#94A3B8" />
            <stop offset="70%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          {/* Electric Turquoise / Cyan Gradients */}
          <linearGradient id="r3d-cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67E8F9" />
            <stop offset="30%" stopColor="#22D3EE" />
            <stop offset="70%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>

          <linearGradient id="r3d-cyan-electric" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="50%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>

          <linearGradient id="r3d-cyan-3d" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#A5F3FC" />
            <stop offset="25%" stopColor="#22D3EE" />
            <stop offset="60%" stopColor="#06B6D4" />
            <stop offset="90%" stopColor="#0E7490" />
            <stop offset="100%" stopColor="#164E63" />
          </linearGradient>

          {/* Neon Glow Filter */}
          <filter id="neon-cyan-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ================= CROWN ================= */}
        <g transform="translate(105, 12)">
          {/* Crown Base Band */}
          <path
            d="M 8 36 Q 55 42 102 36 L 98 43 Q 55 48 12 43 Z"
            fill="url(#r3d-chrome-light)"
            stroke="#64748B"
            strokeWidth="0.8"
          />
          {/* Crown Inner Glow */}
          <path
            d="M 12 40 Q 55 45 98 40"
            stroke="#22D3EE"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />
          {/* Crown Spikes */}
          <path
            d="M 10 37 L 16 16 L 36 28 L 55 4 L 74 28 L 94 16 L 100 37 Q 55 42 10 37 Z"
            fill="url(#r3d-chrome-bevel)"
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
          {/* Crown Jewels / Spheres */}
          <circle cx="16" cy="14" r="3.2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />
          <circle cx="36" cy="26" r="2.8" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="0.8" />
          <circle cx="55" cy="3" r="4.2" fill="#FFFFFF" stroke="#22D3EE" strokeWidth="1" />
          <circle cx="74" cy="26" r="2.8" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="0.8" />
          <circle cx="94" cy="14" r="3.2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />
        </g>

        {/* ================= HEXAGON SHIELD ================= */}
        {/* Outer Cyan Neon Halo behind shield */}
        <polygon
          points="160,54 236,98 236,186 160,230 84,186 84,98"
          fill="none"
          stroke="#00F0FF"
          strokeWidth="6"
          opacity="0.35"
          filter="url(#neon-cyan-blur)"
        />

        {/* Outer Silver Beveled Shield */}
        <polygon
          points="160,56 234,99 234,184 160,227 86,184 86,99"
          fill="#070C12"
          stroke="url(#r3d-chrome-light)"
          strokeWidth="6.5"
          strokeLinejoin="round"
        />

        {/* Inner Cyan Vibrant Accent Trim */}
        <polygon
          points="160,67 225,104 225,178 160,215 95,178 95,104"
          fill="none"
          stroke="url(#r3d-cyan-electric)"
          strokeWidth="3.5"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* Inner Hexagon Dark Background */}
        <polygon
          points="160,73 220,108 220,174 160,209 100,174 100,108"
          fill="#05090E"
        />

        {/* ================= EMBLEM INTERIOR: "R" & LIGHTNING BOLT ================= */}
        {/* Glowing Turquoise Accent Backing & Lightning Wing */}
        <g>
          {/* Lower left neon bracket backing */}
          <path
            d="M 103 148 L 103 176 L 158 208 L 160 200 L 115 172 L 115 148 Z"
            fill="url(#r3d-cyan-glow)"
            opacity="0.9"
            filter="url(#neon-cyan-blur)"
          />

          {/* Cyan Energy Lightning Slash */}
          <path
            d="M 152 142 L 110 186 L 140 186 L 118 208 L 176 156 L 146 156 Z"
            fill="url(#r3d-cyan-glow)"
            stroke="#00F0FF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Stylized Futuristic 3D Metallic "R" Letter */}
          {/* Upper Loop of R */}
          <path
            d="M 124 100 L 198 100 Q 218 100 218 122 Q 218 144 196 144 L 140 144 L 124 100 Z"
            fill="url(#r3d-chrome-light)"
            stroke="#64748B"
            strokeWidth="1.2"
          />
          {/* Inner Negative Cutout of R loop */}
          <path
            d="M 148 113 L 190 113 Q 202 113 202 122 Q 202 131 190 131 L 148 131 Z"
            fill="#05090E"
            stroke="url(#r3d-cyan-glow)"
            strokeWidth="1"
          />

          {/* Dynamic Stem & Slanted Leg of R */}
          <path
            d="M 124 100 L 152 144 L 144 144 L 126 128 L 116 142 L 148 142 L 188 184 L 216 184 L 168 136 Q 192 134 204 122 L 124 100 Z"
            fill="url(#r3d-chrome-bevel)"
            stroke="#CBD5E1"
            strokeWidth="1"
          />

          {/* Main Diagonal Leg Accent Cutting Down */}
          <polygon
            points="148,142 208,185 190,185 136,142"
            fill="url(#r3d-chrome-light)"
            stroke="#FFFFFF"
            strokeWidth="0.8"
          />

          {/* Cyan Neon Inner Glow Line on R */}
          <path
            d="M 146 142 L 196 182"
            stroke="#22D3EE"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* ================= TYPOGRAPHY: "R3D" ================= */}
        {showText && (
          <g transform="translate(18, 240)">
            {/* Ambient Cyan Floor Glow under text */}
            <ellipse cx="142" cy="72" rx="100" ry="8" fill="#06B6D4" opacity="0.3" filter="url(#neon-cyan-blur)" />

            {/* Letter 'R' (Metallic Chrome Silver) */}
            <g transform="translate(12, 0)">
              {/* 3D Depth Extrusion */}
              <path
                d="M 8 58 L 8 16 L 36 16 Q 58 16 58 32 Q 58 42 48 48 L 60 58 L 46 58 L 36 48 L 22 48 L 22 58 Z"
                fill="#0F172A"
                transform="translate(3, 4)"
              />
              {/* Front Face */}
              <path
                d="M 8 58 L 8 16 L 36 16 Q 58 16 58 32 Q 58 42 48 48 L 60 58 L 46 58 L 36 48 L 22 48 L 22 58 Z"
                fill="url(#r3d-chrome-light)"
                stroke="#64748B"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              {/* Cutout */}
              <path
                d="M 22 28 L 34 28 Q 44 28 44 34 Q 44 40 34 40 L 22 40 Z"
                fill="#05090E"
                stroke="#94A3B8"
                strokeWidth="0.8"
              />
              {/* Highlight Bevel */}
              <path
                d="M 8 16 L 36 16 Q 56 16 56 30"
                stroke="#FFFFFF"
                strokeWidth="2"
                fill="none"
              />
            </g>

            {/* Number '3' (VIBRANT GLOWING CYAN / TURQUOISE ENAMEL) */}
            <g transform="translate(98, 0)">
              {/* 3D Cyan Glow Drop */}
              <path
                d="M 8 16 L 50 16 L 32 34 Q 48 35 52 45 Q 56 55 42 58 Q 28 60 12 56 L 16 45 Q 26 48 36 48 Q 42 48 40 42 Q 38 37 30 37 L 22 37 L 34 26 L 10 26 Z"
                fill="#083344"
                transform="translate(3, 4)"
                filter="url(#neon-cyan-blur)"
              />
              {/* Front Cyan Metallic 3D Face */}
              <path
                d="M 8 16 L 50 16 L 32 34 Q 48 35 52 45 Q 56 55 42 58 Q 28 60 12 56 L 16 45 Q 26 48 36 48 Q 42 48 40 42 Q 38 37 30 37 L 22 37 L 34 26 L 10 26 Z"
                fill="url(#r3d-cyan-3d)"
                stroke="#A5F3FC"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Electric Highlight Lines */}
              <path
                d="M 12 18 L 48 18 L 33 33"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 38 43 Q 41 47 34 47"
                stroke="#A5F3FC"
                strokeWidth="1.2"
                fill="none"
              />
            </g>

            {/* Letter 'D' (Metallic Chrome Silver) */}
            <g transform="translate(182, 0)">
              {/* 3D Depth Extrusion */}
              <path
                d="M 8 58 L 8 16 L 32 16 Q 58 16 58 37 Q 58 58 32 58 Z"
                fill="#0F172A"
                transform="translate(3, 4)"
              />
              {/* Front Face */}
              <path
                d="M 8 58 L 8 16 L 32 16 Q 58 16 58 37 Q 58 58 32 58 Z"
                fill="url(#r3d-chrome-light)"
                stroke="#64748B"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              {/* Cutout */}
              <path
                d="M 22 28 L 30 28 Q 44 28 44 37 Q 44 46 30 46 L 22 46 Z"
                fill="#05090E"
                stroke="#94A3B8"
                strokeWidth="0.8"
              />
              {/* Highlight Bevel */}
              <path
                d="M 8 16 L 32 16 Q 56 16 56 35"
                stroke="#FFFFFF"
                strokeWidth="2"
                fill="none"
              />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
