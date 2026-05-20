import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MapPinned } from 'lucide-react';

import { DataTable } from '@/components';
import { useGetAzmapFilterQuery } from '@/services/azmap.service';
import type { AzmapItem } from '@/types/azmap.type';

import {
  DataPageHeader,
  formatAmount,
  formatDate,
  formatNumber,
  PageError,
  PageLoading,
  StatCard,
} from '../_data-page-ui';

const AzmapPage: React.FC = () => {
  const { data, isLoading, isError } = useGetAzmapFilterQuery({ Page: 1, PageSize: 25 });
  const rows = data?.items ?? [];

  const columns = useMemo<ColumnDef<AzmapItem, unknown>[]>(
    () => [
      { accessorKey: 'bankName', header: 'Bank' },
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
          </div>
          <DataTable columns={columns} data={rows} />
        </>
      )}
    </div>
  );
};

export default AzmapPage;
