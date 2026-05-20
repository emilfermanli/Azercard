import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Briefcase,
  Building2,
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
    label: 'AzMap',
    icon: MapPinned,
  },
  {
    path: '/worldmap',
    label: 'WorldMap',
    icon: Globe2,
  },
  {
    path: '/marketbenchmark',
    label: 'Market Benchmark',
    icon: BarChart3,
  },
  {
    path: '/sectorspend',
    label: 'Sector Spend',
    icon: WalletCards,
  },
  {
    path: '/forecasting',
    label: 'Forecasting',
    icon: TrendingUp,
  },
];
