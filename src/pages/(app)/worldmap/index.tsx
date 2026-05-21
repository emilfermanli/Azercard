import { useEffect, useMemo, useRef, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ArcLayer, BitmapLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import type { MapViewState, ViewStateChangeParameters } from '@deck.gl/core';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowRightLeft,
  BadgeDollarSign,
  Globe2,
  Landmark,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import { DataPagination, DataTable } from '@/components';
import {
  useGetWorldmapFilterQuery,
  useGetWorldmapHeatmapQuery,
} from '@/services/worldmap.service';
import type {
  WorldmapHeatmapResponse,
  WorldmapItem,
} from '@/types/worldmap.type';
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

type Flow = {
  id: string;
  sourceCountry: string;
  targetCountry: string;
  sourcePosition: [number, number];
  targetPosition: [number, number];
  paymentSystem: string;
  bankName: string;
  totalAmount: number;
  totalCount: number;
  isDomestic: boolean;
};

type CountryPoint = {
  id: string;
  country: string;
  category: string;
  position: [number, number];
  totalAmount: number;
  totalCount: number;
};

type PaymentSummary = {
  name: string;
  totalAmount: number;
  totalCount: number;
};

type MapMode = 'flow' | 'heatmap';

type HeatmapPoint = {
  id: string;
  country: string;
  position: [number, number];
  weight: number;
  totalCount: number;
};

const INITIAL_VIEW_STATE = {
  longitude: 48,
  latitude: 34,
  zoom: 1.35,
  pitch: 0,
  bearing: 0,
};

const MAP_MIN_ZOOM = 0.8;
const MAP_MAX_ZOOM = 6;
const PAGE_SIZE = 10;

const BASE_MAP_TILE_URL = {
  dark: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  light: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
};

type WorldMapViewState = MapViewState;

function toBool(value: boolean | number) {
  return value === true || value === 1;
}

function hasCoordinates(item: WorldmapItem) {
  return (
    item.sourceLatitude != null &&
    item.sourceLongitude != null &&
    item.targetLatitude != null &&
    item.targetLongitude != null
  );
}

function formatShortAmount(value: number) {
  if (value >= 1_000_000_000) return `${formatAmount(value / 1_000_000_000)} mlrd`;
  if (value >= 1_000_000) return `${formatAmount(value / 1_000_000)} mln`;
  if (value >= 1_000) return `${formatAmount(value / 1_000)} min`;
  return formatAmount(value);
}

function normalizeHeatmapResponse(
  heatmap: WorldmapHeatmapResponse | undefined,
  countryPoints: CountryPoint[]
) {
  const pointByCountry = new Map<string, CountryPoint>();

  countryPoints.forEach((point) => {
    if (!pointByCountry.has(point.country)) {
      pointByCountry.set(point.country, point);
    }
  });

  if (Array.isArray(heatmap)) {
    return heatmap
      .map((point, index): HeatmapPoint | null => {
        const country =
          point.country ?? point.sourceCountry ?? point.targetCountry ?? 'Naməlum';
        const fallbackPoint = pointByCountry.get(country);
        const longitude = point.longitude ?? fallbackPoint?.position[0];
        const latitude = point.latitude ?? fallbackPoint?.position[1];
        const weight = point.value ?? point.totalAmount ?? point.totalCount ?? 0;

        if (longitude == null || latitude == null || weight <= 0) return null;

        return {
          id: `${country}-${index}`,
          country,
          position: [longitude, latitude],
          totalCount: point.totalCount ?? 0,
          weight,
        };
      })
      .filter((point): point is HeatmapPoint => point != null);
  }

  if (heatmap) {
    return Object.entries(heatmap)
      .map(([country, value]): HeatmapPoint | null => {
        const countryPoint = pointByCountry.get(country);

        if (!countryPoint || value <= 0) return null;

        return {
          id: country,
          country,
          position: countryPoint.position,
          totalCount: countryPoint.totalCount,
          weight: value,
        };
      })
      .filter((point): point is HeatmapPoint => point != null);
  }

  return countryPoints.map((point) => ({
    id: point.id,
    country: point.country,
    position: point.position,
    totalCount: point.totalCount,
    weight: point.totalAmount,
  }));
}

const WorldmapPage: React.FC = () => {
  const isDark = useShellTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('flow');
  const [page, setPage] = useState(1);
  const [viewState, setViewState] = useState<WorldMapViewState>(INITIAL_VIEW_STATE);
  const { data, isLoading, isError, isFetching } = useGetWorldmapFilterQuery({
    Page: page,
    PageSize: PAGE_SIZE,
  });
  const {
    data: heatmapData,
    isError: isHeatmapError,
    isFetching: isHeatmapFetching,
  } = useGetWorldmapHeatmapQuery();
  const rows = data?.items ?? [];

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === mapContainerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleViewStateChange = ({
    viewState: nextViewState,
  }: ViewStateChangeParameters) => {
    const mapViewState = nextViewState as WorldMapViewState;

    setViewState((current) => {
      return {
        ...current,
        ...mapViewState,
        zoom: Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, mapViewState.zoom)),
      };
    });
  };

  const changeZoom = (delta: number) => {
    setViewState((current) => ({
      ...current,
      zoom: Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, current.zoom + delta)),
    }));
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await mapContainerRef.current?.requestFullscreen();
  };

  const columns = useMemo<ColumnDef<WorldmapItem, unknown>[]>(
    () => [
      { accessorKey: 'bankName', header: 'Bank' },
      { accessorKey: 'sourceCountry', header: 'Mənbə ölkə' },
      { accessorKey: 'targetCountry', header: 'Hədəf ölkə' },
      { accessorKey: 'paymentSystem', header: 'Ödəniş sistemi' },
      {
        accessorKey: 'reportMonth',
        header: 'Ay',
        cell: ({ getValue }) => formatDate(getValue() as string),
      },
      {
        accessorKey: 'isIssuing',
        header: 'Issuing',
        cell: ({ getValue }) => (toBool(getValue() as boolean | number) ? 'Bəli' : 'Xeyr'),
      },
      {
        accessorKey: 'isAcquiring',
        header: 'Acquiring',
        cell: ({ getValue }) => (toBool(getValue() as boolean | number) ? 'Bəli' : 'Xeyr'),
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

  const mapData = useMemo(() => {
    const flowMap = new Map<string, Flow>();
    const countryMap = new Map<string, CountryPoint>();
    const paymentMap = new Map<string, PaymentSummary>();

    rows.filter(hasCoordinates).forEach((item) => {
      const sourceCountry = item.sourceCountry ?? 'Naməlum';
      const targetCountry = item.targetCountry ?? 'Naməlum';
      const paymentSystem = item.paymentSystem ?? 'Digər';
      const bankName = item.bankName ?? 'Naməlum bank';
      const sourcePosition: [number, number] = [
        Number(item.sourceLongitude),
        Number(item.sourceLatitude),
      ];
      const targetPosition: [number, number] = [
        Number(item.targetLongitude),
        Number(item.targetLatitude),
      ];
      const flowKey = [
        sourceCountry,
        targetCountry,
        paymentSystem,
        bankName,
        sourcePosition.join(','),
        targetPosition.join(','),
      ].join('|');
      const existingFlow = flowMap.get(flowKey);

      if (existingFlow) {
        existingFlow.totalAmount += item.totalAmount;
        existingFlow.totalCount += item.totalCount;
      } else {
        flowMap.set(flowKey, {
          id: flowKey,
          sourceCountry,
          targetCountry,
          sourcePosition,
          targetPosition,
          paymentSystem,
          bankName,
          totalAmount: item.totalAmount,
          totalCount: item.totalCount,
          isDomestic:
            sourceCountry === targetCountry ||
            (item.sourceCountryCategory === 'Domestic' &&
              item.targetCountryCategory === 'Domestic'),
        });
      }

      [
        {
          country: sourceCountry,
          category: item.sourceCountryCategory ?? 'Unknown',
          position: sourcePosition,
        },
        {
          country: targetCountry,
          category: item.targetCountryCategory ?? 'Unknown',
          position: targetPosition,
        },
      ].forEach((point) => {
        const pointKey = `${point.country}|${point.position.join(',')}`;
        const existingPoint = countryMap.get(pointKey);

        if (existingPoint) {
          existingPoint.totalAmount += item.totalAmount;
          existingPoint.totalCount += item.totalCount;
        } else {
          countryMap.set(pointKey, {
            id: pointKey,
            ...point,
            totalAmount: item.totalAmount,
            totalCount: item.totalCount,
          });
        }
      });

      const existingPayment = paymentMap.get(paymentSystem);
      if (existingPayment) {
        existingPayment.totalAmount += item.totalAmount;
        existingPayment.totalCount += item.totalCount;
      } else {
        paymentMap.set(paymentSystem, {
          name: paymentSystem,
          totalAmount: item.totalAmount,
          totalCount: item.totalCount,
        });
      }
    });

    const flows = Array.from(flowMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );
    const countryPoints = Array.from(countryMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );
    const paymentSummary = Array.from(paymentMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );
    const maxAmount = Math.max(...flows.map((flow) => flow.totalAmount), 1);

    return { countryPoints, flows, maxAmount, paymentSummary };
  }, [rows]);

  const totalAmount = useMemo(
    () => rows.reduce((sum, item) => sum + item.totalAmount, 0),
    [rows]
  );
  const totalOperations = useMemo(
    () => rows.reduce((sum, item) => sum + item.totalCount, 0),
    [rows]
  );
  const foreignFlows = useMemo(
    () => rows.filter((item) => item.sourceCountryCategory === 'Foreign').length,
    [rows]
  );
  const uniqueBanks = useMemo(
    () => new Set(rows.map((item) => item.bankName).filter(Boolean)).size,
    [rows]
  );
  const heatmapPoints = useMemo(
    () => normalizeHeatmapResponse(heatmapData, mapData.countryPoints),
    [heatmapData, mapData.countryPoints]
  );
  const maxHeatmapWeight = useMemo(
    () => Math.max(...heatmapPoints.map((point) => point.weight), 1),
    [heatmapPoints]
  );

  const deckLayers = useMemo(() => {
    const arcColor: [number, number, number, number] = isDark
      ? [56, 189, 248, 190]
      : [14, 116, 144, 190];
    const domesticColor: [number, number, number, number] = [245, 158, 11, 180];
    const foreignPointColor: [number, number, number, number] = [34, 211, 238, 210];
    const domesticPointColor: [number, number, number, number] = [16, 185, 129, 220];

    const baseLayers = [
      new TileLayer<ImageBitmap | HTMLImageElement>({
        id: 'worldmap-base-tiles',
        data: isDark ? BASE_MAP_TILE_URL.dark : BASE_MAP_TILE_URL.light,
        maxRequests: 20,
        maxZoom: 8,
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
        new HeatmapLayer<HeatmapPoint>({
          id: 'worldmap-heatmap',
          data: heatmapPoints,
          getPosition: (point) => point.position,
          getWeight: (point) => point.weight,
          intensity: 1.35,
          radiusPixels: 70,
          threshold: 0.03,
          colorRange: [
            [8, 145, 178, 0],
            [34, 211, 238, 110],
            [16, 185, 129, 150],
            [245, 158, 11, 190],
            [249, 115, 22, 220],
            [239, 68, 68, 235],
          ],
          pickable: false,
        }),
        new ScatterplotLayer<HeatmapPoint>({
          id: 'worldmap-heatmap-points',
          data: heatmapPoints,
          getPosition: (point) => point.position,
          getRadius: (point) => 55_000 + (point.weight / maxHeatmapWeight) * 260_000,
          getFillColor: [255, 255, 255, 60],
          getLineColor: [255, 255, 255, 210],
          lineWidthMinPixels: 1,
          pickable: true,
          stroked: true,
        }),
        new TextLayer<HeatmapPoint>({
          id: 'worldmap-heatmap-labels',
          data: heatmapPoints.slice(0, 10),
          getPosition: (point) => point.position,
          getText: (point) => point.country,
          getSize: 12,
          getColor: [255, 255, 255, 235],
          getPixelOffset: [0, 22],
          background: true,
          getBackgroundColor: isDark ? [15, 23, 42, 190] : [15, 23, 42, 165],
          backgroundPadding: [6, 3],
        }),
      ];
    }

    return [
      ...baseLayers,
      new ArcLayer<Flow>({
        id: 'worldmap-arcs',
        data: mapData.flows.filter((flow) => !flow.isDomestic),
        getSourcePosition: (flow) => flow.sourcePosition,
        getTargetPosition: (flow) => flow.targetPosition,
        getSourceColor: arcColor,
        getTargetColor: [16, 185, 129, 230],
        getWidth: (flow) => 1.5 + (flow.totalAmount / mapData.maxAmount) * 7,
        greatCircle: true,
        pickable: true,
      }),
      new ScatterplotLayer<Flow>({
        id: 'worldmap-domestic-flows',
        data: mapData.flows.filter((flow) => flow.isDomestic),
        getPosition: (flow) => flow.targetPosition,
        getRadius: (flow) => 90_000 + (flow.totalAmount / mapData.maxAmount) * 450_000,
        getFillColor: domesticColor,
        getLineColor: [255, 255, 255, 210],
        lineWidthMinPixels: 1,
        stroked: true,
        pickable: true,
      }),
      new ScatterplotLayer<CountryPoint>({
        id: 'worldmap-country-points',
        data: mapData.countryPoints,
        getPosition: (point) => point.position,
        getRadius: (point) => 70_000 + (point.totalAmount / mapData.maxAmount) * 240_000,
        getFillColor: (point) =>
          point.category === 'Domestic' ? domesticPointColor : foreignPointColor,
        getLineColor: [255, 255, 255, 240],
        lineWidthMinPixels: 1,
        stroked: true,
        pickable: true,
      }),
      new TextLayer<CountryPoint>({
        id: 'worldmap-labels',
        data: mapData.countryPoints.slice(0, 8),
        getPosition: (point) => point.position,
        getText: (point) => point.country,
        getSize: 12,
        getColor: isDark ? [226, 232, 240, 230] : [15, 23, 42, 230],
        getPixelOffset: [0, 20],
        background: true,
        getBackgroundColor: isDark ? [15, 23, 42, 185] : [255, 255, 255, 210],
        backgroundPadding: [6, 3],
      }),
    ];
  }, [heatmapPoints, isDark, mapData, mapMode, maxHeatmapWeight]);

  const panelClass = isDark
    ? 'border-slate-800 bg-slate-900/70 text-slate-100 shadow-black/20'
    : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70';
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-500';
  const mapButtonClass = [
    'flex h-10 w-10 items-center justify-center rounded-lg border shadow-lg transition hover:scale-[1.03]',
    isDark
      ? 'border-slate-700 bg-slate-950/90 text-slate-100 hover:bg-slate-900'
      : 'border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50',
  ].join(' ');

  return (
    <div className="space-y-5">
      <DataPageHeader
        eyebrow="Qlobal əməliyyatlar"
        title="Dünya xəritəsi"
        description="Ölkələr, banklar və ödəniş sistemləri üzrə beynəlxalq əməliyyat axını."
        icon={Globe2}
        tone="cyan"
      />
      {isLoading && <PageLoading />}
      {isError && <PageError />}
      {!isLoading && !isError && (
        <>
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
                isDark
                  ? 'border-slate-800 bg-slate-950'
                  : 'border-slate-200 bg-slate-50',
              ].join(' ')}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div>
                  <h2
                    className={[
                      'text-base font-semibold',
                      isDark ? 'text-white' : 'text-slate-950',
                    ].join(' ')}
                  >
                    Ölkələrarası axınlar
                  </h2>
                  <p className={['mt-1 text-sm', mutedText].join(' ')}>
                    {mapMode === 'flow'
                      ? 'Xətt qalınlığı məbləğə, marker ölçüsü ölkə üzrə ümumi həcmə görədir.'
                      : 'Heatmap rəngi və sıxlığı ölkələr üzrə əməliyyat həcmini göstərir.'}
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
                      { label: 'Axınlar', value: 'flow' as const },
                      { label: 'Heatmap', value: 'heatmap' as const },
                    ].map((item) => (
                      <button
                        key={item.value}
                        className={[
                          'rounded-md px-3 py-1.5 transition',
                          mapMode === item.value
                            ? 'bg-cyan-500 text-white shadow-sm'
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
                  {mapMode === 'flow' ? (
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-500">
                        Xarici
                      </span>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-500">
                        Domestic
                      </span>
                      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-500">
                        Ölkədaxili
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-500">
                        Aşağı
                      </span>
                      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-500">
                        Orta
                      </span>
                      <span className="rounded-full bg-red-500/15 px-3 py-1 text-red-500">
                        Yüksək
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div
                ref={mapContainerRef}
                className={[
                  'relative',
                  isFullscreen ? 'h-screen min-h-screen w-screen' : 'h-[520px] min-h-[420px]',
                  isDark
                    ? 'bg-[radial-gradient(circle_at_50%_40%,rgba(8,145,178,0.18),rgba(2,6,23,0.98)_58%)]'
                    : 'bg-[radial-gradient(circle_at_50%_40%,rgba(186,230,253,0.7),rgba(248,250,252,1)_62%)]',
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
                {mapMode === 'heatmap' && (isHeatmapFetching || isHeatmapError) && (
                  <div
                    className={[
                      'absolute left-4 top-4 z-10 rounded-lg border px-3 py-2 text-xs font-semibold shadow-lg',
                      isHeatmapError
                        ? 'border-red-500/30 bg-red-500/15 text-red-300'
                        : isDark
                          ? 'border-slate-700 bg-slate-950/90 text-slate-200'
                          : 'border-slate-200 bg-white/95 text-slate-700',
                    ].join(' ')}
                  >
                    {isHeatmapError ? 'Heatmap API yüklənmədi' : 'Heatmap yüklənir...'}
                  </div>
                )}
                <div
                  className={[
                    'absolute inset-0',
                    isDark ? 'opacity-25' : 'opacity-45',
                  ].join(' ')}
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                    color: isDark ? '#38bdf8' : '#94a3b8',
                  }}
                />
                <DeckGL
                  controller
                  getTooltip={({ object }) => {
                    if (!object) return null;
                    const item = object as Flow | CountryPoint | HeatmapPoint;

                    if ('sourceCountry' in item) {
                      return {
                        html: `<strong>${item.sourceCountry} -> ${item.targetCountry}</strong><br/>${item.paymentSystem}<br/>Məbləğ: ${formatAmount(item.totalAmount)}<br/>Say: ${formatNumber(item.totalCount)}`,
                      };
                    }

                    if ('weight' in item) {
                      return {
                        html: `<strong>${item.country}</strong><br/>Heatmap dəyəri: ${formatAmount(item.weight)}<br/>Say: ${formatNumber(item.totalCount)}`,
                      };
                    }

                    return {
                      html: `<strong>${item.country}</strong><br/>${item.category}<br/>Məbləğ: ${formatAmount(item.totalAmount)}<br/>Say: ${formatNumber(item.totalCount)}`,
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
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-500">
                    <ArrowRightLeft className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">Top marşrutlar</h3>
                    <p className={['text-sm', mutedText].join(' ')}>
                      Aggregate olunmuş axınlar
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {mapData.flows.slice(0, 6).map((flow) => (
                    <div key={flow.id}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium">
                          {flow.sourceCountry} {'->'} {flow.targetCountry}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {formatShortAmount(flow.totalAmount)}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-500/15">
                        <div
                          className="h-full rounded-full bg-cyan-500"
                          style={{
                            width: `${Math.max(
                              6,
                              (flow.totalAmount / mapData.maxAmount) * 100
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
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                    <BadgeDollarSign className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">Ödəniş sistemləri</h3>
                    <p className={['text-sm', mutedText].join(' ')}>
                      Məbləğ üzrə paylanma
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {mapData.paymentSummary.map((payment) => (
                    <div
                      key={payment.name}
                      className={[
                        'rounded-lg border px-3 py-2',
                        isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{payment.name}</span>
                        <span className="text-sm tabular-nums">
                          {formatShortAmount(payment.totalAmount)}
                        </span>
                      </div>
                      <p className={['mt-1 text-xs', mutedText].join(' ')}>
                        {formatNumber(payment.totalCount)} əməliyyat
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={['rounded-xl border p-4 shadow-lg', panelClass].join(' ')}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                    <Landmark className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">Segment</h3>
                    <p className={['text-sm', mutedText].join(' ')}>
                      {formatNumber(foreignFlows)} xarici qeyd,{' '}
                      {formatNumber(Math.max(rows.length - foreignFlows, 0))} domestic qeyd
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

export default WorldmapPage;
