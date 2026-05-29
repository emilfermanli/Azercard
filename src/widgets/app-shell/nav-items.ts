import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Briefcase,
  Building2,
  CreditCard,
  Globe2,
  MapPinned,
  Shield,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';

export type NavLinkItem = {
  path: string;
  label: string;
  icon: LucideIcon;
};

export const navLinks: NavLinkItem[] = [
  {
    path: '/istifadeciler',
    label: 'İstifadəçilər',
    icon: Users,
  },
  {
    path: '/departamentler',
    label: 'Departamentlər',
    icon: Building2,
  },
  {
    path: '/pozisiyalar',
    label: 'Pozisiyalar',
    icon: Briefcase,
  },
  {
    path: '/rollar',
    label: 'Rollar',
    icon: Shield,
  },
  {
    path: '/azmap',
    label: 'Azərbaycan xəritəsi',
    icon: MapPinned,
  },
  {
    path: '/worldmap',
    label: 'Dünya xəritəsi',
    icon: Globe2,
  },
  {
    path: '/marketbenchmark',
    label: 'Bazar müqayisəsi',
    icon: BarChart3,
  },
  {
    path: '/sectorspend',
    label: 'Sektor xərcləri',
    icon: WalletCards,
  },
  {
    path: '/kart-aktivliyi',
    label: 'Kart aktivliyi',
    icon: CreditCard,
  },
  {
    path: '/forecasting',
    label: 'Proqnozlaşdırma',
    icon: TrendingUp,
  },
];
