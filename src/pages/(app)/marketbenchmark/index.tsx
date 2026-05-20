import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { BarChart3 } from 'lucide-react';

import { DataTable } from '@/components';
import { useGetMarketbenchmarkFilterQuery } from '@/services/marketbenchmark.service';
import type { MarketBenchmarkItem } from '@/types/marketbenchmark.type';

import {
  DataPageHeader,
  formatAmount,
  formatDate,
  formatNumber,
  PageError,
  PageLoading,
  StatCard,
} from '../_data-page-ui';

const MarketBenchmarkPage: React.FC = () => {
  const { data, isLoading, isError } = useGetMarketbenchmarkFilterQuery({
    Page: 1,
    PageSize: 25,
  });
  const rows = data?.items ?? [];

  const columns = useMemo<ColumnDef<MarketBenchmarkItem, unknown>[]>(
    () => [
      { accessorKey: 'bankName', header: 'Bank' },
      { accessorKey: 'regionNameClean', header: 'Region' },
      { accessorKey: 'productType', header: 'Məhsul tipi' },
      {
        accessorKey: 'reportMonth',
        header: 'Ay',
        cell: ({ getValue }) => formatDate(getValue() as string),
      },
      {
        accessorKey: 'marketSharePct',
        header: 'Market payı',
        cell: ({ getValue }) => `${formatAmount(getValue() as number)}%`,
      },
      {
        accessorKey: 'bankRank',
        header: 'Reytinq',
        cell: ({ getValue }) => formatNumber(getValue() as number),
      },
      {
        accessorKey: 'bankTransAmount',
        header: 'Bank məbləği',
        cell: ({ getValue }) => formatAmount(getValue() as number),
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <DataPageHeader
        eyebrow="Benchmark"
        title="Bazar müqayisəsi"
        description="Bankların bazar payı, kart payı və region üzrə reytinq göstəriciləri."
        icon={BarChart3}
        tone="blue"
      />
      {isLoading && <PageLoading />}
      {isError && <PageError />}
      {!isLoading && !isError && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ümumi qeyd" value={formatNumber(data?.totalCount)} />
          </div>
          <DataTable columns={columns} data={rows} />
        </>
      )}
    </div>
  );
};

export default MarketBenchmarkPage;
