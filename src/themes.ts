import { StoreTheme, Prize, StoreSettings } from './types';

export const THEME_PRESETS: StoreTheme[] = [
  {
    id: 'r3d-turquoise',
    name: 'R3D تركوازي وأسود وأبيض (Cyber Turquoise & Obsidian)',
    primary: '#06B6D4', // vibrant electric cyan / turquoise
    primaryHover: '#0891B2',
    secondary: '#22D3EE', // bright cyan neon
    accent: '#FFFFFF', // crisp pure white
    bgDark: '#04070A', // deep stealth black
    cardBg: '#091016', // sleek dark obsidian with subtle cyan depth
    borderColor: '#164E63', // cyan cyber border
    badgeBg: '#083344',
  },
  {
    id: 'gold',
    name: 'الذهبي الملكي (Royal Gold)',
    primary: '#D97706', // amber-600
    primaryHover: '#B45309',
    secondary: '#F59E0B',
    accent: '#FCD34D',
    bgDark: '#0B0F19', // deep navy onyx
    cardBg: '#111827',
    borderColor: '#374151',
    badgeBg: '#78350F',
  },
  {
    id: 'emerald',
    name: 'الزمرد الفاخر (Luxury Emerald)',
    primary: '#059669', // emerald-600
    primaryHover: '#047857',
    secondary: '#10B981',
    accent: '#6EE7B7',
    bgDark: '#061A14',
    cardBg: '#0A261D',
    borderColor: '#064E3B',
    badgeBg: '#064E3B',
  },
  {
    id: 'purple',
    name: 'البنفسجي العصري (Cyber Violet)',
    primary: '#7C3AED', // violet-600
    primaryHover: '#6D28D9',
    secondary: '#8B5CF6',
    accent: '#C4B5FD',
    bgDark: '#0F0B1E',
    cardBg: '#1A1435',
    borderColor: '#3B2D64',
    badgeBg: '#4C1D95',
  },
  {
    id: 'rose',
    name: 'الوردي الأنيق (Rose Chic)',
    primary: '#E11D48', // rose-600
    primaryHover: '#BE123C',
    secondary: '#F43F5E',
    accent: '#FDA4AF',
    bgDark: '#190B10',
    cardBg: '#28111B',
    borderColor: '#5B1E34',
    badgeBg: '#881337',
  },
  {
    id: 'ocean',
    name: 'الأزرق الملكي (Ocean Prestige)',
    primary: '#0284C7', // sky-600
    primaryHover: '#0369A1',
    secondary: '#38BDF8',
    accent: '#BAE6FD',
    bgDark: '#081220',
    cardBg: '#0C1B2E',
    borderColor: '#1E3A5F',
    badgeBg: '#0C4A6E',
  },
  {
    id: 'midnight',
    name: 'الأسود الكلاسيكي الفخم (Obsidian Monochrome)',
    primary: '#E2E8F0', // slate-200
    primaryHover: '#CBD5E1',
    secondary: '#94A3B8',
    accent: '#FFFFFF',
    bgDark: '#09090B',
    cardBg: '#18181B',
    borderColor: '#27272A',
    badgeBg: '#27272A',
  },
];

export const PRESET_LOGOS = [
  {
    id: 'r3d',
    label: 'شعار R3D الرسمي (التاج والدرع التركوازي)',
    iconName: 'R3D',
    emoji: '👑',
    bg: 'from-cyan-500 to-slate-900',
  },
  {
    id: 'perfume',
    label: 'عطور وبخور',
    iconName: 'Sparkles',
    emoji: '✨',
    bg: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'shopping',
    label: 'متجر عام وموضة',
    iconName: 'ShoppingBag',
    emoji: '🛍️',
    bg: 'from-rose-500 to-pink-600',
  },
  {
    id: 'jewelry',
    label: 'مجوهرات وساعات',
    iconName: 'Gem',
    emoji: '💎',
    bg: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'tech',
    label: 'إلكترونيات وهواتف',
    iconName: 'Smartphone',
    emoji: '📱',
    bg: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'coffee',
    label: 'كافيه وحلويات',
    iconName: 'Coffee',
    emoji: '☕',
    bg: 'from-amber-700 to-orange-800',
  },
  {
    id: 'gift',
    label: 'هدايا وتوزيعات',
    iconName: 'Gift',
    emoji: '🎁',
    bg: 'from-emerald-500 to-teal-600',
  },
];

export const DEFAULT_PRIZES: Prize[] = [];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'متجر الرعد',
  storeTagline: 'سحب حصري وعجلة الحظ الكبرى للمشاركين الكرام',
  giveawayTitle: 'السحب الكبير وعجلة الحظ',
  giveawayDescription: 'سجل اسمك وقبيلتك ورقم هاتفك (8 أرقام) للدخول في السحب المباشر وعجلة الحظ للفوز بجوائز قيمة!',
  logoUrl: '',
  logoType: 'preset',
  logoPreset: 'r3d',
  themeId: 'r3d-turquoise',
  isRegistrationOpen: true,
  allowDuplicates: false,
  maskPhoneNumbers: true,
  adminPin: '1234',
  adminPassword: 'Alrneem9@1',
  currentPrize: {
    title: '',
    details: '',
  },
  wheelState: {
    isSpinning: false,
    winnerName: '',
    prizeTitle: '',
    spunAt: '',
  },
  prizes: [],
};

