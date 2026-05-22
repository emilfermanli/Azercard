import { useEffect, useMemo, useRef, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Activity,
  BarChart3,
  CircleDollarSign,
  Filter,
  Globe2,
  PieChart as PieChartIcon,
  RotateCcw,
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
import Select, { type SingleValue, type StylesConfig } from 'react-select';

import { Button, DataPagination, DataTable } from '@/components';
import { useGetGeneralBanksQuery, useGetGeneralMccGroupsQuery } from '@/services/general.service';
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

type SelectOption = {
  id?: string;
  label: string;
  value: string;
};

type NumberOption = {
  label: string;
  value: number;
};

const CHART_COLORS = ['#f59e0b', '#2563eb', '#10b981', '#06b6d4', '#ef4444', '#8b5cf6'];
const PAGE_SIZE = 10;
const FLAG_OPTIONS: NumberOption[] = [
  { label: 'Bəli', value: 1 },
  { label: 'Xeyr', value: 0 },
];

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

function translateCategory(value: string | null | undefined, fallback = 'Naməlum') {
  const text = cleanOptionValue(value);
  const translations: Record<string, string> = {
    Domestic: 'Daxili',
    Foreign: 'Xarici',
    Local: 'Yerli',
    International: 'Beynəlxalq',
    Cash: 'Nağd',
    'Non-cash': 'Nağdsız',
    NonCash: 'Nağdsız',
    Card: 'Kart',
  };

  return text ? translations[text] ?? text : fallback;
}

function cleanOptionValue(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function toUniqueOptions(
  values: Array<string | null | undefined>,
  selectedValue = '',
  getLabel: (value: string) => string = (value) => value
) {
  const map = new Map<string, SelectOption>();

  values.forEach((value) => {
    const cleanValue = cleanOptionValue(value);
    if (cleanValue) map.set(cleanValue, { label: getLabel(cleanValue), value: cleanValue });
  });

  if (selectedValue && !map.has(selectedValue)) {
    map.set(selectedValue, { label: getLabel(selectedValue), value: selectedValue });
  }

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label, 'az')
  );
}

function mergeSelectOptions(current: SelectOption[], incoming: SelectOption[]) {
  const map = new Map<string, SelectOption>();

  current.forEach((option) => map.set(option.value, option));
  incoming.forEach((option) => map.set(option.value, option));

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label, 'az')
  );
}

