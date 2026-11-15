import { useEffect, useMemo, useRef, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ArcLayer, BitmapLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { FlyToInterpolator } from '@deck.gl/core';
import type { MapViewState, ViewStateChangeParameters } from '@deck.gl/core';
import { BASE_MAP_TILE_URL, type BaseMapStyle } from '@/utils/basemap-tiles';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowRightLeft,
  BadgeDollarSign,
  X,
  Filter,
  Globe2,
  Landmark,
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Select, { type SingleValue, type StylesConfig } from 'react-select';

import {
  Button,
  DataPagination,
  DataTable,
  DateInput,
  LoadingSpinner,
} from '@/components';
import { useGetGeneralBanksQuery } from '@/services/general.service';
import {
  useGetWorldmapFilterQuery,
  useGetWorldmapHeatmapQuery,
} from '@/services/worldmap.service';
import type { WorldmapHeatmapResponse, WorldmapItem } from '@/types/worldmap.type';
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

type SelectOption = {
  label: string;
  value: string;
};

type BooleanOption = {
  label: string;
  value: boolean;
};

type MapMode = 'flow' | 'heatmap';

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
const FLAG_OPTIONS: BooleanOption[] = [
  { label: 'Bəli', value: true },
  { label: 'Xeyr', value: false },
];

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
    if (cleanValue)
      map.set(cleanValue, { label: getLabel(cleanValue), value: cleanValue });
  });

  if (selectedValue && !map.has(selectedValue)) {
    map.set(selectedValue, { label: getLabel(selectedValue), value: selectedValue });
  }

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'az'));
}

function mergeSelectOptions(current: SelectOption[], incoming: SelectOption[]) {
  const map = new Map<string, SelectOption>();

  current.forEach((option) => map.set(option.value, option));
  incoming.forEach((option) => map.set(option.value, option));

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'az'));
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

