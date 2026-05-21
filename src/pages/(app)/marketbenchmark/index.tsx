import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { BarChart3, CreditCard, Landmark, PieChart as PieChartIcon, Trophy } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

import { DataPagination, DataTable } from '@/components';
import { useGetMarketbenchmarkFilterQuery } from '@/services/marketbenchmark.service';
import type { MarketBenchmarkItem } from '@/types/marketbenchmark.type';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';

import {
  DataPageHeader,
  formatAmount,
  formatDate,
  formatNumber,
  PageError,
  PageLoading,
  StatCard,
} from '../_data-page-ui';

type SummaryItem = {
  label: string;
  amount: number;
  count: number;
  cards: number;
  marketShare: number;
  cardShare: number;
};

type ChartItem = SummaryItem & {
  name: string;
  value: number;
};

type BenchmarkScatterPoint = {
  bank: string;
  region: string;
  brand: string;
  marketShare: number;
  cardShare: number;
  amount: number;
};

const CHART_COLORS = ['#2563eb', '#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'];
const PAGE_SIZE = 10;

function formatPercent(value: number | null | undefined) {
  return `${formatAmount(value)}%`;
}

function formatShortAmount(value: number) {
  if (value >= 1_000_000_000) return `${formatAmount(value / 1_000_000_000)} mlrd`;
  if (value >= 1_000_000) return `${formatAmount(value / 1_000_000)} mln`;
  if (value >= 1_000) return `${formatAmount(value / 1_000)} min`;
  return formatAmount(value);
}

function cleanBrand(value: string | null) {
  if (!value) return 'Naməlum';
  const [, product] = value.split(':');
  return (product || value).trim() || 'Naməlum';
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function groupRows(
  rows: MarketBenchmarkItem[],
  getLabel: (row: MarketBenchmarkItem) => string
) {
  const map = new Map<string, SummaryItem>();

  rows.forEach((row) => {
    const label = getLabel(row);
    const current = map.get(label);

    if (current) {
      current.amount += row.bankTransAmount;
      current.count += row.bankTransCount;
      current.cards += row.bankCardCount;
      current.marketShare = Math.max(current.marketShare, row.marketSharePct);
      current.cardShare = Math.max(current.cardShare, row.cardSharePct);
      return;
    }

    map.set(label, {
      label,
      amount: row.bankTransAmount,
      count: row.bankTransCount,
      cards: row.bankCardCount,
      marketShare: row.marketSharePct,
      cardShare: row.cardSharePct,
    });
  });

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

function toChartItems(items: SummaryItem[]): ChartItem[] {
  return items.map((item) => ({
    ...item,
    name: item.label,
    value: item.amount,
  }));
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartItem }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 shadow-xl">
      <p className="font-semibold">{item.name}</p>
      <p className="mt-1">Məbləğ: {formatAmount(item.amount)}</p>
      <p>Market payı: {formatPercent(item.marketShare)}</p>
      <p>Kart payı: {formatPercent(item.cardShare)}</p>
    </div>
  );
}

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BenchmarkScatterPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 shadow-xl">
      <p className="font-semibold">{item.bank}</p>
      <p className="mt-1">{item.region}</p>
      <p>{item.brand}</p>
      <p className="mt-1">Market payı: {formatPercent(item.marketShare)}</p>
      <p>Kart payı: {formatPercent(item.cardShare)}</p>
      <p>Məbləğ: {formatAmount(item.amount)}</p>
    </div>
  );
}

