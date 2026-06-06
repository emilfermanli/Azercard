import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Activity,
  BarChart3,
  BrainCircuit,
  Filter,
  LineChart as LineChartIcon,
  Play,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import Select, { type SingleValue, type StylesConfig } from 'react-select';

import { Button, DataTable } from '@/components';
import {
  useGetForecastQuery,
  useTrainAllForecastingMutation,
  useTrainGlobalForecastingMutation,
} from '@/services/forecasting.service';
import {
  useGetGeneralBanksQuery,
  useGetGeneralMccGroupsQuery,
} from '@/services/general.service';
import type { ForecastResult, MonthlyForecast } from '@/types/forecasting.type';
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

type ForecastPoint = MonthlyForecast & {
  monthLabel: string;
};

type ModelPoint = {
  bankName: string;
  mccGroup: string;
  modelUsed: string;
  accuracy: number;
  confidenceLevel: number;
  forecastCount: number;
};

type ModelSummary = {
  label: string;
  accuracy: number;
  confidence: number;
  count: number;
};

type ForecastingResponse = ForecastResult | ForecastResult[];

type SelectOption = {
  id: string;
  label: string;
  value: string;
};

type HorizonOption = {
  label: string;
  value: number;
};

const DEFAULT_HORIZON = 6;
const HORIZON_OPTIONS = [3, DEFAULT_HORIZON, 9, 12, 24];
const HORIZON_SELECT_OPTIONS: HorizonOption[] = HORIZON_OPTIONS.map((option) => ({
  label: `${option} ay`,
  value: option,
}));

function formatPercent(value: number | null | undefined) {
  return `${formatAmount(value)}%`;
}

function formatShortAmount(value: number) {
  if (value >= 1_000_000_000) return `${formatAmount(value / 1_000_000_000)} mlrd`;
  if (value >= 1_000_000) return `${formatAmount(value / 1_000_000)} mln`;
  if (value >= 1_000) return `${formatAmount(value / 1_000)} min`;
  return formatAmount(value);
}

function getForecasts(result: ForecastResult | undefined) {
  return (result?.forecasts ?? []).map((forecast) => ({
    ...forecast,
    monthLabel: formatDate(forecast.month),
  }));
}

function normalizeForecastResults(data: ForecastingResponse | undefined) {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getTotalPredictedAmount(points: ForecastPoint[]) {
  return points.reduce((sum, point) => sum + point.predictedAmount, 0);
}

function getTotalPredictedCount(points: ForecastPoint[]) {
  return points.reduce((sum, point) => sum + point.predictedCount, 0);
}

function chartAxisColor(isDark: boolean) {
  return isDark ? '#94a3b8' : '#64748b';
}

function ForecastTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const labelMap: Record<string, string> = {
    amountLowerBound: 'Aşağı məbləğ həddi',
    amountUpperBound: 'Yuxarı məbləğ həddi',
    predictedAmount: 'Proqnoz məbləği',
    predictedCount: 'Proqnoz sayı',
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 shadow-xl">
      <p className="font-semibold">{label}</p>
      {payload.map((item) => (
        <p key={String(item.dataKey)} className="mt-1">
          {labelMap[String(item.dataKey)] ?? String(item.dataKey)}:{' '}
          {formatAmount(item.value)}
        </p>
      ))}
    </div>
  );
}

function ModelTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ModelPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 shadow-xl">
      <p className="font-semibold">{item.bankName}</p>
      <p className="mt-1">{item.mccGroup}</p>
      <p>{item.modelUsed}</p>
      <p className="mt-1">Dəqiqlik: {formatPercent(item.accuracy)}</p>
      <p>Etibar səviyyəsi: {formatPercent(item.confidenceLevel)}</p>
      <p>Ay sayı: {formatNumber(item.forecastCount)}</p>
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof TrendingUp;
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
          <p
            className={['text-sm', isDark ? 'text-slate-300' : 'text-slate-500'].join(
              ' '
            )}
          >
            {subtitle}
          </p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ForecastLineChart({ data }: { data: ForecastPoint[] }) {
  const isDark = useShellTheme();

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ bottom: 8, left: 4, right: 18, top: 12 }}>
          <CartesianGrid stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeDasharray="3 3" />
          <XAxis
            dataKey="monthLabel"
            tick={{ fill: chartAxisColor(isDark), fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: chartAxisColor(isDark), fontSize: 11 }}
            tickFormatter={(value) => formatShortAmount(Number(value))}
            tickLine={false}
          />
          <Tooltip content={<ForecastTooltip />} />
          <Legend />
          <Line
            dataKey="amountUpperBound"
            dot={false}
            name="Yuxarı hədd"
            stroke="#94a3b8"
            strokeDasharray="5 5"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="predictedAmount"
            name="Proqnoz məbləği"
            stroke="#2563eb"
            strokeWidth={3}
            type="monotone"
          />
          <Line
            dataKey="amountLowerBound"
            dot={false}
            name="Aşağı hədd"
            stroke="#94a3b8"
            strokeDasharray="5 5"
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ForecastCountChart({ data }: { data: ForecastPoint[] }) {
  const isDark = useShellTheme();

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ bottom: 8, left: 4, right: 18, top: 12 }}>
          <CartesianGrid
            vertical={false}
            stroke={isDark ? '#1e293b' : '#e2e8f0'}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="monthLabel"
            tick={{ fill: chartAxisColor(isDark), fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: chartAxisColor(isDark), fontSize: 11 }}
            tickFormatter={(value) => formatNumber(Number(value))}
            tickLine={false}
          />
          <Tooltip content={<ForecastTooltip />} />
          <Bar
            dataKey="predictedCount"
            fill="#10b981"
            name="Proqnoz sayı"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ModelQualityChart({ data }: { data: ModelPoint[] }) {
  const isDark = useShellTheme();

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ bottom: 12, left: 4, right: 18, top: 12 }}>
          <CartesianGrid stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeDasharray="3 3" />
          <XAxis
            dataKey="accuracy"
            name="Dəqiqlik"
            tick={{ fill: chartAxisColor(isDark), fontSize: 11 }}
            tickLine={false}
            type="number"
            unit="%"
          />
          <YAxis
            dataKey="confidenceLevel"
            name="Etibar səviyyəsi"
            tick={{ fill: chartAxisColor(isDark), fontSize: 11 }}
            tickLine={false}
            type="number"
            unit="%"
          />
          <ZAxis dataKey="forecastCount" range={[80, 420]} />
          <Tooltip content={<ModelTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data} fill="#2563eb" fillOpacity={0.78} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

