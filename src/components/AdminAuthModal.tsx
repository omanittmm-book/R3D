import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { StoreTheme } from '../types';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  theme: StoreTheme;
}

export default function AdminAuthModal({
  isOpen,
  onClose,
  onSuccess,
  theme,
}: AdminAuthModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('يرجى إدخال رمز الدخول');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Save session in localStorage so admin doesn't re-enter on every click
        if (typeof window !== 'undefined') {
          localStorage.setItem('r3d_admin_authenticated', 'true');
          localStorage.setItem('r3d_admin_auth_time', Date.now().toString());
        }
        setPin('');
        setError('');
        onSuccess();
      } else {
        setError(data.error || 'رمز الدخول غير صحيح! حاول مرة أخرى.');
      }
    } catch {
      setError('تعذر التحقق من الرمز، تأكد من الاتصال.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      id="admin-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Lock Icon */}
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl"
          style={{ backgroundColor: `${theme.primary}25`, border: `2px solid ${theme.primary}` }}
        >
          <Lock className="w-8 h-8 text-cyan-400" />
        </div>

        <h3 className="text-xl font-black text-white mb-1">منطقة لوحة تحكم الأدمن</h3>
        <p className="text-xs text-slate-400 mb-6">
          هذه الصفحة مخصصة لمدير السحب فقط للتحكم بالسحب وتدوير العجلة وإدارة المشاركين.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              أدخل رمز دخول الأدمن (PIN):
            </label>
            <div className="relative">
              <input
                type="password"
                autoFocus
                maxLength={12}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="أدخل الرمز هنا (الافتراضي 1234)"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
              <KeyRound className="absolute right-3.5 top-3.5 text-slate-500 w-5 h-5 pointer-events-none" />
            </div>
            {error && (
              <p className="mt-2 text-xs text-rose-400 font-bold flex items-center gap-1.5 justify-center">
                <ShieldAlert size={14} />
                <span>{error}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3.5 rounded-xl font-bold text-slate-950 text-sm shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: theme.primary }}
          >
            {isVerifying ? (
              <span>جاري التحقق...</span>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>دخول لوحة التحكم</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-[11px] text-slate-500">
          رمز الأدمن الافتراضي: <span className="font-mono text-cyan-400 font-bold">1234</span> (يمكنك تغييره من ثيم وهوية المتجر)
        </p>
      </div>
    </div>
  );
}
