import type { ReactNode } from "react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

type AdminTableProps = {
  children: ReactNode;
  empty?: boolean;
  emptyDescription?: string;
  headers: string[];
};

export function AdminTable({
  children,
  empty = false,
  emptyDescription,
  headers,
}: AdminTableProps) {
  if (empty) {
    return <AdminEmptyState description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((header) => (
              <th
                className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                key={header}
                scope="col"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}
