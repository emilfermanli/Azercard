import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Filter,
  Globe2,
  Landmark,
  MapPinned,
  Columns2,
  PanelRightClose,
  PanelRightOpen,
  RefreshCcw,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Select, { type SingleValue, type StylesConfig } from 'react-select';

import { Button } from '@/components';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import {
  useDeviceCategoryTotals,
  useDeviceMonthlyTotals,
  useGetDevicesFiltersQuery,
  useGetDevicesLatestMonthQuery,
  useGetDevicesShareQuery,
  useGetDevicesTotalQuery,
  useGetDevicesXyAnalysisQuery,
} from '@/services/devices.service';

type Trend = 'up' | 'down' | 'flat';

type SelectOption = {
  label: string;
  value: string;
};

type SummaryCard = {
  label: string;
  value: string;
  share: string;
  trend: Trend;
  tone: string;
  details: string[];
};

type MatrixCell = {
  amount: number;
  trend: Trend;
};

type DisplayRow = {
  name: string;
  values: MatrixCell[];
};

const DEFAULT_CHART_WIDTH = 380;
const MIN_CHART_WIDTH = 300;
const STACK_CHART_WIDTH = 260;
const MIN_TABLE_WIDTH = 520;
const SPLITTER_SPACE = 28;

// Kart fonu və donut rəng palitraları (kateqoriya sayı dəyişkən olduğu üçün dövr edir).
const CARD_TONES = [
  'from-sky-500 to-cyan-500',
  'from-violet-600 to-fuchsia-600',
  'from-emerald-500 to-green-600',
  'from-amber-300 to-yellow-400',
  'from-rose-500 to-pink-600',
];
const PIE_COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'];

// Sağ panel rejimləri (Pay = donut, Trend = xətti qrafik).
type RightPanelMode = 'share' | 'trend';
const RIGHT_PANEL_MODES: Array<{ value: RightPanelMode; label: string }> = [
  { value: 'share', label: 'Pay' },
  { value: 'trend', label: 'Trend' },
];
const TREND_MONTH_COUNT = 6;
const MONTHS_AZ = [
  'Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn',
  'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek',
];

// Statik tablar — backend qarşılığı yoxdur (period/dimension).
const periodTabs = ['Ay', 'İl'];
const dimensionTabs = [
  { label: 'Kart', icon: CreditCard },
  { label: 'ÖS', icon: Landmark },
  { label: 'AZC', icon: MapPinned },
  { label: 'Bank', icon: Landmark },
  { label: 'Region', icon: Globe2 },
];

function trendOf(diff: number | null | undefined): Trend {
  if (diff == null || diff === 0) return 'flat';
  return diff > 0 ? 'up' : 'down';
}

/** API ISO tarixini ("...T00:00:00") date input dəyərinə çevirir ("YYYY-MM-DD"). */
function toDateInput(iso: string | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}

/** Date input dəyərini ("YYYY-MM-DD") API formatına çevirir (ayın 1-i). */
function toReportMonth(dateInput: string): string {
  const [year, month] = dateInput.split('-');
  return `${year}-${month}-01T00:00:00`;
}

