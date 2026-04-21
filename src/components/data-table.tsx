import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';

import { cn } from '@/utils';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  className?: string;
};

export function DataTable<TData>({ columns, data, className }: DataTableProps<TData>) {
  const isDark = useShellTheme();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const shell = isDark
    ? {
        wrap: 'border-slate-700/60 bg-slate-900/40',
        headRow: 'border-slate-700/80 bg-slate-800/60',
        th: 'text-slate-200',
        body: 'text-slate-200',
        row: 'border-slate-800/80 hover:bg-slate-800/30',
        cell: 'text-slate-300',
        empty: 'text-slate-500',
      }
    : {
        wrap: 'border-slate-200 bg-white shadow-sm',
        headRow: 'border-slate-200 bg-slate-50',
        th: 'text-slate-800',
        body: 'text-slate-900',
        row: 'border-slate-100 hover:bg-slate-50/80',
        cell: 'text-slate-700',
        empty: 'text-slate-500',
      };

  return (
    <div className={cn('overflow-x-auto rounded-xl border', shell.wrap, className)}>
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className={cn('border-b', shell.headRow)}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn('px-4 py-3 font-semibold first:rounded-tl-xl last:rounded-tr-xl', shell.th)}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className={shell.body}>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={cn('px-4 py-10 text-center', shell.empty)}>
                Məlumat yoxdur
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={cn('border-b last:border-0', shell.row)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={cn('px-4 py-2.5 align-middle', shell.cell)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
