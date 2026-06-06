import { ArrowDown, ArrowLeftRight, ArrowUp } from 'lucide-react';

import type { Trend } from '../_types';

export function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === 'flat') return <ArrowLeftRight className="h-4 w-4" />;
  const Icon = trend === 'up' ? ArrowUp : ArrowDown;
  return <Icon className="h-4 w-4" />;
}
