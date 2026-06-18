import React, { useMemo } from 'react';
import type { SessionData } from './types';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { formatCurrency } from './utils';

type Props = { sessions: SessionData[] };

const columnHelper = createColumnHelper<SessionData>();

export default function DataTableAdvanced({ sessions }: Props) {
  const columns = useMemo(() => [
    columnHelper.accessor('className', { header: 'Class', cell: (info) => info.getValue() }),
    columnHelper.accessor('trainerName', { header: 'Trainer', cell: (info) => info.getValue() }),
    columnHelper.accessor('day', { header: 'Day', cell: (info) => info.getValue() }),
    columnHelper.accessor('checkedInCount', { header: 'Attn', cell: (info) => info.getValue() }),
    columnHelper.accessor('capacity', { header: 'Cap', cell: (info) => info.getValue() }),
    columnHelper.accessor('totalPaid', { header: 'Revenue', cell: (info) => formatCurrency(info.getValue() as number) }),
  ], []);

  const table = useReactTable({
    data: sessions || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!sessions || sessions.length === 0) return <div className="text-sm text-slate-500">No sessions available.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="p-2 text-left text-sm text-slate-600">{flexRender(h.column.columnDef.header, h.getContext())}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-2 align-top text-sm">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
