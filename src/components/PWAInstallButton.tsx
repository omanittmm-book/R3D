import React, { useState } from 'react';
import { MonitorDown, Smartphone, Laptop, CheckCircle2, X, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already opened as an installed desktop app, show a small verified badge
  if (isInstalled) {
    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
        <CheckCircle2 size={14} className="text-cyan-400" />
        <span>مثبت كتطبيق سطح مكتب</span>
      </div>
    );
  }

  const handleButtonClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        id="pwa-desktop-install-btn"
        onClick={handleButtonClick}
        type="button"
        title="تثبيت اختصار على سطح المكتب والجوال"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
      >
        <MonitorDown size={17} className="animate-bounce" />
        <span>تثبيت على سطح المكتب</span>
      </button>

      {/* Guide Modal for Desktop & Mobile Installation */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-cyan-500/40 p-6 sm:p-7 shadow-2xl text-right">
            {/* Close Button */}
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-5 left-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                <Laptop size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">إضافة اختصار للموقع على سطح المكتب</h3>
                <p className="text-xs text-cyan-300/80">تشغيل الموقع بنقرة واحدة كبرنامج مستقل بدون شريط المتصفح</p>
              </div>
            </div>

            {/* Steps Container */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              {/* Option 1: Chrome / Edge Desktop */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Laptop size={16} className="text-cyan-400" />
                    على الكمبيوتر (متصفح Chrome أو Edge):
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">سطح المكتب</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400 pr-1 leading-relaxed">
                  <li>
                    اضغط على أيقونة التثبيت <span className="font-mono text-cyan-300 font-bold">(🖥️ تثبيت / Install)</span> الموجودة في نهاية شريط العنوان بالأعلى بجانب النجمة.
                  </li>
                  <li>
                    أو اضغط على زر القائمة <span className="font-bold text-white">الثلاث نقاط (⋮)</span> بأعلى المتصفح.
                  </li>
                  <li>
                    اختر <span className="font-bold text-cyan-300">حفظ ومشاركة (Save and share)</span> ➔ ثم اضغط <span className="font-bold text-white">تثبيت الصفحة كتطبيق (Install page as app)</span> أو <span className="font-bold text-white">إنشاء اختصار (Create shortcut)</span>.
                  </li>
                  <li>
                    ستظهر لك أيقونة <strong className="text-cyan-300 font-bold">سحب R3D</strong> فوراً على سطح مكتبك مع اللوقو الفاخر!
                  </li>
                </ol>
              </div>

              {/* Option 2: Mobile / iPhone */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Smartphone size={16} className="text-emerald-400" />
                    على الجوال (iPhone أو Android):
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">الهاتف</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  اضغط على زر <strong className="text-white">المشاركة (Share)</strong> ثم اختر <strong className="text-emerald-400">«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)</strong> ليصبح تطبيقاً كاملاً على شاشة جوالك.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {isInstallable && (
                <button
                  type="button"
                  onClick={() => {
                    install();
                    setShowGuideModal(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm transition-colors text-center shadow-lg shadow-cyan-500/20"
                >
                  تثبيت الآن مباشرة 🚀
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors text-center"
              >
                فهمت ذلك، إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
