import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CurrentPrize, WheelState, StoreTheme, Participant } from '../types';
import { Trophy, Sparkles, Eye, UserCheck, ShieldCheck, Award, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpectatorScreenProps {
  theme: StoreTheme;
  currentPrize: CurrentPrize;
  wheelState: WheelState;
  participantNames: string[];
  totalParticipants: number;
  isRegistrationOpen?: boolean;
  registeredUser: Participant | null;
  onClearRegistration: () => void;
}

export default function SpectatorScreen({
  theme,
  currentPrize,
  wheelState,
  participantNames,
  totalParticipants,
  isRegistrationOpen = true,
  registeredUser,
  onClearRegistration,
}: SpectatorScreenProps) {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isLocalSpinning, setIsLocalSpinning] = useState(false);
  const [announcedWinner, setAnnouncedWinner] = useState<{ name: string; prize: string } | null>(null);
  const [spinSecondsRemaining, setSpinSecondsRemaining] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastSpunAtRef = useRef<string | null>(null);

  // Up to 36 display names for wheel visual slices
  const displayNames = participantNames.slice(0, 36);

  // High contrast vibrant slice colors
  const sliceColors = [
    '#06B6D4', // Electric Cyan
    '#0B1926', // Deep Obsidian
    '#22D3EE', // Neon Cyan
    '#112536', // Midnight Blue
    '#0891B2', // Deep Turquoise
    '#1E3A52', // Dark Slate
    '#38BDF8', // Sky Blue
    '#071018', // Pitch Black
  ];

  // Draw the Wheel Canvas
  const drawWheel = useCallback(
    (angle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 24;

      ctx.clearRect(0, 0, width, height);

      const count = displayNames.length;

      if (count === 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#091016';
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = theme.primary;
        ctx.stroke();

        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 18px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('بانتظار تسجيل المشاركين للسحب...', centerX, centerY);
        ctx.restore();
        return;
      }

      const arcSize = (2 * Math.PI) / count;

      // Outer rim
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 14, 0, 2 * Math.PI);
      ctx.fillStyle = '#04070A';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = theme.primary;
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.restore();

      // Outer rim glowing pegs
      const pegCount = Math.max(12, Math.min(count, 32));
      for (let i = 0; i < pegCount; i++) {
        const pegAngle = (i * (2 * Math.PI)) / pegCount + angle;
        const px = centerX + (radius + 8) * Math.cos(pegAngle);
        const py = centerY + (radius + 8) * Math.sin(pegAngle);

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      // Slices
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      for (let i = 0; i < count; i++) {
        const start = i * arcSize;
        const end = start + arcSize;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, start, end);
        ctx.closePath();

        ctx.fillStyle = sliceColors[i % sliceColors.length];
        ctx.fill();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#04070A';
        ctx.stroke();

        // Text slice
        ctx.save();
        ctx.rotate(start + arcSize / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const isLight = (i % sliceColors.length) % 2 === 0;
        ctx.fillStyle = isLight ? '#04070A' : '#FFFFFF';
        ctx.font = 'bold 13px Cairo, sans-serif';

        const rawText = displayNames[i] || '';
        const nameText = rawText.length > 20 ? rawText.slice(0, 18) + '..' : rawText;

        ctx.fillText(nameText, radius - 18, 0);
        ctx.restore();
      }

      ctx.restore();

      // Center Hub
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 42, 0, 2 * Math.PI);
      ctx.fillStyle = '#04070A';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = theme.primary;
      ctx.stroke();

      // Inner hub gold badge
      ctx.beginPath();
      ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
      ctx.fillStyle = theme.primary;
      ctx.fill();

      // Center star or gift symbol
      ctx.fillStyle = '#04070A';
      ctx.font = 'bold 18px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎁', centerX, centerY);
      ctx.restore();
    },
    [displayNames, theme.primary]
  );

  // Redraw when angle changes or names change
  useEffect(() => {
    drawWheel(rotationAngle);
  }, [rotationAngle, drawWheel]);

  // Synchronize with server wheelState
  useEffect(() => {
    if (!wheelState) return;

    // Check if new spin happened
    if (wheelState.isSpinning && wheelState.spunAt && wheelState.spunAt !== lastSpunAtRef.current) {
      lastSpunAtRef.current = wheelState.spunAt;
      setAnnouncedWinner(null);
      setIsLocalSpinning(true);

      const targetWinnerName = wheelState.winnerName || '';
      let targetSliceIndex = displayNames.findIndex((n) => n === targetWinnerName);
      if (targetSliceIndex === -1) targetSliceIndex = 0;

      const totalSlices = Math.max(displayNames.length, 1);
      const arcSize = (2 * Math.PI) / totalSlices;

      // Pointer is at TOP (3 * PI / 2)
      // Angle to align slice under top pointer
      const targetAngleWithin = 1.5 * Math.PI - (targetSliceIndex + 0.5) * arcSize;
      // 25 to 30 full rotations over the 30 seconds for thrilling momentum
      const extraSpins = (25 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
      const startAngle = rotationAngle % (2 * Math.PI);
      const finalAngle = startAngle + extraSpins + (targetAngleWithin - (startAngle % (2 * Math.PI)));

      const duration = 30000; // 30 seconds spin
      const startTime = performance.now();
      let lastTickAngle = startAngle;
      setSpinSecondsRemaining(30);

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Update remaining seconds for suspense countdown
        const secondsLeft = Math.max(0, Math.ceil((duration - elapsed) / 1000));
        setSpinSecondsRemaining(secondsLeft);

        // Smooth cubic/quartic ease out for suspenseful realistic slowdown over 30s
        const ease = 1 - Math.pow(1 - progress, 3.8);
        const currentA = startAngle + (finalAngle - startAngle) * ease;

        setRotationAngle(currentA);

        // Step calculation when crossing slices
        if (Math.abs(currentA - lastTickAngle) >= arcSize * 0.7) {
          lastTickAngle = currentA;
        }

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          setIsLocalSpinning(false);
          setSpinSecondsRemaining(null);
          setAnnouncedWinner({
            name: targetWinnerName || 'أحد المشاركين المحظوظين',
            prize: wheelState.prizeTitle || currentPrize.title || 'الجائزة الكبرى',
          });

          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
            colors: [theme.primary, theme.secondary, '#F59E0B', '#10B981', '#38BDF8'],
          });
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    } else if (!wheelState.isSpinning && !wheelState.winnerName) {
      // Draw was reset by admin
      setAnnouncedWinner(null);
      setSpinSecondsRemaining(null);
      setIsLocalSpinning(false);
    }
  }, [wheelState, displayNames, currentPrize.title, rotationAngle, theme.primary, theme.secondary]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" dir="rtl">
      {/* Spectator Live Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping absolute" />
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 relative" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">بث مباشر • وضع المشاهد (Spectator)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                مباشر
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              أنت متصل بالبث المباشر لعجلة السحب، سيتم إعلان الفائزين فور إجراء السحب من المسؤول
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Registration Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
              isRegistrationOpen
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            }`}
          >
            <span>{isRegistrationOpen ? 'التسجيل متاح' : 'التسجيل مغلق (مكتفى بالعدد)'}</span>
          </div>

          {/* Privacy Guarantee Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-slate-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>خصوصية الأرقام محمية</span>
          </div>
        </div>
      </div>

      {/* User's Own Registration Card if registered */}
      {registeredUser && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <UserCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-bold">أنت مشارك في هذا السحب ✅</span>
                <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                  تذكرة #{registeredUser.ticketNumber}
                </span>
              </div>
              <p className="text-sm font-black text-white mt-0.5">{registeredUser.name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClearRegistration}
            className="text-xs text-slate-400 hover:text-rose-300 transition-colors underline cursor-pointer"
          >
            تسجيل مشارك آخر
          </button>
        </div>
      )}

      {/* PROMINENT CURRENT PRIZE CARD (Requested by user) */}
      <div className="relative mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800/95 to-slate-950 border-2 border-amber-500 shadow-2xl overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-2xl relative"
              style={{
                backgroundColor: `${theme.primary}20`,
                border: `2.5px solid ${theme.primary}`,
                boxShadow: `0 0 35px ${theme.primary}50`,
              }}
            >
              <Trophy className="w-9 h-9 sm:w-11 sm:h-11 text-amber-400 animate-pulse" />
              <Sparkles className="w-5 h-5 text-amber-300 absolute -top-2 -right-2 animate-spin" style={{ animationDuration: '4s' }} />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black mb-2 shadow-sm">
                <span>🏆 الجائزة المعروضة للسحب</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
                {currentPrize.title?.trim() || 'بانتظار تحديد الجائزة من قِبل إدارة السحب'}
              </h2>
              {currentPrize.details?.trim() ? (
                <div className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed whitespace-pre-line bg-slate-950/40 p-3 rounded-2xl border border-slate-700/40">
                  {currentPrize.details.trim()}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl leading-relaxed">
                  {currentPrize.title?.trim() ? '' : 'سيتم تحديد وتفصيل الجائزة عبر لوحة التحكم قبل بدء السحب'}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-center min-w-[140px]">
            <span className="text-[11px] text-slate-400 block mb-1">المشاركون في السحب</span>
            <div className="flex items-center justify-center gap-1.5 text-xl sm:text-2xl font-black text-cyan-400 font-mono">
              <span>{totalParticipants}</span>
              <span className="text-xs text-slate-400 font-sans">مشترك</span>
            </div>
          </div>
        </div>
      </div>

      {/* WHEEL OF FORTUNE SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Status Indicator Above Wheel */}
        <div className="mb-4 text-center">
          {isLocalSpinning ? (
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-amber-500/20 to-cyan-500/20 text-white border border-cyan-500/40 text-sm font-black animate-pulse shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>جاري تدوير العجلة باحتدام... إعلان الفائز بعد {spinSecondsRemaining ?? 30} ثانية!</span>
            </div>
          ) : announcedWinner ? (
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-sm font-black animate-bounce shadow-lg">
              <PartyPopper className="w-5 h-5" />
              <span>مبروك للفائز: {announcedWinner.name}!</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
              <Eye size={14} className="text-cyan-400" />
              <span>العجلة جاهزة بانتظار إشارة السحب المباشر من المسؤول</span>
            </div>
          )}
        </div>

        {/* Wheel Canvas Container */}
        <div className="relative flex items-center justify-center p-2 my-2">
          {/* Top Indicator Pointer */}
          <div className="absolute top-0 z-20 flex flex-col items-center pointer-events-none drop-shadow-2xl">
            <div
              className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[34px] transition-transform duration-100"
              style={{
                borderTopColor: '#F59E0B',
                filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.8))',
                transform: isLocalSpinning ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
              }}
            />
            <div className="w-3.5 h-3.5 rounded-full bg-white -mt-9 shadow-md border-2 border-slate-900" />
          </div>

          <canvas
            ref={canvasRef}
            width={520}
            height={520}
            className="max-w-full h-auto rounded-full shadow-2xl transition-all"
            style={{
              filter: isLocalSpinning ? 'brightness(1.1)' : 'none',
            }}
          />
        </div>

        {/* Announcement Banner If Winner Picked */}
        {announcedWinner && (
          <div className="w-full max-w-xl mt-6 p-6 rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border-2 border-amber-400 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-lg">
              <Award size={32} />
            </div>

            <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider mb-2 inline-block">
              الفائز بالسحب الحالي 🏆
            </span>

            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-1">
              {announcedWinner.name}
            </h3>

            <p className="text-sm font-bold text-amber-300 mb-4">
              فاز بـ: {announcedWinner.prize}
            </p>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
              سيتم التواصل مع الفائز عبر رقم الهاتف المسجل لتسليمه الجائزة مباشرة. ألف مبروك!
            </div>
          </div>
        )}

        {/* Footer Note with Privacy Assurance */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-cyan-400" />
          <span>
            لحماية الخصوصية، تظهر فقط أسماء المشاركين على العجلة ويحظر عرض أرقام الهواتف أو القوائم للجمهور.
          </span>
        </div>
      </div>
    </div>
  );
}
