import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  pageSize?: number;
  filters?: ReactNode;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  data, columns, searchKeys = [], pageSize = 8, filters, rowKey, onRowClick,
  emptyMessage = "Aucun résultat",
}: Props<T>) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!q) return data;
    const t = q.toLowerCase();
    return data.filter(row =>
      searchKeys.some(k => String(row[k] ?? "").toLowerCase().includes(t))
    );
  }, [data, q, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, totalPages);
  const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 p-4 border-b">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Rechercher…"
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {filters}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {columns.map(c => (
                <th key={c.key} className={`px-4 py-3 font-medium ${c.className ?? ""}`}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 && (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">{emptyMessage}</td></tr>
            )}
            {slice.map(row => (
              <tr
                key={rowKey(row)}
                className={`border-t hover:bg-accent/40 ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(c => (
                  <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                    {c.render ? c.render(row) : String(row[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t text-xs text-muted-foreground">
        <div>{filtered.length} résultat(s)</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={cur === 1}
            className="rounded-md border px-2.5 py-1 disabled:opacity-40 hover:bg-accent"
          >Préc.</button>
          <span>Page {cur} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={cur === totalPages}
            className="rounded-md border px-2.5 py-1 disabled:opacity-40 hover:bg-accent"
          >Suiv.</button>
        </div>
      </div>
    </div>
  );
}
