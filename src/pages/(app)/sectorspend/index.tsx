import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { WalletCards } from 'lucide-react';

import { DataTable } from '@/components';
import { useGetSectorSpendFilterQuery } from '@/services/sectorspend.service';
import type { SectorSpendItem } from '@/types/sectorspend.type';

import {
  DataPageHeader,
  formatAmount,
  formatDate,
  formatNumber,
  PageError,
  PageLoading,
  StatCard,
} from '../_data-page-ui';

const SectorSpendPage: React.FC = () => {
  const { data, isLoading, isError } = useGetSectorSpendFilterQuery({
    page: 1,
    pageSize: 25,
  });
  const rows = data?.items ?? [];

  const columns = useMemo<ColumnDef<SectorSpendItem, unknown>[]>(
    () => [
      { accessorKey: 'bankName', header: 'Bank' },
      { accessorKey: 'mccGroup', header: 'MCC qrup' },
      { accessorKey: 'sourceChannel', header: 'Kanal' },
      { accessorKey: 'operationType', header: 'Əməliyyat tipi' },
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
        eyebrow="Sektor xərcləri"
        title="Sector Spend"
        description="Bank, MCC qrupu, kanal və əməliyyat tipinə görə xərcləmə analitikası."
        icon={WalletCards}
        tone="amber"
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

export default SectorSpendPage;
