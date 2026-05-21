import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Activity,
  BarChart3,
  CircleDollarSign,
  Globe2,
  PieChart as PieChartIcon,
  WalletCards,
} from 'lucide-react';
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
import { useGetSectorSpendFilterQuery } from '@/services/sectorspend.service';
import type {
  SectorSpendItem,
  SectorSpendPaginatedResponse,
} from '@/types/sectorspend.type';
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

type SectorSpendResponse = SectorSpendPaginatedResponse | SectorSpendItem[];

type SummaryItem = {
  label: string;
  amount: number;
  count: number;
  localAmount: number;
  avgTicket: number;
  localRatio: number;
  marketShare: number;
};

type ChartItem = SummaryItem & {
  name: string;
  value: number;
};

type ScatterPoint = {
  city: string;
  channel: string;
  amount: number;
  avgTicket: number;
  localRatio: number;
  marketShare: number;
};

const CHART_COLORS = ['#f59e0b', '#2563eb', '#10b981', '#06b6d4', '#ef4444', '#8b5cf6'];
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

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function cleanText(value: string | null | undefined, fallback: string) {
  const text = value?.trim();
  return text || fallback;
}

function getRows(data: SectorSpendResponse | undefined) {
  if (!data) return [];
  return Array.isArray(data) ? data : data.items;
}

function getTotalCount(data: SectorSpendResponse | undefined, rows: SectorSpendItem[]) {
  if (!data || Array.isArray(data)) return rows.length;
  return data.totalCount;
}

