import { PRESET_LOGOS } from '../themes';
import { Sparkles, ShoppingBag, Gem, Smartphone, Coffee, Gift } from 'lucide-react';
import R3DLogo from './R3DLogo';

interface LogoDisplayProps {
  logoUrl?: string;
  logoType?: 'url' | 'upload' | 'preset';
  logoPreset?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function LogoDisplay({
  logoUrl,
  logoType = 'preset',
  logoPreset = 'r3d',
  size = 'md',
  className = '',
}: LogoDisplayProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-3xl',
    xl: 'w-28 h-28 text-4xl',
  };

  const iconSizes = {
    sm: 18,
    md: 26,
    lg: 38,
    xl: 52,
  };

  // If upload or URL has an actual image URL
  if ((logoType === 'upload' || logoType === 'url') && logoUrl) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden shadow-lg border border-cyan-500/30 bg-slate-950/90 flex items-center justify-center ${sizeClasses[size]} ${className}`}
      >
        <img
          src={logoUrl}
          alt="شعار المتجر"
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            // Fallback if URL fails
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // If R3D preset is selected
  if (logoPreset === 'r3d' || (!logoUrl && logoType === 'preset' && (!logoPreset || logoPreset === 'r3d'))) {
    return (
      <div
        className={`relative rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center shadow-xl border border-cyan-500/40 p-1 ${sizeClasses[size]} ${className}`}
      >
        <R3DLogo size={size} showText={size === 'lg' || size === 'xl'} glow={true} />
      </div>
    );
  }

  // Preset icon
  const preset = PRESET_LOGOS.find((p) => p.id === logoPreset) || PRESET_LOGOS[0];

  const renderIcon = () => {
    const s = iconSizes[size];
    switch (preset.iconName) {
      case 'Sparkles':
        return <Sparkles size={s} className="text-white drop-shadow-md" />;
      case 'ShoppingBag':
        return <ShoppingBag size={s} className="text-white drop-shadow-md" />;
      case 'Gem':
        return <Gem size={s} className="text-white drop-shadow-md" />;
      case 'Smartphone':
        return <Smartphone size={s} className="text-white drop-shadow-md" />;
      case 'Coffee':
        return <Coffee size={s} className="text-white drop-shadow-md" />;
      case 'Gift':
      default:
        return <Gift size={s} className="text-white drop-shadow-md" />;
    }
  };

  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-br ${preset.bg} flex items-center justify-center shadow-lg border border-white/20 ${sizeClasses[size]} ${className}`}
    >
      {renderIcon()}
    </div>
  );
}

