import React, { useState, useEffect, useCallback } from 'react';
import { StoreSettings, Participant, StoreTheme, PublicGiveawayState, CurrentPrize } from './types';
import { DEFAULT_STORE_SETTINGS, THEME_PRESETS } from './themes';
import { supabase, lookupParticipantFromCloud } from './lib/supabase';
import Header from './components/Header';
import RegistrationForm from './components/RegistrationForm';
import SpectatorScreen from './components/SpectatorScreen';
import AdminDashboard from './components/AdminDashboard';
import ShareModal from './components/ShareModal';

export default function App() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [publicState, setPublicState] = useState<PublicGiveawayState>({
    currentPrize: DEFAULT_STORE_SETTINGS.currentPrize,
    wheelState: DEFAULT_STORE_SETTINGS.wheelState,
    totalParticipants: 0,
    participantNames: [],
    isRegistrationOpen: true,
  });

  // Current View: 'register' | 'spectator' | 'admin'
  const [currentView, setCurrentView] = useState<'register' | 'spectator' | 'admin'>('register');
  const [registeredUser, setRegisteredUser] = useState<Participant | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Check URL pathname, search parameters, or Supabase cloud registration on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') || params.get('tab');
      const ticketParam = params.get('ticket');
      const phoneParam = params.get('phone');

      if (pathname === '/admin' || viewParam === 'admin') {
        setCurrentView('admin');
      } else if (viewParam === 'spectator' || viewParam === 'wheel') {
        setCurrentView('spectator');
      } else if (ticketParam || phoneParam) {
        // Direct cloud lookup from URL parameters
        lookupParticipantFromCloud(ticketParam || phoneParam || '').then((user) => {
          if (user) {
            setRegisteredUser(user);
            setCurrentView('spectator');
          }
        });
      } else {
        // Cloud-synced check: check stored user ticket in session
        const savedUser = sessionStorage.getItem('giveaway_registered_user') || localStorage.getItem('giveaway_registered_user');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed && (parsed.id || parsed.phone || parsed.ticketNumber)) {
              // Verify directly against Supabase cloud
              lookupParticipantFromCloud(parsed.phone || parsed.id || String(parsed.ticketNumber)).then((cloudUser) => {
                if (cloudUser) {
                  setRegisteredUser(cloudUser);
                  setCurrentView('spectator');
                } else if (parsed.name) {
                  setRegisteredUser(parsed);
                  setCurrentView('spectator');
                }
              });
            }
          } catch {
            // Ignore parse error
          }
        }
      }
    }
  }, []);

  // Sync browser URL with view change for clean routing
  const handleViewChange = (view: 'register' | 'spectator' | 'admin') => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      const targetPath = view === 'admin' ? '/admin' : '/';
      const search = view === 'spectator' ? '?view=spectator' : view === 'admin' ? '?view=admin' : '';
      window.history.pushState({}, '', `${targetPath}${search}`);
    }
  };

  // Fetch Public Giveaway Data (Real-time state for spectators)
  const fetchPublicState = useCallback(async () => {
    try {
      const res = await fetch('/api/public/giveaway');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPublicState((prev) => {
            const nextPrize = data.currentPrize || DEFAULT_STORE_SETTINGS.currentPrize;
            const nextWheel = data.wheelState || DEFAULT_STORE_SETTINGS.wheelState;
            const nextTotal = data.totalParticipants || 0;
            const nextNames = data.participantNames || [];
            const nextRegOpen = data.isRegistrationOpen ?? true;

            const isPrizeEqual =
              prev.currentPrize.title === nextPrize.title &&
              prev.currentPrize.details === nextPrize.details;

            const isWheelEqual =
              prev.wheelState.isSpinning === nextWheel.isSpinning &&
              prev.wheelState.winnerName === nextWheel.winnerName &&
              prev.wheelState.winnerTicket === nextWheel.winnerTicket &&
              prev.wheelState.prizeTitle === nextWheel.prizeTitle &&
              prev.wheelState.spunAt === nextWheel.spunAt;

            const isNamesEqual =
              prev.participantNames.length === nextNames.length &&
              prev.participantNames.every((name, idx) => name === nextNames[idx]);

            if (
              isPrizeEqual &&
              isWheelEqual &&
              isNamesEqual &&
              prev.totalParticipants === nextTotal &&
              prev.isRegistrationOpen === nextRegOpen
            ) {
              return prev;
            }

            return {
              currentPrize: isPrizeEqual ? prev.currentPrize : nextPrize,
              wheelState: isWheelEqual ? prev.wheelState : nextWheel,
              totalParticipants: nextTotal,
              participantNames: nextNames,
              isRegistrationOpen: nextRegOpen,
            };
          });

          if (data.storeName) {
            setSettings((prev) => {
              if (
                prev.storeName === data.storeName &&
                prev.storeTagline === (data.storeTagline || prev.storeTagline) &&
                prev.themeId === (data.themeId || prev.themeId) &&
                prev.currentPrize.title === (data.currentPrize?.title || prev.currentPrize.title) &&
                prev.currentPrize.details === (data.currentPrize?.details || prev.currentPrize.details) &&
                prev.wheelState.isSpinning === (data.wheelState?.isSpinning || false) &&
                prev.wheelState.winnerName === (data.wheelState?.winnerName || '')
              ) {
                return prev;
              }
              return {
                ...prev,
                storeName: data.storeName,
                storeTagline: data.storeTagline || prev.storeTagline,
                themeId: data.themeId || prev.themeId,
                currentPrize: data.currentPrize || prev.currentPrize,
                wheelState: data.wheelState || prev.wheelState,
              };
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch public giveaway state:', err);
    }
  }, []);

  // Fetch full settings once
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    async function init() {
      setIsInitialLoading(true);
      await Promise.all([fetchPublicState(), fetchSettings()]);
      setIsInitialLoading(false);
    }
    init();
  }, [fetchPublicState, fetchSettings]);

  // Supabase Realtime Subscription for zero-latency instant updates across all screens
  useEffect(() => {
    const channel = supabase
      .channel('giveaway-live-broadcast')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'giveaway_settings' },
        () => {
          fetchPublicState();
          fetchSettings();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          fetchPublicState();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prizes' },
        () => {
          fetchPublicState();
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPublicState, fetchSettings]);

  // Periodic polling every 3 seconds as a robust fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchPublicState();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchPublicState]);

  // Callback when a participant successfully registers
  const handleParticipantRegistered = (participant: Participant) => {
    setRegisteredUser(participant);
    fetchPublicState();
    handleViewChange('spectator');
  };

  // Callback to clear local registration if user wants to register another person
  const handleClearRegistration = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('giveaway_registered_user');
    }
    setRegisteredUser(null);
    handleViewChange('register');
  };

  // Callback when admin updates prize
  const handlePrizeUpdated = (newPrize: CurrentPrize) => {
    setPublicState((prev) => ({ ...prev, currentPrize: newPrize }));
    setSettings((prev) => ({ ...prev, currentPrize: newPrize }));
  };

  // Determine active theme
  const currentTheme: StoreTheme =
    THEME_PRESETS.find((t) => t.id === settings.themeId) || THEME_PRESETS[0];

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black antialiased"
      style={{
        backgroundColor: '#04070A',
        backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.primary}18, transparent 70%), radial-gradient(circle at 100% 100%, ${currentTheme.secondary}12, transparent 50%)`,
      }}
      dir="rtl"
    >
      {/* Top Header Navigation */}
      <Header
        settings={settings}
        theme={currentTheme}
        currentView={currentView}
        onViewChange={handleViewChange}
        onOpenShare={() => setIsShareModalOpen(true)}
        participantsCount={publicState.totalParticipants}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {isInitialLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
            <div
              className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4"
              style={{ borderColor: `${currentTheme.primary}40`, borderTopColor: currentTheme.primary }}
            />
            <p className="text-sm font-bold text-slate-400">جاري تحميل بيانات السحب المباشر...</p>
          </div>
        ) : currentView === 'admin' ? (
          <AdminDashboard
            theme={currentTheme}
            currentPrize={publicState.currentPrize}
            wheelState={publicState.wheelState}
            isRegistrationOpen={publicState.isRegistrationOpen}
            onRegistrationStatusChanged={(isOpen) => {
              setPublicState((prev) => ({ ...prev, isRegistrationOpen: isOpen }));
              setSettings((prev) => ({ ...prev, isRegistrationOpen: isOpen }));
            }}
            onPrizeUpdated={handlePrizeUpdated}
            onGoToSpectator={() => handleViewChange('spectator')}
          />
        ) : currentView === 'spectator' ? (
          <SpectatorScreen
            theme={currentTheme}
            currentPrize={publicState.currentPrize}
            wheelState={publicState.wheelState}
            participantNames={publicState.participantNames}
            totalParticipants={publicState.totalParticipants}
            isRegistrationOpen={publicState.isRegistrationOpen}
            registeredUser={registeredUser}
            onClearRegistration={handleClearRegistration}
          />
        ) : (
          <RegistrationForm
            theme={currentTheme}
            currentPrize={publicState.currentPrize}
            storeName={settings.storeName}
            storeTagline={settings.storeTagline}
            isRegistrationOpen={publicState.isRegistrationOpen}
            onRegistered={handleParticipantRegistered}
            onGoToSpectator={() => handleViewChange('spectator')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} {settings.storeName} • منصة السحب وعجلة الحظ المباشرة</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleViewChange(currentView === 'admin' ? 'spectator' : 'admin')}
              className="text-slate-400 hover:text-amber-400 transition-colors"
            >
              {currentView === 'admin' ? 'العودة لواجهة المشاهدين' : 'لوحة تحكم السحب (Admin)'}
            </button>
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              مشاركة الرابط
            </button>
          </div>
        </div>
      </footer>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        settings={settings}
        theme={currentTheme}
      />
    </div>
  );
}
