import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Briefcase,
  Building2,
  CreditCard,
  Globe2,
  Layers,
  MapPinned,
  LayoutDashboard,
  Network,
  Shield,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
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
    path: '/terminal-aktivliyi',
    label: 'Terminal aktivliyi',
    icon: CreditCard,
  },
  {
    path: '/kart-portfoliyosu',
    label: 'Kart portfoliyosu',
    icon: Wallet,
  },
  {
    path: '/acquiring-device-transaction',
    label: 'Acquiring qurğu əməliyyatları',
    icon: Smartphone,
  },
  {
    path: '/card-dashboard',
    label: 'Kart əməliyyat icmalı',
    icon: LayoutDashboard,
  },
  {
    path: '/card-transaction-detailed',
    label: 'Kart əməliyyat detalları',
    icon: Network,
  },
  {
    path: '/summary-transaction',
    label: 'Tranzaksiya xülasəsi',
    icon: Layers,
  },
  {
    path: '/forecasting',
    label: 'Proqnozlaşdırma',
    icon: TrendingUp,
  },
];
