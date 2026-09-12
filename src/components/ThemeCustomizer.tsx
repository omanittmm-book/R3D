import React, { useState, useRef } from 'react';
import { StoreSettings, StoreTheme, Prize } from '../types';
import { THEME_PRESETS, PRESET_LOGOS } from '../themes';
import LogoDisplay from './LogoDisplay';
import {
  Palette,
  Upload,
  Link as LinkIcon,
  Check,
  Save,
  Plus,
  Trash2,
  Gift,
  Sliders,
  Shield,
  Store,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

interface ThemeCustomizerProps {
  settings: StoreSettings;
  currentTheme: StoreTheme;
  onSaveSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
}

export default function ThemeCustomizer({
  settings,
  currentTheme,
  onSaveSettings,
}: ThemeCustomizerProps) {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [prizes, setPrizes] = useState<Prize[]>([...settings.prizes]);
  const [newPrizeTitle, setNewPrizeTitle] = useState('');
  const [newPrizeQuantity, setNewPrizeQuantity] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Logo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)');
      return;
    }

    // Compress image using client-side canvas before saving
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/webp', 0.85);
          setFormData((prev) => ({
            ...prev,
            logoType: 'upload',
            logoUrl: compressed,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            logoType: 'upload',
            logoUrl: rawDataUrl,
          }));
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Add a new prize
  const handleAddPrize = () => {
    if (!newPrizeTitle.trim()) return;
    const newPrize: Prize = {
      id: `prize-${Date.now()}`,
      title: newPrizeTitle.trim(),
      quantity: Math.max(1, Number(newPrizeQuantity) || 1),
      icon: 'Gift',
      color: formData.themeId === 'gold' ? '#EAB308' : '#3B82F6',
    };
    setPrizes([...prizes, newPrize]);
    setNewPrizeTitle('');
    setNewPrizeQuantity(1);
  };

  // Remove a prize
  const handleRemovePrize = (id: string) => {
    setPrizes(prizes.filter((p) => p.id !== id));
  };

  // Submit all settings
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveSettings({
        ...formData,
        prizes,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" id="theme-customizer-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: currentTheme.primary }}
          >
            <Palette size={24} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">تخصيص ثيم وهوية المتجر</h2>
            <p className="text-xs text-slate-400">
              قم بضبط ألوان الثيم، رفع شعارك الخاص، وإدارة الجوائز وشروط السحب
            </p>
          </div>
        </div>

        <button
          id="save-settings-btn"
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 rounded-xl font-bold text-white shadow-xl flex items-center gap-2 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: currentTheme.primary }}
        >
          {saveSuccess ? <Check size={18} /> : <Save size={18} />}
          <span>{isSaving ? 'جاري الحفظ...' : saveSuccess ? 'تم الحفظ بنجاح!' : 'حفظ التغييرات'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Logo & Store Visual Identity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Store className="text-amber-400" size={20} />
            <h3 className="text-base font-bold text-white">شعار المتجر (Logo)</h3>
          </div>

          {/* Current Logo Preview */}
          <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <LogoDisplay
              logoUrl={formData.logoUrl}
              logoType={formData.logoType}
              logoPreset={formData.logoPreset}
              size="lg"
            />
            <div>
              <p className="text-xs text-slate-400 mb-1">المعاينة الحالية للشعار</p>
              <p className="text-sm font-bold text-white">{formData.storeName || 'متجرك'}</p>
              <p className="text-xs text-slate-400">{formData.storeTagline}</p>
            </div>
          </div>

          {/* Logo Source Selection Tabs */}
          <div>
            <p className="text-xs font-bold text-slate-300 mb-2">طريقة اختيار الشعار:</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, logoType: 'upload' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  formData.logoType === 'upload'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Upload size={14} />
                <span>رفع من الجهاز</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, logoType: 'url' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  formData.logoType === 'url'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <LinkIcon size={14} />
                <span>رابط مباشر</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, logoType: 'preset' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  formData.logoType === 'preset'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles size={14} />
                <span>أيقونات جاهزة</span>
              </button>
            </div>

            {/* Mode 1: Upload File */}
            {formData.logoType === 'upload' && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-800/40 hover:bg-slate-800/70 text-slate-300 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload size={24} className="text-amber-400" />
                  <span className="text-xs font-bold">اضغط هنا لاختيار صورة الشعار من جهازك</span>
                  <span className="text-[10px] text-slate-400">يدعم PNG, JPG, WebP, SVG</span>
                </button>
              </div>
            )}

            {/* Mode 2: Direct Image URL */}
            {formData.logoType === 'url' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">رابط صورة الشعار (URL):</label>
                <input
                  type="url"
                  placeholder="https://example.com/store-logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  dir="ltr"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Mode 3: Presets */}
            {formData.logoType === 'preset' && (
              <div>
                <label className="block text-xs text-slate-400 mb-2">اختر أيقونة مناسبة لنشاط متجرك:</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {PRESET_LOGOS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, logoPreset: preset.id })}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        formData.logoPreset === preset.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xl mb-1">{preset.emoji}</div>
                      <div className="text-[11px] font-medium">{preset.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Store Name & Tagline Inputs */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">اسم المتجر:</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">وصف المتجر القصير:</label>
              <input
                type="text"
                value={formData.storeTagline}
                onChange={(e) => setFormData({ ...formData, storeTagline: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Theme Colors & Presets */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Palette className="text-amber-400" size={20} />
            <h3 className="text-base font-bold text-white">ثيم وألوان المتجر</h3>
          </div>

          {/* Theme Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2.5">
              اختر ثيم ألوان جاهز للمتجر:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {THEME_PRESETS.map((preset) => {
                const isSelected = formData.themeId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, themeId: preset.id })}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-white ring-2 ring-amber-400/80 shadow-lg'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    }`}
                    style={{
                      background: isSelected ? `${preset.bgDark}` : '#0B1120',
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: preset.secondary }}
                      />
                    </div>
                    <p className="text-xs font-bold text-white">{preset.name.split(' ')[0]}</p>
                    <span className="text-[10px] text-slate-400">
                      {preset.id === 'gold' ? 'ملكي فخم' : preset.id === 'emerald' ? 'زمردي' : 'عصري'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Giveaway Title & Description */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">عنوان السحب (العريض):</label>
              <input
                type="text"
                value={formData.giveawayTitle}
                onChange={(e) => setFormData({ ...formData, giveawayTitle: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">تفاصيل وشروط السحب:</label>
              <textarea
                rows={3}
                value={formData.giveawayDescription}
                onChange={(e) => setFormData({ ...formData, giveawayDescription: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Prize Management */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Gift className="text-amber-400" size={20} />
              <h3 className="text-base font-bold text-white">إدارة جوائز السحب</h3>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg">
              {prizes.length} جوائز
            </span>
          </div>

          {/* Current Prizes List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {prizes.map((prize, idx) => (
              <div
                key={prize.id}
                className="flex items-center justify-between bg-slate-800/80 border border-slate-700/80 rounded-xl p-3"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🎁</span>
                  <div>
                    <p className="text-xs font-bold text-white">{prize.title}</p>
                    <p className="text-[10px] text-slate-400">الكمية المتاحة: {prize.quantity}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePrize(prize.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="حذف الجائزة"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Prize Form */}
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-3">
            <p className="text-xs font-bold text-slate-300">إضافة جائزة جديدة:</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="اسم الجائزة (مثلاً: قسيمة 200 ريال)"
                value={newPrizeTitle}
                onChange={(e) => setNewPrizeTitle(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                min="1"
                max="50"
                value={newPrizeQuantity}
                onChange={(e) => setNewPrizeQuantity(Number(e.target.value))}
                className="w-16 bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white text-center focus:outline-none focus:border-amber-500"
                title="الكمية"
              />
              <button
                type="button"
                onClick={handleAddPrize}
                disabled={!newPrizeTitle.trim()}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus size={14} />
                <span>إضافة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Draw & Security Rules */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Sliders className="text-amber-400" size={20} />
            <h3 className="text-base font-bold text-white">إعدادات وضوابط السحب</h3>
          </div>

          <div className="space-y-4">
            {/* Toggle Registration Open */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div>
                <p className="text-xs font-bold text-white">فتح باب التسجيل للمشاركين</p>
                <p className="text-[11px] text-slate-400">
                  عند الإغلاق لن يتمكن أي شخص من إرسال بياناته عبر الرابط
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRegistrationOpen}
                  onChange={(e) => setFormData({ ...formData, isRegistrationOpen: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Toggle Allow Duplicate Phones */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div>
                <p className="text-xs font-bold text-white">منع التكرار (رقم هاتف واحد لكل مشارك)</p>
                <p className="text-[11px] text-slate-400">
                  ضمان العدالة بمنع تسجيل نفس رقم الجوال أكثر من مرة
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!formData.allowDuplicates}
                  onChange={(e) => setFormData({ ...formData, allowDuplicates: !e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Toggle Mask Phone Numbers */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div>
                <p className="text-xs font-bold text-white">إخفاء أرقام الهواتف على الشاشة العامة</p>
                <p className="text-[11px] text-slate-400">
                  حماية خصوصية العملاء بعرض الرقم مشفراً جزئياً (05****1234)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.maskPhoneNumbers}
                  onChange={(e) => setFormData({ ...formData, maskPhoneNumbers: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
