import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { TrendingUp } from 'lucide-react';

import { DataTable } from '@/components';
import { useGetAllForecastsQuery } from '@/services/forecasting.service';
import type { ForecastResult } from '@/types/forecasting.type';

import {
  DataPageHeader,
  formatAmount,
  formatNumber,
  PageError,
  PageLoading,
  StatCard,
} from '../_data-page-ui';

const ForecastingPage: React.FC = () => {
  const { data = [], isLoading, isError } = useGetAllForecastsQuery({ horizon: 6 });

  const columns = useMemo<ColumnDef<ForecastResult, unknown>[]>(
    () => [
      { accessorKey: 'bankName', header: 'Bank' },
      { accessorKey: 'mccGroup', header: 'MCC qrup' },
      { accessorKey: 'modelUsed', header: 'Model' },
      {
        accessorKey: 'accuracy',
        header: 'Dəqiqlik',
        cell: ({ getValue }) => formatAmount(getValue() as number),
      },
      {
        accessorKey: 'confidenceLevel',
        header: 'Etibar səviyyəsi',
        cell: ({ getValue }) => formatAmount(getValue() as number),
      },
      {
        id: 'forecastCount',
        header: 'Proqnoz ayı',
        cell: ({ row }) => formatNumber(row.original.forecasts?.length ?? 0),
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <DataPageHeader
        eyebrow="Proqnoz"
        title="Forecasting"
        description="Bank və MCC qrupları üzrə proqnoz modelləri və növbəti aylar üçün nəticələr."
        icon={TrendingUp}
        tone="blue"
      />
      {isLoading && <PageLoading />}
      {isError && <PageError />}
      {!isLoading && !isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Model nəticəsi" value={formatNumber(data.length)} />
          </div>
          <DataTable columns={columns} data={data} />
        </>
      )}
    </div>
  );
};

export default ForecastingPage;