function groupRows(
  rows: SectorSpendItem[],
  getLabel: (row: SectorSpendItem) => string
) {
  const map = new Map<string, SummaryItem & { avgTicketValues: number[]; ratios: number[]; shares: number[] }>();

  rows.forEach((row) => {
    const label = getLabel(row);
    const current = map.get(label);

    if (current) {
      current.amount += row.totalAmount;
      current.count += row.totalCount;
      current.localAmount += row.totalLocalAmount;
      current.avgTicketValues.push(row.avgTicket);
      current.ratios.push(row.localRatioPct);
      current.shares.push(row.sectorMarketSharePct);
      current.avgTicket = average(current.avgTicketValues);
      current.localRatio = average(current.ratios);
      current.marketShare = Math.max(...current.shares);
      return;
    }

    map.set(label, {
      label,
      amount: row.totalAmount,
      count: row.totalCount,
      localAmount: row.totalLocalAmount,
      avgTicket: row.avgTicket,
      localRatio: row.localRatioPct,
      marketShare: row.sectorMarketSharePct,
      avgTicketValues: [row.avgTicket],
      ratios: [row.localRatioPct],
      shares: [row.sectorMarketSharePct],
    });
  });

  return Array.from(map.values())
    .map(({ avgTicketValues: _avgTicketValues, ratios: _ratios, shares: _shares, ...item }) => ({
      ...item,
      name: item.label,
      value: item.amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function Panel({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof WalletCards;
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
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
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
      <p>Say: {formatNumber(item.count)}</p>
      <p>Avg ticket: {formatAmount(item.avgTicket)}</p>
      <p>Sector payı: {formatPercent(item.marketShare)}</p>
    </div>
  );
}

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ScatterPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 shadow-xl">
      <p className="font-semibold">{item.city}</p>
      <p className="mt-1">{item.channel}</p>
      <p>Məbləğ: {formatAmount(item.amount)}</p>
      <p>Avg ticket: {formatAmount(item.avgTicket)}</p>
      <p>Local ratio: {formatPercent(item.localRatio)}</p>
      <p>Sector payı: {formatPercent(item.marketShare)}</p>
    </div>
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

function HorizontalChart({
  data,
  color,
}: {
  data: ChartItem[];
  color: string;
}) {
  const isDark = useShellTheme();
  const chartData = data.slice(0, 8);

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

function LocalRatioScatter({ data }: { data: ScatterPoint[] }) {
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
            dataKey="localRatio"
            name="Local ratio"
            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
            tickLine={false}
            type="number"
            unit="%"
          />
          <YAxis
            dataKey="marketShare"
            name="Sector payı"
            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
            tickLine={false}
            type="number"
            unit="%"
          />
          <ZAxis dataKey="amount" range={[60, 520]} />
          <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data.slice(0, 80)} fill="#f59e0b" fillOpacity={0.78} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

const SectorSpendPage: React.FC = () => {
  const isDark = useShellTheme();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, isFetching } = useGetSectorSpendFilterQuery({
    page,
    pageSize: PAGE_SIZE,
  });
  const response = data as SectorSpendResponse | undefined;
  const rows = getRows(response);
  const currentPage = !response || Array.isArray(response) ? page : response.page;
  const recordCount = getTotalCount(response, rows);
  const totalPages = !response || Array.isArray(response) ? 1 : response.totalPages;
  const hasNext = !response || Array.isArray(response) ? false : response.hasNext;
  const hasPrev = !response || Array.isArray(response) ? page > 1 : response.hasPrev;

  const columns = useMemo<ColumnDef<SectorSpendItem, unknown>[]>(
    () => [
      { accessorKey: 'bankName', header: 'Bank' },
      { accessorKey: 'mccGroup', header: 'MCC qrup' },
      { accessorKey: 'mcc', header: 'MCC' },
      { accessorKey: 'sourceCity', header: 'Şəhər' },
      { accessorKey: 'sourceCityCategory', header: 'Şəhər tipi' },
      { accessorKey: 'sourceChannel', header: 'Kanal' },
      { accessorKey: 'operationType', header: 'Əməliyyat tipi' },
      {
        accessorKey: 'reportMonth',
        header: 'Ay',
        cell: ({ getValue }) => formatDate(getValue() as string),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Məbləğ',
        cell: ({ getValue }) => formatAmount(getValue() as number),
      },
      {
        accessorKey: 'avgTicket',
        header: 'Avg ticket',
        cell: ({ getValue }) => formatAmount(getValue() as number),
      },
      {
        accessorKey: 'localRatioPct',
        header: 'Local ratio',
        cell: ({ getValue }) => formatPercent(getValue() as number),
      },
      {
        accessorKey: 'sectorMarketSharePct',
        header: 'Sector payı',
        cell: ({ getValue }) => formatPercent(getValue() as number),
      },
      {
        accessorKey: 'totalCount',
        header: 'Say',
        cell: ({ getValue }) => formatNumber(getValue() as number),
      },
    ],
    []
  );

  const sectorMix = useMemo(
    () => groupRows(rows, (row) => cleanText(row.mccGroup, 'Naməlum sektor')),
    [rows]
  );
  const channelMix = useMemo(
    () => groupRows(rows, (row) => cleanText(row.sourceChannel, 'Naməlum kanal')),
    [rows]
  );
  const cityMix = useMemo(
    () => groupRows(rows, (row) => cleanText(row.sourceCity, 'Naməlum şəhər')),
    [rows]
  );
  const countryCategoryMix = useMemo(
    () => groupRows(rows, (row) => cleanText(row.sourceCountryCategory, 'Naməlum')),
    [rows]
  );
  const operationMix = useMemo(
    () => groupRows(rows, (row) => cleanText(row.operationType, 'Naməlum əməliyyat')),
    [rows]
  );
  const scatterData = useMemo<ScatterPoint[]>(
    () =>
      rows.map((row) => ({
        city: cleanText(row.sourceCity, 'Naməlum şəhər'),
        channel: cleanText(row.sourceChannel, 'Naməlum kanal'),
        amount: row.totalAmount,
        avgTicket: row.avgTicket,
        localRatio: row.localRatioPct,
        marketShare: row.sectorMarketSharePct,
      })),
    [rows]
  );

  const totalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0);
  const totalLocalAmount = rows.reduce((sum, row) => sum + row.totalLocalAmount, 0);
  const totalCount = rows.reduce((sum, row) => sum + row.totalCount, 0);
  const avgTicket = totalCount > 0 ? totalAmount / totalCount : 0;
  const avgLocalRatio = average(rows.map((row) => row.localRatioPct));
  const topSector = sectorMix[0];

  return (
    <div className="space-y-5">
      <DataPageHeader
        eyebrow="Sektor xərcləri"
        title="Sector Spend"
        description="MCC qrupu, kanal, şəhər və domestic/foreign istiqaməti üzrə xərcləmə analitikası."
        icon={WalletCards}
        tone="amber"
      />
      {isLoading && <PageLoading />}
      {isError && <PageError />}
      {!isLoading && !isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ümumi qeyd" value={formatNumber(recordCount)} />
            <StatCard label="Ümumi məbləğ" value={formatShortAmount(totalAmount)} />
            <StatCard label="Local məbləğ" value={formatShortAmount(totalLocalAmount)} />
            <StatCard label="Avg ticket" value={formatAmount(avgTicket)} />
          </div>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
            <Panel
              icon={Activity}
              title="Local ratio və sector payı"
              subtitle="Bubble ölçüsü totalAmount dəyərinə görədir"
            >
              <LocalRatioScatter data={scatterData} />
            </Panel>

            <Panel
              icon={CircleDollarSign}
              title="Ən böyük sektor"
              subtitle="MCC group üzrə ən yüksək xərcləmə"
            >
              {topSector ? (
                <div
                  className={[
                    'rounded-lg border p-4',
                    isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50',
                  ].join(' ')}
                >
                  <p className="text-sm font-semibold">{topSector.label}</p>
                  <p className="mt-2 text-4xl font-semibold tabular-nums text-amber-500">
                    {formatShortAmount(topSector.amount)}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sector payı</p>
                      <p className="font-semibold">{formatPercent(topSector.marketShare)}</p>
                    </div>
                    <div>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Local ratio</p>
                      <p className="font-semibold">{formatPercent(avgLocalRatio)}</p>
                    </div>
                    <div>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Əməliyyat</p>
                      <p className="font-semibold">{formatNumber(topSector.count)}</p>
                    </div>
                    <div>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Avg ticket</p>
                      <p className="font-semibold">{formatAmount(topSector.avgTicket)}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </Panel>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Panel
              icon={PieChartIcon}
              title="Country category"
              subtitle="Domestic və Foreign xərcləmə bölgüsü"
            >
              <DonutChart data={countryCategoryMix} />
            </Panel>

            <Panel
              icon={BarChart3}
              title="Kanallar"
              subtitle="Source channel üzrə xərcləmə həcmi"
            >
              <HorizontalChart color="#2563eb" data={channelMix} />
            </Panel>
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            <Panel
              icon={WalletCards}
              title="MCC sektorları"
              subtitle="MCC group üzrə top xərclər"
            >
              <HorizontalChart color="#f59e0b" data={sectorMix} />
            </Panel>

            <Panel
              icon={Globe2}
              title="Şəhərlər"
              subtitle="Source city üzrə xərcləmə"
            >
              <HorizontalChart color="#06b6d4" data={cityMix} />
            </Panel>

            <Panel
              icon={Activity}
              title="Əməliyyat tipi"
              subtitle="Cash və non-cash bölgüsü"
            >
              <HorizontalChart color="#10b981" data={operationMix} />
            </Panel>
          </section>

          <DataTable columns={columns} data={rows} />
          <DataPagination
            hasNext={hasNext}
            hasPrev={hasPrev}
            isFetching={isFetching}
            onPageChange={setPage}
            page={currentPage}
            pageSize={PAGE_SIZE}
            totalCount={recordCount}
            totalPages={totalPages}
          />
        </>
      )}
    </div>
  );
};

export default SectorSpendPage;
