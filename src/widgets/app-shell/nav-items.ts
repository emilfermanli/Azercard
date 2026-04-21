import type { LucideIcon } from 'lucide-react';
import { Briefcase, Building2, Shield, Users } from 'lucide-react';

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
];
