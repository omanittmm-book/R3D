import React, { useState, useEffect, useCallback } from 'react';
import { StoreSettings, Participant, StoreTheme } from './types';
import { DEFAULT_STORE_SETTINGS, THEME_PRESETS } from './themes';
import Header from './components/Header';
import WheelOfFortune from './components/WheelOfFortune';
import RegistrationForm from './components/RegistrationForm';
import ThemeCustomizer from './components/ThemeCustomizer';
import ParticipantsManager from './components/ParticipantsManager';
import ShareModal from './components/ShareModal';
import { Sparkles, Trophy, Users, Compass, Share2 } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState<'wheel' | 'register' | 'participants' | 'theme'>('wheel');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Parse initial tab from URL query (?tab=register)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'register' || tabParam === 'wheel' || tabParam === 'participants' || tabParam === 'theme') {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Fetch Settings
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

  // Fetch Participants with smart state diffing to prevent unnecessary re-renders
  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch('/api/participants');
      if (res.ok) {
        const data = await res.json();
        if (data.participants && Array.isArray(data.participants)) {
          setParticipants((prev) => {
            if (
              prev.length === data.participants.length &&
              prev.every((p, idx) => {
                const q = data.participants[idx];
                return p.id === q?.id && p.hasWon === q?.hasWon && p.ticketNumber === q?.ticketNumber;
              })
            ) {
              return prev; // Identical, avoid re-rendering tree
            }
            return data.participants;
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch participants:', err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await Promise.all([fetchSettings(), fetchParticipants()]);
      setIsLoading(false);
    }
    init();
  }, [fetchSettings, fetchParticipants]);

  // Periodic polling for participants (updates live entries, pauses when tab is inactive)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchParticipants();
    }, 4500);
    return () => clearInterval(interval);
  }, [fetchParticipants]);

  // Determine active theme
  const currentTheme: StoreTheme =
    THEME_PRESETS.find((t) => t.id === settings.themeId) || THEME_PRESETS[0];

  // Callback: Save updated settings
  const handleSaveSettings = async (newSettings: Partial<StoreSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
    } else {
      throw new Error('فشل حفظ الإعدادات');
    }
  };

  // Callback: Winner drawn from Wheel
  const handleWinnerDrawn = async (participantId: string, prizeTitle: string) => {
    const res = await fetch('/api/draw/winner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, prizeWon: prizeTitle }),
    });
    if (res.ok) {
      await fetchParticipants();
    }
  };

  // Callback: Delete single participant
  const handleDeleteParticipant = async (id: string) => {
    const res = await fetch(`/api/participants/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setParticipants((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Callback: Clear participants
  const handleClearParticipants = async (type: 'all' | 'non-winners' | 'winners') => {
    const res = await fetch('/api/participants/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const data = await res.json();
      setParticipants(data.participants);
    }
  };

  // Callback: Seed realistic sample entries
  const handleSeedSample = async () => {
    const res = await fetch('/api/participants/seed', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setParticipants(data.participants);
    }
  };

  // Callback: Reset winners
  const handleResetWinners = async () => {
    const res = await fetch('/api/draw/reset-winners', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setParticipants(data.participants);
    }
  };

  // Callback: Add participant manually
  const handleAddManual = async (name: string, phone: string) => {
    const res = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone }),
    });
    if (res.ok) {
      await fetchParticipants();
    }
  };

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col transition-colors duration-300"
      style={{
        backgroundColor: currentTheme.bgDark,
      }}
    >
      {/* App Header */}
      <Header
        settings={settings}
        theme={currentTheme}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenShare={() => setIsShareModalOpen(true)}
        participantsCount={participants.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div
              className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-transparent animate-spin mb-4"
              style={{ borderTopColor: currentTheme.primary }}
            />
            <p className="text-sm font-bold text-slate-300">جاري تحميل بيانات السحب وعجلة الحظ...</p>
          </div>
        ) : (
          <>
            {activeTab === 'wheel' && (
              <WheelOfFortune
                participants={participants}
                prizes={settings.prizes}
                theme={currentTheme}
                maskPhone={settings.maskPhoneNumbers}
                onWinnerDrawn={handleWinnerDrawn}
                onSeedSample={handleSeedSample}
              />
            )}

            {activeTab === 'register' && (
              <RegistrationForm
                settings={settings}
                theme={currentTheme}
                onParticipantAdded={fetchParticipants}
                onSwitchToWheel={() => setActiveTab('wheel')}
              />
            )}

            {activeTab === 'participants' && (
              <ParticipantsManager
                participants={participants}
                theme={currentTheme}
                maskPhone={settings.maskPhoneNumbers}
                onDeleteParticipant={handleDeleteParticipant}
                onClearParticipants={handleClearParticipants}
                onSeedSample={handleSeedSample}
                onResetWinners={handleResetWinners}
                onAddManual={handleAddManual}
              />
            )}

            {activeTab === 'theme' && (
              <ThemeCustomizer
                settings={settings}
                currentTheme={currentTheme}
                onSaveSettings={handleSaveSettings}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            {settings.storeName} &copy; {new Date().getFullYear()} - منصة سحب وقيف اوي تفاعلية
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              type="button"
              onClick={() => setActiveTab('wheel')}
              className="hover:text-amber-400 transition-colors"
            >
              عجلة الحظ
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className="hover:text-amber-400 transition-colors"
            >
              صفحة التسجيل
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              مشاركة الرابط
            </button>
          </div>
        </div>
      </footer>

      {/* Share Modal */}
      <ShareModal
        settings={settings}
        theme={currentTheme}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
