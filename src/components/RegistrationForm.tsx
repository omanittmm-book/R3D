import React, { useState } from 'react';
import { StoreSettings, StoreTheme, Participant } from '../types';
import LogoDisplay from './LogoDisplay';
import { playSubmitSuccess } from '../utils/audio';
import { CheckCircle2, Ticket, Sparkles, AlertCircle, Share2, Phone, User, Clock, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegistrationFormProps {
  settings: StoreSettings;
  theme: StoreTheme;
  onParticipantAdded: () => Promise<void>;
  onSwitchToWheel?: () => void;
}

export default function RegistrationForm({
  settings,
  theme,
  onParticipantAdded,
  onSwitchToWheel,
}: RegistrationFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredTicket, setRegisteredTicket] = useState<Participant | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('يرجى إدخال اسمك الكريم بشكل صحيح.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage('يرجى إدخال رقم جوال صحيح للتواصل في حال فوزك.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, phone: cleanPhone }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.error || 'حدث خطأ أثناء التسجيل، يرجى المحاولة لاحقاً.');
        return;
      }

      // Success!
      setRegisteredTicket(data.participant);
      setName('');
      setPhone('');
      playSubmitSuccess();

      // Trigger mini confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: [theme.primary, theme.secondary, '#F59E0B', '#10B981'],
      });

      await onParticipantAdded();
    } catch {
      setErrorMessage('تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎁 شارك في سحب ${settings.storeName} على جوائز قيمة عبر عجلة الحظ! سجل اسمك ورقمك هنا: ${window.location.origin}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8" id="registration-section">
      {/* Store Header Info */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <LogoDisplay
            logoUrl={settings.logoUrl}
            logoType={settings.logoType}
            logoPreset={settings.logoPreset}
            size="lg"
            className="ring-4 ring-white/10"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-amber-400 font-bold mb-3 shadow-sm">
          <Sparkles size={13} />
          <span>{settings.isRegistrationOpen ? 'التسجيل مفتوح الآن في السحب' : 'التسجيل مغلق حالياً'}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
          {settings.giveawayTitle || 'السحب الكبير على الجوائز'}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-md mx-auto leading-relaxed">
          {settings.giveawayDescription || 'سجل اسمك ورقم هاتفك للدخول في عجلة الحظ'}
        </p>

        <p className="text-xs text-slate-400 mt-2 font-medium">مقدّم من: {settings.storeName}</p>
      </div>

      {/* Available Prizes Preview Pills */}
      {settings.prizes && settings.prizes.length > 0 && (
        <div className="mb-8 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs font-bold text-slate-400 mb-2.5 text-center">الجوائز المرصودة في هذا السحب:</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {settings.prizes.map((prize) => (
              <span
                key={prize.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-slate-200"
              >
                <span>🎁</span>
                <span>{prize.title}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* If already registered successfully, show Lucky Ticket card */}
      {registeredTicket ? (
        <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
            <CheckCircle2 size={36} />
          </div>

          <h2 className="text-2xl font-black text-white mb-1">تم تأكيد دخولك السحب بنجاح!</h2>
          <p className="text-sm text-slate-300 mb-6">اسمك الآن مسجل في عجلة الحظ، نتمنى لك أوفر الحظوظ بالفوز.</p>

          {/* Ticket Element */}
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-950 border-2 border-dashed border-amber-400/50 rounded-2xl p-5 mb-6 text-right shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-3">
              <span className="text-xs text-slate-400">تذكرة دخول السحب:</span>
              <span className="font-mono text-xl font-black text-amber-400">#{registeredTicket.ticketNumber}</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">الاسم:</span>
                <span className="font-bold text-white">{registeredTicket.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">رقم الجوال:</span>
                <span className="font-mono font-medium text-slate-300 dir-ltr">
                  {registeredTicket.phone.slice(0, 3) + '****' + registeredTicket.phone.slice(-3)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">تاريخ التسجيل:</span>
                <span className="text-xs text-slate-400">
                  {new Date(registeredTicket.registeredAt).toLocaleDateString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <Share2 size={18} />
              <span>مشاركة السحب عبر واتساب مع أصدقائك</span>
            </button>

            <button
              type="button"
              onClick={() => setRegisteredTicket(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              تسجيل مشترك آخر
            </button>

            {onSwitchToWheel && (
              <button
                type="button"
                onClick={onSwitchToWheel}
                className="w-full py-2 px-4 text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center justify-center gap-1 mt-2"
              >
                <span>الانتقال لمشاهدة عجلة الحظ</span>
                <ArrowRight size={14} className="rotate-180" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Registration Form */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {!settings.isRegistrationOpen ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">باب التسجيل مغلق حالياً</h3>
              <p className="text-sm text-slate-400">
                لقد انتهت فترة استقبال المشاركين أو تم إيقاف التسجيل مؤقتاً من قِبل إدارة المتجر.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Name Input */}
              <div>
                <label htmlFor="participant-name" className="block text-xs font-bold text-slate-300 mb-2">
                  الاسم الكامل (الثلاثي أو الثنائي) <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    id="participant-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: عبدالله محمد الشمري"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pr-10 pl-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Phone Input */}
              <div>
                <label htmlFor="participant-phone" className="block text-xs font-bold text-slate-300 mb-2">
                  رقم الهاتف للتواصل في حال الفوز <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone size={18} />
                  </div>
                  <input
                    id="participant-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 0501234567"
                    dir="ltr"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pr-10 pl-4 py-3 text-white placeholder-slate-500 text-sm text-right focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  لن يتم نشر رقم هاتفك كاملاً على الشاشة العامة للحفاظ على خصوصيتك.
                </p>
              </div>

              {/* Submit Button */}
              <button
                id="submit-entry-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl text-base font-black text-slate-950 shadow-xl flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-98 disabled:opacity-50 cursor-pointer"
                style={{
                  backgroundColor: theme.primary,
                  boxShadow: `0 8px 25px ${theme.primary}40`,
                }}
              >
                <Ticket size={20} />
                <span>{isLoading ? 'جاري تسجيل دخولك...' : 'دخول السحب وعجلة الحظ الآن'}</span>
              </button>
            </form>
          )}

          {/* Quick Ticket Lookup Tool */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <TicketCheckerModal />
          </div>
        </div>
      )}
    </div>
  );
}

function TicketCheckerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [foundParticipant, setFoundParticipant] = useState<Participant | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setNotFound(false);
    setFoundParticipant(null);

    try {
      const res = await fetch('/api/participants');
      const data = await res.json();
      if (data.success && Array.isArray(data.participants)) {
        const cleanQ = query.trim().replace(/[^0-9]/g, '');
        const match = data.participants.find(
          (p: Participant) =>
            p.phone.replace(/[^0-9]/g, '').endsWith(cleanQ) ||
            p.ticketNumber.toString() === query.trim().replace('#', '')
        );
        if (match) {
          setFoundParticipant(match);
        } else {
          setNotFound(true);
        }
      }
    } catch {
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline inline-flex items-center gap-1.5 transition-colors"
      >
        <span>🔍 هل سجلت مسبقاً؟ اضغط هنا للتحقق من تذكرتك</span>
      </button>

      {isOpen && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 text-right animate-in fade-in">
          <p className="text-xs font-bold text-slate-300 mb-2">استعلام سريع عن تذكرة السحب:</p>
          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب رقم جوالك أو رقم التذكرة"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              {isSearching ? '...' : 'بحث'}
            </button>
          </form>

          {foundParticipant && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-xs space-y-1">
              <p className="text-emerald-400 font-bold">✓ تم العثور على اشتراكك بنجاح!</p>
              <p className="text-white font-bold">الاسم: {foundParticipant.name}</p>
              <p className="text-cyan-300 font-mono">رقم التذكرة: #{foundParticipant.ticketNumber}</p>
              <p className="text-slate-400 text-[11px]">
                الحالة: {foundParticipant.hasWon ? '🎉 فاز في السحب (' + foundParticipant.prizeWon + ')' : '⏳ مؤهل وبانتظار السحب'}
              </p>
            </div>
          )}

          {notFound && (
            <p className="text-rose-400 text-xs">لم نجد تسجيلاً يطابق هذا الرقم. تأكد من إدخال الرقم المسجل به.</p>
          )}
        </div>
      )}
    </div>
  );
}

