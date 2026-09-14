import React, { useRef, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  Award,
  CheckCircle2,
  UserCheck,
  Sparkles,
  Eye,
  EyeOff,
  ShieldAlert,
  MessageCircle,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Tv,
  Zap,
  Lock,
} from 'lucide-react';
import { Participant, Prize, StoreTheme } from '../types';
import { downloadWinnerCertificate } from '../utils/winnerCard';
import DigitalLuckyDraw from './DigitalLuckyDraw';
import R3DLogo from './R3DLogo';

interface WheelOfFortuneProps {
  participants: Participant[];
  prizes: Prize[];
  theme: StoreTheme;
  maskPhone: boolean;
  isAdmin?: boolean;
  onRequestAdminLogin?: () => void;
  onWinnerDrawn: (participantId: string, prizeTitle: string) => Promise<void>;
  onSeedSample: () => Promise<void>;
}

export default function WheelOfFortune({
  participants,
  prizes,
  theme,
  maskPhone,
  isAdmin = false,
  onRequestAdminLogin,
  onWinnerDrawn,
  onSeedSample,
}: WheelOfFortuneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeDrawMode, setActiveDrawMode] = useState<'wheel' | 'digital'>('wheel');
  const [isLiveStage, setIsLiveStage] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const rotationAngleRef = useRef(0);
  const [onlyNonWinners, setOnlyNonWinners] = useState(true);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>(prizes[0]?.id || '');
  const [currentWinner, setCurrentWinner] = useState<Participant | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [revealPhone, setRevealPhone] = useState(false);
  const [isSavingWinner, setIsSavingWinner] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Filter candidates
  const eligibleCandidates = participants.filter((p) => (onlyNonWinners ? !p.hasWon : true));
  const recentWinners = participants.filter((p) => p.hasWon);

  // Limit canvas slices to at most 36 for visual clarity and readability
  const displaySlices = eligibleCandidates.slice(0, 36);

  // Wheel colors adapted specifically for R3D Turquoise or default
  const isR3D = theme.id === 'r3d-turquoise';
  const sliceColors = isR3D
    ? [
        '#06B6D4', // Electric Turquoise
        '#09121A', // Obsidian Black
        '#22D3EE', // Neon Cyan
        '#0F1E29', // Dark Cyber Slate
        '#0891B2', // Deep Turquoise
        '#162838', // Midnight Azure
        '#38BDF8', // Cyan Blue
        '#04070A', // Deep Black
      ]
    : [
        theme.primary,
        '#3B82F6', // Blue
        theme.secondary,
        '#10B981', // Emerald
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#F97316', // Orange
        '#14B8A6', // Teal
      ];

  // Draw the wheel on canvas
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

      const count = displaySlices.length;

      if (count === 0) {
        // Empty wheel state
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#091016';
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = theme.primary;
        ctx.stroke();

        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 20px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('لا يوجد مشاركون مؤهلون للسحب', centerX, centerY - 10);
        ctx.font = '15px Cairo, sans-serif';
        ctx.fillText('أضف مشاركين أو أعد تعيين الفائزين', centerX, centerY + 20);
        ctx.restore();
        return;
      }

      const arcSize = (2 * Math.PI) / count;

      // Outer rim cyber ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 12, 0, 2 * Math.PI);
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#0B131B';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
      ctx.lineWidth = 6;
      ctx.strokeStyle = theme.primary;
      ctx.shadowColor = theme.secondary;
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.restore();

      // Draw slices
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      for (let i = 0; i < count; i++) {
        const sliceAngle = i * arcSize;
        const color = sliceColors[i % sliceColors.length];

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, sliceAngle, sliceAngle + arcSize);
        ctx.closePath();

        // Gradient for depth
        const gradient = ctx.createRadialGradient(0, 0, 20, 0, 0, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, adjustBrightness(color, -25));

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#04070A';
        ctx.stroke();

        // Slice text (Participant name)
        ctx.save();
        ctx.rotate(sliceAngle + arcSize / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 5;

        const fontSize = count > 20 ? 12 : count > 12 ? 14 : 16;
        ctx.font = `bold ${fontSize}px Cairo, sans-serif`;

        const name = displaySlices[i].name;
        const maxChars = count > 20 ? 12 : 18;
        const displayName = name.length > maxChars ? name.substring(0, maxChars) + '..' : name;

        ctx.fillText(displayName, radius - 20, 0);

        // Small ticket number near outer edge
        ctx.font = '10px Tajawal, sans-serif';
        ctx.fillStyle = '#22D3EE';
        ctx.fillText(`#${displaySlices[i].ticketNumber}`, radius - 20, 16);

        ctx.restore();
      }

      // Draw rim neon pins
      for (let i = 0; i < count * 2; i++) {
        const pinAngle = (i * Math.PI) / count;
        const pinX = (radius + 2) * Math.cos(pinAngle);
        const pinY = (radius + 2) * Math.sin(pinAngle);

        ctx.beginPath();
        ctx.arc(pinX, pinY, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = theme.primary;
        ctx.shadowBlur = 4;
        ctx.fill();
      }

      ctx.restore();

      // Center Hub with R3D Emblem
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 42, 0, 2 * Math.PI);
      ctx.fillStyle = '#04070A';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = theme.primary;
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 15;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 34, 0, 2 * Math.PI);
      const hubGrad = ctx.createLinearGradient(centerX - 34, centerY - 34, centerX + 34, centerY + 34);
      hubGrad.addColorStop(0, '#0E2A38');
      hubGrad.addColorStop(1, '#04080D');
      ctx.fillStyle = hubGrad;
      ctx.fill();

      // R3D metallic hub text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#22D3EE';
      ctx.shadowBlur = 6;
      ctx.fillText(isR3D ? 'R3D' : 'WIN', centerX, centerY + 2);
      ctx.restore();
    },
    [displaySlices, theme, sliceColors, isR3D]
  );

  // Redraw when slices, theme, or sizing changes
  useEffect(() => {
    drawWheel(rotationAngleRef.current);
  }, [drawWheel]);

  // Handle spin animation
  const spinWheel = () => {
    if (isSpinning || displaySlices.length === 0) return;

    setIsSpinning(true);
    setShowWinnerModal(false);
    setCurrentWinner(null);
    setRevealPhone(false);

    const count = displaySlices.length;
    const arcSize = (2 * Math.PI) / count;
    const winningIndex = Math.floor(Math.random() * count);

    const desiredSliceCenter = winningIndex * arcSize + arcSize / 2;
    const pointerOffset = (3 * Math.PI) / 2; // 270 degrees (Top)

    const fullSpins = 25 + Math.floor(Math.random() * 6);
    const targetAngle = pointerOffset - desiredSliceCenter + fullSpins * 2 * Math.PI;

    const startAngle = rotationAngleRef.current % (2 * Math.PI);
    const totalRotation = targetAngle - startAngle;

    const duration = 30000; // 30 seconds spin
    const startTime = performance.now();

    let lastTickAngle = startAngle;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3.8);
      const currentAngle = startAngle + totalRotation * easeOut;

      rotationAngleRef.current = currentAngle;
      drawWheel(currentAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const winner = displaySlices[winningIndex];
        setCurrentWinner(winner);

        triggerCelebrationConfetti();

        setTimeout(() => {
          setShowWinnerModal(true);
        }, 500);
      }
    };

    requestAnimationFrame(animate);
  };

  const triggerCelebrationConfetti = () => {
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 70,
      origin: { x: 0.1, y: 0.6 },
      colors: [theme.primary, theme.secondary, '#00F0FF', '#FFFFFF'],
    });

    confetti({
      particleCount: 80,
      angle: 120,
      spread: 70,
      origin: { x: 0.9, y: 0.6 },
      colors: [theme.primary, theme.secondary, '#00F0FF', '#FFFFFF'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 120,
        origin: { x: 0.5, y: 0.5 },
        shapes: ['circle', 'star'],
        scalar: 1.2,
      });
    }, 250);
  };

  const selectedPrize = prizes.find((p) => p.id === selectedPrizeId) || prizes[0];

  const handleConfirmWinner = async () => {
    if (!currentWinner) return;
    setIsSavingWinner(true);
    try {
      const prizeTitle = selectedPrize ? selectedPrize.title : 'جائزة السحب الكبرى';
      await onWinnerDrawn(currentWinner.id, prizeTitle);
      setShowWinnerModal(false);
      setCurrentWinner(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingWinner(false);
    }
  };

  const handleWhatsAppWinner = () => {
    if (!currentWinner) return;
    let cleanPhone = currentWinner.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('05')) {
      cleanPhone = '966' + cleanPhone.substring(1);
    }
    const prizeTitle = selectedPrize ? selectedPrize.title : 'الجائزة الكبرى';
    const storeLabel = isR3D ? 'متجر R3D الفاخر' : 'المتجر';
    const message = `مرحباً ${currentWinner.name} 🎉\nألف مبروك! لقد فزت معنا في سحب ${storeLabel} بجائزة:\n🎁 ${prizeTitle}\nرقم تذكرتك الرابحة: #${currentWinner.ticketNumber}\n\nيرجى تزويدنا بعنوان التوصيل لتسليمك الجائزة فوراً! ✨`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDownloadCard = () => {
    if (!currentWinner) return;
    downloadWinnerCertificate({
      participant: currentWinner,
      prize: selectedPrize,
      storeName: isR3D ? 'متجر R3D الفاخر' : 'متجر الجوائز الكبرى',
    });
  };

  const handleCopyWinnerDetails = () => {
    if (!currentWinner) return;
    const text = `فائز سحب ${isR3D ? 'R3D' : 'المتجر'}: ${currentWinner.name} | تذكرة #${currentWinner.ticketNumber} | الجائزة: ${selectedPrize?.title || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div
      className={`flex flex-col items-center w-full transition-all duration-300 ${
        isLiveStage
          ? 'fixed inset-0 z-50 bg-slate-950 overflow-y-auto p-4 sm:p-8'
          : 'max-w-5xl mx-auto px-4 py-6'
      }`}
      id="wheel-section"
    >
      {/* Top Banner & Active Prize Bar */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 mb-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Draw Mode Switch (Wheel vs Digital Matrix) */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setActiveDrawMode('wheel')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeDrawMode === 'wheel'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <RotateCcw size={14} />
              <span>عجلة الحظ التوربينية</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDrawMode('digital')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeDrawMode === 'digital'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap size={14} />
              <span>السحب الرقمي السريع</span>
            </button>
          </div>

          {/* Active Prize Selection */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-inner shrink-0"
              style={{ backgroundColor: `${theme.primary}20`, border: `2px solid ${theme.primary}` }}
            >
              🏆
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">السحب على جائزة:</p>
              <select
                id="prize-select"
                value={selectedPrizeId}
                onChange={(e) => setSelectedPrizeId(e.target.value)}
                disabled={isSpinning}
                className="mt-0.5 bg-slate-800 text-white font-bold rounded-xl px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-400 text-xs sm:text-sm cursor-pointer"
              >
                {prizes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.quantity} متاح)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => setOnlyNonWinners(!onlyNonWinners)}
              disabled={isSpinning}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                onlyNonWinners
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <UserCheck size={14} />
              {onlyNonWinners ? 'استبعاد الفائزين' : 'شمل الجميع'}
            </button>

            {/* Live Stage Fullscreen Mode Button */}
            <button
              type="button"
              onClick={() => setIsLiveStage(!isLiveStage)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isLiveStage
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-700'
              }`}
              title="وضع البث المباشر والشاشة الكبيرة"
            >
              {isLiveStage ? <Minimize2 size={14} /> : <Tv size={14} />}
              <span>{isLiveStage ? 'خروج من العرض المسرحي' : 'وضع البث المباشر'}</span>
            </button>

            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300">
              المؤهلون: <span className="text-cyan-400 text-sm">{eligibleCandidates.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Draw View (Wheel or Digital) */}
      {activeDrawMode === 'digital' ? (
        <DigitalLuckyDraw
          participants={participants}
          selectedPrize={selectedPrize}
          theme={theme}
          maskPhone={maskPhone}
          onlyNonWinners={onlyNonWinners}
          onWinnerSelected={(winner) => {
            setCurrentWinner(winner);
            setShowWinnerModal(true);
          }}
        />
      ) : (
        /* The Wheel Container */
        <div className="relative flex flex-col items-center justify-center my-2">
          {/* Pointer Indicator at 12 o'clock */}
          <div className="absolute -top-5 z-20 flex flex-col items-center drop-shadow-2xl">
            <div
              className={`w-10 h-12 flex items-center justify-center transition-transform duration-75 ${
                isSpinning ? 'animate-bounce' : ''
              }`}
            >
              <svg viewBox="0 0 32 40" className="w-9 h-11 filter drop-shadow-lg">
                <path
                  d="M 16 38 L 2 10 C 0 6 3 0 8 0 L 24 0 C 29 0 32 6 30 10 Z"
                  fill="#06B6D4"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />
                <circle cx="16" cy="12" r="5" fill="#FFFFFF" />
              </svg>
            </div>
          </div>

          {/* Canvas Wheel */}
          <div className="relative rounded-full p-3 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl border-4 border-cyan-900/40">
            <canvas
              ref={canvasRef}
              width={520}
              height={520}
              className="w-[310px] h-[310px] sm:w-[440px] sm:h-[440px] md:w-[490px] md:h-[490px] rounded-full max-w-full"
            />
          </div>

          {/* Big Spin Action Button */}
          <div className="mt-7 flex flex-col items-center gap-3">
            <button
              id="spin-wheel-btn"
              type="button"
              onClick={spinWheel}
              disabled={isSpinning || displaySlices.length === 0}
              className={`group relative px-10 py-4 rounded-2xl text-xl font-black text-slate-950 shadow-2xl transition-all duration-200 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                isSpinning ? 'scale-95' : 'hover:scale-105 active:scale-95'
              }`}
              style={{
                backgroundColor: theme.primary,
                boxShadow: `0 0 35px ${theme.primary}70`,
              }}
            >
              <Play className={`w-6 h-6 fill-slate-950 ${isSpinning ? 'animate-spin' : 'group-hover:translate-x-1'}`} />
              <span>{isSpinning ? 'جاري دوران عجلة R3D...' : 'تدوير عجلة الحظ الآن!'}</span>
              <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
            </button>

            {eligibleCandidates.length === 0 && (
              <button
                type="button"
                onClick={onSeedSample}
                className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                إضافة مشاركين تجريبيين لتجربة العجلة فوراً
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live Winners Ticker Bar */}
      {recentWinners.length > 0 && (
        <div className="w-full mt-8 p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/20 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Award size={14} />
              قائمة الفائزين الموثقين ({recentWinners.length}):
            </span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-1 text-xs">
            {recentWinners.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shrink-0"
              >
                <span className="text-amber-400 font-bold">#{w.ticketNumber}</span>
                <span className="font-bold text-white">{w.name}</span>
                <span className="text-slate-400 text-[11px]">— {w.prizeWon || 'جائزة السحب'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Winner Celebration Modal */}
      {showWinnerModal && currentWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-slate-950 border-2 border-cyan-400/80 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden">
            {/* Ambient Cyan Glows */}
            <div className="absolute -top-24 -left-24 w-52 h-52 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />

            {/* R3D Brand Header with Crown */}
            <div className="flex justify-center mb-3">
              <R3DLogo size="md" showText={true} glow={true} />
            </div>

            <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold mb-1">
              👑 شهادة فوز رسمية معتمدة 👑
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">{currentWinner.name}</h2>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200 mb-5">
              <span>تذكرة رقم:</span>
              <span className="font-mono font-bold text-cyan-400">#{currentWinner.ticketNumber}</span>
            </div>

            {/* Prize Card */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 mb-4 text-right">
              <p className="text-xs text-slate-400 mb-1">الجائزة المستحقة:</p>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🎁</span>
                <span className="text-base font-bold text-white">
                  {selectedPrize ? selectedPrize.title : 'جائزة السحب الكبرى'}
                </span>
              </div>
            </div>

            {/* Phone Number with Privacy Reveal */}
            <div className="bg-slate-900/60 rounded-xl p-3 mb-5 flex items-center justify-between border border-slate-800">
              <div className="text-right">
                <p className="text-xs text-slate-400">رقم الهاتف للتواصل:</p>
                <p className="font-mono text-base font-bold text-slate-200 dir-ltr">
                  {revealPhone
                    ? currentWinner.phone
                    : currentWinner.phone.slice(0, 3) + '****' + currentWinner.phone.slice(-3)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRevealPhone(!revealPhone)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title={revealPhone ? 'إخفاء الرقم' : 'إظهار الرقم كاملاً'}
              >
                {revealPhone ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Quick Action Tools: WhatsApp & Card Download */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                type="button"
                onClick={handleWhatsAppWinner}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
              >
                <MessageCircle size={15} />
                <span>مراسلة واتساب فوراً</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCard}
                className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
              >
                <Download size={15} />
                <span>تحميل بطاقة الفوز PNG</span>
              </button>
            </div>

            {/* Confirm Winner & Close Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleConfirmWinner}
                disabled={isSavingWinner}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-950 shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 bg-cyan-400 hover:bg-cyan-300 cursor-pointer"
              >
                <CheckCircle2 size={18} />
                <span>{isSavingWinner ? 'جاري التوثيق...' : 'اعتماد وتوثيق الفائز'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyWinnerDetails}
                className="py-3 px-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1"
                title="نسخ التفاصيل"
              >
                {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedCode ? 'تم النسخ' : 'نسخ'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWinnerModal(false)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function adjustBrightness(hex: string, percent: number): string {
  if (!hex || hex[0] !== '#') return hex;
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

