import { useEffect, useMemo, useRef, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { BitmapLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { FlyToInterpolator } from '@deck.gl/core';
import type { MapViewState, ViewStateChangeParameters } from '@deck.gl/core';
import type { ColumnDef } from '@tanstack/react-table';
import {
  BarChart3,
  Filter,
  Layers,
  Maximize2,
  Minimize2,
  MapPinned,
  RadioTower,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Select, { type SingleValue, type StylesConfig } from 'react-select';

import { Button, DataPagination, DataTable } from '@/components';
import {
  useGetAzmapBanksQuery,
  useGetAzmapCitiesQuery,
  useGetAzmapFilterQuery,
  useGetAzmapHeatmapQuery,
  useGetAzmapRegionsQuery,
} from '@/services/azmap.service';
import type { AzmapItem } from '@/types/azmap.type';
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

type MapMode = 'points' | 'heatmap';
type BaseMapStyle = 'dark' | 'light' | 'voyager' | 'minimal';

type SelectOption = {
  label: string;
  value: string;
};

type CityPoint = {
  id: string;
  city: string;
  category: string;
  position: [number, number];
  totalAmount: number;
  totalCount: number;
  bankCount: number;
};

type ClusteredCityPoint = CityPoint & {
  isCluster: boolean;
  pointCount: number;
};

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 47.9,
  latitude: 40.35,
  zoom: 6.35,
  pitch: 0,
  bearing: 0,
};

const MAP_MIN_ZOOM = 5;
const MAP_MAX_ZOOM = 10;
const PAGE_SIZE = 10;

const BASE_MAP_TILE_URL: Record<BaseMapStyle, string> = {
  dark: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
  light: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
  voyager: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
  minimal: 'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png',
};
const BASE_MAP_OPTIONS: { label: string; value: BaseMapStyle }[] = [
  { label: 'Qara', value: 'dark' },
  { label: 'Açıq', value: 'light' },
  { label: 'Səyahət', value: 'voyager' },
  { label: 'Sadə', value: 'minimal' },
];

function hasCoordinates(item: AzmapItem) {
  return item.latitude != null && item.longitude != null;
}

function getCityName(item: AzmapItem) {
  const city = item.city?.trim();
  const clean = item.sourceCityClean?.trim();
  const raw = item.sourceCity?.trim();

  return city || clean || raw || 'Naməlum';
}

function formatShortAmount(value: number) {
  if (value >= 1_000_000_000) return `${formatAmount(value / 1_000_000_000)} mlrd`;
  if (value >= 1_000_000) return `${formatAmount(value / 1_000_000)} mln`;
  if (value >= 1_000) return `${formatAmount(value / 1_000)} min`;
  return formatAmount(value);
}

function buildCityPoints(items: AzmapItem[]) {
  const pointMap = new Map<string, CityPoint & { banks: Set<string> }>();

  items.filter(hasCoordinates).forEach((item) => {
    const city = getCityName(item);
    const longitude = Number(item.longitude);
    const latitude = Number(item.latitude);
    const key = `${city}|${longitude}|${latitude}`;
    const existing = pointMap.get(key);

    if (existing) {
      existing.totalAmount += item.totalAmount;
      existing.totalCount += item.totalCount;
      if (item.bankName) existing.banks.add(item.bankName);
      existing.bankCount = existing.banks.size;
      return;
    }

    const banks = new Set<string>();
    if (item.bankName) banks.add(item.bankName);

    pointMap.set(key, {
      id: key,
      city,
      category: item.sourceCityCategory?.trim() || 'Naməlum',
      position: [longitude, latitude],
      totalAmount: item.totalAmount,
      totalCount: item.totalCount,
      bankCount: banks.size,
      banks,
    });
  });

  return Array.from(pointMap.values())
    .map((item) => ({
      id: item.id,
      city: item.city,
      category: item.category,
      position: item.position,
      totalAmount: item.totalAmount,
      totalCount: item.totalCount,
      bankCount: item.bankCount,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

const AzmapPage: React.FC = () => {
  const isDark = useShellTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const reportMonthInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('points');
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>(
    isDark ? 'dark' : 'light'
  );
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [sourceCity, setSourceCity] = useState('');
  const [sourceCityClean, setSourceCityClean] = useState('');
  const [reportMonth, setReportMonth] = useState('');
  const [page, setPage] = useState(1);
  const [draftBankName, setDraftBankName] = useState('');
  const [draftSourceCity, setDraftSourceCity] = useState('');
  const [draftSourceCityClean, setDraftSourceCityClean] = useState('');
  const [draftReportMonth, setDraftReportMonth] = useState('');

  useEffect(() => {
    if (filterDrawerOpen) {
      setDraftBankName(bankName);
      setDraftSourceCity(sourceCity);
      setDraftSourceCityClean(sourceCityClean);
      setDraftReportMonth(reportMonth);
    }
  }, [filterDrawerOpen, bankName, sourceCity, sourceCityClean, reportMonth]);

  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const { data: banks = [], isLoading: banksLoading } = useGetAzmapBanksQuery();
  const { data: cities = [], isLoading: citiesLoading } = useGetAzmapCitiesQuery();
  const { data: regions = [], isLoading: regionsLoading } = useGetAzmapRegionsQuery();
  const queryMonth = reportMonth;
  const { data, isLoading, isError, isFetching } = useGetAzmapFilterQuery({
    ...(bankName ? { BankName: bankName } : {}),
    ...(sourceCity ? { SourceCity: sourceCity } : {}),
    ...(sourceCityClean ? { SourceCityClean: sourceCityClean } : {}),
    ...(queryMonth ? { ReportMonth: queryMonth } : {}),
    Page: page,
    PageSize: PAGE_SIZE,
  });
  const {
    data: heatmapData,
    isError: isHeatmapError,
    isFetching: isHeatmapFetching,
  } = useGetAzmapHeatmapQuery({
    ...(bankName ? { bankName } : {}),
    ...(sourceCity ? { sourceCity } : {}),
    ...(queryMonth ? { month: queryMonth } : {}),
  });
  const rows = data?.items ?? [];

  useEffect(() => {
    setPage(1);
  }, [bankName, sourceCity, sourceCityClean, reportMonth]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === mapContainerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const columns = useMemo<ColumnDef<AzmapItem, unknown>[]>(
    () => [
      { accessorKey: 'bankName', header: 'Bank' },
      { accessorKey: 'sourceCity', header: 'Mənbə şəhər' },
      { accessorKey: 'sourceCityClean', header: 'Şəhər' },
      { accessorKey: 'sourceCityCategory', header: 'Kateqoriya' },
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
        accessorKey: 'totalCount',
        header: 'Say',
        cell: ({ getValue }) => formatNumber(getValue() as number),
      },
    ],
    []
  );

  const cityPoints = useMemo(() => buildCityPoints(rows), [rows]);

  const clusteredPoints = useMemo<ClusteredCityPoint[]>(() => {
    const zoom = viewState.zoom ?? 6.35;
    if (zoom >= 7.8) {
      return cityPoints.map((p) => ({ ...p, isCluster: false, pointCount: 1 }));
    }

    // Dynamic threshold based on zoom level: at zoom 5, ~1.0 degree distance; zoom 6, ~0.5; etc.
    const threshold = 1.0 / Math.pow(2, zoom - 5);
    const result: ClusteredCityPoint[] = [];

    cityPoints.forEach((point) => {
      let merged = false;
      for (const cluster of result) {
        const dist = Math.sqrt(
          Math.pow(point.position[0] - cluster.position[0], 2) +
          Math.pow(point.position[1] - cluster.position[1], 2)
        );
        if (dist < threshold) {
          const totalAmt = cluster.totalAmount + point.totalAmount;
          if (totalAmt > 0) {
            cluster.position[0] =
              (cluster.position[0] * cluster.totalAmount +
                point.position[0] * point.totalAmount) /
              totalAmt;
            cluster.position[1] =
              (cluster.position[1] * cluster.totalAmount +
                point.position[1] * point.totalAmount) /
              totalAmt;
          } else {
            cluster.position[0] = (cluster.position[0] + point.position[0]) / 2;
            cluster.position[1] = (cluster.position[1] + point.position[1]) / 2;
          }
          cluster.totalAmount += point.totalAmount;
          cluster.totalCount += point.totalCount;
          cluster.pointCount += 1;
          cluster.isCluster = true;

          // Merge names elegantly
          if (!cluster.city.includes(point.city)) {
            cluster.city = `${cluster.city}, ${point.city}`;
          }
          merged = true;
          break;
        }
      }

      if (!merged) {
        result.push({
          ...point,
          isCluster: false,
          pointCount: 1,
        });
      }
    });

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [cityPoints, viewState.zoom]);

  const heatmapPoints = useMemo(
    () => buildCityPoints(heatmapData?.length ? heatmapData : rows),
    [heatmapData, rows]
  );

  const clusteredHeatmapPoints = useMemo<ClusteredCityPoint[]>(() => {
    const zoom = viewState.zoom ?? 6.35;
    if (zoom >= 7.8) {
      return heatmapPoints.map((p) => ({ ...p, isCluster: false, pointCount: 1 }));
    }

    const threshold = 1.0 / Math.pow(2, zoom - 5);
    const result: ClusteredCityPoint[] = [];

    heatmapPoints.forEach((point) => {
      let merged = false;
      for (const cluster of result) {
        const dist = Math.sqrt(
          Math.pow(point.position[0] - cluster.position[0], 2) +
          Math.pow(point.position[1] - cluster.position[1], 2)
        );
        if (dist < threshold) {
          const totalAmt = cluster.totalAmount + point.totalAmount;
          if (totalAmt > 0) {
            cluster.position[0] =
              (cluster.position[0] * cluster.totalAmount +
                point.position[0] * point.totalAmount) /
              totalAmt;
            cluster.position[1] =
              (cluster.position[1] * cluster.totalAmount +
                point.position[1] * point.totalAmount) /
              totalAmt;
          } else {
            cluster.position[0] = (cluster.position[0] + point.position[0]) / 2;
            cluster.position[1] = (cluster.position[1] + point.position[1]) / 2;
          }
          cluster.totalAmount += point.totalAmount;
          cluster.totalCount += point.totalCount;
          cluster.pointCount += 1;
          cluster.isCluster = true;

          if (!cluster.city.includes(point.city)) {
            cluster.city = `${cluster.city}, ${point.city}`;
          }
          merged = true;
          break;
        }
      }

      if (!merged) {
        result.push({
          ...point,
          isCluster: false,
          pointCount: 1,
        });
      }
    });

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [heatmapPoints, viewState.zoom]);
  const maxAmount = useMemo(
    () => Math.max(...cityPoints.map((point) => point.totalAmount), 1),
    [cityPoints]
  );
  const maxHeatmapAmount = useMemo(
    () => Math.max(...heatmapPoints.map((point) => point.totalAmount), 1),
    [heatmapPoints]
  );
  const totalAmount = useMemo(
    () => rows.reduce((sum, item) => sum + item.totalAmount, 0),
    [rows]
  );
  const totalOperations = useMemo(
    () => rows.reduce((sum, item) => sum + item.totalCount, 0),
    [rows]
  );
  const uniqueBanks = useMemo(
    () => new Set(rows.map((item) => item.bankName).filter(Boolean)).size,
    [rows]
  );
  const bankOptions = useMemo<SelectOption[]>(
    () => banks.filter(Boolean).map((item) => ({ label: item, value: item })),
    [banks]
  );
  const cityOptions = useMemo<SelectOption[]>(
    () => cities.filter(Boolean).map((item) => ({ label: item, value: item })),
    [cities]
  );
  const regionOptions = useMemo<SelectOption[]>(
    () => regions.filter(Boolean).map((item) => ({ label: item, value: item })),
    [regions]
  );


  const selectedDraftBank = bankOptions.find((item) => item.value === draftBankName) ?? null;
  const selectedDraftCity = cityOptions.find((item) => item.value === draftSourceCity) ?? null;
  const selectedDraftRegion = regionOptions.find((item) => item.value === draftSourceCityClean) ?? null;

  const hasActiveFilters = Boolean(
    bankName || sourceCity || sourceCityClean || reportMonth
  );

  const handleViewStateChange = ({
    viewState: nextViewState,
  }: ViewStateChangeParameters) => {
    const mapViewState = nextViewState as MapViewState;

    setViewState((current) => ({
      ...current,
      ...mapViewState,
      zoom: Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, mapViewState.zoom)),
      transitionDuration: undefined,
      transitionInterpolator: undefined,
    }));
  };

  const changeZoom = (delta: number) => {
    setViewState((current) => ({
      ...current,
      zoom: Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, current.zoom + delta)),
      transitionDuration: 400,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.2 }),
    }));
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await mapContainerRef.current?.requestFullscreen();
  };

  const deckLayers = useMemo(() => {
    const baseLayers = [
      new TileLayer<ImageBitmap | HTMLImageElement>({
        id: 'azmap-base-tiles',
        data: BASE_MAP_TILE_URL[baseMapStyle],
        maxRequests: 20,
        maxZoom: 14,
        minZoom: 0,
        renderSubLayers: (props) => {
          const { west, south, east, north } = props.tile.bbox as {
            east: number;
            north: number;
            south: number;
            west: number;
          };

          return new BitmapLayer({
            bounds: [west, south, east, north],
            id: `${props.id}-bitmap`,
            image: props.data,
          });
        },
        tileSize: 256,
      }),
    ];

    if (mapMode === 'heatmap') {
      return [
        ...baseLayers,
        new HeatmapLayer<CityPoint>({
          id: 'azmap-heatmap',
          data: heatmapPoints,
          getPosition: (point) => point.position,
          getWeight: (point) => point.totalAmount,
          intensity: 1.2,
          radiusPixels: 80,
          threshold: 0.04,
          colorRange: [
            [8, 145, 178, 0],
            [34, 211, 238, 115],
            [16, 185, 129, 150],
            [245, 158, 11, 195],
            [249, 115, 22, 225],
            [239, 68, 68, 240],
          ],
        }),
        new ScatterplotLayer<ClusteredCityPoint>({
          id: 'azmap-heatmap-points',
          data: clusteredHeatmapPoints,
          getPosition: (point) => point.position,
          getRadius: (point) =>
            point.isCluster
              ? 8_000 + point.pointCount * 1_000
              : 2_500 + (point.totalAmount / maxHeatmapAmount) * 18_000,
          getFillColor: (point) => (point.isCluster ? [255, 255, 255, 110] : [255, 255, 255, 70]),
          getLineColor: (point) => (point.isCluster ? [255, 255, 255, 255] : [255, 255, 255, 230]),
          radiusMinPixels: 12,
          radiusMaxPixels: 50,
          lineWidthMinPixels: 1.5,
          pickable: true,
          stroked: true,
        }),
        new TextLayer<ClusteredCityPoint>({
          id: 'azmap-heatmap-cluster-counts',
          data: clusteredHeatmapPoints.filter((p) => p.isCluster),
          getPosition: (point) => point.position,
          getText: (point) => String(point.pointCount),
          getSize: 11,
          getColor: [15, 23, 42, 255],
          getPixelOffset: [0, 0],
          fontWeight: 'bold',
        }),
      ];
    }

    const getLabelText = (point: ClusteredCityPoint) => {
      if (point.isCluster) {
        const parts = point.city.split(', ');
        const primary = parts[0];
        return `${primary} (+${point.pointCount - 1})`;
      }
      return point.city;
    };

    return [
      ...baseLayers,
      new ScatterplotLayer<ClusteredCityPoint>({
        id: 'azmap-city-points',
        data: clusteredPoints,
        getPosition: (point) => point.position,
        getRadius: (point) =>
          point.isCluster
            ? 8_000 + point.pointCount * 1_000
            : 3_000 + (point.totalAmount / maxAmount) * 28_000,
        getFillColor: (point) =>
          point.isCluster
            ? [99, 102, 241, 215] // Indigo color for clusters
            : point.category === 'REGION'
              ? [16, 185, 129, 205]
              : [34, 211, 238, 210],
        getLineColor: (point) => (point.isCluster ? [79, 70, 229, 255] : [255, 255, 255, 230]),
        radiusMinPixels: 14,
        radiusMaxPixels: 60,
        lineWidthMinPixels: 1.5,
        pickable: true,
        stroked: true,
      }),
      new TextLayer<ClusteredCityPoint>({
        id: 'azmap-cluster-counts',
        data: clusteredPoints.filter((p) => p.isCluster),
        getPosition: (point) => point.position,
        getText: (point) => String(point.pointCount),
        getSize: 12,
        getColor: [255, 255, 255, 255],
        getPixelOffset: [0, 0],
        fontWeight: 'bold',
      }),
      new TextLayer<ClusteredCityPoint>({
        id: 'azmap-city-labels',
        data: clusteredPoints.slice(0, 15),
        getPosition: (point) => point.position,
        getText: (point) => getLabelText(point),
        getSize: 11,
        getColor: isDark ? [226, 232, 240, 235] : [15, 23, 42, 235],
        getPixelOffset: [0, 22],
        background: true,
        getBackgroundColor: isDark ? [15, 23, 42, 190] : [255, 255, 255, 215],
        backgroundPadding: [5, 3],
      }),
    ];
  }, [
    baseMapStyle,
    cityPoints,
    clusteredPoints,
    clusteredHeatmapPoints,
    heatmapPoints,
    isDark,
    mapMode,
    maxAmount,
    maxHeatmapAmount,
    viewState.zoom,
  ]);

  const panelClass = isDark
    ? 'border-slate-800 bg-slate-900/70 text-slate-100 shadow-black/20'
    : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70';
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-500';
  const inputClass = [
    'h-10 w-full rounded-lg border px-3 text-sm outline-none ring-emerald-500/40 transition focus:ring-2',
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
        borderColor: state.isFocused ? '#10b981' : isDark ? '#334155' : '#e2e8f0',
        backgroundColor: isDark ? '#020617' : '#ffffff',
        boxShadow: state.isFocused ? '0 0 0 2px rgb(16 185 129 / 0.35)' : 'none',
        ':hover': {
          borderColor: state.isFocused ? '#10b981' : isDark ? '#475569' : '#cbd5e1',
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
          ? '#059669'
          : state.isFocused
            ? isDark
              ? '#064e3b'
              : '#ecfdf5'
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
  const mapButtonClass = [
    'flex h-10 w-10 items-center justify-center rounded-lg border shadow-lg transition hover:scale-[1.03]',
    isDark
      ? 'border-slate-700 bg-slate-950/90 text-slate-100 hover:bg-slate-900'
      : 'border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50',
  ].join(' ');

  const resetFilters = () => {
    setBankName('');
    setSourceCity('');
    setSourceCityClean('');
    setReportMonth('');
    setDraftBankName('');
    setDraftSourceCity('');
    setDraftSourceCityClean('');
    setDraftReportMonth('');
    setPage(1);
    setFilterDrawerOpen(false);
  };

  const applyFilters = () => {
    setBankName(draftBankName);
    setSourceCity(draftSourceCity);
    setSourceCityClean(draftSourceCityClean);
    setReportMonth(draftReportMonth);
    setPage(1);
    setFilterDrawerOpen(false);
  };

  const openDatePicker = () => {
    reportMonthInputRef.current?.showPicker?.();
  };

  return (
    <div className="space-y-5 pt-2 pb-2 pl-2 pr-4 sm:pt-3 sm:pb-3 sm:pl-3 sm:pr-6">
      <DataPageHeader
        eyebrow="Coğrafiya"
        title="Azərbaycan xəritəsi"
        description="Bank, şəhər və ay üzrə ölkədaxili əməliyyat göstəricilərinə baxış."
        icon={MapPinned}
        tone="emerald"
      />
      {isLoading && <PageLoading />}
      {isError && <PageError />}
      {!isLoading && !isError && (
        <>
          <div
            aria-hidden={!filterDrawerOpen}
            className="fixed inset-0 z-[110] h-dvh transition pointer-events-none"
          >
            <button
              aria-label="Filter panelini bağla"
              className={[
                'absolute inset-0 bg-slate-950/40 transition-opacity',
                filterDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
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
                  filterDrawerOpen ? 'translate-x-[calc(50%-16px)]' : 'translate-x-[calc(50%-28px)]',
                  isDark
                    ? 'border-emerald-500/30 bg-slate-950/95 text-emerald-400 hover:text-emerald-300 hover:bg-slate-900'
                    : 'border-emerald-200 bg-white/95 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
                ].join(' ')}
                onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                type="button"
              >
                {filterDrawerOpen ? (
                  <ChevronRight className="h-3.5 w-3.5 rotate-90 text-emerald-500" />
                ) : (
                  <ChevronLeft className="h-3.5 w-3.5 rotate-90 text-emerald-500" />
                )}
                <span>Filterlər</span>
                <Filter className="h-3 w-3 text-emerald-500" />
                {hasActiveFilters && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                )}
              </button>
              <div
                className={[
                  'flex items-start justify-between gap-3 border-b p-4',
                  isDark ? 'border-slate-800' : 'border-slate-200',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                    <Filter className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-semibold">Filterlər</h2>
                    <p className={['text-sm', mutedText].join(' ')}>
                      Bank, şəhər, region və ay üzrə süzün.
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
                    <span className={mutedText}>Bank</span>
                    <Select
                      inputId="azmap-filter-bank"
                      isClearable
                      isLoading={banksLoading}
                      noOptionsMessage={() => 'Bank tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) =>
                        setDraftBankName(option?.value ?? '')
                      }
                      options={bankOptions}
                      placeholder="Bütün banklar"
                      styles={selectStyles}
                      value={selectedDraftBank}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={mutedText}>Şəhər</span>
                    <Select
                      inputId="azmap-filter-city"
                      isClearable
                      isLoading={citiesLoading}
                      noOptionsMessage={() => 'Şəhər tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) =>
                        setDraftSourceCity(option?.value ?? '')
                      }
                      options={cityOptions}
                      placeholder="Bütün şəhərlər"
                      styles={selectStyles}
                      value={selectedDraftCity}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={mutedText}>Region</span>
                    <Select
                      inputId="azmap-filter-region"
                      isClearable
                      isLoading={regionsLoading}
                      noOptionsMessage={() => 'Region tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) =>
                        setDraftSourceCityClean(option?.value ?? '')
                      }
                      options={regionOptions}
                      placeholder="Bütün regionlar"
                      styles={selectStyles}
                      value={selectedDraftRegion}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={mutedText}>Ay</span>
                    <input
                      ref={reportMonthInputRef}
                      className={inputClass}
                      type="date"
                      value={draftReportMonth}
                      onChange={(event) => setDraftReportMonth(event.target.value)}
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
                  disabled={!hasActiveFilters && !draftBankName && !draftSourceCity && !draftSourceCityClean && !draftReportMonth}
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-4 w-4" />
                  Təmizlə
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={applyFilters}
                >
                  Təsdiq et
                </Button>
              </div>
            </aside>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ümumi qeyd" value={formatNumber(data?.totalCount)} />
            <StatCard label="Ümumi məbləğ" value={formatShortAmount(totalAmount)} />
            <StatCard label="Əməliyyat sayı" value={formatNumber(totalOperations)} />
            <StatCard label="Aktiv bank" value={formatNumber(uniqueBanks)} />
          </div>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div
              className={[
                'overflow-hidden rounded-xl border shadow-lg',
                isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50',
              ].join(' ')}
            >
              <div className="space-y-3 border-b border-white/10 px-4 py-3">
                <div>
                  <h2
                    className={[
                      'text-base font-semibold',
                      isDark ? 'text-white' : 'text-slate-950',
                    ].join(' ')}
                  >
                    Şəhər və region paylanması
                  </h2>
                  <p className={['mt-1 text-sm', mutedText].join(' ')}>
                    {mapMode === 'points'
                      ? 'Marker ölçüsü şəhər üzrə ümumi məbləğə görə hesablanır.'
                      : 'İstilik xəritəsinin sıxlığı şəhər və region üzrə əməliyyat həcmini göstərir.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className={[
                      'flex rounded-lg border p-1 text-xs font-semibold',
                      isDark
                        ? 'border-slate-800 bg-slate-950/70'
                        : 'border-slate-200 bg-slate-100',
                    ].join(' ')}
                  >
                    {[
                      { label: 'Nöqtələr', value: 'points' as const },
                      { label: 'İstilik xəritəsi', value: 'heatmap' as const },
                    ].map((item) => (
                      <button
                        key={item.value}
                        className={[
                          'rounded-md px-3 py-1.5 transition',
                          mapMode === item.value
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : isDark
                              ? 'text-slate-300 hover:text-white'
                              : 'text-slate-600 hover:text-slate-950',
                        ].join(' ')}
                        onClick={() => setMapMode(item.value)}
                        type="button"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div
                ref={mapContainerRef}
                className={[
                  'relative',
                  isFullscreen
                    ? 'h-screen min-h-screen w-screen'
                    : 'h-[520px] min-h-[420px]',
                  isDark
                    ? 'bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.18),rgba(2,6,23,0.98)_58%)]'
                    : 'bg-[radial-gradient(circle_at_50%_40%,rgba(187,247,208,0.55),rgba(248,250,252,1)_62%)]',
                ].join(' ')}
              >
                <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
                  <button
                    aria-label="Xəritəni yaxınlaşdır"
                    className={mapButtonClass}
                    onClick={() => changeZoom(0.45)}
                    title="Yaxınlaşdır"
                    type="button"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Xəritəni uzaqlaşdır"
                    className={mapButtonClass}
                    onClick={() => changeZoom(-0.45)}
                    title="Uzaqlaşdır"
                    type="button"
                  >
                    <ZoomOut className="h-5 w-5" />
                  </button>
                  <button
                    aria-label={
                      isFullscreen ? 'Tam ekran rejimindən çıx' : 'Tam ekran et'
                    }
                    className={mapButtonClass}
                    onClick={() => void toggleFullscreen()}
                    title={isFullscreen ? 'Tam ekrandan çıx' : 'Tam ekran'}
                    type="button"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-5 w-5" />
                    ) : (
                      <Maximize2 className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div
                  className={[
                    'group absolute left-4 top-4 z-10 flex h-10 max-w-[calc(100%-5.5rem)] items-center overflow-hidden rounded-lg border text-xs font-semibold shadow-lg backdrop-blur transition-all duration-200 hover:w-[315px] focus-within:w-[315px] sm:w-10',
                    isDark
                      ? 'border-slate-700 bg-slate-950/90'
                      : 'border-slate-200 bg-white/95',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
                      isDark ? 'text-slate-300' : 'text-slate-500',
                    ].join(' ')}
                  >
                    <Layers className="h-4 w-4" />
                  </span>
                  <div className="flex w-[270px] shrink-0 items-center gap-1 pr-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                    {BASE_MAP_OPTIONS.map((item) => (
                      <button
                        key={item.value}
                        className={[
                          'rounded-md px-2.5 py-1.5 transition',
                          baseMapStyle === item.value
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : isDark
                              ? 'text-slate-300 hover:text-white'
                              : 'text-slate-600 hover:text-slate-950',
                        ].join(' ')}
                        onClick={() => setBaseMapStyle(item.value)}
                        type="button"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                {mapMode === 'heatmap' && (isHeatmapFetching || isHeatmapError) && (
                  <div
                    className={[
                      'absolute left-4 top-16 z-10 rounded-lg border px-3 py-2 text-xs font-semibold shadow-lg',
                      isHeatmapError
                        ? 'border-red-500/30 bg-red-500/15 text-red-300'
                        : isDark
                          ? 'border-slate-700 bg-slate-950/90 text-slate-200'
                          : 'border-slate-200 bg-white/95 text-slate-700',
                    ].join(' ')}
                  >
                    {isHeatmapError ? 'İstilik xəritəsi yüklənmədi' : 'İstilik xəritəsi yüklənir...'}
                  </div>
                )}
                <div
                  className={[
                    'absolute bottom-4 right-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap justify-end gap-2 rounded-lg border px-3 py-2 text-xs font-medium shadow-lg backdrop-blur',
                    isDark
                      ? 'border-slate-700 bg-slate-950/90'
                      : 'border-slate-200 bg-white/95',
                  ].join(' ')}
                >
                  {mapMode === 'points' ? (
                    <>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-500">
                        Region
                      </span>
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-500">
                        Şəhər
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-500">
                        Aşağı
                      </span>
                      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-500">
                        Orta
                      </span>
                      <span className="rounded-full bg-red-500/15 px-3 py-1 text-red-500">
                        Yüksək
                      </span>
                    </>
                  )}
                </div>
                <DeckGL
                  controller
                  getTooltip={({ object }) => {
                    if (!object) return null;
                    const point = object as ClusteredCityPoint;

                    if (point.isCluster) {
                      return {
                        html: `
                          <div style="padding: 4px; font-family: sans-serif;">
                            <strong style="color: #6366f1;">Qruplaşdırılmış Bölgə (${point.pointCount} şəhər)</strong><br/>
                            <span style="color: #94a3b8; font-size: 11px;">${point.city}</span><br/>
                            <div style="margin-top: 6px; border-top: 1px solid #334155; padding-top: 4px;">
                              <strong>Məbləğ:</strong> ${formatAmount(point.totalAmount)}<br/>
                              <strong>Əməliyyat:</strong> ${formatNumber(point.totalCount)}
                            </div>
                          </div>
                        `,
                      };
                    }

                    return {
                      html: `<strong>${point.city}</strong><br/>Məbləğ: ${formatAmount(point.totalAmount)}<br/>Say: ${formatNumber(point.totalCount)}`,
                    };
                  }}
                  layers={deckLayers}
                  onViewStateChange={handleViewStateChange}
                  style={{
                    bottom: '0',
                    left: '0',
                    position: 'absolute',
                    right: '0',
                    top: '0',
                  }}
                  viewState={viewState}
                />
              </div>
            </div>

            <aside className="space-y-5">
              <div className={['rounded-xl border p-4 shadow-lg', panelClass].join(' ')}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                    <BarChart3 className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">Ən böyük regionlar</h3>
                    <p className={['text-sm', mutedText].join(' ')}>
                      Məbləğ üzrə ümumiləşdirmə
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {cityPoints.slice(0, 7).map((point) => (
                    <div key={point.id}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium">{point.city}</span>
                        <span className="shrink-0 tabular-nums">
                          {formatShortAmount(point.totalAmount)}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-500/15">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{
                            width: `${Math.max(
                              6,
                              (point.totalAmount / maxAmount) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={['rounded-xl border p-4 shadow-lg', panelClass].join(' ')}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-500">
                    <RadioTower className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">Əhatə</h3>
                    <p className={['text-sm', mutedText].join(' ')}>
                      {formatNumber(cityPoints.length)} koordinatlı nöqtə,{' '}
                      {formatNumber(rows.length)} qeyd
                    </p>
                  </div>
                </div>
              </div>
            </aside>
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

export default AzmapPage;
