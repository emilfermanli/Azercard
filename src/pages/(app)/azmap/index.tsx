import { useEffect, useMemo, useRef, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { BitmapLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import type { MapViewState, ViewStateChangeParameters } from '@deck.gl/core';
import type { ColumnDef } from '@tanstack/react-table';
import {
  BarChart3,
  Layers,
  Maximize2,
  Minimize2,
  MapPinned,
  RadioTower,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import { DataPagination, DataTable } from '@/components';
import {
  useGetAzmapFilterQuery,
  useGetAzmapHeatmapQuery,
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

type CityPoint = {
  id: string;
  city: string;
  category: string;
  position: [number, number];
  totalAmount: number;
  totalCount: number;
  bankCount: number;
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
  { label: 'Voyager', value: 'voyager' },
  { label: 'Minimal', value: 'minimal' },
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
    .map(({ banks: _banks, ...point }) => point)
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

const AzmapPage: React.FC = () => {
  const isDark = useShellTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('points');
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>(
    isDark ? 'dark' : 'light'
  );
  const [page, setPage] = useState(1);
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const { data, isLoading, isError, isFetching } = useGetAzmapFilterQuery({
    Page: page,
    PageSize: PAGE_SIZE,
  });
  const {
    data: heatmapData,
    isError: isHeatmapError,
    isFetching: isHeatmapFetching,
  } = useGetAzmapHeatmapQuery();
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
  const heatmapPoints = useMemo(
    () => buildCityPoints(heatmapData?.length ? heatmapData : rows),
    [heatmapData, rows]
  );
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

  const handleViewStateChange = ({
    viewState: nextViewState,
  }: ViewStateChangeParameters) => {
    const mapViewState = nextViewState as MapViewState;

    setViewState((current) => ({
      ...current,
      ...mapViewState,
      zoom: Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, mapViewState.zoom)),
    }));
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
        new ScatterplotLayer<CityPoint>({
          id: 'azmap-heatmap-points',
          data: heatmapPoints,
          getPosition: (point) => point.position,
          getRadius: (point) =>
            2_500 + (point.totalAmount / maxHeatmapAmount) * 18_000,
          getFillColor: [255, 255, 255, 70],
          getLineColor: [255, 255, 255, 230],
          lineWidthMinPixels: 1,
          pickable: true,
          stroked: true,
        }),
      ];
    }

    return [
      ...baseLayers,
      new ScatterplotLayer<CityPoint>({
        id: 'azmap-city-points',
        data: cityPoints,
        getPosition: (point) => point.position,
        getRadius: (point) => 3_000 + (point.totalAmount / maxAmount) * 28_000,
        getFillColor: (point) =>
          point.category === 'REGION' ? [16, 185, 129, 205] : [34, 211, 238, 210],
        getLineColor: [255, 255, 255, 230],
        lineWidthMinPixels: 1,
        pickable: true,
        stroked: true,
      }),
      new TextLayer<CityPoint>({
        id: 'azmap-city-labels',
        data: cityPoints.slice(0, 10),
        getPosition: (point) => point.position,
        getText: (point) => point.city,
        getSize: 12,
        getColor: isDark ? [226, 232, 240, 235] : [15, 23, 42, 235],
        getPixelOffset: [0, 22],
        background: true,
        getBackgroundColor: isDark ? [15, 23, 42, 190] : [255, 255, 255, 215],
        backgroundPadding: [6, 3],
      }),
    ];
  }, [
    baseMapStyle,
    cityPoints,
    heatmapPoints,
    isDark,
    mapMode,
    maxAmount,
    maxHeatmapAmount,
  ]);

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
                      : 'Heatmap sıxlığı şəhər və region üzrə əməliyyat həcmini göstərir.'}
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
                      { label: 'Heatmap', value: 'heatmap' as const },
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
                  isFullscreen ? 'h-screen min-h-screen w-screen' : 'h-[520px] min-h-[420px]',
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
                    {isHeatmapError ? 'Heatmap API yüklənmədi' : 'Heatmap yüklənir...'}
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
                    const point = object as CityPoint;

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
                    <h3 className="font-semibold">Top regionlar</h3>
                    <p className={['text-sm', mutedText].join(' ')}>
                      Məbləğ üzrə aggregate
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