const ForecastingPage: React.FC = () => {
  const isDark = useShellTheme();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [horizon, setHorizon] = useState(DEFAULT_HORIZON);
  const [selectedBank, setSelectedBank] = useState<SelectOption | null>(null);
  const [selectedMcc, setSelectedMcc] = useState<SelectOption | null>(null);

  const [draftBank, setDraftBank] = useState<SelectOption | null>(null);
  const [draftMcc, setDraftMcc] = useState<SelectOption | null>(null);
  const [draftHorizon, setDraftHorizon] = useState(DEFAULT_HORIZON);

  useEffect(() => {
    if (filterDrawerOpen) {
      setDraftBank(selectedBank);
      setDraftMcc(selectedMcc);
      setDraftHorizon(horizon);
    }
  }, [filterDrawerOpen, selectedBank, selectedMcc, horizon]);
  const { data: banks = [], isLoading: banksLoading } = useGetGeneralBanksQuery();
  const { data: mccGroups = [], isLoading: mccGroupsLoading } =
    useGetGeneralMccGroupsQuery();
  const { data, isLoading, isError, refetch, isFetching } = useGetForecastQuery({
    ...(selectedBank ? { bank: selectedBank.value } : {}),
    ...(selectedMcc ? { mcc: selectedMcc.value } : {}),
    horizon,
  }) as {
    data?: ForecastingResponse;
    isLoading: boolean;
    isError: boolean;
    refetch: () => unknown;
    isFetching: boolean;
  };
  const [trainGlobal, trainGlobalState] = useTrainGlobalForecastingMutation();
  const [trainAll, trainAllState] = useTrainAllForecastingMutation();
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
  const mccOptions = useMemo<SelectOption[]>(
    () =>
      mccGroups
        .filter((mccGroup) => mccGroup.mccName)
        .map((mccGroup) => ({
          id: mccGroup.id,
          label: mccGroup.mccName,
          value: mccGroup.mccName,
        })),
    [mccGroups]
  );
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
        zIndex: 30,
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
  const horizonSelectStyles = selectStyles as unknown as StylesConfig<
    HorizonOption,
    false
  >;
  const results = useMemo(() => normalizeForecastResults(data), [data]);
  const selectedForecast = results[selectedIndex] ?? results[0];
  const forecastPoints = useMemo(
    () => getForecasts(selectedForecast),
    [selectedForecast]
  );

  const modelPoints = useMemo<ModelPoint[]>(
    () =>
      results.map((item) => ({
        bankName: item.bankName ?? 'Naməlum bank',
        mccGroup: item.mccGroup ?? 'Naməlum MCC',
        modelUsed: item.modelUsed ?? 'Naməlum alqoritm',
        accuracy: item.accuracy,
        confidenceLevel: item.confidenceLevel,
        forecastCount: item.forecasts?.length ?? 0,
      })),
    [results]
  );

  const modelSummary = useMemo<ModelSummary[]>(() => {
    const map = new Map<
      string,
      ModelSummary & { accuracies: number[]; confidences: number[] }
    >();

    results.forEach((item) => {
      const label = item.modelUsed ?? 'Naməlum alqoritm';
      const current = map.get(label);

      if (current) {
        current.count += 1;
        current.accuracies.push(item.accuracy);
        current.confidences.push(item.confidenceLevel);
        current.accuracy = average(current.accuracies);
        current.confidence = average(current.confidences);
        return;
      }

      map.set(label, {
        label,
        accuracy: item.accuracy,
        confidence: item.confidenceLevel,
        count: 1,
        accuracies: [item.accuracy],
        confidences: [item.confidenceLevel],
      });
    });

    return Array.from(map.values())
      .map((item) => ({
        label: item.label,
        accuracy: item.accuracy,
        confidence: item.confidence,
        count: item.count,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);
  }, [results]);

  const columns = useMemo<ColumnDef<ForecastResult, unknown>[]>(
    () => [
      { accessorKey: 'bankName', header: 'Bank' },
      { accessorKey: 'mccGroup', header: 'MCC qrup' },
      { accessorKey: 'modelUsed', header: 'Alqoritm' },
      {
        accessorKey: 'accuracy',
        header: 'Dəqiqlik',
        cell: ({ getValue }) => formatPercent(getValue() as number),
      },
      {
        accessorKey: 'confidenceLevel',
        header: 'Etibar səviyyəsi',
        cell: ({ getValue }) => formatPercent(getValue() as number),
      },
      {
        id: 'forecastCount',
        header: 'Proqnoz ayı',
        cell: ({ row }) => formatNumber(row.original.forecasts?.length ?? 0),
      },
    ],
    []
  );

  const totalPredictedAmount = getTotalPredictedAmount(forecastPoints);
  const totalPredictedCount = getTotalPredictedCount(forecastPoints);
  const avgAccuracy = average(results.map((item) => item.accuracy));
  const avgConfidence = average(results.map((item) => item.confidenceLevel));
  const trainBusy = trainGlobalState.isLoading || trainAllState.isLoading;
  const selectedDraftHorizon =
    HORIZON_SELECT_OPTIONS.find((option) => option.value === draftHorizon) ?? null;
  const hasActiveFilters = Boolean(
    selectedBank || selectedMcc || horizon !== DEFAULT_HORIZON
  );
  const outlineButtonClass = isDark
    ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-slate-100'
    : undefined;

  const resetFilters = () => {
    setSelectedIndex(0);
    setSelectedBank(null);
    setSelectedMcc(null);
    setHorizon(DEFAULT_HORIZON);
    setDraftBank(null);
    setDraftMcc(null);
    setDraftHorizon(DEFAULT_HORIZON);
    setFilterDrawerOpen(false);
  };

  const applyFilters = () => {
    setSelectedBank(draftBank);
    setSelectedMcc(draftMcc);
    setHorizon(draftHorizon);
    setSelectedIndex(0);
    setFilterDrawerOpen(false);
  };

  return (
    <div className="space-y-5 pt-2 pb-2 pl-2 pr-4 sm:pt-3 sm:pb-3 sm:pl-3 sm:pr-6">
      <DataPageHeader
        eyebrow="Proqnoz"
        title="Proqnozlaşdırma"
        description="Bank və MCC qrupları üzrə alqoritm keyfiyyəti, etibar intervalı və növbəti ay proqnozları."
        icon={TrendingUp}
        tone="blue"
      />
      {isLoading && <PageLoading />}
      {isError && <PageError />}
      {!isLoading && !isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Alqoritm nəticəsi" value={formatNumber(results.length)} />
            <StatCard
              label="Proqnoz məbləği"
              value={formatShortAmount(totalPredictedAmount)}
            />
            <StatCard label="Proqnoz sayı" value={formatNumber(totalPredictedCount)} />
            <StatCard label="Orta dəqiqlik" value={formatPercent(avgAccuracy)} />
          </div>

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
                aria-label={
                  filterDrawerOpen ? 'Filter panelini bağla' : 'Filter panelini aç'
                }
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
                    <h2 className="font-semibold">Proqnoz filterləri</h2>
                    <p
                      className={[
                        'text-sm',
                        isDark ? 'text-slate-400' : 'text-slate-500',
                      ].join(' ')}
                    >
                      Bank, MCC qrupu və gələcək aylar üzrə süzün.
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
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Bank
                    </span>
                    <Select
                      isClearable
                      isLoading={banksLoading}
                      noOptionsMessage={() => 'Bank tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) => {
                        setDraftBank(option);
                      }}
                      options={bankOptions}
                      placeholder="Bank axtar"
                      styles={selectStyles}
                      value={draftBank}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      MCC
                    </span>
                    <Select
                      isClearable
                      isLoading={mccGroupsLoading}
                      noOptionsMessage={() => 'MCC qrupu tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) => {
                        setDraftMcc(option);
                      }}
                      options={mccOptions}
                      placeholder="MCC axtar"
                      styles={selectStyles}
                      value={draftMcc}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      Üfüq
                    </span>
                    <Select
                      inputId="forecasting-filter-horizon"
                      isSearchable={false}
                      onChange={(option: SingleValue<HorizonOption>) => {
                        setDraftHorizon(option?.value ?? DEFAULT_HORIZON);
                      }}
                      options={HORIZON_SELECT_OPTIONS}
                      placeholder="Üfüq"
                      styles={horizonSelectStyles}
                      value={selectedDraftHorizon}
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
                  disabled={
                    !hasActiveFilters &&
                    !draftBank &&
                    !draftMcc &&
                    draftHorizon === DEFAULT_HORIZON
                  }
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

          <section
            className={[
              'rounded-xl border p-4 shadow-lg',
              isDark
                ? 'border-slate-800 bg-slate-900/70 text-slate-100 shadow-black/20'
                : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70',
            ].join(' ')}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
                  <BrainCircuit className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">Proqnoz alqoritminin idarəetməsi</h2>
                  <p
                    className={[
                      'text-sm',
                      isDark ? 'text-slate-300' : 'text-slate-500',
                    ].join(' ')}
                  >
                    Alqoritm hazırlama və ümumi proqnoz nəticələrini yeniləmə
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={trainBusy}
                  onClick={() => void trainGlobal().then(() => refetch())}
                  size="sm"
                  type="button"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Qlobal alqoritmi hazırla
                </Button>
                <Button
                  disabled={trainBusy}
                  onClick={() => void trainAll().then(() => refetch())}
                  size="sm"
                  type="button"
                  variant="outline"
                  className={outlineButtonClass}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Hamısını hazırla
                </Button>
              </div>
            </div>
            {(trainGlobalState.isError || trainAllState.isError) && (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                Alqoritm hazırlama sorğusu uğursuz oldu.
              </p>
            )}
            {(trainGlobalState.isSuccess || trainAllState.isSuccess) && !isFetching && (
              <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                Alqoritm hazırlama sorğusu tamamlandı.
              </p>
            )}
          </section>

          <section className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
            <Panel
              icon={Activity}
              title="Proqnoz seçimi"
              subtitle="Qrafik üçün bank və MCC kombinasiyası"
            >
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {results.map((item, index) => (
                  <button
                    key={`${item.bankName}-${item.mccGroup}-${index}`}
                    className={[
                      'w-full rounded-lg border px-3 py-2 text-left text-sm transition',
                      selectedIndex === index
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                        : isDark
                          ? 'border-slate-800 bg-slate-950/30 text-slate-200 hover:bg-slate-800/70'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                    onClick={() => setSelectedIndex(index)}
                    type="button"
                  >
                    <span className="block truncate font-semibold">
                      {item.bankName ?? 'Naməlum bank'}
                    </span>
                    <span
                      className={[
                        'mt-1 block truncate text-xs',
                        isDark ? 'text-slate-400' : 'text-slate-500',
                      ].join(' ')}
                    >
                      {item.mccGroup ?? 'Naməlum MCC'} • {item.modelUsed ?? 'Alqoritm'}
                    </span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel
              icon={LineChartIcon}
              title="Proqnoz məbləği"
              subtitle={`Aşağı və yuxarı etibar həddi ilə ${horizon} aylıq proqnoz`}
            >
              <ForecastLineChart data={forecastPoints} />
            </Panel>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Panel
              icon={BarChart3}
              title="Proqnoz sayı"
              subtitle="Aylar üzrə gözlənilən əməliyyat sayı"
            >
              <ForecastCountChart data={forecastPoints} />
            </Panel>

            <Panel
              icon={BrainCircuit}
              title="Alqoritm keyfiyyət matrisi"
              subtitle={`Orta etibar səviyyəsi: ${formatPercent(avgConfidence)}`}
            >
              <ModelQualityChart data={modelPoints} />
            </Panel>
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            {modelSummary.slice(0, 3).map((model) => (
              <Panel
                key={model.label}
                icon={TrendingUp}
                title={model.label}
                subtitle={`${formatNumber(model.count)} nəticə üzrə alqoritm göstəricisi`}
              >
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div
                    className={[
                      'rounded-lg border p-3',
                      isDark
                        ? 'border-slate-800 bg-slate-950/40'
                        : 'border-slate-100 bg-slate-50',
                    ].join(' ')}
                  >
                    <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                      Dəqiqlik
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-blue-500">
                      {formatPercent(model.accuracy)}
                    </p>
                  </div>
                  <div
                    className={[
                      'rounded-lg border p-3',
                      isDark
                        ? 'border-slate-800 bg-slate-950/40'
                        : 'border-slate-100 bg-slate-50',
                    ].join(' ')}
                  >
                    <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                      Etibar səviyyəsi
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-500">
                      {formatPercent(model.confidence)}
                    </p>
                  </div>
                </div>
              </Panel>
            ))}
          </section>

          <DataTable columns={columns} data={results} />
        </>
      )}
    </div>
  );
};

export default ForecastingPage;
