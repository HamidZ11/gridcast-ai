import { Eyebrow } from "@/components/ui/primitives"

/**
 * The keyboard- and screen-reader-accessible twin of a chart.
 *
 * Recharts' tooltip is pointer-only, so every chart on a screen ships one of
 * these: a real table, collapsed by default, reachable by keyboard, carrying
 * the same values the chart draws. Nothing is gated behind hover.
 */
export function ChartDataTable({
  summary,
  columns,
  rows,
  note,
}: {
  summary: string
  columns: string[]
  rows: (string | number | null)[][]
  note?: string
}) {
  return (
    <details className="group border-t border-[var(--gc-rule)]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.07em] text-[var(--gc-ink-3)] transition-colors hover:text-[var(--gc-ink)] [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="transition-transform group-open:rotate-90">
          ›
        </span>
        {summary}
      </summary>
      <div className="max-h-[320px] overflow-auto border-t border-[var(--gc-rule)] px-4 py-3">
        {note ? <Eyebrow className="mb-2 normal-case tracking-normal">{note}</Eyebrow> : null}
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--gc-rule-strong)]">
              {columns.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  className={`py-1.5 font-mono text-[10px] font-normal uppercase tracking-[0.07em] text-[var(--gc-ink-3)] ${
                    index === 0 ? "" : "text-right"
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-[var(--gc-rule)]">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`py-1 font-mono text-[11.5px] tabular-nums text-[var(--gc-ink-2)] ${
                      cellIndex === 0 ? "" : "text-right"
                    }`}
                  >
                    {cell ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
