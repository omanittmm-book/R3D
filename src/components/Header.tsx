import React from 'react';
import { StoreSettings, StoreTheme } from '../types';
import LogoDisplay from './LogoDisplay';
import {
  UserPlus,
  Tv,
  Lock,
  Share2,
  Trophy,
} from 'lucide-react';

interface HeaderProps {
  settings: StoreSettings;
  theme: StoreTheme;
  currentView: 'register' | 'spectator' | 'admin';
  onViewChange: (view: 'register' | 'spectator' | 'admin') => void;
  onOpenShare: () => void;
  participantsCount: number;
}

export default function Header({
  settings,
  theme,
  currentView,
  onViewChange,
  onOpenShare,
  participantsCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 transition-colors" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Right Brand / Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <LogoDisplay
              logoUrl={settings.logoUrl}
              logoType={settings.logoType}
              logoPreset={settings.logoPreset}
              size="sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base text-white tracking-wide">
                  {settings.storeName && settings.storeName !== 'سحب وقيف اوي المتاجر' ? settings.storeName : 'متجر الرعد'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  <Trophy size={10} />
                  <span>سحب مباشر</span>
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400 truncate max-w-xs">
                {settings.storeTagline || 'سحب حصري وعجلة الحظ الكبرى'}
              </p>
            </div>
          </div>

          {/* Center Navigation: Registration vs Spectator */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => onViewChange('register')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'register'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserPlus size={15} />
              <span>التسجيل</span>
            </button>

            <button
              type="button"
              onClick={() => onViewChange('spectator')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'spectator'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Tv size={15} />
              <span>المشاهدة والعجلة</span>
              {participantsCount > 0 && (
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-300 font-mono">
                  {participantsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Left Actions: Admin & Share */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onViewChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                  : 'bg-slate-900 text-amber-300 hover:bg-slate-800 border-amber-500/30'
              }`}
              title="لوحة تحكم المسؤول"
            >
              <Lock size={14} />
              <span className="hidden sm:inline">لوحة المسؤول</span>
            </button>

            <button
              type="button"
              onClick={onOpenShare}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="مشاركة رابط السحب"
            >
              <Share2 size={15} />
              <span className="hidden md:inline">مشاركة</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
