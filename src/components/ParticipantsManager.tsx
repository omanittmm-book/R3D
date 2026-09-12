import React, { useState } from 'react';
import { Participant, StoreTheme } from '../types';
import {
  Users,
  Search,
  Download,
  Trash2,
  RotateCcw,
  UserPlus,
  Award,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface ParticipantsManagerProps {
  participants: Participant[];
  theme: StoreTheme;
  maskPhone: boolean;
  onDeleteParticipant: (id: string) => Promise<void>;
  onClearParticipants: (type: 'all' | 'non-winners' | 'winners') => Promise<void>;
  onSeedSample: () => Promise<void>;
  onResetWinners: () => Promise<void>;
  onAddManual: (name: string, phone: string) => Promise<void>;
}

export default function ParticipantsManager({
  participants,
  theme,
  maskPhone,
  onDeleteParticipant,
  onClearParticipants,
  onSeedSample,
  onResetWinners,
  onAddManual,
}: ParticipantsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'winners' | 'eligible'>('all');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [overridePhoneMask, setOverridePhoneMask] = useState(false);

  // Filtered list
  const filtered = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.ticketNumber.toString().includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterType === 'winners') return p.hasWon;
    if (filterType === 'eligible') return !p.hasWon;
    return true;
  });

  const winnersCount = participants.filter((p) => p.hasWon).length;

  // Export to CSV
  const handleExportCSV = () => {
    if (participants.length === 0) return;

    const headers = ['رقم التذكرة', 'الاسم', 'رقم الجوال', 'تاريخ التسجيل', 'حالة الفوز', 'الجائزة'];
    const rows = participants.map((p) => [
      p.ticketNumber,
      `"${p.name}"`,
      `"${p.phone}"`,
      `"${new Date(p.registeredAt).toLocaleString('ar-SA')}"`,
      p.hasWon ? 'فائز' : 'مشارك',
      `"${p.prizeWon || ''}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `giveaway_participants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPhone.trim()) return;
    setIsSubmittingManual(true);
    try {
      await onAddManual(manualName.trim(), manualPhone.trim());
      setManualName('');
      setManualPhone('');
      setShowManualModal(false);
    } catch {
      alert('حدث خطأ أثناء إضافة المشارك');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6" id="participants-section">
      {/* Top Header & Stats */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 mb-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: theme.primary }}
          >
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">قائمة المشاركين والفائزين</h2>
            <p className="text-xs text-slate-400">
              إجمالي المشاركين: <span className="text-white font-bold">{participants.length}</span> | الفائزون:{' '}
              <span className="text-amber-400 font-bold">{winnersCount}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <UserPlus size={15} />
            <span>إضافة مشارك يدوياً</span>
          </button>

          <button
            type="button"
            onClick={onSeedSample}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles size={15} />
            <span>توليد أسماء تجريبية</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={participants.length === 0}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download size={15} />
            <span>تصدير Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، الجوال أو رقم التذكرة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filter Pills & Phone Mask Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterType === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              الكل ({participants.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('winners')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterType === 'winners' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              الفائزون ({winnersCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('eligible')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterType === 'eligible' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              بانتظار السحب ({participants.length - winnersCount})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOverridePhoneMask(!overridePhoneMask)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title={overridePhoneMask ? 'إخفاء الأرقام' : 'كشف أرقام الهواتف كاملة'}
          >
            {overridePhoneMask ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-slate-400 text-sm mb-2">لا توجد سجلات تطابق البحث أو الفلتر المحدد.</p>
            {participants.length === 0 && (
              <button
                type="button"
                onClick={onSeedSample}
                className="text-xs text-amber-400 hover:underline"
              >
                اضغط هنا لإضافة مشاركين تجريبيين للتجربة
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase">
                <tr>
                  <th className="py-3 px-4">التذكرة</th>
                  <th className="py-3 px-4">اسم المشارك</th>
                  <th className="py-3 px-4">رقم الجوال</th>
                  <th className="py-3 px-4">تاريخ التسجيل</th>
                  <th className="py-3 px-4">حالة السحب</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((participant) => {
                  const shouldMask = maskPhone && !overridePhoneMask;
                  const displayPhone = shouldMask
                    ? participant.phone.slice(0, 3) + '****' + participant.phone.slice(-3)
                    : participant.phone;

                  return (
                    <tr
                      key={participant.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        participant.hasWon ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        #{participant.ticketNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-white text-sm">{participant.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-300 dir-ltr text-right">
                        {displayPhone}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(participant.registeredAt).toLocaleDateString('ar-SA', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {participant.hasWon ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                            <Award size={12} />
                            <span>فائز: {participant.prizeWon || 'جائزة'}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                            <Clock size={11} />
                            <span>في قائمة السحب</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteParticipant(participant.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="حذف المشارك"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Actions */}
        {participants.length > 0 && (
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              يتم تحديث القائمة تلقائياً عند قيام أي شخص بالتسجيل عبر الرابط
            </span>
            <div className="flex items-center gap-2">
              {winnersCount > 0 && (
                <button
                  type="button"
                  onClick={onResetWinners}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>إعادة تعيين الفائزين للسحب مجدداً</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm('هل أنت متأكد من رغبتك في حذف جميع المشاركين من السحب؟')) {
                    onClearParticipants('all');
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                مسح القائمة بالكامل
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Add Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">إضافة مشارك جديد يدوياً</h3>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم المشارك:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: صالح العلي"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رقم الجوال:</label>
                <input
                  type="tel"
                  required
                  placeholder="مثال: 0551234567"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  dir="ltr"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white text-right focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: theme.primary }}
                >
                  <UserPlus size={16} />
                  <span>{isSubmittingManual ? 'جاري الإضافة...' : 'إضافة إلى السحب'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