function ensureSelectedOption(
  options: SelectOption[],
  selectedValue: string,
  getLabel: (value: string) => string = (value) => value
) {
  if (!selectedValue || options.some((option) => option.value === selectedValue)) {
    return options;
  }

  return mergeSelectOptions(options, [
    { label: getLabel(selectedValue), value: selectedValue },
  ]);
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
      <p>Orta çek: {formatAmount(item.avgTicket)}</p>
      <p>Sektor payı: {formatPercent(item.marketShare)}</p>
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
      <p>Orta çek: {formatAmount(item.avgTicket)}</p>
      <p>Yerli pay: {formatPercent(item.localRatio)}</p>
      <p>Sektor payı: {formatPercent(item.marketShare)}</p>
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
            name="Yerli pay"
            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
            tickLine={false}
            type="number"
            unit="%"
          />
          <YAxis
            dataKey="marketShare"
            name="Sektor payı"
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
  const reportMonthInputRef = useRef<HTMLInputElement>(null);
  const [bankName, setBankName] = useState('');
  const [mccGroup, setMccGroup] = useState('');
  const [sourceChannel, setSourceChannel] = useState('');
  const [operationType, setOperationType] = useState('');
  const [sourceCityCategory, setSourceCityCategory] = useState('');
  const [sourceCountryCategory, setSourceCountryCategory] = useState('');
  const [isAcquiring, setIsAcquiring] = useState<number | null>(null);
  const [isIssuing, setIsIssuing] = useState<number | null>(null);
  const [reportMonth, setReportMonth] = useState('');
  const [page, setPage] = useState(1);
  const [mccGroupOptionCache, setMccGroupOptionCache] = useState<SelectOption[]>([]);
  const [sourceChannelOptionCache, setSourceChannelOptionCache] = useState<SelectOption[]>([]);
  const [operationTypeOptionCache, setOperationTypeOptionCache] = useState<SelectOption[]>([]);
  const [sourceCityCategoryOptionCache, setSourceCityCategoryOptionCache] = useState<
    SelectOption[]
  >([]);
  const [sourceCountryCategoryOptionCache, setSourceCountryCategoryOptionCache] = useState<
    SelectOption[]
  >([]);
  const { data: banks = [], isLoading: banksLoading } = useGetGeneralBanksQuery();
  const { data: mccGroups = [], isLoading: mccGroupsLoading } =
    useGetGeneralMccGroupsQuery();
  const { data, isLoading, isError, isFetching } = useGetSectorSpendFilterQuery({
    ...(bankName ? { bankName } : {}),
    ...(mccGroup ? { mccGroup } : {}),
    ...(sourceChannel ? { sourceChannel } : {}),
    ...(operationType ? { operationType } : {}),
    ...(sourceCityCategory ? { sourceCityCategory } : {}),
    ...(sourceCountryCategory ? { sourceCountryCategory } : {}),
    ...(isAcquiring != null ? { isAcquiring } : {}),
    ...(isIssuing != null ? { isIssuing } : {}),
    ...(reportMonth ? { month: reportMonth } : {}),
    page,
    pageSize: PAGE_SIZE,
  });
  const response = data as SectorSpendResponse | undefined;
  const rows = useMemo(() => getRows(response), [response]);
  const currentPage = !response || Array.isArray(response) ? page : response.page;
  const recordCount = getTotalCount(response, rows);
  const totalPages = !response || Array.isArray(response) ? 1 : response.totalPages;
  const hasNext = !response || Array.isArray(response) ? false : response.hasNext;
  const hasPrev = !response || Array.isArray(response) ? page > 1 : response.hasPrev;

  useEffect(() => {
    setPage(1);
  }, [
    bankName,
    mccGroup,
    sourceChannel,
    operationType,
    sourceCityCategory,
    sourceCountryCategory,
    isAcquiring,
    isIssuing,
    reportMonth,
  ]);

  useEffect(() => {
    const lookupMccOptions = mccGroups
      .filter((item) => item.mccName)
      .map((item) => ({
        id: item.id,
        label: item.mccName,
        value: item.mccName,
      }));

    setMccGroupOptionCache((current) =>
      mergeSelectOptions(
        current,
        toUniqueOptions(
          [...lookupMccOptions.map((item) => item.value), ...rows.map((row) => row.mccGroup)]
        ).map((option) => ({
          ...option,
          id: lookupMccOptions.find((item) => item.value === option.value)?.id,
        }))
      )
    );
    setSourceChannelOptionCache((current) =>
      mergeSelectOptions(
        current,
        toUniqueOptions(rows.map((row) => row.sourceChannel), '', translateCategory)
      )
    );
    setOperationTypeOptionCache((current) =>
      mergeSelectOptions(
        current,
        toUniqueOptions(rows.map((row) => row.operationType), '', translateCategory)
      )
    );
    setSourceCityCategoryOptionCache((current) =>
      mergeSelectOptions(
        current,
        toUniqueOptions(rows.map((row) => row.sourceCityCategory), '', translateCategory)
      )
    );
    setSourceCountryCategoryOptionCache((current) =>
      mergeSelectOptions(
        current,
        toUniqueOptions(rows.map((row) => row.sourceCountryCategory), '', translateCategory)
      )
    );
  }, [mccGroups, rows]);

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
        header: 'Orta çek',
        cell: ({ getValue }) => formatAmount(getValue() as number),
      },
      {
        accessorKey: 'localRatioPct',
        header: 'Yerli pay',
        cell: ({ getValue }) => formatPercent(getValue() as number),
      },
      {
        accessorKey: 'sectorMarketSharePct',
        header: 'Sektor payı',
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
    () => groupRows(rows, (row) => translateCategory(row.sourceChannel, 'Naməlum kanal')),
    [rows]
  );
  const cityMix = useMemo(
    () => groupRows(rows, (row) => cleanText(row.sourceCity, 'Naməlum şəhər')),
    [rows]
  );
  const countryCategoryMix = useMemo(
    () => groupRows(rows, (row) => translateCategory(row.sourceCountryCategory)),
    [rows]
  );
  const operationMix = useMemo(
    () => groupRows(rows, (row) => translateCategory(row.operationType, 'Naməlum əməliyyat')),
    [rows]
  );
  const scatterData = useMemo<ScatterPoint[]>(
    () =>
      rows.map((row) => ({
        city: cleanText(row.sourceCity, 'Naməlum şəhər'),
        channel: translateCategory(row.sourceChannel, 'Naməlum kanal'),
        amount: row.totalAmount,
        avgTicket: row.avgTicket,
        localRatio: row.localRatioPct,
        marketShare: row.sectorMarketSharePct,
      })),
    [rows]
  );
  const bankOptions = useMemo<SelectOption[]>(
    () =>
      banks
        .filter((bank) => bank.bankName)
        .map((bank) => ({
          id: bank.id,
          label: bank.bankName,
          value: bank.id,
        })),
    [banks]
  );
  const mccGroupOptions = useMemo<SelectOption[]>(
    () => ensureSelectedOption(mccGroupOptionCache, mccGroup),
    [mccGroup, mccGroupOptionCache]
  );
  const sourceChannelOptions = useMemo(
    () =>
      ensureSelectedOption(
        sourceChannelOptionCache,
        sourceChannel,
        translateCategory
      ),
    [sourceChannel, sourceChannelOptionCache]
  );
  const operationTypeOptions = useMemo(
    () =>
      ensureSelectedOption(
        operationTypeOptionCache,
        operationType,
        translateCategory
      ),
    [operationType, operationTypeOptionCache]
  );
  const sourceCityCategoryOptions = useMemo(
    () =>
      ensureSelectedOption(
        sourceCityCategoryOptionCache,
        sourceCityCategory,
        translateCategory
      ),
    [sourceCityCategory, sourceCityCategoryOptionCache]
  );
  const sourceCountryCategoryOptions = useMemo(
    () =>
      ensureSelectedOption(
        sourceCountryCategoryOptionCache,
        sourceCountryCategory,
        translateCategory
      ),
    [sourceCountryCategory, sourceCountryCategoryOptionCache]
  );
  const selectedBank = bankOptions.find((item) => item.value === bankName) ?? null;
  const selectedMccGroup =
    mccGroupOptions.find((item) => item.value === mccGroup) ?? null;
  const selectedSourceChannel =
    sourceChannelOptions.find((item) => item.value === sourceChannel) ?? null;
  const selectedOperationType =
    operationTypeOptions.find((item) => item.value === operationType) ?? null;
  const selectedSourceCityCategory =
    sourceCityCategoryOptions.find((item) => item.value === sourceCityCategory) ?? null;
  const selectedSourceCountryCategory =
    sourceCountryCategoryOptions.find((item) => item.value === sourceCountryCategory) ??
    null;
  const selectedIsAcquiring =
    FLAG_OPTIONS.find((item) => item.value === isAcquiring) ?? null;
  const selectedIsIssuing = FLAG_OPTIONS.find((item) => item.value === isIssuing) ?? null;

  const totalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0);
  const totalLocalAmount = rows.reduce((sum, row) => sum + row.totalLocalAmount, 0);
  const totalCount = rows.reduce((sum, row) => sum + row.totalCount, 0);
  const avgTicket = totalCount > 0 ? totalAmount / totalCount : 0;
  const avgLocalRatio = average(rows.map((row) => row.localRatioPct));
  const topSector = sectorMix[0];
  const panelClass = isDark
    ? 'border-slate-800 bg-slate-900/70 text-slate-100 shadow-black/20'
    : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70';
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-500';
  const inputClass = [
    'h-10 w-full rounded-lg border px-3 text-sm outline-none ring-amber-500/40 transition focus:ring-2',
    isDark
      ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500'
      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400',
  ].join(' ');
  const outlineButtonClass = isDark
    ? 'border-slate-500 bg-slate-800/90 text-slate-100 hover:bg-slate-700 hover:text-white'
    : '';
  const selectStyles = useMemo<StylesConfig<SelectOption, false>>(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: 40,
        borderRadius: 8,
        borderColor: state.isFocused ? '#f59e0b' : isDark ? '#334155' : '#e2e8f0',
        backgroundColor: isDark ? '#020617' : '#ffffff',
        boxShadow: state.isFocused ? '0 0 0 2px rgb(245 158 11 / 0.35)' : 'none',
        ':hover': {
          borderColor: state.isFocused ? '#f59e0b' : isDark ? '#475569' : '#cbd5e1',
        },
      }),
      input: (base) => ({
        ...base,
        color: isDark ? '#f8fafc' : '#0f172a',
      }),
      menu: (base) => ({
        ...base,
        zIndex: 80,
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        backgroundColor: isDark ? '#020617' : '#ffffff',
        boxShadow: isDark
          ? '0 18px 40px rgb(0 0 0 / 0.35)'
          : '0 18px 40px rgb(15 23 42 / 0.12)',
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? '#d97706'
          : state.isFocused
            ? isDark
              ? '#78350f'
              : '#fffbeb'
            : 'transparent',
        color: state.isSelected ? '#ffffff' : isDark ? '#f8fafc' : '#0f172a',
      }),
      placeholder: (base) => ({
        ...base,
        color: isDark ? '#94a3b8' : '#64748b',
      }),
      singleValue: (base) => ({
        ...base,
        color: isDark ? '#f8fafc' : '#0f172a',
      }),
    }),
    [isDark]
  );
  const numberSelectStyles = selectStyles as unknown as StylesConfig<NumberOption, false>;
  const hasActiveFilters = Boolean(
    bankName ||
      mccGroup ||
      sourceChannel ||
      operationType ||
      sourceCityCategory ||
      sourceCountryCategory ||
      isAcquiring != null ||
      isIssuing != null ||
      reportMonth
  );

  const resetFilters = () => {
    setBankName('');
    setMccGroup('');
    setSourceChannel('');
    setOperationType('');
    setSourceCityCategory('');
    setSourceCountryCategory('');
    setIsAcquiring(null);
    setIsIssuing(null);
    setReportMonth('');
    setPage(1);
  };

  const openDatePicker = () => {
    reportMonthInputRef.current?.showPicker?.();
  };

  return (
    <div className="space-y-5">
      <DataPageHeader
        eyebrow="Sektor xərcləri"
        title="Sektor xərcləri"
        description="MCC qrupu, kanal, şəhər və daxili/xarici istiqamət üzrə xərcləmə analitikası."
        icon={WalletCards}
        tone="amber"
      />
      {isLoading && <PageLoading />}
      {isError && <PageError />}
      {!isLoading && !isError && (
        <>
          <section className={['rounded-xl border p-4 shadow-lg', panelClass].join(' ')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                  <Filter className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Filterlər</h2>
                  <p className={['text-sm', mutedText].join(' ')}>
                    Bank, MCC qrupu, kanal, əməliyyat tipi və ay üzrə xərcləmə məlumatlarını süzün.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={outlineButtonClass}
                disabled={!hasActiveFilters || isFetching}
                onClick={resetFilters}
              >
                <RotateCcw className="h-4 w-4" />
                Təmizlə
              </Button>
            </div>

            <div className="mt-4 grid gap-3 grid-cols-4">
              <label className="space-y-1.5 text-sm font-medium">
                <span className={mutedText}>Bank</span>
                <Select
                  inputId="sectorspend-filter-bank"
                  isClearable
                  isLoading={banksLoading}
                  noOptionsMessage={() => 'Bank tapılmadı'}
                  onChange={(option: SingleValue<SelectOption>) =>
                    setBankName(option?.value ?? '')
                  }
                  options={bankOptions}
                  placeholder="Bütün banklar"
                  styles={selectStyles}
                  value={selectedBank}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                <span className={mutedText}>MCC qrup</span>
                <Select
                  inputId="sectorspend-filter-mcc-group"
                  isClearable
                  isLoading={mccGroupsLoading}
                  noOptionsMessage={() => 'MCC qrupu tapılmadı'}
                  onChange={(option: SingleValue<SelectOption>) =>
                    setMccGroup(option?.value ?? '')
                  }
                  options={mccGroupOptions}
                  placeholder="Bütün MCC qrupları"
                  styles={selectStyles}
                  value={selectedMccGroup}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                <span className={mutedText}>Kanal</span>
                <Select
                  inputId="sectorspend-filter-channel"
                  isClearable
                  noOptionsMessage={() => 'Kanal tapılmadı'}
                  onChange={(option: SingleValue<SelectOption>) =>
                    setSourceChannel(option?.value ?? '')
                  }
                  options={sourceChannelOptions}
                  placeholder="Bütün kanallar"
                  styles={selectStyles}
                  value={selectedSourceChannel}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                <span className={mutedText}>Əməliyyat tipi</span>
                <Select
                  inputId="sectorspend-filter-operation"
                  isClearable
                  noOptionsMessage={() => 'Əməliyyat tipi tapılmadı'}
                  onChange={(option: SingleValue<SelectOption>) =>
                    setOperationType(option?.value ?? '')
                  }
                  options={operationTypeOptions}
                  placeholder="Bütün tiplər"
                  styles={selectStyles}
                  value={selectedOperationType}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                <span className={mutedText}>Şəhər kateqoriyası</span>
                <Select
                  inputId="sectorspend-filter-city-category"
                  isClearable
                  noOptionsMessage={() => 'Kateqoriya tapılmadı'}
                  onChange={(option: SingleValue<SelectOption>) =>
                    setSourceCityCategory(option?.value ?? '')
                  }
                  options={sourceCityCategoryOptions}
                  placeholder="Bütün kateqoriyalar"
                  styles={selectStyles}
                  value={selectedSourceCityCategory}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                <span className={mutedText}>Ölkə kateqoriyası</span>
                <Select
                  inputId="sectorspend-filter-country-category"
                  isClearable
                  noOptionsMessage={() => 'Kateqoriya tapılmadı'}
                  onChange={(option: SingleValue<SelectOption>) =>
                    setSourceCountryCategory(option?.value ?? '')
                  }
                  options={sourceCountryCategoryOptions}
                  placeholder="Bütün kateqoriyalar"
                  styles={selectStyles}
                  value={selectedSourceCountryCategory}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                <span className={mutedText}>Ekvayrinq</span>
                <Select
                  inputId="sectorspend-filter-acquiring"
                  isClearable
                  isSearchable={false}
                  noOptionsMessage={() => 'Dəyər tapılmadı'}
                  onChange={(option: SingleValue<NumberOption>) =>
                    setIsAcquiring(option?.value ?? null)
                  }
                  options={FLAG_OPTIONS}
                  placeholder="Hamısı"
                  styles={numberSelectStyles}
                  value={selectedIsAcquiring}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                <span className={mutedText}>Emitent</span>
                <Select
                  inputId="sectorspend-filter-issuing"
                  isClearable
                  isSearchable={false}
                  noOptionsMessage={() => 'Dəyər tapılmadı'}
                  onChange={(option: SingleValue<NumberOption>) =>
                    setIsIssuing(option?.value ?? null)
                  }
                  options={FLAG_OPTIONS}
                  placeholder="Hamısı"
                  styles={numberSelectStyles}
                  value={selectedIsIssuing}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                <span className={mutedText}>Ay</span>
                <input
                  ref={reportMonthInputRef}
                  className={inputClass}
                  type="date"
                  value={reportMonth}
                  onChange={(event) => setReportMonth(event.target.value)}
                  onClick={openDatePicker}
                  onFocus={openDatePicker}
                />
              </label>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ümumi qeyd" value={formatNumber(recordCount)} />
            <StatCard label="Ümumi məbləğ" value={formatShortAmount(totalAmount)} />
            <StatCard label="Yerli məbləğ" value={formatShortAmount(totalLocalAmount)} />
            <StatCard label="Orta çek" value={formatAmount(avgTicket)} />
          </div>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
            <Panel
              icon={Activity}
              title="Yerli pay və sektor payı"
              subtitle="Nöqtə ölçüsü ümumi məbləğə görədir"
            >
              <LocalRatioScatter data={scatterData} />
            </Panel>

            <Panel
              icon={CircleDollarSign}
              title="Ən böyük sektor"
              subtitle="MCC qrupu üzrə ən yüksək xərcləmə"
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
                      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Sektor payı</p>
                      <p className="font-semibold">{formatPercent(topSector.marketShare)}</p>
                    </div>
                    <div>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Yerli pay</p>
                      <p className="font-semibold">{formatPercent(avgLocalRatio)}</p>
                    </div>
                    <div>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Əməliyyat</p>
                      <p className="font-semibold">{formatNumber(topSector.count)}</p>
                    </div>
                    <div>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Orta çek</p>
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
              title="Ölkə kateqoriyası"
              subtitle="Daxili və xarici xərcləmə bölgüsü"
            >
              <DonutChart data={countryCategoryMix} />
            </Panel>

            <Panel
              icon={BarChart3}
              title="Kanallar"
              subtitle="Mənbə kanalı üzrə xərcləmə həcmi"
            >
              <HorizontalChart color="#2563eb" data={channelMix} />
            </Panel>
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            <Panel
              icon={WalletCards}
              title="MCC sektorları"
              subtitle="MCC qrupu üzrə ən yüksək xərclər"
            >
              <HorizontalChart color="#f59e0b" data={sectorMix} />
            </Panel>

            <Panel
              icon={Globe2}
              title="Şəhərlər"
              subtitle="Mənbə şəhəri üzrə xərcləmə"
            >
              <HorizontalChart color="#06b6d4" data={cityMix} />
            </Panel>

            <Panel
              icon={Activity}
              title="Əməliyyat tipi"
              subtitle="Nağd və nağdsız bölgüsü"
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
