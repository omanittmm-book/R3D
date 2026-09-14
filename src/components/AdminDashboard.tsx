import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CurrentPrize, Participant, StoreTheme, WheelState } from '../types';
import {
  getParticipantsFromSupabase,
  addManualParticipantToSupabase,
  deleteParticipantFromSupabase,
  clearParticipantsFromSupabase,
  seedSampleParticipantsToSupabase,
  resetWinnersInSupabase,
  spinWheelInSupabase,
  resetWheelInSupabase,
  updateCurrentPrizeInSupabase,
  toggleRegistrationInSupabase,
  verifyAdminPin,
} from '../lib/supabase';
import {
  Lock,
  Unlock,
  Trophy,
  Play,
  RotateCcw,
  Users,
  Download,
  Printer,
  Trash2,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  LogOut,
  Search,
  Award,
  Phone,
  Calendar,
  ShieldAlert,
  UserCheck,
  Database,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminDashboardProps {
  theme: StoreTheme;
  currentPrize: CurrentPrize;
  wheelState: WheelState;
  isRegistrationOpen?: boolean;
  onRegistrationStatusChanged?: (isOpen: boolean) => void;
  onPrizeUpdated: (prize: CurrentPrize) => void;
  onGoToSpectator: () => void;
}

const ADMIN_REQUIRED_PASS = 'Alrneem9@1';

export default function AdminDashboard({
  theme,
  currentPrize,
  wheelState,
  isRegistrationOpen = true,
  onRegistrationStatusChanged,
  onPrizeUpdated,
  onGoToSpectator,
}: AdminDashboardProps) {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Registration Open/Close State
  const [isRegOpen, setIsRegOpen] = useState(isRegistrationOpen);
  const [isTogglingReg, setIsTogglingReg] = useState(false);
  const [regToast, setRegToast] = useState('');

  // Sync isRegOpen when prop changes
  useEffect(() => {
    setIsRegOpen(isRegistrationOpen);
  }, [isRegistrationOpen]);

  // Prize Edit state
  const [prizeTitle, setPrizeTitle] = useState(currentPrize.title || '');
  const [prizeDetails, setPrizeDetails] = useState(currentPrize.details || '');
  const [isSavingPrize, setIsSavingPrize] = useState(false);
  const [prizeSavedToast, setPrizeSavedToast] = useState(false);

  // Refs to prevent periodic polling from wiping out user input while typing
  const hasUserEditedPrizeRef = useRef(false);
  const isInputFocusedRef = useRef(false);
  const lastKnownServerPrizeRef = useRef({
    title: currentPrize?.title || '',
    details: currentPrize?.details || '',
  });

  // Participants Data
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinWinner, setSpinWinner] = useState<Participant | null>(null);
  const [adminSpinCountdown, setAdminSpinCountdown] = useState<number | null>(null);

  // Manual Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualError, setManualError] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);

  // Check saved session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPass = sessionStorage.getItem('admin_giveaway_pass');
      if (savedPass === ADMIN_REQUIRED_PASS) {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Fetch Full Participants List for Admin directly from Supabase
  const fetchAdminParticipants = useCallback(async () => {
    setIsLoadingParticipants(true);
    try {
      const list = await getParticipantsFromSupabase();
      setParticipants(list);
    } catch (err) {
      console.error('Error fetching admin participants from Supabase:', err);
    } finally {
      setIsLoadingParticipants(false);
    }
  }, []);

  // Load participants when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminParticipants();
    }
  }, [isAuthenticated, fetchAdminParticipants]);

  // Update local prize form if server changes, but NEVER wipe user's active typing
  useEffect(() => {
    const sTitle = currentPrize?.title || '';
    const sDetails = currentPrize?.details || '';

    // If server values match what we already know, do nothing
    if (sTitle === lastKnownServerPrizeRef.current.title && sDetails === lastKnownServerPrizeRef.current.details) {
      return;
    }

    lastKnownServerPrizeRef.current = { title: sTitle, details: sDetails };

    // Do NOT wipe user input if the user has edited or is currently focused on an input
    if (hasUserEditedPrizeRef.current || isInputFocusedRef.current) {
      return;
    }

    setPrizeTitle(sTitle);
    setPrizeDetails(sDetails);
  }, [currentPrize?.title, currentPrize?.details]);

  // Handle Login directly via Supabase / PIN validation
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      const isValid = await verifyAdminPin(passwordInput.trim());

      if (isValid) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_giveaway_pass', ADMIN_REQUIRED_PASS);
        setPasswordInput('');
      } else {
        setAuthError('كلمة المرور غير صحيحة! تأكد من إدخالها بدقة.');
      }
    } catch {
      setAuthError('تعذر التحقق من الرمز. يرجى المحاولة ثانية.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_giveaway_pass');
  };

  // Save Prize directly to Supabase
  const handleSavePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prizeTitle.trim()) return;

    setIsSavingPrize(true);
    try {
      const result = await updateCurrentPrizeInSupabase(prizeTitle.trim(), prizeDetails.trim());

      hasUserEditedPrizeRef.current = false;
      lastKnownServerPrizeRef.current = {
        title: result.currentPrize.title,
        details: result.currentPrize.details,
      };
      onPrizeUpdated(result.currentPrize);
      setPrizeSavedToast(true);
      setTimeout(() => setPrizeSavedToast(false), 3500);
    } catch {
      alert('فشل حفظ بيانات الجائزة في Supabase. يرجى المحاولة مجدداً.');
    } finally {
      setIsSavingPrize(false);
    }
  };

  // Toggle Registration Status directly in Supabase (Close / Open)
  const handleToggleRegistration = async () => {
    setIsTogglingReg(true);
    try {
      const nextState = !isRegOpen;
      const ok = await toggleRegistrationInSupabase(nextState);

      if (ok) {
        setIsRegOpen(nextState);
        if (onRegistrationStatusChanged) {
          onRegistrationStatusChanged(nextState);
        }
        setRegToast(
          nextState
            ? 'تم فتح باب التسجيل بنجاح'
            : 'تم إغلاق باب التسجيل والاكتفاء بالعدد الحالي'
        );
        setTimeout(() => setRegToast(''), 4500);
      } else {
        alert('فشل تغيير حالة التسجيل في Supabase');
      }
    } catch {
      alert('حدث خطأ أثناء تحديث حالة التسجيل في قاعدة البيانات.');
    } finally {
      setIsTogglingReg(false);
    }
  };

  // Spin Wheel & Pick Winner directly in Supabase (30 seconds duration)
  const handleSpinWheel = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinWinner(null);
    setAdminSpinCountdown(30);

    try {
      const result = await spinWheelInSupabase(prizeTitle.trim() || currentPrize.title);

      if (!result.success || !result.winner) {
        alert(result.error || 'تعذر إجراء السحب. تأكد من وجود مشاركين مسجلين.');
        setIsSpinning(false);
        setAdminSpinCountdown(null);
        return;
      }

      // 30 seconds interval countdown
      let remainingSec = 30;
      const countdownInterval = setInterval(() => {
        remainingSec -= 1;
        if (remainingSec <= 0) {
          clearInterval(countdownInterval);
          setAdminSpinCountdown(null);
        } else {
          setAdminSpinCountdown(remainingSec);
        }
      }, 1000);

      // Complete 30 seconds spin duration
      setTimeout(() => {
        clearInterval(countdownInterval);
        setAdminSpinCountdown(null);
        setIsSpinning(false);
        setSpinWinner(result.winner!);
        confetti({
          particleCount: 120,
          spread: 85,
          origin: { y: 0.6 },
          colors: [theme.primary, theme.secondary, '#F59E0B', '#10B981'],
        });
        fetchAdminParticipants();
      }, 30000);
    } catch {
      setIsSpinning(false);
      setAdminSpinCountdown(null);
      alert('حدث خطأ أثناء الاتصال بقاعدة البيانات لإجراء السحب.');
    }
  };

  // Reset Wheel Draw directly in Supabase
  const handleResetWheel = async () => {
    if (!confirm('هل أنت متأكد من إعادة تعيين السحب الحالي؟ سيتم إلغاء شاشة الفائز والاستعداد لسحب جديد.')) {
      return;
    }

    try {
      const ok = await resetWheelInSupabase();
      if (ok) {
        setSpinWinner(null);
        alert('تمت إعادة تعيين السحب بنجاح!');
      }
    } catch {
      alert('فشل إعادة تعيين السحب.');
    }
  };

  // Reset all winners to eligible directly in Supabase
  const handleResetWinners = async () => {
    if (!confirm('هل تريد إعادة تعيين حالة جميع الفائزين ليصبح الجميع مؤهلاً للسحب مرة أخرى؟')) {
      return;
    }

    try {
      const ok = await resetWinnersInSupabase();
      if (ok) {
        fetchAdminParticipants();
        alert('تمت إعادة تأهيل جميع المشاركين للسحب!');
      }
    } catch {
      alert('فشل إعادة تعيين الفائزين.');
    }
  };

  // Clear all participants directly in Supabase
  const handleClearParticipants = async () => {
    if (!confirm('⚠️ تحذير: هل أنت متأكد تماماً من تفريغ وحذف جميع المشاركين من السحب؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    try {
      const ok = await clearParticipantsFromSupabase('all');
      if (ok) {
        setParticipants([]);
        setSpinWinner(null);
        alert('تم تفريغ قائمة المشاركين بالكامل.');
      }
    } catch {
      alert('فشل تفريغ القائمة.');
    }
  };

  // Delete single participant directly in Supabase
  const handleDeleteParticipant = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف المشارك "${name}" من السحب؟`)) {
      return;
    }

    try {
      const ok = await deleteParticipantFromSupabase(id);
      if (ok) {
        setParticipants((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      alert('فشل حذف المشارك.');
    }
  };

  // Add Participant Manually directly into Supabase
  const handleAddManualParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');

    const trimmedName = manualName.trim();
    const cleanDigits = manualPhone.replace(/\D/g, '');

    if (!trimmedName || trimmedName.length < 3) {
      setManualError('يرجى كتابة الاسم والقبيلة بالكامل.');
      return;
    }

    if (cleanDigits.length !== 8) {
      setManualError('رقم الهاتف يجب أن يتكون من 8 أرقام فقط.');
      return;
    }

    setIsAddingManual(true);
    try {
      const res = await addManualParticipantToSupabase(trimmedName, cleanDigits);

      if (!res.success) {
        setManualError(res.error || 'فشل في إضافة المشارك.');
        return;
      }

      setManualName('');
      setManualPhone('');
      setShowAddModal(false);
      fetchAdminParticipants();
    } catch {
      setManualError('تعذر الاتصال بقاعدة البيانات.');
    } finally {
      setIsAddingManual(false);
    }
  };

  // Seed Realistic Sample Participants directly to Supabase
  const handleSeedSample = async () => {
    try {
      const res = await seedSampleParticipantsToSupabase();
      if (res.success) {
        fetchAdminParticipants();
        alert('تمت إضافة مشاركين تجريبيين بنجاح مع أرقام هواتف من 8 أرقام!');
      }
    } catch {
      alert('فشل إضافة المشاركين التجريبيين.');
    }
  };

  // Export to Excel / CSV with UTF-8 BOM for perfect Arabic display
  const handleExportCSV = () => {
    if (participants.length === 0) {
      alert('لا يوجد مشاركون لتصديرهم حالياً.');
      return;
    }

    const headers = ['#', 'الاسم والقبيلة', 'رقم الهاتف (8 أرقام)', 'وقت التسجيل', 'حالة الفوز', 'الجائزة'];
    const rows = participants.map((p, index) => [
      p.ticketNumber || index + 1,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.phone}"`,
      `"${new Date(p.registeredAt).toLocaleString('ar-OM')}"`,
      p.hasWon ? 'فاز بالقرعة' : 'مؤهل',
      `"${(p.prizeWon || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `كشف_المشاركين_في_السحب_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Friendly
  const handlePrint = () => {
    window.print();
  };

  // Filtered participants list for search
  const filteredParticipants = participants.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      p.ticketNumber.toString().includes(term)
    );
  });

  // --- RENDER LOGIN SCREEN IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 animate-in fade-in duration-300" dir="rtl">
        <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 shadow-lg">
            <Lock size={32} />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
            لوحة تحكم المسؤول (Admin)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6">
            منطقة محمية مخصصة لإدارة السحب، يرجى إدخال كلمة المرور للمتابعة
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (authError) setAuthError('');
                }}
                placeholder="أدخل كلمة مرور المسؤول..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3.5 text-center text-base font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthLoading || !passwordInput}
              className="w-full py-3.5 rounded-2xl font-black text-slate-950 text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
              style={{ backgroundColor: '#F59E0B' }}
            >
              {isAuthLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
              ) : (
                <>
                  <Unlock size={18} />
                  <span>دخول لوحة التحكم</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onGoToSpectator}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Eye size={14} />
              <span>العودة لشاشة الجمهور والمشاهدين</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER FULL ADMIN DASHBOARD ---
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300" dir="rtl">
      {/* Admin Top Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
            <Unlock size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">لوحة تحكم المسؤول</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ADMIN ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة الجوائز، تدوير العجلة، واستعراض بيانات المشاركين الكاملة بأرقام الهواتف
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGoToSpectator}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <Eye size={16} />
            <span>معاينة شاشة المشاهدين</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <LogOut size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* SECTION: REGISTRATION CONTROL (إغلاق / فتح باب التسجيل) */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border-2 shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isRegOpen
            ? 'bg-slate-900 border-slate-800'
            : 'bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border-rose-500/70 shadow-rose-950/30'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border transition-all ${
                isRegOpen
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-rose-500/25 text-rose-400 border-rose-500/50 animate-pulse'
              }`}
            >
              {isRegOpen ? <UserCheck size={28} /> : <Lock size={28} />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  حالة استقبال وتسجيل المشاركين
                </h2>
                <span
                  className={`text-xs font-black px-3 py-0.5 rounded-full border ${
                    isRegOpen
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {isRegOpen ? '🟢 التسجيل مفتوح للجميع' : '🔴 التسجيل مغلق (مكتفى بالعدد الحالي)'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isRegOpen
                  ? `باب التسجيل مفتوح عبر الرابط. العدد المسجل حتى الآن: ${participants.length} مشارك.`
                  : `تم إغلاق باب التسجيل ولن يتمكن أي شخص جديد من الدخول. سيتم السحب بين المشاركين الحاليين فقط وعددهم (${participants.length} مشارك).`}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleToggleRegistration}
              disabled={isTogglingReg}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 cursor-pointer transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                isRegOpen
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
              }`}
            >
              {isTogglingReg ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>جاري المعالجة...</span>
                </div>
              ) : isRegOpen ? (
                <>
                  <Lock size={18} />
                  <span>إغلاق باب التسجيل والاكتفاء بالعدد الحالي</span>
                </>
              ) : (
                <>
                  <Unlock size={18} />
                  <span>إعادة فتح باب التسجيل للمشاركين</span>
                </>
              )}
            </button>
          </div>
        </div>

        {regToast && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{regToast}</span>
          </div>
        )}
      </div>

      {/* SECTION 1: PRIZE MANAGEMENT (إدارة الجائزة) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">إدارة الجائزة الحالية (Current Prize)</h2>
              <p className="text-xs text-slate-400">
                عدّل اسم الجائزة ومواصفاتها، واحفظها لتظهر فوراً على شاشة جميع المشاهدين
              </p>
            </div>
          </div>

          {prizeSavedToast && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-in fade-in">
              <CheckCircle2 size={16} />
              <span>تم حفظ وتحديث الجائزة لجميع المشاهدين!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSavePrize} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              اسم الجائزة الحالية <span className="text-rose-400">*</span>:
            </label>
            <input
              type="text"
              required
              value={prizeTitle}
              onFocus={() => {
                isInputFocusedRef.current = true;
              }}
              onBlur={() => {
                isInputFocusedRef.current = false;
              }}
              onChange={(e) => {
                hasUserEditedPrizeRef.current = true;
                setPrizeTitle(e.target.value);
              }}
              placeholder="مثال: آيفون 16 برو ماكس، سيارة لكزس، تذكرة سفر..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3.5 text-base font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300">
                تفاصيل ومواصفات وشروط الجائزة (مساحة متعددة الأسطر):
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-slate-800 text-amber-300 border border-slate-700">
                  {prizeDetails ? `${prizeDetails.split('\n').length} أسطر` : '0 أسطر'}
                </span>
                <span className="text-[11px] text-slate-400">
                  (اضغط Enter لإضافة سطر جديد)
                </span>
              </div>
            </div>

            <textarea
              rows={6}
              value={prizeDetails}
              onFocus={() => {
                isInputFocusedRef.current = true;
              }}
              onBlur={() => {
                isInputFocusedRef.current = false;
              }}
              onChange={(e) => {
                hasUserEditedPrizeRef.current = true;
                setPrizeDetails(e.target.value);
              }}
              placeholder={`أدخل كافة تفاصيل ومواصفات الجائزة هنا (يمكنك كتابة أسطر متعددة وقوائم نقطية)...
