import { Note, Panel, PanelHeader, ProvenanceTag } from "@/components/ui/primitives"
import type { HeatmapCell } from "@/data/mockForecastAnalyticsData"
import { cn } from "@/lib/utils"

type DemandHeatmapProps = {
  data: HeatmapCell[]
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const hours = Array.from({ length: 24 }, (_, index) => index)

/** One hue, light to dark - a magnitude scale, never a rainbow. */
const STEPS = [
  { max: 0.26, className: "bg-[var(--gc-seq-1)]", label: "0–25%" },
  { max: 0.4, className: "bg-[var(--gc-seq-2)]", label: "26–40%" },
  { max: 0.54, className: "bg-[var(--gc-seq-3)]", label: "41–54%" },
  { max: 0.68, className: "bg-[var(--gc-seq-4)]", label: "55–68%" },
  { max: 0.82, className: "bg-[var(--gc-seq-5)]", label: "69–82%" },
  { max: 1.01, className: "bg-[var(--gc-seq-6)]", label: "83–100%" },
]

function step(value: number) {
  return STEPS.find((entry) => value <= entry.max) ?? STEPS[STEPS.length - 1]
}

export function DemandHeatmap({ data }: DemandHeatmapProps) {
  const lookup = new Map(data.map((cell) => [`${cell.day}-${cell.hour}`, cell.value]))

  return (
    <Panel className="animate-enter">
      <PanelHeader
        eyebrow="Weekly shape"
        title="Demand intensity by day and hour"
        actions={
          <div className="flex items-center gap-2">
            <ProvenanceTag title="Fixed sample grid shipped with the frontend, not derived from the NESO record.">
              Illustrative
            </ProvenanceTag>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.07em] text-[var(--gc-ink-3)]">Low</span>
              <div className="flex gap-px">
                {STEPS.map((entry) => (
                  <span key={entry.label} title={entry.label} className={cn("h-3 w-3", entry.className)} />
                ))}
              </div>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.07em] text-[var(--gc-ink-3)]">High</span>
            </div>
          </div>
        }
      />
      <div className="gc-scroll-x p-4">
        <table className="w-full min-w-[760px] border-collapse">
          <caption className="sr-only">
            Relative demand intensity for each hour of each weekday, as a percentage of the weekly
            maximum.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-10" />
              {hours.map((hour) => (
                <th
                  key={hour}
                  scope="col"
                  className="pb-1.5 text-center font-mono text-[9.5px] font-normal tabular-nums text-[var(--gc-ink-3)]"
                >
                  {String(hour).padStart(2, "0")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <th
                  scope="row"
                  className="pr-2 text-left font-mono text-[10.5px] font-normal uppercase tracking-[0.06em] text-[var(--gc-ink-3)]"
                >
                  {day}
                </th>
                {hours.map((hour) => {
                  const value = lookup.get(`${day}-${hour}`) ?? 0
                  return (
                    <td key={`${day}-${hour}`} className="p-px">
                      <div
                        title={`${day} ${String(hour).padStart(2, "0")}:00 — ${(value * 100).toFixed(0)}% of the weekly maximum`}
                        className={cn("h-5 rounded-[2px]", step(value).className)}
                      >
                        <span className="sr-only">
                          {day} {String(hour).padStart(2, "0")}:00, {(value * 100).toFixed(0)} percent
                        </span>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Note className="border-t border-[var(--gc-rule)] px-4 py-2.5">
        A fixed sample grid bundled with the frontend. Hourly intensity is not yet computed from the
        NESO record.
      </Note>
    </Panel>
  )
}
