import { Note, Panel, PanelHeader, StatusChip } from "@/components/ui/primitives"
import type { GridStress, ScenarioResults } from "@/lib/scenario-engine"

function stressTone(level: GridStress) {
  if (level === "High") return "bad" as const
  if (level === "Medium") return "warn" as const
  return "ok" as const
}

/**
 * Deltas against the baseline. A large change is not a fault, so the numbers
 * are plain; the reserved status colours are kept for the grid-stress reading,
 * which is the only value here with a good/bad meaning.
 */
export function ScenarioImpactSummary({ results }: { results: ScenarioResults }) {
  const deltas = [
    {
      label: "Peak",
      value: `${results.peakChange >= 0 ? "+" : ""}${results.peakChange.toFixed(1)}`,
      unit: "GW",
      detail: "vs baseline peak",
    },
    {
      label: "Energy",
      value: `${results.energyChange >= 0 ? "+" : ""}${results.energyChange.toFixed(1)}`,
      unit: "GWh",
      detail: "across 48 hours",
    },
    {
      label: "Carbon",
      value: `${results.carbonChange >= 0 ? "+" : ""}${results.carbonChange.toFixed(1)}`,
      unit: "ktCO₂",
      detail: "estimated marginal",
    },
  ]

  return (
    <Panel className="mt-3">
      <PanelHeader
        eyebrow="Result"
        title="Change against the baseline"
        actions={<StatusChip tone={stressTone(results.gridStress)}>Grid stress {results.gridStress}</StatusChip>}
      />
      <div className="grid divide-y divide-[var(--gc-rule)] sm:grid-cols-3 sm:divide-y-0 sm:[&>*:not(:first-child)]:border-l sm:[&>*:not(:first-child)]:border-[var(--gc-rule)]">
        {deltas.map((delta) => (
          <div key={delta.label} className="px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
              {delta.label}
            </p>
            <p className="mt-1.5 flex items-baseline gap-1 text-[22px] leading-none tracking-[-0.02em] text-[var(--gc-ink)]">
              {delta.value}
              <span className="text-[12px] text-[var(--gc-ink-3)]">{delta.unit}</span>
            </p>
            <p className="mt-1.5 text-[11.5px] text-[var(--gc-ink-3)]">{delta.detail}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--gc-rule)] px-4 py-3">
        <p className="text-[12.5px] leading-[1.55] text-[var(--gc-ink-2)]">{results.summary}</p>
        <Note className="mt-2">
          Simulated from documented sensitivity assumptions, not measured. The interval carries the
          model&apos;s {(100 - results.confidence).toFixed(1)}% one-step-ahead validation error and does
          not account for the assumptions themselves.
        </Note>
      </div>
    </Panel>
  )
}
