
import type { LucideIcon } from 'lucide-react';
import { Rocket, Bomb, Sparkles, Disc3, Gift, Smile, Package } from 'lucide-react';

export const iconMap: { [key: string]: LucideIcon } = {
  RocketIcon: Rocket,
  BombIcon: Bomb,
  SparklesIcon: Sparkles,
  Disc3Icon: Disc3,
  GiftIcon: Gift,
  SmileIcon: Smile,
  DefaultIcon: Package, // Fallback icon
};

export const getIcon = (iconName?: string): LucideIcon => {
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }
  return iconMap.DefaultIcon;
};
