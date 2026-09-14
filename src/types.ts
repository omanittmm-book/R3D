export interface StoreTheme {
  id: string;
  name: string;
  primary: string; // e.g., gold #D4AF37
  primaryHover: string;
  secondary: string; // e.g., amber #F59E0B
  accent: string;
  bgDark: string; // page background
  cardBg: string; // card container background
  borderColor: string;
  badgeBg: string;
}

export interface Prize {
  id: string;
  title: string;
  quantity: number;
  icon: string; // lucide icon identifier
  color: string;
}

export interface CurrentPrize {
  title: string;
  details: string;
}

export interface WheelState {
  isSpinning: boolean;
  winnerName?: string;
  winnerId?: string;
  winnerTicket?: number;
  prizeTitle?: string;
  spunAt?: string;
}

export interface PublicGiveawayState {
  currentPrize: CurrentPrize;
  wheelState: WheelState;
  totalParticipants: number;
  participantNames: string[];
  isRegistrationOpen: boolean;
  storeName: string;
  storeTagline: string;
  themeId: string;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  giveawayTitle: string;
  giveawayDescription: string;
  logoUrl: string;
  logoType: 'url' | 'upload' | 'preset';
  logoPreset: string;
  themeId: string;
  customColors?: {
    primary: string;
    secondary: string;
    bgDark: string;
  };
  isRegistrationOpen: boolean;
  allowDuplicates: boolean;
  maskPhoneNumbers: boolean;
  adminPin?: string;
  adminPassword?: string;
  currentPrize: CurrentPrize;
  wheelState: WheelState;
  prizes: Prize[];
}

export interface Participant {
  id: string;
  ticketNumber: number;
  name: string;
  phone: string;
  registeredAt: string;
  hasWon: boolean;
  wonAt?: string;
  prizeWon?: string;
}

export interface WinnerResult {
  participant: Participant;
  prize?: Prize;
  drawnAt: string;
}
