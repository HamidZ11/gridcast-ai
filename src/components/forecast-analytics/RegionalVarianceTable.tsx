import { Note, Panel, PanelHeader, ProvenanceTag } from "@/components/ui/primitives"
import type { RegionalVariance } from "@/data/mockForecastAnalyticsData"
import { cn } from "@/lib/utils"

type RegionalVarianceTableProps = {
  rows: RegionalVariance[]
}

export function RegionalVarianceTable({ rows }: RegionalVarianceTableProps) {
  return (
    <Panel className="animate-enter">
      <PanelHeader
        eyebrow="Regional variance"
        title="Load deviation by region"
        actions={
          <ProvenanceTag title="Fixed sample rows shipped with the frontend. The model is national and does not produce regional anomaly scores.">
            Illustrative
          </ProvenanceTag>
        }
      />
      <div className="gc-scroll-x">
        <table className="w-full min-w-[440px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--gc-rule-strong)]">
              {["Region", "Load", "Trend", "Anomaly score"].map((heading, index) => (
                <th
                  key={heading}
                  scope="col"
                  className={cn(
                    "px-4 py-2 font-mono text-[10px] font-normal uppercase tracking-[0.07em] text-[var(--gc-ink-3)]",
                    index > 0 && "text-right"
                  )}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.region} className="border-b border-[var(--gc-rule)] last:border-b-0">
                <th scope="row" className="px-4 py-2.5 text-[12.5px] font-normal text-[var(--gc-ink)]">
                  {row.region}
                </th>
                <td className="px-4 py-2.5 text-right font-mono text-[12px] tabular-nums text-[var(--gc-ink-2)]">
                  {row.load}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-[12px] tabular-nums text-[var(--gc-ink-2)]">
                  {row.trend}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 font-mono text-[12px] tabular-nums",
                      row.severity === "critical" ? "text-[var(--gc-ink)]" : "text-[var(--gc-ink-2)]"
                    )}
                  >
                    {row.severity === "critical" ? (
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--gc-bad)]" />
                    ) : null}
                    {row.anomalyScore}
                    {row.severity === "critical" ? <span className="sr-only">, flagged</span> : null}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Note className="border-t border-[var(--gc-rule)] px-4 py-2.5">
        Fixed sample rows. The production model forecasts national demand only.
      </Note>
    </Panel>
  )
}
