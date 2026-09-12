import React from 'react';
import { StoreSettings, StoreTheme } from '../types';
import LogoDisplay from './LogoDisplay';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Compass,
  UserCheck,
  Palette,
  Share2,
  Users,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  settings: StoreSettings;
  theme: StoreTheme;
  activeTab: 'wheel' | 'register' | 'participants' | 'theme';
  onTabChange: (tab: 'wheel' | 'register' | 'participants' | 'theme') => void;
  onOpenShare: () => void;
  participantsCount: number;
}

export default function Header({
  settings,
  theme,
  activeTab,
  onTabChange,
  onOpenShare,
  participantsCount,
}: HeaderProps) {
  const tabs = [
    {
      id: 'wheel' as const,
      label: 'عجلة الحظ',
      icon: Compass,
      badge: null,
    },
    {
      id: 'register' as const,
      label: 'صفحة التسجيل (للمشاركين)',
      icon: UserCheck,
      badge: settings.isRegistrationOpen ? 'مفتوح' : 'مغلق',
    },
    {
      id: 'participants' as const,
      label: 'قائمة المشاركين',
      icon: Users,
      badge: participantsCount.toString(),
    },
    {
      id: 'theme' as const,
      label: 'ثيم وهوية المتجر',
      icon: Palette,
      badge: null,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Store Logo & Branding Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('wheel')}>
            <LogoDisplay
              logoUrl={settings.logoUrl}
              logoType={settings.logoType}
              logoPreset={settings.logoPreset}
              size="md"
              className="shrink-0"
            />
            <div className="hidden sm:block text-right">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-wide">
                  {settings.storeName || 'متجر النخبة'}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-950 uppercase"
                  style={{ backgroundColor: theme.primary }}
                >
                  سحب وقيف اوي
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium line-clamp-1">
                {settings.storeTagline || 'عجلة الحظ وسحب الجوائز الفورية'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  style={{
                    backgroundColor: isActive ? theme.primary : 'transparent',
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-black/30 text-white'
                          : 'bg-slate-800 text-amber-400 border border-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action: Desktop App Install + Share Link Button */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <button
              id="share-giveaway-btn"
              type="button"
              onClick={onOpenShare}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black text-slate-950 shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer border border-cyan-400/30"
              style={{
                backgroundColor: theme.primary,
                boxShadow: `0 4px 18px ${theme.primary}40`,
              }}
            >
              <Share2 size={15} />
              <span className="hidden xs:inline">مشاركة الرابط والـ QR</span>
              <span className="xs:hidden">مشاركة</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  isActive ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                <Icon size={18} className="mb-0.5" />
                <span className="whitespace-nowrap">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
