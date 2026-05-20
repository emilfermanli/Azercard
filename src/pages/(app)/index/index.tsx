import { BarChart3, Box, DollarSign, TrendingUp, Users } from 'lucide-react';

import { Button } from '@/components';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';

const chartDays = ['01 Yan', '02 Yan', '03 Yan', '04 Yan', '05 Yan', '06 Yan', '07 Yan'];
const amountHeights = [45, 62, 38, 70, 55, 80, 48];
const txHeights = [30, 45, 55, 40, 50, 65, 35];

const recent = [
  { id: '12345', time: '2 saat əvvəl', amount: '₼ 1.240,00' },
  { id: '12344', time: '5 saat əvvəl', amount: '₼ 890,50' },
  { id: '12343', time: '1 gün əvvəl', amount: '₼ 2.100,00' },
  { id: '12342', time: '1 gün əvvəl', amount: '₼ 340,00' },
];

const IndexPage: React.FC = () => {
  const isDark = useShellTheme();

  const cardBase = isDark
    ? 'border-slate-700/60 bg-slate-900/50 text-slate-100'
    : 'border-slate-200 bg-white text-slate-900 shadow-sm';

  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const panel = isDark ? 'border-slate-700/60 bg-slate-900/50' : 'border-slate-200 bg-white shadow-sm';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">İdarəetmə Paneli</h1>
        </div>
        <Button
          type="button"
          className="h-10 shrink-0 border-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-white shadow-md hover:from-blue-500 hover:to-indigo-500"
        >
          Hesabat yaradın
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Ümumi gəlir',
            value: '₼ 2.450.500',
            icon: DollarSign,
            accent: 'text-emerald-400',
            iconBg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50',
          },
          {
            label: 'Aktiv istifadəçilər',
            value: '14.257',
            icon: Users,
            accent: 'text-blue-400',
            iconBg: isDark ? 'bg-blue-500/15' : 'bg-blue-50',
          },
          {
            label: 'İnventar mövqeləri',
            value: '3.285',
            icon: Box,
            accent: 'text-violet-400',
            iconBg: isDark ? 'bg-violet-500/15' : 'bg-violet-50',
          },
          {
            label: 'Aylıq artım',
            value: '+15,2%',
            icon: TrendingUp,
            accent: 'text-amber-400',
            iconBg: isDark ? 'bg-amber-500/15' : 'bg-amber-50',
          },
        ].map((c) => (
          <div
            key={c.label}
            className={`relative overflow-hidden rounded-xl border p-5 ${cardBase}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-medium ${muted}`}>{c.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{c.value}</p>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.iconBg}`}>
                <c.icon className={`h-5 w-5 ${c.accent}`} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className={`rounded-xl border p-5 lg:col-span-3 ${panel}`}>
          <div className="mb-6 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Ödəniş aktivliyi</h2>
            <BarChart3 className={`h-5 w-5 ${muted}`} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-emerald-500" />
              Məbləğ (₼)
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-blue-500" />
              Əməliyyatlar
            </span>
          </div>
          <div
            className={`mt-6 flex h-52 items-end justify-between gap-1 border-t pt-4 ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}
          >
            {chartDays.map((day, i) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full max-w-[2.5rem] items-end justify-center gap-0.5 sm:max-w-[3rem]">
                  <div
                    className="w-2/5 max-w-[10px] rounded-t-sm bg-emerald-500/90"
                    style={{ height: `${amountHeights[i]}%` }}
                  />
                  <div
                    className="w-2/5 max-w-[10px] rounded-t-sm bg-blue-500/90"
                    style={{ height: `${txHeights[i]}%` }}
                  />
                </div>
                <span className={`text-[10px] font-medium sm:text-xs ${muted}`}>{day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={`rounded-xl border p-5 lg:col-span-2 ${panel}`}>
          <h2 className="text-lg font-semibold">Son əməliyyatlar</h2>
          <ul className="mt-4 space-y-3">
            {recent.map((row) => (
              <li
                key={row.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${isDark ? 'border-slate-700/50 bg-slate-950/40' : 'border-slate-100 bg-slate-50/80'
                  }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600/90 text-xs font-bold text-white">
                  TX
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">Əməliyyat #{row.id}</p>
                  <p className={`text-xs ${muted}`}>{row.time}</p>
                </div>
                <span className="shrink-0 font-semibold text-emerald-500">{row.amount}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default IndexPage;