مثال:
• الموديل: iPhone 16 Pro Max
• السعة: 256 جيجابايت
• اللون: Desert Titanium (تيتانيوم صحراوي)
• الضمان: ضمان محلي معتمد لمدة سنتين`}
              className="w-full min-h-[150px] bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-2xl p-4 text-sm leading-relaxed text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-sans resize-y"
            />
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
              <span>ستظهر هذه الأسطر والمواصفات مرتبة كما هي تماماً للمشاهدين وفي نموذج التسجيل.</span>
              <span className="text-slate-500">يمكنك سحب طرف المربع لتكبير المساحة للأسفل</span>
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSavingPrize || !prizeTitle.trim()}
              className="px-7 py-3.5 rounded-2xl font-black text-slate-950 text-sm shadow-xl flex items-center gap-2.5 cursor-pointer hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              style={{ backgroundColor: '#F59E0B' }}
            >
              {isSavingPrize ? (
                <span>جاري الحفظ...</span>
              ) : (
                <>
                  <span>حفظ وتحديث الجائزة والمواصفات لجميع المشاهدين 💾</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: WHEEL DRAW MANAGEMENT (إدارة وسحب العجلة) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-cyan-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Play size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">إدارة وسحب عجلة الحظ (Wheel Draw)</h2>
              <p className="text-xs text-slate-400">
                تحكم بالسحب المباشر: تدوير العجلة، اختيار الفائز العشوائي، وإعادة التعيين
              </p>
            </div>
          </div>

          {/* Draw Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetWheel}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw size={15} />
              <span>إعادة تعيين السحب (Reset)</span>
            </button>

            <button
              type="button"
              onClick={handleResetWinners}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Sparkles size={15} />
              <span>تأهيل الفائزين مجدداً</span>
            </button>
          </div>
        </div>

        {/* Main Spin Banner & Trigger Button */}
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
          <div className="max-w-md">
            <span className="text-xs font-bold text-slate-400 block mb-1">الجائزة المستهدفة لهذا السحب:</span>
            <div className="text-lg font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-2 inline-block">
              🏆 {prizeTitle?.trim() || currentPrize.title?.trim() || 'لم يتم تحديد جائزة بعد (أدخل اسم الجائزة أعلاه)'}
            </div>
          </div>

          {/* Big Trigger Button */}
          <button
            type="button"
            onClick={handleSpinWheel}
            disabled={isSpinning || participants.length === 0}
            className={`px-10 py-5 rounded-3xl text-lg sm:text-xl font-black text-slate-950 shadow-2xl flex items-center gap-3 transition-all duration-300 cursor-pointer ${
              isSpinning
                ? 'opacity-80 scale-95 cursor-wait'
                : 'hover:scale-105 active:scale-95 hover:brightness-110'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            style={{
              backgroundColor: '#06B6D4',
              boxShadow: '0 0 35px rgba(6, 182, 212, 0.4)',
            }}
          >
            <Play className={`w-7 h-7 fill-slate-950 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? `جاري تدوير العجلة الآن... (بقي ${adminSpinCountdown ?? 30} ثانية)` : '🎡 بدء تدوير العجلة واختيار فائز عشوائي!'}</span>
            <Sparkles className="w-6 h-6 animate-pulse" />
          </button>

          <p className="text-xs font-semibold text-slate-400">
            ⏱️ مدة الدوران: 30 ثانية لزيادة الحماس والتشويق للمشاهدين قبل كشف الفائز
          </p>

          {participants.length === 0 && (
            <p className="text-xs font-bold text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
              ⚠️ لا يوجد مشاركون مسجلون حتى الآن — ستبدأ العجلة بالعمل فور تسجيل أول مشارك عبر صفحة التسجيل.
            </p>
          )}

          {/* Winner Announcement Card in Admin */}
          {spinWinner && (
            <div className="w-full max-w-lg mt-4 p-6 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-2 border-emerald-500 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-2">
                <Award size={28} />
              </div>

              <span className="text-xs font-black text-emerald-400">الفائز المسحوب حالياً 🏆</span>
              <h3 className="text-2xl font-black text-white mt-1">{spinWinner.name}</h3>

              <div className="mt-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-around text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">رقم الهاتف:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">{spinWinner.phone}</span>
                </div>
                <div className="w-[1px] h-6 bg-slate-800" />
                <div>
                  <span className="text-slate-400 block text-[10px]">رقم التذكرة:</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">#{spinWinner.ticketNumber}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: PARTICIPANTS TABLE (قائمة المشاركين - للمسؤول فقط) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        {/* Table Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">قائمة المشاركين المسجلين</h2>
                {/* Live Participants Counter */}
                <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {participants.length} مشارك
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                جدول سري مخصص للمسؤول فقط يعرض الأسماء والقبائل وأرقام الهواتف المكونة من 8 أرقام ووقت التسجيل
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <PlusCircle size={15} />
              <span>إضافة مشارك يدوياً</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Download size={15} className="text-amber-400" />
              <span>تصدير Excel / CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Printer size={15} className="text-slate-400" />
              <span>طباعة</span>
            </button>

            <button
              type="button"
              onClick={handleClearParticipants}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 size={14} />
              <span>تفريغ القائمة</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، رقم الهاتف (8 أرقام)، أو رقم التذكرة..."
            className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-2xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
          />
          <Search className="absolute right-3.5 top-3 text-slate-500 w-4 h-4 pointer-events-none" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4"># التذكرة</th>
                <th className="py-3.5 px-4">الاسم والقبيلة</th>
                <th className="py-3.5 px-4">رقم الهاتف (8 أرقام)</th>
                <th className="py-3.5 px-4">وقت التسجيل</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 font-medium">
                    {searchTerm ? 'لا توجد نتائج تطابق بحثك' : 'لا يوجد مشاركون مسجلون في السحب حتى الآن — بانتظار تسجيل المشاركين عبر صفحة التسجيل'}
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      #{p.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white text-sm">
                      {p.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300 tracking-wider">
                      {p.phone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {new Date(p.registeredAt).toLocaleString('ar-OM', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.hasWon ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[11px]">
                          🏆 فائز ({p.prizeWon || 'الجائزة'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px]">
                          مؤهل للسحب
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteParticipant(p.id, p.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="حذف المشارك"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD PARTICIPANT MANUALLY */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-white mb-1">إضافة مشارك يدوياً</h3>
            <p className="text-xs text-slate-400 mb-5">
              أدخل الاسم والقبيلة ورقم الهاتف المكون من 8 أرقام لإدراجه في قائمة السحب
            </p>

            <form onSubmit={handleAddManualParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الاسم والقبيلة:
                </label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="مثال: سعيد بن راشد الحجري"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    رقم الهاتف (8 أرقام فقط):
                  </label>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {manualPhone.replace(/\D/g, '').length} / 8
                  </span>
                </div>
                <input
                  type="tel"
                  maxLength={8}
                  required
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="9xxxxxxx أو 7xxxxxxx"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {manualError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                  {manualError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAddingManual}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-cyan-400 hover:brightness-110 cursor-pointer shadow-lg"
                >
                  {isAddingManual ? 'جاري الإضافة...' : 'إضافة إلى السحب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
