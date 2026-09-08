import { Eyebrow } from "@/components/ui/primitives"
import type { ScenarioResults } from "@/lib/scenario-engine"

/** The scenario's own outputs, as one comparable set. */
export function ScenarioKpis({ results }: { results: ScenarioResults }) {
  const items = [
    { label: "Peak demand", value: results.peakDemand.toFixed(1), unit: "GW" },
    { label: "Average demand", value: results.averageDemand.toFixed(1), unit: "GW" },
    { label: "Energy", value: results.forecastEnergy.toFixed(0), unit: "GWh" },
    { label: "Carbon estimate", value: results.carbonImpact.toFixed(0), unit: "ktCO₂" },
    { label: "Peak time", value: results.peakTime, unit: "" },
  ]

  return (
    <div className="grid divide-y divide-[var(--gc-rule)] rounded-[8px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] sm:grid-cols-3 sm:divide-y-0 sm:[&>*:not(:first-child)]:border-l sm:[&>*:not(:first-child)]:border-[var(--gc-rule)] sm:[&>*:nth-child(n+4)]:border-t sm:[&>*:nth-child(n+4)]:border-[var(--gc-rule)] sm:[&>*:nth-child(4)]:border-l-0 lg:grid-cols-5 lg:[&>*:nth-child(n+4)]:border-t-0 lg:[&>*:nth-child(4)]:border-l">
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3">
          <Eyebrow>{item.label}</Eyebrow>
          <p className="mt-1.5 flex items-baseline gap-1 text-[22px] leading-none tracking-[-0.02em] text-[var(--gc-ink)]">
            {item.value}
            {item.unit ? <span className="text-[12px] text-[var(--gc-ink-3)]">{item.unit}</span> : null}
          </p>
        </div>
      ))}
    </div>
  )
}
