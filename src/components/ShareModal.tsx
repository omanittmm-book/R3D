import React, { useState } from 'react';
import QRCodeDisplay from './QRCodeDisplay';
import { StoreSettings, StoreTheme } from '../types';
import { Copy, Check, Share2, X, MessageCircle, Send, ExternalLink, QrCode } from 'lucide-react';

interface ShareModalProps {
  settings: StoreSettings;
  theme: StoreTheme;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ settings, theme, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(true);

  if (!isOpen) return null;

  // Build registration link URL - always ensure ais-pre public URL is used so members on iOS/Android never encounter developer login gates
  let origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }
  const shareUrl = `${origin}?tab=register`;

  const shareText = `🎁 شارك الآن في سحب ${settings.storeName} على جوائز قيمة عبر عجلة الحظ! سجل اسمك ورقم هاتفك هنا:\n${shareUrl}`;

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        fallbackCopy();
      });
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
        `🎁 شارك في سحب ${settings.storeName} وعجلة الحظ!`
      )}`,
      '_blank'
    );
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      '_blank'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
          <Share2 size={26} />
        </div>

        <h3 className="text-xl font-black text-white mb-1">مشاركة رابط السحب مع المشاركين</h3>
        <p className="text-xs text-slate-400 mb-6">
          أرسل هذا الرابط للجمهور أو انشره لكي يسجلوا أسماءهم وأرقام هواتفهم ويدخلوا عجلة الحظ
        </p>

        {/* QR Code Tab / Preview */}
        {showQR && (
          <div className="flex flex-col items-center justify-center mb-6">
            <QRCodeDisplay url={shareUrl} size={180} />
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              امسح الرمز بكاميرا الجوال للانتقال لصفحة التسجيل مباشرة
            </p>
          </div>
        )}

        {/* Link Copy Box */}
        <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex items-center gap-2 mb-4">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-xs text-slate-300 font-mono px-2 focus:outline-none select-all dir-ltr text-left"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
            style={{ backgroundColor: theme.primary }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
          </button>
        </div>

        {/* Social Share Shortcuts */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <MessageCircle size={15} />
            <span>واتساب</span>
          </button>

          <button
            type="button"
            onClick={handleTelegram}
            className="py-2.5 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Send size={15} />
            <span>تيليجرام</span>
          </button>

          <button
            type="button"
            onClick={handleTwitter}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink size={15} />
            <span>منصة X</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowQR(!showQR)}
          className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center justify-center gap-1 mx-auto"
        >
          <QrCode size={14} />
          <span>{showQR ? 'إخفاء رمز QR' : 'إظهار رمز QR للطباعة أو العرض'}</span>
        </button>
      </div>
    </div>
  );
}
