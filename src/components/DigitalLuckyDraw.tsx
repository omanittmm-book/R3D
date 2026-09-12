import React, { useState, useEffect, useRef } from 'react';
import { Participant, Prize, StoreTheme } from '../types';
import { Play, Sparkles, UserCheck, Volume2, VolumeX, ShieldAlert, Award } from 'lucide-react';
import { playTickSound, playWinnerFanfare } from '../utils/audio';
import confetti from 'canvas-confetti';
import R3DLogo from './R3DLogo';

interface DigitalLuckyDrawProps {
  participants: Participant[];
  selectedPrize: Prize;
  theme: StoreTheme;
  maskPhone: boolean;
  soundEnabled: boolean;
  onlyNonWinners: boolean;
  onWinnerSelected: (winner: Participant) => void;
}

export default function DigitalLuckyDraw({
  participants,
  selectedPrize,
  theme,
  maskPhone,
  soundEnabled,
  onlyNonWinners,
  onWinnerSelected,
}: DigitalLuckyDrawProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayedCandidate, setDisplayedCandidate] = useState<Participant | null>(null);
  const [recentPicks, setRecentPicks] = useState<Participant[]>([]);
  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Eligible pool
  const eligible = participants.filter((p) => (onlyNonWinners ? !p.hasWon : true));

  // Default displayed candidate
  useEffect(() => {
    if (eligible.length > 0 && !displayedCandidate && !isRolling) {
      setDisplayedCandidate(eligible[0]);
    }
  }, [eligible, displayedCandidate, isRolling]);

  const startDigitalDraw = () => {
    if (isRolling || eligible.length === 0) return;

    setIsRolling(true);
    let speed = 40; // ms
    let elapsed = 0;
    const totalDuration = 4800; // 4.8 seconds suspense roll
    const startTime = Date.now();

    // Pick a winner fairly in advance
    const winnerIndex = Math.floor(Math.random() * eligible.length);
    const winningParticipant = eligible[winnerIndex];

    const cycle = () => {
      elapsed = Date.now() - startTime;
      const progress = elapsed / totalDuration;

      // Random scramble display
      const randomIndex = Math.floor(Math.random() * eligible.length);
      setDisplayedCandidate(eligible[randomIndex]);

      if (soundEnabled && Math.random() > 0.3) {
        playTickSound(1 + progress);
      }

      if (elapsed < totalDuration) {
        // Slow down smoothly in the last 1.5 seconds
        if (progress > 0.65) {
          speed = 40 + Math.pow((progress - 0.65) / 0.35, 2.5) * 320;
        }
        rollIntervalRef.current = setTimeout(cycle, speed);
      } else {
        // Final Reveal
        setDisplayedCandidate(winningParticipant);
        setIsRolling(false);
        setRecentPicks((prev) => [winningParticipant, ...prev.slice(0, 4)]);

        if (soundEnabled) {
          playWinnerFanfare();
        }

        // Spectacular Confetti
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: [theme.primary, theme.secondary, '#00F0FF', '#FFFFFF'],
        });

        setTimeout(() => {
          onWinnerSelected(winningParticipant);
        }, 800);
      }
    };

    cycle();
  };

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearTimeout(rollIntervalRef.current);
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Cyber Scramble Screen Box */}
      <div className="relative w-full max-w-2xl bg-slate-950 rounded-3xl border-2 border-cyan-500/40 p-6 sm:p-10 shadow-2xl overflow-hidden text-center my-4">
        {/* Animated Cyber Neon Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d410_1px,transparent_1px),linear-gradient(to_bottom,#06b6d410_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

        {/* Brand Watermark */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <R3DLogo size="sm" showText={false} glow={true} />
          <span className="text-xs font-mono tracking-widest text-cyan-400 font-bold uppercase">
            R3D Digital Quantum Picker
          </span>
        </div>

        {/* Prize being drawn */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-xs font-bold text-white mb-6">
          <span className="text-cyan-400">السحب على:</span>
          <span>🎁 {selectedPrize.title}</span>
        </div>

        {/* Display Screen */}
        <div className="relative bg-slate-900/90 rounded-2xl border-2 border-cyan-500/60 p-6 sm:p-8 mb-6 shadow-inner">
          {displayedCandidate ? (
            <div className="space-y-4">
              <div className="inline-block px-4 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-mono text-sm sm:text-base font-black tracking-wider">
                تذكرة رقم: #{displayedCandidate.ticketNumber}
              </div>

              <h3
                className={`text-2xl sm:text-4xl font-black transition-all ${
                  isRolling
                    ? 'text-cyan-200 blur-[0.5px] scale-105'
                    : 'text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                }`}
              >
                {displayedCandidate.name}
              </h3>

              <p className="text-xs sm:text-sm font-mono text-slate-400 dir-ltr">
                {maskPhone
                  ? displayedCandidate.phone.slice(0, 3) + '****' + displayedCandidate.phone.slice(-3)
                  : displayedCandidate.phone}
              </p>
            </div>
          ) : (
            <div className="py-8 text-slate-400 text-sm font-medium">
              لا يوجد مشاركون مؤهلون في قائمة السحب
            </div>
          )}

          {/* Electronic Scanline effect when rolling */}
          {isRolling && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-[pulse_0.4s_ease-in-out_infinite] pointer-events-none" />
          )}
        </div>

        {/* Draw Trigger Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            id="start-digital-draw-btn"
            type="button"
            onClick={startDigitalDraw}
            disabled={isRolling || eligible.length === 0}
            className="px-10 py-4 rounded-2xl text-lg sm:text-xl font-black text-white shadow-2xl transition-all duration-200 flex items-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 cursor-pointer"
            style={{
              backgroundColor: theme.primary,
              boxShadow: `0 0 30px ${theme.primary}60`,
            }}
          >
            <Play className={`w-6 h-6 fill-white ${isRolling ? 'animate-spin' : ''}`} />
            <span>{isRolling ? 'جاري خلط أرقام التذاكر...' : 'بدء السحب الرقمي السريع!'}</span>
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </button>
          <span className="text-xs text-slate-400">
            عدد المرشحين المؤهلين حالياً: <strong className="text-cyan-400">{eligible.length}</strong> مشترك
          </span>
        </div>
      </div>
    </div>
  );
}