function BenchmarkPanel({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof BarChart3;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const isDark = useShellTheme();

  return (
    <section
      className={[
        'rounded-xl border p-4 shadow-lg',
        isDark
          ? 'border-slate-800 bg-slate-900/70 text-slate-100 shadow-black/20'
          : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className={['text-sm', isDark ? 'text-slate-300' : 'text-slate-500'].join(' ')}>
            {subtitle}
          </p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DonutChart({ data }: { data: ChartItem[] }) {
  const isDark = useShellTheme();
  const chartData = data.slice(0, 6);

  return (
    <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={chartData}
              dataKey="value"
              innerRadius={58}
              outerRadius={86}
              paddingAngle={3}
              stroke="none"
            >
              {chartData.map((item, index) => (
                <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3 self-center">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="truncate">{item.name}</span>
            </span>
            <span className={['shrink-0 tabular-nums', isDark ? 'text-slate-300' : 'text-slate-600'].join(' ')}>
              {formatShortAmount(item.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalAmountChart({
  data,
  color,
}: {
  data: ChartItem[];
  color: string;
}) {
  const isDark = useShellTheme();
  const chartData = data.slice(0, 7);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid
            horizontal={false}
            stroke={isDark ? '#1e293b' : '#e2e8f0'}
            strokeDasharray="3 3"
          />
          <XAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
            type="number"
          />
          <YAxis
            axisLine={false}
            dataKey="name"
            tickLine={false}
            tick={{ fill: isDark ? '#cbd5e1' : '#475569', fontSize: 11 }}
            type="category"
            width={92}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
          <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ShareScatterChart({ data }: { data: BenchmarkScatterPoint[] }) {
  const isDark = useShellTheme();

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ bottom: 12, left: 4, right: 16, top: 12 }}>
          <CartesianGrid
            stroke={isDark ? '#1e293b' : '#e2e8f0'}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="marketShare"
            name="Market payı"
            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
            tickLine={false}
            type="number"
            unit="%"
          />
          <YAxis
            dataKey="cardShare"
            name="Kart payı"
            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
            tickLine={false}
            type="number"
            unit="%"
          />
          <ZAxis dataKey="amount" range={[70, 520]} />
          <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data.slice(0, 70)} fill="#2563eb" fillOpacity={0.78} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

const MarketBenchmarkPage: React.FC = () => {
  const isDark = useShellTheme();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, isFetching } = useGetMarketbenchmarkFilterQuery({
    Page: page,
    PageSize: PAGE_SIZE,
  });
  const rows = data?.items ?? [];

  const columns = useMemo<ColumnDef<MarketBenchmarkItem, unknown>[]>(
    () => [
      { accessorKey: 'bankName', header: 'Bank' },
      { accessorKey: 'regionNameClean', header: 'Region' },
      {
        accessorKey: 'cardBrandName',
        header: 'Kart brendi',
        cell: ({ getValue }) => cleanBrand(getValue() as string | null),
      },
      { accessorKey: 'productType', header: 'Məhsul tipi' },
      {
        accessorKey: 'reportMonth',
        header: 'Ay',
        cell: ({ getValue }) => formatDate(getValue() as string),
      },
      {
        accessorKey: 'marketSharePct',
        header: 'Market payı',
        cell: ({ getValue }) => formatPercent(getValue() as number),
      },
      {
        accessorKey: 'cardSharePct',
        header: 'Kart payı',
        cell: ({ getValue }) => formatPercent(getValue() as number),
      },
      {
        accessorKey: 'bankCardCount',
        header: 'Bank kartı',
        cell: ({ getValue }) => formatNumber(getValue() as number),
      },
      {
        accessorKey: 'bankTransAmount',
        header: 'Bank məbləği',
        cell: ({ getValue }) => formatAmount(getValue() as number),
      },
    ],
    []
  );

  const topBanks = useMemo(
    () => groupRows(rows, (row) => row.bankName ?? 'Naməlum bank'),
    [rows]
  );
  const topRegions = useMemo(
    () => groupRows(rows, (row) => row.regionNameClean ?? 'Naməlum region'),
    [rows]
  );
  const productMix = useMemo(
    () => groupRows(rows, (row) => row.productType ?? 'Naməlum'),
    [rows]
  );
  const brandMix = useMemo(
    () => groupRows(rows, (row) => cleanBrand(row.cardBrandName)),
    [rows]
  );
  const bankChartData = useMemo(() => toChartItems(topBanks), [topBanks]);
  const regionChartData = useMemo(() => toChartItems(topRegions), [topRegions]);
  const productChartData = useMemo(() => toChartItems(productMix), [productMix]);
  const brandChartData = useMemo(() => toChartItems(brandMix), [brandMix]);
  const scatterData = useMemo<BenchmarkScatterPoint[]>(
    () =>
      rows.map((row) => ({
        bank: row.bankName ?? 'Naməlum bank',
        region: row.regionNameClean ?? 'Naməlum region',
        brand: cleanBrand(row.cardBrandName),
        marketShare: row.marketSharePct,
        cardShare: row.cardSharePct,
        amount: row.bankTransAmount,
      })),
    [rows]
  );

  const totalBankAmount = rows.reduce((sum, row) => sum + row.bankTransAmount, 0);
  const totalBankCards = rows.reduce((sum, row) => sum + row.bankCardCount, 0);
  const avgMarketShare = average(rows.map((row) => row.marketSharePct));
  const avgCardShare = average(rows.map((row) => row.cardSharePct));
  const bestRow = rows.reduce<MarketBenchmarkItem | null>(
    (best, row) => (!best || row.marketSharePct > best.marketSharePct ? row : best),
    null
  );

  return (
    <div className="space-y-5">
      <DataPageHeader
        eyebrow="Benchmark"
        title="Bazar müqayisəsi"
        description="Bankların bazar payı, kart payı və region üzrə müqayisəli performansı."
        icon={BarChart3}
        tone="blue"
      />
      {isLoading && <PageLoading />}
      {isError && <PageError />}
      {!isLoading && !isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ümumi qeyd" value={formatNumber(data?.totalCount)} />
            <StatCard label="Bank məbləği" value={formatShortAmount(totalBankAmount)} />
            <StatCard label="Orta market payı" value={formatPercent(avgMarketShare)} />
            <StatCard label="Orta kart payı" value={formatPercent(avgCardShare)} />
          </div>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <BenchmarkPanel
              icon={BarChart3}
              title="Market və kart payı matrisi"
              subtitle="Hər nöqtə bank, region və kart məhsulu kəsişməsini göstərir"
            >
              <ShareScatterChart data={scatterData} />
            </BenchmarkPanel>

            <BenchmarkPanel
              icon={Landmark}
              title="Ən güclü mövqe"
              subtitle="Seçilmiş məlumatlarda ən yüksək market payı"
            >
              {bestRow ? (
                <div
                  className={[
                    'rounded-lg border p-4',
                    isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50',
                  ].join(' ')}
                >
                  <p className="text-sm font-semibold">{bestRow.regionNameClean ?? '-'}</p>
                  <p className="mt-2 text-4xl font-semibold tabular-nums text-blue-500">
                    {formatPercent(bestRow.marketSharePct)}
                  </p>
                  <p className={['mt-2 text-sm', isDark ? 'text-slate-300' : 'text-slate-500'].join(' ')}>
                    {cleanBrand(bestRow.cardBrandName)} • {bestRow.productType ?? '-'}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Kart payı</p>
                      <p className="font-semibold">{formatPercent(bestRow.cardSharePct)}</p>
                    </div>
                    <div>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Kart sayı</p>
                      <p className="font-semibold">{formatNumber(bestRow.bankCardCount)}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </BenchmarkPanel>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <BenchmarkPanel
              icon={PieChartIcon}
              title="Məhsul tipi"
              subtitle="Bank məbləği üzrə donut bölgüsü"
            >
              <DonutChart data={productChartData} />
            </BenchmarkPanel>

            <BenchmarkPanel
              icon={BarChart3}
              title="Regionlar"
              subtitle="Region üzrə horizontal əməliyyat chartı"
            >
              <HorizontalAmountChart color="#06b6d4" data={regionChartData} />
            </BenchmarkPanel>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <BenchmarkPanel
              icon={Trophy}
              title="Bank liderləri"
              subtitle="Bank üzrə aggregate əməliyyat həcmi"
            >
              <HorizontalAmountChart color="#2563eb" data={bankChartData} />
            </BenchmarkPanel>

            <BenchmarkPanel
              icon={CreditCard}
              title="Kart brendləri"
              subtitle={`${formatNumber(totalBankCards)} bank kartı üzrə chart`}
            >
              <HorizontalAmountChart color="#8b5cf6" data={brandChartData} />
            </BenchmarkPanel>
          </section>

          <DataTable columns={columns} data={rows} />
          <DataPagination
            hasNext={data?.hasNext ?? false}
            hasPrev={data?.hasPrev ?? page > 1}
            isFetching={isFetching}
            onPageChange={setPage}
            page={data?.page ?? page}
            pageSize={PAGE_SIZE}
            totalCount={data?.totalCount ?? rows.length}
            totalPages={data?.totalPages ?? 1}
          />
        </>
      )}
    </div>
  );
};

export default MarketBenchmarkPage;
