import { useEffect, useMemo, useRef, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ArcLayer, BitmapLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { FlyToInterpolator } from '@deck.gl/core';
import type { MapViewState, ViewStateChangeParameters } from '@deck.gl/core';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowRightLeft,
  BadgeDollarSign,
  Globe2,
  Landmark,
  Layers,
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
type BaseMapStyle = 'dark' | 'light' | 'voyager' | 'minimal';

type HeatmapPoint = {
  id: string;
  country: string;
  position: [number, number];
  weight: number;
  totalCount: number;
};

type ClusteredHeatmapPoint = HeatmapPoint & {
  isCluster: boolean;
  pointCount: number;
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
const WORLD_TILE_LONGITUDE_OFFSETS = [-720, -360, 0, 360, 720];

type WorldMapViewState = MapViewState;

type TileIndex = {
  x: number;
  y: number;
  z: number;
};

function wrapTileX(x: number, z: number) {
  const tileCount = 2 ** z;
  return ((x % tileCount) + tileCount) % tileCount;
}

async function loadWrappedMapTile({
  index,
  signal,
  urlTemplate,
}: {
  index: TileIndex;
  signal?: AbortSignal;
  urlTemplate: string;
}) {
  const url = urlTemplate
    .replace('{z}', String(index.z))
    .replace('{x}', String(wrapTileX(index.x, index.z)))
    .replace('{y}', String(index.y));
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Map tile request failed: ${response.status}`);
  }

  return createImageBitmap(await response.blob());
}

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

function translateCategory(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) return 'Naməlum';

  const translations: Record<string, string> = {
    Domestic: 'Daxili',
    Foreign: 'Xarici',
    Local: 'Yerli',
    International: 'Beynəlxalq',
  };

  return translations[text] ?? text;
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
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>(
    isDark ? 'dark' : 'light'
  );
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
        transitionDuration: undefined,
        transitionInterpolator: undefined,
      };
    });
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
        header: 'Emitent',
        cell: ({ getValue }) => (toBool(getValue() as boolean | number) ? 'Bəli' : 'Xeyr'),
      },
      {
        accessorKey: 'isAcquiring',
        header: 'Ekvayrinq',
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
          category: translateCategory(item.sourceCountryCategory),
          position: sourcePosition,
        },
        {
          country: targetCountry,
          category: translateCategory(item.targetCountryCategory),
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

  const clusteredHeatmapPoints = useMemo<ClusteredHeatmapPoint[]>(() => {
    const zoom = viewState.zoom ?? 1.35;
    if (zoom >= 4.0) {
      return heatmapPoints.map((p) => ({ ...p, isCluster: false, pointCount: 1 }));
    }

    const threshold = 18.0 / Math.pow(2, zoom - 1);
    const result: ClusteredHeatmapPoint[] = [];

    heatmapPoints.forEach((point) => {
      let merged = false;
      for (const cluster of result) {
        const dist = Math.sqrt(
          Math.pow(point.position[0] - cluster.position[0], 2) +
          Math.pow(point.position[1] - cluster.position[1], 2)
        );
        if (dist < threshold) {
          const totalWt = cluster.weight + point.weight;
          if (totalWt > 0) {
            cluster.position[0] =
              (cluster.position[0] * cluster.weight +
                point.position[0] * point.weight) /
              totalWt;
            cluster.position[1] =
              (cluster.position[1] * cluster.weight +
                point.position[1] * point.weight) /
              totalWt;
          } else {
            cluster.position[0] = (cluster.position[0] + point.position[0]) / 2;
            cluster.position[1] = (cluster.position[1] + point.position[1]) / 2;
          }
          cluster.weight += point.weight;
          cluster.totalCount += point.totalCount;
          cluster.pointCount += 1;
          cluster.isCluster = true;

          if (!cluster.country.includes(point.country)) {
            cluster.country = `${cluster.country}, ${point.country}`;
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

    return result.sort((a, b) => b.weight - a.weight);
  }, [heatmapPoints, viewState.zoom]);
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
        data: BASE_MAP_TILE_URL[baseMapStyle],
        getTileData: ({ index, signal }) =>
          loadWrappedMapTile({
            index: index as TileIndex,
            signal,
            urlTemplate: BASE_MAP_TILE_URL[baseMapStyle],
          }),
        maxRequests: 20,
        maxZoom: 12,
        minZoom: 0,
        renderSubLayers: (props) => {
          const { west, south, east, north } = props.tile.bbox as {
            east: number;
            north: number;
            south: number;
            west: number;
          };

          return WORLD_TILE_LONGITUDE_OFFSETS.map((offset) => (
            new BitmapLayer({
              bounds: [west + offset, south, east + offset, north],
              id: `${props.id}-bitmap-${offset}`,
              image: props.data,
            })
          ));
        },
        tileSize: 256,
      }),
    ];

    if (mapMode === 'heatmap') {
      const getLabelText = (point: ClusteredHeatmapPoint) => {
        if (point.isCluster) {
          const parts = point.country.split(', ');
          const primary = parts[0];
          return `${primary} (+${point.pointCount - 1})`;
        }
        return point.country;
      };

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
        new ScatterplotLayer<ClusteredHeatmapPoint>({
          id: 'worldmap-heatmap-points',
          data: clusteredHeatmapPoints,
          getPosition: (point) => point.position,
          getRadius: (point) =>
            point.isCluster
              ? 110_000 + point.pointCount * 15_000
              : 55_000 + (point.weight / maxHeatmapWeight) * 260_000,
          getFillColor: (point) => (point.isCluster ? [255, 255, 255, 110] : [255, 255, 255, 60]),
          getLineColor: (point) => (point.isCluster ? [255, 255, 255, 255] : [255, 255, 255, 210]),
          radiusMinPixels: 12,
          radiusMaxPixels: 50,
          lineWidthMinPixels: 1.5,
          pickable: true,
          stroked: true,
        }),
        new TextLayer<ClusteredHeatmapPoint>({
          id: 'worldmap-heatmap-cluster-counts',
          data: clusteredHeatmapPoints.filter((p) => p.isCluster),
          getPosition: (point) => point.position,
          getText: (point) => String(point.pointCount),
          getSize: 11,
          getColor: [15, 23, 42, 255],
          getPixelOffset: [0, 0],
          fontWeight: 'bold',
        }),
        new TextLayer<ClusteredHeatmapPoint>({
          id: 'worldmap-heatmap-labels',
          data: clusteredHeatmapPoints.slice(0, 12),
          getPosition: (point) => point.position,
          getText: (point) => getLabelText(point),
          getSize: 11,
          getColor: [255, 255, 255, 235],
          getPixelOffset: [0, 22],
          background: true,
          getBackgroundColor: isDark ? [15, 23, 42, 190] : [15, 23, 42, 165],
          backgroundPadding: [5, 3],
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
          point.category === 'Daxili' ? domesticPointColor : foreignPointColor,
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
  }, [
    baseMapStyle,
    heatmapPoints,
    clusteredHeatmapPoints,
    isDark,
    mapData,
    mapMode,
    maxHeatmapWeight,
    viewState.zoom,
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
              <div className="space-y-3 border-b border-white/10 px-4 py-3">
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
                      : 'İstilik xəritəsinin rəngi və sıxlığı ölkələr üzrə əməliyyat həcmini göstərir.'}
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
                      { label: 'İstilik xəritəsi', value: 'heatmap' as const },
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
                            ? 'bg-cyan-500 text-white shadow-sm'
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
                  {mapMode === 'flow' ? (
                    <>
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-500">
                        Xarici
                      </span>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-500">
                        Daxili
                      </span>
                      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-500">
                        Ölkədaxili
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
                    const item = object as Flow | CountryPoint | ClusteredHeatmapPoint;

                    if ('sourceCountry' in item) {
                      return {
                        html: `<strong>${item.sourceCountry} → ${item.targetCountry}</strong><br/>${item.paymentSystem}<br/>Məbləğ: ${formatAmount(item.totalAmount)}<br/>Say: ${formatNumber(item.totalCount)}`,
                      };
                    }

                    if ('weight' in item) {
                      const point = item as ClusteredHeatmapPoint;
                      if (point.isCluster) {
                        return {
                          html: `
                            <div style="padding: 4px; font-family: sans-serif;">
                              <strong style="color: #06b6d4;">Qruplaşdırılmış Bölgə (${point.pointCount} ölkə)</strong><br/>
                              <span style="color: #94a3b8; font-size: 11px;">${point.country}</span><br/>
                              <div style="margin-top: 6px; border-top: 1px solid #334155; padding-top: 4px;">
                                <strong>Dəyər:</strong> ${formatAmount(point.weight)}<br/>
                                <strong>Əməliyyat:</strong> ${formatNumber(point.totalCount)}
                              </div>
                            </div>
                          `,
                        };
                      }

                      return {
                        html: `<strong>${point.country}</strong><br/>İstilik xəritəsi dəyəri: ${formatAmount(point.weight)}<br/>Say: ${formatNumber(point.totalCount)}`,
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
                    <h3 className="font-semibold">Ən çox istifadə olunan marşrutlar</h3>
                    <p className={['text-sm', mutedText].join(' ')}>
                      Ümumiləşdirilmiş axınlar
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {mapData.flows.slice(0, 6).map((flow) => (
                    <div key={flow.id}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium">
                          {flow.sourceCountry} {'→'} {flow.targetCountry}
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
                    <h3 className="font-semibold">Seqment</h3>
                    <p className={['text-sm', mutedText].join(' ')}>
                      {formatNumber(foreignFlows)} xarici qeyd,{' '}
                      {formatNumber(Math.max(rows.length - foreignFlows, 0))} daxili qeyd
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