function parseNumberFilter(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
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
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('flow');
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>(
    isDark ? 'dark' : 'light'
  );
  const [bankId, setBankId] = useState('');
  const [sourceCountry, setSourceCountry] = useState('');
  const [sourceCountryCategory, setSourceCountryCategory] = useState('');
  const [targetCountry, setTargetCountry] = useState('');
  const [targetCountryCategory, setTargetCountryCategory] = useState('');
  const [paymentSystem, setPaymentSystem] = useState('');
  const [isIssuing, setIsIssuing] = useState<boolean | null>(null);
  const [isAcquiring, setIsAcquiring] = useState<boolean | null>(null);
  const [totalAmountFilter, setTotalAmountFilter] = useState('');
  const [totalCountFilter, setTotalCountFilter] = useState('');
  const [sourceLatitudeFilter, setSourceLatitudeFilter] = useState('');
  const [sourceLongitudeFilter, setSourceLongitudeFilter] = useState('');
  const [targetLatitudeFilter, setTargetLatitudeFilter] = useState('');
  const [targetLongitudeFilter, setTargetLongitudeFilter] = useState('');
  const [reportMonth, setReportMonth] = useState('');
  const [draftBankId, setDraftBankId] = useState('');
  const [draftSourceCountry, setDraftSourceCountry] = useState('');
  const [draftSourceCountryCategory, setDraftSourceCountryCategory] = useState('');
  const [draftTargetCountry, setDraftTargetCountry] = useState('');
  const [draftTargetCountryCategory, setDraftTargetCountryCategory] = useState('');
  const [draftPaymentSystem, setDraftPaymentSystem] = useState('');
  const [draftIsIssuing, setDraftIsIssuing] = useState<boolean | null>(null);
  const [draftIsAcquiring, setDraftIsAcquiring] = useState<boolean | null>(null);
  const [draftTotalAmountFilter, setDraftTotalAmountFilter] = useState('');
  const [draftTotalCountFilter, setDraftTotalCountFilter] = useState('');
  const [draftSourceLatitudeFilter, setDraftSourceLatitudeFilter] = useState('');
  const [draftSourceLongitudeFilter, setDraftSourceLongitudeFilter] = useState('');
  const [draftTargetLatitudeFilter, setDraftTargetLatitudeFilter] = useState('');
  const [draftTargetLongitudeFilter, setDraftTargetLongitudeFilter] = useState('');
  const [draftReportMonth, setDraftReportMonth] = useState('');
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [hasStartedApplyFetch, setHasStartedApplyFetch] = useState(false);
  const [page, setPage] = useState(1);
  const [sourceCountryOptionCache, setSourceCountryOptionCache] = useState<
    SelectOption[]
  >([]);
  const [sourceCountryCategoryOptionCache, setSourceCountryCategoryOptionCache] =
    useState<SelectOption[]>([]);
  const [targetCountryOptionCache, setTargetCountryOptionCache] = useState<
    SelectOption[]
  >([]);
  const [targetCountryCategoryOptionCache, setTargetCountryCategoryOptionCache] =
    useState<SelectOption[]>([]);
  const [paymentSystemOptionCache, setPaymentSystemOptionCache] = useState<
    SelectOption[]
  >([]);
  const [viewState, setViewState] = useState<WorldMapViewState>(INITIAL_VIEW_STATE);
  const totalAmountNumber = parseNumberFilter(totalAmountFilter);
  const totalCountNumber = parseNumberFilter(totalCountFilter);
  const sourceLatitudeNumber = parseNumberFilter(sourceLatitudeFilter);
  const sourceLongitudeNumber = parseNumberFilter(sourceLongitudeFilter);
  const targetLatitudeNumber = parseNumberFilter(targetLatitudeFilter);
  const targetLongitudeNumber = parseNumberFilter(targetLongitudeFilter);
  const { data: banks = [], isLoading: banksLoading } = useGetGeneralBanksQuery();
  const { data, isLoading, isError, isFetching } = useGetWorldmapFilterQuery({
    ...(reportMonth ? { ReportMonth: reportMonth } : {}),
    ...(bankId ? { BankName: bankId } : {}),
    ...(sourceCountry ? { SourceCountry: sourceCountry } : {}),
    ...(sourceCountryCategory ? { SourceCountryCategory: sourceCountryCategory } : {}),
    ...(targetCountry ? { TargetCountry: targetCountry } : {}),
    ...(targetCountryCategory ? { TargetCountryCategory: targetCountryCategory } : {}),
    ...(paymentSystem ? { PaymentSystem: paymentSystem } : {}),
    ...(isIssuing != null ? { IsIssuing: isIssuing } : {}),
    ...(isAcquiring != null ? { IsAcquiring: isAcquiring } : {}),
    ...(totalAmountNumber != null ? { TotalAmount: totalAmountNumber } : {}),
    ...(totalCountNumber != null ? { TotalCount: totalCountNumber } : {}),
    ...(sourceLatitudeNumber != null ? { SourceLatitude: sourceLatitudeNumber } : {}),
    ...(sourceLongitudeNumber != null ? { SourceLongitude: sourceLongitudeNumber } : {}),
    ...(targetLatitudeNumber != null ? { TargetLatitude: targetLatitudeNumber } : {}),
    ...(targetLongitudeNumber != null ? { TargetLongitude: targetLongitudeNumber } : {}),
    Page: page,
    PageSize: PAGE_SIZE,
  });
  const {
    data: heatmapData,
    isError: isHeatmapError,
    isFetching: isHeatmapFetching,
  } = useGetWorldmapHeatmapQuery({
    ...(bankId ? { bankName: bankId } : {}),
    ...(reportMonth ? { month: reportMonth } : {}),
  });
  const rows = useMemo(() => data?.items ?? [], [data?.items]);

  useEffect(() => {
    setPage(1);
  }, [
    bankId,
    sourceCountry,
    sourceCountryCategory,
    targetCountry,
    targetCountryCategory,
    paymentSystem,
    isIssuing,
    isAcquiring,
    totalAmountFilter,
    totalCountFilter,
    sourceLatitudeFilter,
    sourceLongitudeFilter,
    targetLatitudeFilter,
    targetLongitudeFilter,
    reportMonth,
  ]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === mapContainerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!filterDrawerOpen) return;

    setDraftBankId(bankId);
    setDraftSourceCountry(sourceCountry);
    setDraftSourceCountryCategory(sourceCountryCategory);
    setDraftTargetCountry(targetCountry);
    setDraftTargetCountryCategory(targetCountryCategory);
    setDraftPaymentSystem(paymentSystem);
    setDraftIsIssuing(isIssuing);
    setDraftIsAcquiring(isAcquiring);
    setDraftTotalAmountFilter(totalAmountFilter);
    setDraftTotalCountFilter(totalCountFilter);
    setDraftSourceLatitudeFilter(sourceLatitudeFilter);
    setDraftSourceLongitudeFilter(sourceLongitudeFilter);
    setDraftTargetLatitudeFilter(targetLatitudeFilter);
    setDraftTargetLongitudeFilter(targetLongitudeFilter);
    setDraftReportMonth(reportMonth);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFilterDrawerOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    bankId,
    filterDrawerOpen,
    isAcquiring,
    isIssuing,
    paymentSystem,
    reportMonth,
    sourceCountry,
    sourceCountryCategory,
    sourceLatitudeFilter,
    sourceLongitudeFilter,
    targetCountry,
    targetCountryCategory,
    targetLatitudeFilter,
    targetLongitudeFilter,
    totalAmountFilter,
    totalCountFilter,
  ]);

  useEffect(() => {
    if (!isApplyingFilters) return;

    if (isFetching && !hasStartedApplyFetch) {
      setHasStartedApplyFetch(true);
      return;
    }

    if (hasStartedApplyFetch && !isFetching) {
      setIsApplyingFilters(false);
      setHasStartedApplyFetch(false);
    }
  }, [hasStartedApplyFetch, isApplyingFilters, isFetching]);

  useEffect(() => {
    setSourceCountryOptionCache((current) =>
      mergeSelectOptions(current, toUniqueOptions(rows.map((row) => row.sourceCountry)))
    );
    setSourceCountryCategoryOptionCache((current) =>
      mergeSelectOptions(
        current,
        toUniqueOptions(
          rows.map((row) => row.sourceCountryCategory),
          '',
          translateCategory
        )
      )
    );
    setTargetCountryOptionCache((current) =>
      mergeSelectOptions(current, toUniqueOptions(rows.map((row) => row.targetCountry)))
    );
    setTargetCountryCategoryOptionCache((current) =>
      mergeSelectOptions(
        current,
        toUniqueOptions(
          rows.map((row) => row.targetCountryCategory),
          '',
          translateCategory
        )
      )
    );
    setPaymentSystemOptionCache((current) =>
      mergeSelectOptions(current, toUniqueOptions(rows.map((row) => row.paymentSystem)))
    );
  }, [rows]);

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
        cell: ({ getValue }) =>
          toBool(getValue() as boolean | number) ? 'Bəli' : 'Xeyr',
      },
      {
        accessorKey: 'isAcquiring',
        header: 'Ekvayrinq',
        cell: ({ getValue }) =>
          toBool(getValue() as boolean | number) ? 'Bəli' : 'Xeyr',
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
              (cluster.position[0] * cluster.weight + point.position[0] * point.weight) /
              totalWt;
            cluster.position[1] =
              (cluster.position[1] * cluster.weight + point.position[1] * point.weight) /
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
  const bankOptions = useMemo(() => {
    const options = banks
      .filter((bank) => bank.id && bank.bankName)
      .map((bank) => ({
        label: bank.bankName,
        value: bank.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'az'));

    const fallbackBankId = draftBankId || bankId;

    if (fallbackBankId && !options.some((option) => option.value === fallbackBankId)) {
      options.push({ label: fallbackBankId, value: fallbackBankId });
    }

    return options;
  }, [bankId, banks, draftBankId]);
  const sourceCountryOptions = useMemo(
    () => ensureSelectedOption(sourceCountryOptionCache, draftSourceCountry),
    [draftSourceCountry, sourceCountryOptionCache]
  );
  const sourceCountryCategoryOptions = useMemo(
    () =>
      ensureSelectedOption(
        sourceCountryCategoryOptionCache,
        draftSourceCountryCategory,
        translateCategory
      ),
    [draftSourceCountryCategory, sourceCountryCategoryOptionCache]
  );
  const targetCountryOptions = useMemo(
    () => ensureSelectedOption(targetCountryOptionCache, draftTargetCountry),
    [draftTargetCountry, targetCountryOptionCache]
  );
  const targetCountryCategoryOptions = useMemo(
    () =>
      ensureSelectedOption(
        targetCountryCategoryOptionCache,
        draftTargetCountryCategory,
        translateCategory
      ),
    [draftTargetCountryCategory, targetCountryCategoryOptionCache]
  );
  const paymentSystemOptions = useMemo(
    () => ensureSelectedOption(paymentSystemOptionCache, draftPaymentSystem),
    [draftPaymentSystem, paymentSystemOptionCache]
  );
  const selectedBank = bankOptions.find((item) => item.value === draftBankId) ?? null;
  const selectedSourceCountry =
    sourceCountryOptions.find((item) => item.value === draftSourceCountry) ?? null;
  const selectedSourceCountryCategory =
    sourceCountryCategoryOptions.find(
      (item) => item.value === draftSourceCountryCategory
    ) ?? null;
  const selectedTargetCountry =
    targetCountryOptions.find((item) => item.value === draftTargetCountry) ?? null;
  const selectedTargetCountryCategory =
    targetCountryCategoryOptions.find(
      (item) => item.value === draftTargetCountryCategory
    ) ?? null;
  const selectedPaymentSystem =
    paymentSystemOptions.find((item) => item.value === draftPaymentSystem) ?? null;
  const selectedIsIssuing =
    FLAG_OPTIONS.find((item) => item.value === draftIsIssuing) ?? null;
  const selectedIsAcquiring =
    FLAG_OPTIONS.find((item) => item.value === draftIsAcquiring) ?? null;

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

          return WORLD_TILE_LONGITUDE_OFFSETS.map(
            (offset) =>
              new BitmapLayer({
                bounds: [west + offset, south, east + offset, north],
                id: `${props.id}-bitmap-${offset}`,
                image: props.data,
              })
          );
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
          getFillColor: (point) =>
            point.isCluster ? [255, 255, 255, 110] : [255, 255, 255, 60],
          getLineColor: (point) =>
            point.isCluster ? [255, 255, 255, 255] : [255, 255, 255, 210],
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
  const inputClass = [
    'h-10 w-full rounded-lg border px-3 text-sm outline-none ring-cyan-500/40 transition focus:ring-2',
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
        borderColor: state.isFocused ? '#06b6d4' : isDark ? '#334155' : '#e2e8f0',
        backgroundColor: isDark ? '#020617' : '#ffffff',
        boxShadow: state.isFocused ? '0 0 0 2px rgb(6 182 212 / 0.35)' : 'none',
        ':hover': {
          borderColor: state.isFocused ? '#06b6d4' : isDark ? '#475569' : '#cbd5e1',
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
          ? '#0891b2'
          : state.isFocused
            ? isDark
              ? '#164e63'
              : '#ecfeff'
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
  const booleanSelectStyles = selectStyles as unknown as StylesConfig<
    BooleanOption,
    false
  >;
  const hasActiveFilters = Boolean(
    bankId ||
      sourceCountry ||
      sourceCountryCategory ||
      targetCountry ||
      targetCountryCategory ||
      paymentSystem ||
      isIssuing != null ||
      isAcquiring != null ||
      totalAmountFilter ||
      totalCountFilter ||
      sourceLatitudeFilter ||
      sourceLongitudeFilter ||
      targetLatitudeFilter ||
      targetLongitudeFilter ||
      reportMonth
  );
  const hasDraftFilters = Boolean(
    draftBankId ||
      draftSourceCountry ||
      draftSourceCountryCategory ||
      draftTargetCountry ||
      draftTargetCountryCategory ||
      draftPaymentSystem ||
      draftIsIssuing != null ||
      draftIsAcquiring != null ||
      draftTotalAmountFilter ||
      draftTotalCountFilter ||
      draftSourceLatitudeFilter ||
      draftSourceLongitudeFilter ||
      draftTargetLatitudeFilter ||
      draftTargetLongitudeFilter ||
      draftReportMonth
  );
  const mapButtonClass = [
    'flex h-10 w-10 items-center justify-center rounded-lg border shadow-lg transition hover:scale-[1.03]',
    isDark
      ? 'border-slate-700 bg-slate-950/90 text-slate-100 hover:bg-slate-900'
      : 'border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50',
  ].join(' ');

  const resetFilters = () => {
    setBankId('');
    setSourceCountry('');
    setSourceCountryCategory('');
    setTargetCountry('');
    setTargetCountryCategory('');
    setPaymentSystem('');
    setIsIssuing(null);
    setIsAcquiring(null);
    setTotalAmountFilter('');
    setTotalCountFilter('');
    setSourceLatitudeFilter('');
    setSourceLongitudeFilter('');
    setTargetLatitudeFilter('');
    setTargetLongitudeFilter('');
    setReportMonth('');
    setDraftBankId('');
    setDraftSourceCountry('');
    setDraftSourceCountryCategory('');
    setDraftTargetCountry('');
    setDraftTargetCountryCategory('');
    setDraftPaymentSystem('');
    setDraftIsIssuing(null);
    setDraftIsAcquiring(null);
    setDraftTotalAmountFilter('');
    setDraftTotalCountFilter('');
    setDraftSourceLatitudeFilter('');
    setDraftSourceLongitudeFilter('');
    setDraftTargetLatitudeFilter('');
    setDraftTargetLongitudeFilter('');
    setDraftReportMonth('');
    setPage(1);
  };

  const applyDraftFilters = () => {
    const hasChanges =
      draftBankId !== bankId ||
      draftSourceCountry !== sourceCountry ||
      draftSourceCountryCategory !== sourceCountryCategory ||
      draftTargetCountry !== targetCountry ||
      draftTargetCountryCategory !== targetCountryCategory ||
      draftPaymentSystem !== paymentSystem ||
      draftIsIssuing !== isIssuing ||
      draftIsAcquiring !== isAcquiring ||
      draftTotalAmountFilter !== totalAmountFilter ||
      draftTotalCountFilter !== totalCountFilter ||
      draftSourceLatitudeFilter !== sourceLatitudeFilter ||
      draftSourceLongitudeFilter !== sourceLongitudeFilter ||
      draftTargetLatitudeFilter !== targetLatitudeFilter ||
      draftTargetLongitudeFilter !== targetLongitudeFilter ||
      draftReportMonth !== reportMonth;

    if (!hasChanges) {
      setFilterDrawerOpen(false);
      return;
    }

    setIsApplyingFilters(true);
    setHasStartedApplyFetch(false);
    setBankId(draftBankId);
    setSourceCountry(draftSourceCountry);
    setSourceCountryCategory(draftSourceCountryCategory);
    setTargetCountry(draftTargetCountry);
    setTargetCountryCategory(draftTargetCountryCategory);
    setPaymentSystem(draftPaymentSystem);
    setIsIssuing(draftIsIssuing);
    setIsAcquiring(draftIsAcquiring);
    setTotalAmountFilter(draftTotalAmountFilter);
    setTotalCountFilter(draftTotalCountFilter);
    setSourceLatitudeFilter(draftSourceLatitudeFilter);
    setSourceLongitudeFilter(draftSourceLongitudeFilter);
    setTargetLatitudeFilter(draftTargetLatitudeFilter);
    setTargetLongitudeFilter(draftTargetLongitudeFilter);
    setReportMonth(draftReportMonth);
    setPage(1);
    setFilterDrawerOpen(false);
  };

  return (
    <div className="space-y-5 pt-2 pb-2 pl-2 pr-4 sm:pt-3 sm:pb-3 sm:pl-3 sm:pr-6">
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
          {isApplyingFilters && (
            <div className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-950/18 backdrop-blur-[1px]">
              <div
                className={[
                  'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl',
                  isDark
                    ? 'border-slate-700 bg-slate-950/95 text-slate-100'
                    : 'border-slate-200 bg-white/95 text-slate-900',
                ].join(' ')}
              >
                <LoadingSpinner
                  size="md"
                  className={isDark ? 'text-cyan-300' : 'text-cyan-600'}
                />
                <span className="text-sm font-medium">Filterlər tətbiq olunur...</span>
              </div>
            </div>
          )}

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
                    ? 'border-cyan-500/30 bg-slate-950/95 text-cyan-400 hover:text-cyan-300 hover:bg-slate-900'
                    : 'border-cyan-200 bg-white/95 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50',
                ].join(' ')}
                onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                type="button"
              >
                {filterDrawerOpen ? (
                  <ChevronRight className="h-3.5 w-3.5 rotate-90 text-cyan-500" />
                ) : (
                  <ChevronLeft className="h-3.5 w-3.5 rotate-90 text-cyan-500" />
                )}
                <span>Filterlər</span>
                <Filter className="h-3 w-3 text-cyan-500" />
                {hasActiveFilters && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"
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
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-500">
                    <Filter className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-semibold">Filterlər</h2>
                    <p className={['text-sm', mutedText].join(' ')}>
                      Dünya xəritəsi məlumatlarını süzün.
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
                      inputId="worldmap-filter-bank"
                      isClearable
                      isLoading={banksLoading}
                      noOptionsMessage={() => 'Bank tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) =>
                        setDraftBankId(option?.value ?? '')
                      }
                      options={bankOptions}
                      placeholder="Bütün banklar"
                      styles={selectStyles}
                      value={selectedBank}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={mutedText}>Mənbə ölkə</span>
                    <Select
                      inputId="worldmap-filter-source-country"
                      isClearable
                      noOptionsMessage={() => 'Ölkə tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) =>
                        setDraftSourceCountry(option?.value ?? '')
                      }
                      options={sourceCountryOptions}
                      placeholder="Bütün mənbələr"
                      styles={selectStyles}
                      value={selectedSourceCountry}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={mutedText}>Hədəf ölkə</span>
                    <Select
                      inputId="worldmap-filter-target-country"
                      isClearable
                      noOptionsMessage={() => 'Ölkə tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) =>
                        setDraftTargetCountry(option?.value ?? '')
                      }
                      options={targetCountryOptions}
                      placeholder="Bütün hədəflər"
                      styles={selectStyles}
                      value={selectedTargetCountry}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={mutedText}>Ödəniş sistemi</span>
                    <Select
                      inputId="worldmap-filter-payment-system"
                      isClearable
                      noOptionsMessage={() => 'Sistem tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) =>
                        setDraftPaymentSystem(option?.value ?? '')
                      }
                      options={paymentSystemOptions}
                      placeholder="Bütün sistemlər"
                      styles={selectStyles}
                      value={selectedPaymentSystem}
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium">
                      <span className={mutedText}>Emitent</span>
                      <Select
                        inputId="worldmap-filter-issuing"
                        isClearable
                        onChange={(option: SingleValue<BooleanOption>) =>
                          setDraftIsIssuing(option?.value ?? null)
                        }
                        options={FLAG_OPTIONS}
                        placeholder="Hamısı"
                        styles={booleanSelectStyles}
                        value={selectedIsIssuing}
                      />
                    </label>

                    <label className="space-y-1.5 text-sm font-medium">
                      <span className={mutedText}>Ekvayrinq</span>
                      <Select
                        inputId="worldmap-filter-acquiring"
                        isClearable
                        onChange={(option: SingleValue<BooleanOption>) =>
                          setDraftIsAcquiring(option?.value ?? null)
                        }
                        options={FLAG_OPTIONS}
                        placeholder="Hamısı"
                        styles={booleanSelectStyles}
                        value={selectedIsAcquiring}
                      />
                    </label>
                  </div>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={mutedText}>Ay</span>
                    <DateInput
                      className={inputClass}
                      value={draftReportMonth}
                      onChange={setDraftReportMonth}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={mutedText}>Mənbə kateqoriyası</span>
                    <Select
                      inputId="worldmap-filter-source-category"
                      isClearable
                      noOptionsMessage={() => 'Kateqoriya tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) =>
                        setDraftSourceCountryCategory(option?.value ?? '')
                      }
                      options={sourceCountryCategoryOptions}
                      placeholder="Bütün kateqoriyalar"
                      styles={selectStyles}
                      value={selectedSourceCountryCategory}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={mutedText}>Hədəf kateqoriyası</span>
                    <Select
                      inputId="worldmap-filter-target-category"
                      isClearable
                      noOptionsMessage={() => 'Kateqoriya tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) =>
                        setDraftTargetCountryCategory(option?.value ?? '')
                      }
                      options={targetCountryCategoryOptions}
                      placeholder="Bütün kateqoriyalar"
                      styles={selectStyles}
                      value={selectedTargetCountryCategory}
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium">
                      <span className={mutedText}>Məbləğ</span>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        placeholder="Məs: 1000"
                        value={draftTotalAmountFilter}
                        onChange={(event) =>
                          setDraftTotalAmountFilter(event.target.value)
                        }
                      />
                    </label>

                    <label className="space-y-1.5 text-sm font-medium">
                      <span className={mutedText}>Say</span>
                      <input
                        className={inputClass}
                        inputMode="numeric"
                        placeholder="Məs: 25"
                        value={draftTotalCountFilter}
                        onChange={(event) => setDraftTotalCountFilter(event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium">
                      <span className={mutedText}>Mənbə enliyi</span>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        placeholder="Latitude"
                        value={draftSourceLatitudeFilter}
                        onChange={(event) =>
                          setDraftSourceLatitudeFilter(event.target.value)
                        }
                      />
                    </label>

                    <label className="space-y-1.5 text-sm font-medium">
                      <span className={mutedText}>Mənbə uzunluğu</span>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        placeholder="Longitude"
                        value={draftSourceLongitudeFilter}
                        onChange={(event) =>
                          setDraftSourceLongitudeFilter(event.target.value)
                        }
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium">
                      <span className={mutedText}>Hədəf enliyi</span>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        placeholder="Latitude"
                        value={draftTargetLatitudeFilter}
                        onChange={(event) =>
                          setDraftTargetLatitudeFilter(event.target.value)
                        }
                      />
                    </label>

                    <label className="space-y-1.5 text-sm font-medium">
                      <span className={mutedText}>Hədəf uzunluğu</span>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        placeholder="Longitude"
                        value={draftTargetLongitudeFilter}
                        onChange={(event) =>
                          setDraftTargetLongitudeFilter(event.target.value)
                        }
                      />
                    </label>
                  </div>
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
                  disabled={(!hasDraftFilters && !hasActiveFilters) || isFetching}
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-4 w-4" />
                  Təmizlə
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-cyan-600 text-white hover:bg-cyan-700"
                  onClick={applyDraftFilters}
                  disabled={isFetching}
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
                  isFullscreen
                    ? 'h-screen min-h-screen w-screen'
                    : 'h-[520px] min-h-[420px]',
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
                    {isHeatmapError
                      ? 'İstilik xəritəsi yüklənmədi'
                      : 'İstilik xəritəsi yüklənir...'}
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
