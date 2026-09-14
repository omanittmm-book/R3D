import React, { useState, useEffect } from 'react';
import { CurrentPrize, StoreTheme, Participant } from '../types';
import { Sparkles, Trophy, Phone, User, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Ticket, Lock, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { registerParticipantInSupabase } from '../lib/supabase';

interface RegistrationFormProps {
  theme: StoreTheme;
  currentPrize: CurrentPrize;
  storeName: string;
  storeTagline: string;
  isRegistrationOpen: boolean;
  onRegistered: (participant: Participant) => void;
  onGoToSpectator: () => void;
}

// Convert Arabic-Indic numerals to 0-9
function normalizeArabicDigits(str: string): string {
  const map: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  return str.replace(/[٠-٩]/g, (d) => map[d] || d);
}

export default function RegistrationForm({
  theme,
  currentPrize,
  storeName,
  storeTagline,
  isRegistrationOpen,
  onRegistered,
  onGoToSpectator,
}: RegistrationFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState<Participant | null>(null);

  // Phone validation: extract digits
  const cleanDigits = normalizeArabicDigits(phone).replace(/\D/g, '');
  const digitsCount = cleanDigits.length;
  const isPhoneValid = digitsCount === 8;
  const isNameValid = name.trim().length >= 3;
  const canSubmit = isNameValid && isPhoneValid && isRegistrationOpen && !isLoading;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = normalizeArabicDigits(e.target.value);
    // Allow digits only and max 8 digits
    const digitsOnly = val.replace(/\D/g, '').slice(0, 8);
    setPhone(digitsOnly);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setError('يرجى كتابة الاسم والقبيلة بالكامل (3 أحرف على الأقل).');
      return;
    }

    if (digitsCount !== 8) {
      setError(`رقم الهاتف يجب أن يتكون من 8 أرقام بالضبط. حالياً كتبت: ${digitsCount} أرقام.`);
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerParticipantInSupabase(trimmedName, cleanDigits, false);

      if (!result.success || !result.participant) {
        setError(result.error || 'حدث خطأ أثناء التسجيل. يرجى التأكد من البيانات.');
        setIsLoading(false);
        return;
      }

      const participant = result.participant;

      // Save to LocalStorage so user is remembered
      if (typeof window !== 'undefined') {
        localStorage.setItem('giveaway_registered_user', JSON.stringify(participant));
      }

      setJustRegistered(participant);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: [theme.primary, theme.secondary, '#10B981', '#F59E0B'],
      });

      // Notify parent after small delay
      setTimeout(() => {
        onRegistered(participant);
      }, 2000);
    } catch {
      setError('تعذر إتمام التسجيل في قاعدة البيانات. يرجى التحقق من اتصال الإنترنت والمحاولة مجدداً.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 animate-in fade-in duration-300" dir="rtl">
      {/* Top Banner */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs text-amber-400 font-bold mb-3 shadow-sm">
          <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
          <span>{isRegistrationOpen ? 'التسجيل مفتوح الآن في السحب المباشر' : 'التسجيل مغلق حالياً'}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
          {storeName || 'سحب وقيف اوي المتاجر'}
        </h1>
        <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          {storeTagline || 'سجل اسمك ورقم هاتفك للدخول في عجلة الحظ والسحب المباشر على جوائز قيمة!'}
        </p>
      </div>

      {/* Prominent Current Prize Card */}
      {currentPrize && currentPrize.title && (
        <div className="relative mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/50 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -z-0 pointer-events-none" />
          <div className="relative z-10 flex items-start sm:items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
              style={{ backgroundColor: `${theme.primary}25`, border: `2px solid ${theme.primary}` }}
            >
              <Trophy className="w-7 h-7 text-amber-400 animate-bounce" style={{ animationDuration: '2.5s' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  الجائزة الحالية في هذا السحب
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">{currentPrize.title}</h3>
              {currentPrize.details && (
                <div className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line bg-slate-950/40 p-3 rounded-xl border border-slate-700/40">
                  {currentPrize.details}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration Card or Success State */}
      {justRegistered ? (
        <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
            <CheckCircle2 size={36} />
          </div>

          <h2 className="text-2xl font-black text-white mb-1">تم تأكيد تسجيلك في السحب!</h2>
          <p className="text-sm text-slate-300 mb-5">
            اسمك الآن مسجل في عجلة الحظ، جاري نقلك تلقائياً إلى شاشة المشاهدة المباشرة...
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-right mb-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs text-slate-400">تذكرة السحب:</span>
              <span className="text-lg font-mono font-black text-amber-400">#{justRegistered.ticketNumber}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-xs text-slate-400">الاسم والقبيلة:</span>
              <span className="font-bold text-white">{justRegistered.name}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoToSpectator}
            className="w-full py-3.5 rounded-xl font-black text-slate-950 text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-95 transition-all"
            style={{ backgroundColor: theme.primary }}
          >
            <span>الانتقال فوراً لشاشة المشاهدة المباشرة</span>
            <ArrowLeft size={18} />
          </button>
        </div>
      ) : !isRegistrationOpen ? (
        <div className="bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden animate-in fade-in duration-300">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 shadow-lg">
            <Lock size={38} />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black mb-3">
            <span>⛔ باب التسجيل مغلق حالياً</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            تم إغلاق باب التسجيل في السحب
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto mb-8 leading-relaxed">
            تم إغلاق باب التسجيل والاكتفاء بالعدد الحالي من المشاركين لإجراء السحب. بإمكانك متابعة البث المباشر لعجلة الحظ ومشاهدة إعلان الفائزين الآن.
          </p>

          <button
            type="button"
            onClick={onGoToSpectator}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-slate-950 text-sm shadow-xl flex items-center justify-center gap-2 mx-auto cursor-pointer hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all"
            style={{ backgroundColor: theme.primary }}
          >
            <Eye size={20} />
            <span>الانتقال للبث المباشر لعجلة السحب</span>
            <ArrowLeft size={18} />
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>📝</span> نموذج التسجيل في السحب
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                أدخل بياناتك بدقة للتواصل معك وتسليمك الجائزة عند الفوز
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
              <ShieldCheck size={14} />
              <span>بيانات مشفرة وآمنة</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name & Tribe Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                الاسم والقبيلة <span className="text-rose-400">*</span>:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="مثال: سالم بن ناصر الحارثي"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-2xl px-4 py-3.5 pr-11 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <User className="absolute right-3.5 top-3.5 text-slate-500 w-5 h-5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                اكتب اسمك الثلاثي أو الاسم مع القبيلة بشكل واضح.
              </p>
            </div>

            {/* 8-Digit Phone Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300">
                  رقم الهاتف (8 أرقام فقط) <span className="text-rose-400">*</span>:
                </label>
                {/* Visual digits counter badge */}
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border font-bold transition-all ${
                    isPhoneValid
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : digitsCount > 0
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isPhoneValid ? '8 / 8 أرقام مكتملة ✅' : `${digitsCount} / 8 أرقام`}
                </span>
              </div>

              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={8}
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="9xxxxxxx أو 7xxxxxxx"
                  className={`w-full bg-slate-950 border rounded-2xl px-4 py-3.5 pr-11 text-base font-mono tracking-wider font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    isPhoneValid
                      ? 'border-emerald-500/70 focus:border-emerald-400 focus:ring-emerald-500/20'
                      : error
                      ? 'border-rose-500/70 focus:border-rose-400 focus:ring-rose-500/20'
                      : 'border-slate-700 focus:border-cyan-400 focus:ring-cyan-500/20'
                  }`}
                />
                <Phone className="absolute right-3.5 top-3.5 text-slate-500 w-5 h-5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                التحقق الصارم: يتكون من 8 أرقام فقط بدون مفتاح الدولة (مثال: 91234567 أو 79876543).
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="submit-registration-btn"
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-4 rounded-2xl font-black text-sm text-slate-950 shadow-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                canSubmit
                  ? 'hover:brightness-110 hover:scale-[1.01] active:scale-95'
                  : 'opacity-40 cursor-not-allowed'
              }`}
              style={{ backgroundColor: theme.primary }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  <span>جاري تسجيل بياناتك في السحب...</span>
                </div>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>تأكيد التسجيل والدخول في السحب</span>
                </>
              )}
            </button>

            {/* Direct Link to Spectator if already registered */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onGoToSpectator}
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>مسجل مسبقاً؟ اضغط هنا للانتقال لشاشة المشاهدة المباشرة</span>
                <ArrowLeft size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