/** "YYYY-MM-01T00:00:00" tarixini `delta` ay sürüşdürür. */
function shiftMonth(iso: string, delta: number): string {
  const date = new Date(iso);
  const shifted = new Date(Date.UTC(date.getFullYear(), date.getMonth() + delta, 1));
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01T00:00:00`;
}

function trendClasses(trend: Trend) {
  if (trend === 'up') return 'text-emerald-400';
  if (trend === 'down') return 'text-red-400';
  return 'text-slate-400';
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === 'flat') return <ArrowLeftRight className="h-4 w-4" />;
  const Icon = trend === 'up' ? ArrowUp : ArrowDown;
  return <Icon className="h-4 w-4" />;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold">{item.name}</p>
      <p className="mt-1">{item.value}%</p>
    </div>
  );
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold">{label}</p>
      <p className="mt-1 tabular-nums">{(payload[0].value ?? 0).toLocaleString('az-AZ')}</p>
    </div>
  );
}

const CardActivityPage: React.FC = () => {
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(DEFAULT_CHART_WIDTH);
  const [chartStacked, setChartStacked] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('share');
  const [isTransposed, setIsTransposed] = useState(false);
  const isDark = useShellTheme();
  const reportMonthInputRef = useRef<HTMLInputElement>(null);

  // --- Filter state (tətbiq olunmuş + qaralama) ---
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [regionName, setRegionName] = useState('');
  const [mccName, setMccName] = useState('');
  const [retailCategory, setRetailCategory] = useState('');
  const [monthInput, setMonthInput] = useState(''); // "YYYY-MM-DD", boş = ən son ay
  const [draftBankName, setDraftBankName] = useState('');
  const [draftRegionName, setDraftRegionName] = useState('');
  const [draftMccName, setDraftMccName] = useState('');
  const [draftRetailCategory, setDraftRetailCategory] = useState('');
  const [draftMonthInput, setDraftMonthInput] = useState('');

  // --- API ---
  const { data: latestMonth } = useGetDevicesLatestMonthQuery();
  const { data: filtersData } = useGetDevicesFiltersQuery();

  const reportMonth = monthInput ? toReportMonth(monthInput) : latestMonth?.reportMonth;
  const prevMonth = reportMonth ? shiftMonth(reportMonth, -1) : undefined;

  // Kartlar/donut üçün (retailCategory xaric — hər kart bir kateqoriyadır).
  const baseFilters = useMemo(
    () => ({
      ...(bankName ? { bankName } : {}),
      ...(regionName ? { regionName } : {}),
      ...(mccName ? { mccName } : {}),
    }),
    [bankName, regionName, mccName]
  );
  // Cəmi/matris üçün (retailCategory daxil).
  const queryFilters = useMemo(
    () => ({
      ...baseFilters,
      ...(retailCategory ? { retailCategory } : {}),
    }),
    [baseFilters, retailCategory]
  );

  const retailCategories = useMemo(() => {
    const all = filtersData?.retailCategories ?? [];
    return retailCategory ? all.filter((category) => category === retailCategory) : all;
  }, [filtersData, retailCategory]);

  const { data: totalData } = useGetDevicesTotalQuery(
    { reportMonth: reportMonth ?? '', ...queryFilters },
    { skip: !reportMonth }
  );

  const { data: xyData } = useGetDevicesXyAnalysisQuery(
    {
      reportMonth: reportMonth ?? '',
      xDimension: 'retail_category',
      yDimension: 'region_name',
      ...queryFilters,
    },
    { skip: !reportMonth }
  );

  const { data: categoryTotals } = useDeviceCategoryTotals(
    reportMonth,
    prevMonth,
    retailCategories,
    baseFilters
  );

  // Donut — /share (yalnız panel açıq və "Pay" rejimində yüklənir).
  // Hər sətirdəki sharePctByRetailCat kateqoriya üzrə eynidir, ona görə
  // bir səhifə (PageSize 100) bütün kateqoriyaları əhatə edir.
  const { data: shareData } = useGetDevicesShareQuery(
    { reportMonth: reportMonth ?? '', Page: 1, PageSize: 100, ...queryFilters },
    { skip: !reportMonth || !chartOpen || rightPanelMode !== 'share' }
  );

  // Trend qrafiki — son 6 ay (yalnız panel açıq və "Trend" rejimində yüklənir).
  const trendMonths = useMemo(
    () =>
      reportMonth
        ? Array.from({ length: TREND_MONTH_COUNT }, (_, index) =>
            shiftMonth(reportMonth, index - (TREND_MONTH_COUNT - 1))
          )
        : [],
    [reportMonth]
  );
  const { data: monthlyTotals } = useDeviceMonthlyTotals(
    trendMonths,
    queryFilters,
    !reportMonth || !chartOpen || rightPanelMode !== 'trend'
  );
  const trendChartData = useMemo(
    () =>
      monthlyTotals.map((row) => {
        const monthIndex = Number(row.reportMonth.slice(5, 7)) - 1;
        return {
          label: `${MONTHS_AZ[monthIndex] ?? ''} ${row.reportMonth.slice(2, 4)}`,
          total: row.total,
        };
      }),
    [monthlyTotals]
  );

  // Drawer açılanda qaralamanı tətbiq olunmuş dəyərlərlə doldur.
  useEffect(() => {
    if (filterDrawerOpen) {
      setDraftBankName(bankName);
      setDraftRegionName(regionName);
      setDraftMccName(mccName);
      setDraftRetailCategory(retailCategory);
      setDraftMonthInput(monthInput || toDateInput(latestMonth?.reportMonth));
    }
  }, [filterDrawerOpen, bankName, regionName, mccName, retailCategory, monthInput, latestMonth]);

  // --- Törəmə data ---
  const grandTotal = totalData?.total ?? 0;
  const totalValue = grandTotal ? grandTotal.toLocaleString('az-AZ') : '—';

  const summaryCards = useMemo<SummaryCard[]>(
    () =>
      categoryTotals.map((row, index) => {
        const details: string[] = [];
        if (row.prevTotal != null) {
          details.push(`Keçən ay ${row.prevTotal.toLocaleString('az-AZ')}`);
          const diff = row.total - row.prevTotal;
          details.push(`${diff >= 0 ? '+' : ''}${diff.toLocaleString('az-AZ')}`);
        }
        return {
          label: row.category,
          value: row.total.toLocaleString('az-AZ'),
          share: grandTotal ? `${Math.round((row.total / grandTotal) * 100)}%` : '—',
          trend:
            row.prevTotal == null ? 'flat' : trendOf(row.total - row.prevTotal),
          tone: CARD_TONES[index % CARD_TONES.length],
          details,
        };
      }),
    [categoryTotals, grandTotal]
  );

  // retailCategory → sharePctByRetailCat (hər kateqoriyadan ilk sətir).
  const shareByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of shareData?.items ?? []) {
      if (!map.has(item.retailCategory)) {
        map.set(item.retailCategory, item.sharePctByRetailCat);
      }
    }
    return map;
  }, [shareData]);
  const pieData = useMemo(() => {
    const categories = retailCategories.length
      ? retailCategories
      : Array.from(shareByCategory.keys());
    return categories
      .filter((category) => shareByCategory.has(category))
      .map((category, index) => ({
        name: category,
        value: Math.round(shareByCategory.get(category) ?? 0),
        color: PIE_COLORS[index % PIE_COLORS.length],
      }));
  }, [retailCategories, shareByCategory]);

  // xy-analysis → pivot (sütun = xValue, sətir = yValue).
  const xyItems = useMemo(() => xyData ?? [], [xyData]);
  const channels = useMemo(() => {
    const seen = new Set<string>();
    const values: string[] = [];
    for (const item of xyItems) {
      if (!seen.has(item.xValue)) {
        seen.add(item.xValue);
        values.push(item.xValue);
      }
    }
    return values;
  }, [xyItems]);
  const matrixRows = useMemo<DisplayRow[]>(() => {
    const seen = new Set<string>();
    const yValues: string[] = [];
    for (const item of xyItems) {
      if (!seen.has(item.yValue)) {
        seen.add(item.yValue);
        yValues.push(item.yValue);
      }
    }
    const cellMap = new Map<string, (typeof xyItems)[number]>();
    for (const item of xyItems) {
      cellMap.set(`${item.xValue}|${item.yValue}`, item);
    }
    return yValues.map((y) => ({
      name: y,
      values: channels.map((x) => {
        const item = cellMap.get(`${x}|${y}`);
        return {
          amount: item?.deviceCount ?? 0,
          trend: trendOf(item?.momDiff),
        };
      }),
    }));
  }, [xyItems, channels]);

  const panel = isDark
    ? 'border-slate-800 bg-slate-900/70 text-slate-100 shadow-black/20'
    : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70';
  const subtlePanel = isDark
    ? 'border-slate-800 bg-slate-950/45'
    : 'border-slate-200 bg-slate-50';
  const muted = isDark ? 'text-slate-300' : 'text-slate-500';
  const tableColumns = isTransposed ? matrixRows.map((row) => row.name) : channels;
  const tableRows: DisplayRow[] = isTransposed
    ? channels.map((channel, channelIndex) => ({
        name: channel,
        values: matrixRows.map((row) => row.values[channelIndex] ?? { amount: 0, trend: 'flat' }),
      }))
    : matrixRows;
  const matrixGridStyle = {
    gridTemplateColumns: `8rem repeat(${tableColumns.length}, minmax(5.75rem, 1fr))`,
  };
  const matrixMinWidth = `${8 + tableColumns.length * 5.75 + (tableColumns.length + 1) * 0.5}rem`;

  const selectOptions = useMemo(() => {
    const toOptions = (values: string[] = []) => {
      const seen = new Set<string>();
      const options: SelectOption[] = [];
      for (const value of values) {
        if (value && !seen.has(value)) {
          seen.add(value);
          options.push({ label: value, value });
        }
      }
      return options;
    };
    return {
      banks: toOptions(filtersData?.bankNames),
      regions: toOptions(filtersData?.regionNames),
      mccs: toOptions(filtersData?.mccNames),
      retails: toOptions(filtersData?.retailCategories),
    };
  }, [filtersData]);

  const selectedDraftBank =
    selectOptions.banks.find((option) => option.value === draftBankName) ?? null;
  const selectedDraftRegion =
    selectOptions.regions.find((option) => option.value === draftRegionName) ?? null;
  const selectedDraftMcc =
    selectOptions.mccs.find((option) => option.value === draftMccName) ?? null;
  const selectedDraftRetail =
    selectOptions.retails.find((option) => option.value === draftRetailCategory) ?? null;

  const inputClass = [
    'h-10 w-full rounded-lg border px-3 text-sm outline-none ring-blue-500/40 transition focus:ring-2',
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
        borderColor: state.isFocused ? '#3b82f6' : isDark ? '#334155' : '#e2e8f0',
        backgroundColor: isDark ? '#020617' : '#ffffff',
        boxShadow: state.isFocused ? '0 0 0 2px rgb(59 130 246 / 0.4)' : 'none',
        ':hover': {
          borderColor: state.isFocused ? '#3b82f6' : isDark ? '#475569' : '#cbd5e1',
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
          ? '#2563eb'
          : state.isFocused
            ? isDark
              ? '#1e293b'
              : '#eff6ff'
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

  const latestInput = toDateInput(latestMonth?.reportMonth);
  const hasActiveFilters = Boolean(
    bankName ||
      regionName ||
      mccName ||
      retailCategory ||
      (monthInput && monthInput !== latestInput)
  );
  const hasDraftSelection = Boolean(
    draftBankName ||
      draftRegionName ||
      draftMccName ||
      draftRetailCategory ||
      (draftMonthInput && draftMonthInput !== latestInput)
  );

  const openDatePicker = () => reportMonthInputRef.current?.showPicker?.();

  const applyFilters = () => {
    setBankName(draftBankName);
    setRegionName(draftRegionName);
    setMccName(draftMccName);
    setRetailCategory(draftRetailCategory);
    setMonthInput(draftMonthInput && draftMonthInput !== latestInput ? draftMonthInput : '');
    setFilterDrawerOpen(false);
  };

  const resetFilters = () => {
    setBankName('');
    setRegionName('');
    setMccName('');
    setRetailCategory('');
    setMonthInput('');
    setDraftBankName('');
    setDraftRegionName('');
    setDraftMccName('');
    setDraftRetailCategory('');
    setDraftMonthInput(latestInput);
    setFilterDrawerOpen(false);
  };

  const handleSplitterPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!splitContainerRef.current || !chartOpen) return;
    event.preventDefault();

    const container = splitContainerRef.current;
    const rect = container.getBoundingClientRect();
    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onPointerMove = (moveEvent: PointerEvent) => {
      const maxChartWidth = Math.max(
        MIN_CHART_WIDTH,
        rect.width - MIN_TABLE_WIDTH - SPLITTER_SPACE
      );
      const nextChartWidth = rect.right - moveEvent.clientX - SPLITTER_SPACE;

      if (nextChartWidth < STACK_CHART_WIDTH) {
        setChartStacked(true);
        setChartWidth(MIN_CHART_WIDTH);
        return;
      }

      setChartStacked(false);
      setChartWidth(Math.min(Math.max(nextChartWidth, MIN_CHART_WIDTH), maxChartWidth));
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp, { once: true });
  };

  return (
    <div className="space-y-5 pt-2 pb-2 pl-2 pr-4 sm:pt-3 sm:pb-3 sm:pl-3 sm:pr-6">
      <div
        aria-hidden={!filterDrawerOpen}
        className="fixed inset-0 z-[110] h-dvh transition pointer-events-none"
      >
        <button
          aria-label="Filter panelini bağla"
          className={[
            'absolute inset-0 bg-slate-950/40 transition-opacity',
            filterDrawerOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none',
          ].join(' ')}
          onClick={() => setFilterDrawerOpen(false)}
          type="button"
        />
        <aside
          aria-label="Filterlər"
          className={[
            'fixed bottom-0 right-0 top-0 flex h-dvh min-h-dvh w-full max-w-[420px] flex-col border-l shadow-2xl transition-transform duration-300 ease-out pointer-events-auto',
            filterDrawerOpen ? 'translate-x-0' : 'translate-x-full',
            isDark
              ? 'border-slate-800 bg-slate-950 text-slate-100'
              : 'border-slate-200 bg-white text-slate-950',
          ].join(' ')}
        >
          <button
            aria-expanded={filterDrawerOpen}
            aria-label={filterDrawerOpen ? 'Filter panelini bağla' : 'Filter panelini aç'}
            className={[
              'absolute right-full bottom-32 z-[90] -rotate-90 origin-center flex h-8 items-center gap-1.5 rounded-t-md border-x border-t px-3.5 text-[10px] font-bold uppercase tracking-wider shadow-2xl transition-all duration-300 pointer-events-auto',
              filterDrawerOpen
                ? 'translate-x-[calc(50%-16px)]'
                : 'translate-x-[calc(50%-28px)]',
              isDark
                ? 'border-blue-500/30 bg-slate-950/95 text-blue-400 hover:text-blue-300 hover:bg-slate-900'
                : 'border-blue-200 bg-white/95 text-blue-600 hover:text-blue-700 hover:bg-blue-50',
            ].join(' ')}
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
            type="button"
          >
            {filterDrawerOpen ? (
              <ChevronRight className="h-3.5 w-3.5 rotate-90 text-blue-500" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5 rotate-90 text-blue-500" />
            )}
            <span>Filterlər</span>
            <Filter className="h-3 w-3 text-blue-500" />
            {hasActiveFilters && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"
                aria-hidden="true"
              />
            )}
          </button>
          <div
            className={[
              'flex items-start justify-between gap-3 border-b p-4',
              isDark ? 'border-slate-800' : 'border-slate-200',
            ].join(' ')}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
                <Filter className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Filterlər</h2>
                <p className={['text-sm', muted].join(' ')}>
                  Kart aktivliyini bank, region, MCC, kateqoriya və ay üzrə süzün.
                </p>
              </div>
            </div>
            <button
              aria-label="Filter panelini bağla"
              className={[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition',
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              ].join(' ')}
              onClick={() => setFilterDrawerOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="grid gap-3">
              <label className="space-y-1.5 text-sm font-medium">
                <span className={muted}>Bank</span>
                <Select
                  inputId="devices-filter-bank"
                  isClearable
                  noOptionsMessage={() => 'Bank tapılmadı'}
                  onChange={(option: SingleValue<SelectOption>) =>
                    setDraftBankName(option?.value ?? '')
                  }
                  options={selectOptions.banks}
                  placeholder="Bütün banklar"
                  styles={selectStyles}
                  value={selectedDraftBank}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                <span className={muted}>Region</span>
                <Select
                  inputId="devices-filter-region"
                  isClearable
                  noOptionsMessage={() => 'Region tapılmadı'}
                  onChange={(option: SingleValue<SelectOption>) =>
                    setDraftRegionName(option?.value ?? '')
                  }
                  options={selectOptions.regions}
                  placeholder="Bütün regionlar"
                  styles={selectStyles}
                  value={selectedDraftRegion}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                <span className={muted}>MCC</span>
                <Select
                  inputId="devices-filter-mcc"
                  isClearable
                  noOptionsMessage={() => 'MCC tapılmadı'}
                  onChange={(option: SingleValue<SelectOption>) =>
                    setDraftMccName(option?.value ?? '')
                  }
                  options={selectOptions.mccs}
                  placeholder="Bütün MCC-lər"
                  styles={selectStyles}
                  value={selectedDraftMcc}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                <span className={muted}>Kateqoriya</span>
                <Select
                  inputId="devices-filter-retail"
                  isClearable
                  noOptionsMessage={() => 'Kateqoriya tapılmadı'}
                  onChange={(option: SingleValue<SelectOption>) =>
                    setDraftRetailCategory(option?.value ?? '')
                  }
                  options={selectOptions.retails}
                  placeholder="Bütün kateqoriyalar"
                  styles={selectStyles}
                  value={selectedDraftRetail}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium">
                <span className={muted}>Ay</span>
                <input
                  ref={reportMonthInputRef}
                  className={inputClass}
                  type="date"
                  value={draftMonthInput}
                  onChange={(event) => setDraftMonthInput(event.target.value)}
                  onClick={openDatePicker}
                  onFocus={openDatePicker}
                />
              </label>
            </div>
          </div>

          <div
            className={[
              'flex items-center justify-between gap-3 border-t p-4',
              isDark ? 'border-slate-800' : 'border-slate-200',
            ].join(' ')}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={outlineButtonClass}
              disabled={!hasActiveFilters && !hasDraftSelection}
              onClick={resetFilters}
            >
              <RotateCcw className="h-4 w-4" />
              Təmizlə
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={applyFilters}
            >
              Təsdiq et
            </Button>
          </div>
        </aside>
      </div>

      <section className={['rounded-xl border px-4 py-2 shadow-lg', panel].join(' ')}>
        <p className={['text-xs font-semibold', muted].join(' ')}>Cəmi</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{totalValue}</p>
      </section>

      <section className="grid gap-3 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className={[
              'min-h-[9.75rem] rounded-xl border border-white/10 bg-gradient-to-br p-4 text-white shadow-lg',
              card.tone,
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-bold tabular-nums">{card.value}</p>
                <span className="mt-3 inline-flex min-w-20 items-center justify-center rounded-md border border-white/50 px-3 py-1 text-xs font-bold">
                  {card.label}
                </span>
              </div>
              <div className={['mt-12 flex items-center gap-1 text-lg font-bold', trendClasses(card.trend)].join(' ')}>
                <TrendIcon trend={card.trend} />
                <span className="text-white">{card.share}</span>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
              {card.details.map((detail) => (
                <span key={detail}>{detail}</span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <div
        ref={splitContainerRef}
        className="flex flex-col gap-4 xl:flex-row xl:flex-wrap xl:items-stretch"
      >
        <section
          className={['min-w-0 rounded-xl border p-4 shadow-lg', panel].join(' ')}
          style={{
            flex: chartOpen && chartStacked ? '1 1 100%' : '1 1 0%',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Kart aktivliyi</h1>
              <p className={['mt-1 text-sm', muted].join(' ')}>
                Kart brendləri və istiqamətlər üzrə əməliyyat göstəriciləri
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-blue-500/30 p-1">
              {periodTabs.map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={[
                    'h-8 min-w-12 rounded-md px-3 text-xs font-semibold transition',
                    index === 0
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'text-slate-300 hover:bg-slate-800'
                        : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[7rem_minmax(0,1fr)]">
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {dimensionTabs.map((tab, index) => (
                <button
                  key={tab.label}
                  type="button"
                  className={[
                    'flex h-14 min-w-24 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold transition lg:min-w-0',
                    index === 0
                      ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-900/20'
                      : isDark
                        ? 'border-slate-700 bg-slate-800/80 text-slate-100 hover:bg-slate-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-w-0 overflow-x-auto">
              <div style={{ minWidth: matrixMinWidth }}>
                <div className="grid gap-2" style={matrixGridStyle}>
                  <div className="flex h-10 items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setIsTransposed((value) => !value)}
                      className={[
                        'flex h-10 w-10 items-center justify-center rounded-full border transition',
                        isDark
                          ? 'border-blue-500/40 bg-slate-800/80 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200'
                          : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50',
                        isTransposed ? 'rotate-180' : '',
                      ].join(' ')}
                      aria-label="Sətir və sütunların yerini dəyiş"
                      title="Sətir və sütunların yerini dəyiş"
                    >
                      <RefreshCcw className="h-5 w-5" />
                    </button>
                  </div>
                  {tableColumns.map((column) => (
                    <button
                      key={column}
                      type="button"
                      className={[
                        'h-10 rounded-lg border px-3 text-sm font-bold transition',
                        isDark
                          ? 'border-blue-500/40 bg-blue-500/20 text-slate-100 hover:bg-blue-500/30'
                          : 'border-blue-200 bg-blue-50 text-blue-950 hover:bg-blue-100',
                      ].join(' ')}
                    >
                      {column}
                    </button>
                  ))}
                </div>

                <div className="mt-4 divide-y divide-slate-700/70">
                  {tableRows.map((row) => (
                    <div
                      key={row.name}
                      className="grid items-center gap-2 py-3"
                      style={matrixGridStyle}
                    >
                      <button
                        type="button"
                        className={[
                          'min-h-14 rounded-xl border px-3 text-base font-bold transition',
                          isDark
                            ? 'border-blue-500/40 bg-blue-500/25 text-white hover:bg-blue-500/35'
                            : 'border-blue-200 bg-blue-100 text-blue-950 hover:bg-blue-200',
                        ].join(' ')}
                      >
                        {row.name}
                      </button>
                      {row.values.map((cell, index) => (
                        <div
                          key={`${row.name}-${tableColumns[index]}`}
                          className="flex min-h-14 items-center justify-center gap-1.5 text-xl font-bold tabular-nums"
                        >
                          <span className={trendClasses(cell.trend)}>
                            <TrendIcon trend={cell.trend} />
                          </span>
                          <span>{cell.amount.toLocaleString('az-AZ')}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {!chartOpen && (
          <button
            type="button"
            onClick={() => {
              setChartOpen(true);
              setChartStacked(false);
              setChartWidth(DEFAULT_CHART_WIDTH);
            }}
            className={[
              'flex min-h-14 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold shadow-lg transition xl:w-14 xl:shrink-0 xl:[writing-mode:vertical-rl]',
              isDark
                ? 'border-blue-500/40 bg-blue-500/15 text-blue-200 hover:bg-blue-500/25 hover:text-white'
                : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50',
            ].join(' ')}
            aria-label="Pay bölgüsünü göstər"
            title="Pay bölgüsünü göstər"
          >
            <PanelRightOpen className="h-4 w-4 xl:-rotate-90" />
            Pay bölgüsü
          </button>
        )}

        {chartOpen && (
          <button
            type="button"
            onPointerDown={handleSplitterPointerDown}
            className={[
              'hidden w-3 shrink-0 cursor-col-resize rounded-full border transition xl:flex xl:items-center xl:justify-center',
              chartStacked ? 'xl:hidden' : '',
              isDark
                ? 'border-slate-700 bg-slate-800/80 hover:bg-blue-600'
                : 'border-slate-200 bg-white hover:bg-blue-100',
            ].join(' ')}
            aria-label="Cədvəl və qrafik ölçüsünü dəyiş"
          >
            <span
              className={[
                'h-12 w-1 rounded-full',
                isDark ? 'bg-slate-500' : 'bg-slate-300',
              ].join(' ')}
            />
          </button>
        )}

        {chartOpen && (
          <aside
            className={['min-w-0 rounded-xl border p-4 shadow-lg', panel].join(' ')}
            style={{
              flex: chartStacked ? '1 1 100%' : `0 0 ${chartWidth}px`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  {rightPanelMode === 'share' ? 'Pay bölgüsü' : 'Trend'}
                </h2>
                <p className={['mt-1 text-sm', muted].join(' ')}>
                  {rightPanelMode === 'share'
                    ? 'Seçilən göstərici üzrə kart payları'
                    : 'Vaxt üzrə cihaz sayının dəyişməsi'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {chartStacked && (
                  <button
                    type="button"
                    onClick={() => {
                      setChartStacked(false);
                      setChartWidth(DEFAULT_CHART_WIDTH);
                    }}
                    className={[
                      'flex h-9 w-9 items-center justify-center rounded-lg border transition',
                      isDark
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                    ].join(' ')}
                    aria-label="Cədvəl və qrafiki yan-yana göstər"
                    title="Yan-yana göstər"
                  >
                    <Columns2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setChartOpen(false);
                    setChartStacked(false);
                  }}
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-lg border transition',
                    isDark
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                  ].join(' ')}
                  aria-label="Pay bölgüsünü gizlət"
                  title="Pay bölgüsünü gizlət"
                >
                  <PanelRightClose className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 inline-flex rounded-lg border border-blue-500/30 p-1">
              {RIGHT_PANEL_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setRightPanelMode(mode.value)}
                  className={[
                    'h-8 min-w-16 rounded-md px-3 text-xs font-semibold transition',
                    rightPanelMode === mode.value
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'text-slate-300 hover:bg-slate-800'
                        : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className={['mt-4 rounded-xl border p-4', subtlePanel].join(' ')}>
              {rightPanelMode === 'share' ? (
                <>
                  <div className="h-64 xl:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<ChartTooltip />} />
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius="58%"
                          outerRadius="86%"
                          paddingAngle={2}
                          stroke="transparent"
                        >
                          {pieData.map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                    {pieData.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold"
                      >
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                        <span className={muted}>{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 xl:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendChartData}
                      margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? '#1e293b' : '#e2e8f0'}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }}
                      />
                      <YAxis
                        width={48}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }}
                      />
                      <Tooltip content={<TrendTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#3b82f6' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <p className={['mt-4 text-sm leading-6', muted].join(' ')}>
              {rightPanelMode === 'share'
                ? 'Seçilmiş filtrlər üzrə kateqoriyaların ümumi cihaz sayındakı payı.'
                : `Son ${TREND_MONTH_COUNT} ayın ümumi cihaz sayı (seçilmiş filtrlər üzrə).`}
            </p>
          </aside>
        )}
      </div>
    </div>
  );
};

export default CardActivityPage;
