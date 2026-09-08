import { HelpTooltip } from "@/components/ui/help-tooltip"
import { Note, Panel, PanelHeader } from "@/components/ui/primitives"
import type { ModelPerformance } from "@/types/dashboard"
import { cn } from "@/lib/utils"

type PerformanceTableProps = {
  rows: ModelPerformance[]
}

const METRICS = [
  { key: "mae" as const, label: "MAE", help: "Mean absolute error: the average size of a mistake, in megawatts. Lower is better." },
  { key: "rmse" as const, label: "RMSE", help: "Root mean squared error: like MAE but penalises large misses more heavily. Lower is better." },
  { key: "mape" as const, label: "MAPE", help: "Mean absolute percentage error: the average mistake as a share of actual demand. Lower is better." },
  { key: "r2" as const, label: "R²", help: "Share of the variation in demand the model accounts for. Closer to 1 is better." },
]

export function PerformanceTable({ rows }: PerformanceTableProps) {
  return (
    <Panel className="animate-enter">
      <PanelHeader
        eyebrow="Evaluation"
        title="Model leaderboard"
        note="Scored on the same held-out window, one step ahead. Both baselines land within a few megawatts of each other."
      />
      {rows.length === 0 ? (
        <Note className="px-4 py-6">
          No saved evaluation metrics are available, so no leaderboard is shown.
        </Note>
      ) : (
        <div className="gc-scroll-x">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--gc-rule-strong)]">
                <th
                  scope="col"
                  className="w-[34%] px-4 py-2 font-mono text-[10px] font-normal uppercase tracking-[0.07em] text-[var(--gc-ink-3)]"
                >
                  Model
                </th>
                {METRICS.map((metric) => (
                  <th
                    key={metric.key}
                    scope="col"
                    className="px-2.5 py-2 text-right font-mono text-[10px] font-normal uppercase tracking-[0.07em] text-[var(--gc-ink-3)]"
                  >
                    <span className="inline-flex items-center gap-1">
                      {metric.label}
                      <HelpTooltip content={metric.help} label={`About ${metric.label}`} />
                    </span>
                  </th>
                ))}
                <th
                  scope="col"
                  className="px-4 py-2 text-right font-mono text-[10px] font-normal uppercase tracking-[0.07em] text-[var(--gc-ink-3)]"
                >
                  State
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const selected = row.status === "Production"
                return (
                  <tr
                    key={row.model}
                    className={cn(
                      "border-b border-[var(--gc-rule)] last:border-b-0",
                      selected && "bg-[var(--gc-surface-sunk)]/60"
                    )}
                  >
                    <th scope="row" className="px-4 py-2.5 text-left text-[12.5px] font-normal text-[var(--gc-ink)]">
                      {row.model}
                    </th>
                    {METRICS.map((metric) => (
                      <td
                        key={metric.key}
                        className="whitespace-nowrap px-2.5 py-2.5 text-right font-mono text-[12.5px] tabular-nums text-[var(--gc-ink-2)]"
                      >
                        {row[metric.key]}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.06em]",
                          selected ? "text-[var(--gc-ink)]" : "text-[var(--gc-ink-3)]"
                        )}
                      >
                        {selected ? (
                          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--gc-model)]" />
                        ) : null}
                        {selected ? "Active" : "Evaluated"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
