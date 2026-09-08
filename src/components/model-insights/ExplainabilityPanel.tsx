import { Figure, Note, Panel, PanelHeader } from "@/components/ui/primitives"
import type { Contribution } from "@/types/dashboard"
import { cn } from "@/lib/utils"

type ExplainabilityPanelProps = {
  predictedPeak: string
  basePrediction: string
  unit: string
  window: string
  contributions: Contribution[]
}

/**
 * A diverging view: warm pushes the prediction up, cool pushes it down, with a
 * neutral midpoint. The two poles reuse the product's warm/cool pair rather
 * than red/green, which is reserved for status.
 */
function ContributionRow({ item, maxImpact, unit }: { item: Contribution; maxImpact: number; unit: string }) {
  const positive = item.impact >= 0
  const width = `${Math.max((Math.abs(item.impact) / maxImpact) * 50, 1.5)}%`

  return (
    <li className="border-b border-[var(--gc-rule)] py-2 last:border-b-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[12.5px] text-[var(--gc-ink)]">{item.factor}</p>
          <p className="mt-0.5 truncate font-mono text-[10.5px] text-[var(--gc-ink-3)]">
            {item.featureValue}
          </p>
        </div>
        <span className="shrink-0 font-mono text-[12px] tabular-nums text-[var(--gc-ink)]">
          {positive ? "+" : "−"}
          {Math.abs(item.impact).toFixed(3)} {unit}
        </span>
      </div>
      <div className="relative h-1.5 bg-[var(--gc-surface-sunk)]">
        <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-[var(--gc-rule-strong)]" />
        <span
          className={cn(
            "absolute inset-y-0",
            positive ? "left-1/2 bg-[var(--gc-model)]" : "right-1/2 bg-[var(--gc-observed)]"
          )}
          style={{ width }}
        />
      </div>
    </li>
  )
}

export function ExplainabilityPanel({
  predictedPeak,
  basePrediction,
  unit,
  window,
  contributions,
}: ExplainabilityPanelProps) {
  const positive = contributions.filter((item) => item.impact >= 0)
  const negative = contributions.filter((item) => item.impact < 0)
  const maxImpact = Math.max(...contributions.map((item) => Math.abs(item.impact)), 0.001)

  return (
    <Panel className="animate-enter">
      <PanelHeader eyebrow="Single prediction" title="Why this number" note={window} />

      <div className="flex flex-wrap gap-x-10 gap-y-4 border-b border-[var(--gc-rule)] px-4 py-3.5">
        <Figure
          label="Final prediction"
          value={predictedPeak}
          unit={predictedPeak === "--" ? undefined : unit}
          state={predictedPeak === "--" ? "unavailable" : "value"}
        />
        <Figure
          label="Base prediction"
          value={basePrediction}
          unit={basePrediction === "--" ? undefined : unit}
          state={basePrediction === "--" ? "unavailable" : "value"}
          detail="Average output before this row's features"
        />
      </div>

      {contributions.length === 0 ? (
        <Note className="px-4 py-5">
          No local explanation is available for this forecast point. The{" "}
          <code className="font-mono">/explain</code> endpoint returned no contributions — it does
          so when the <code className="font-mono">shap</code> package is missing from the running
          backend. Nothing is shown in its place.
        </Note>
      ) : (
        <div className="grid gap-x-8 px-4 py-3 md:grid-cols-2">
          <div>
            <p className="flex items-center gap-1.5 pb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--gc-model)]" />
              Pushes the forecast up
            </p>
            <ul className="border-t border-[var(--gc-rule)]">
              {positive.length ? (
                positive.map((item) => (
                  <ContributionRow key={item.factor} item={item} maxImpact={maxImpact} unit={unit} />
                ))
              ) : (
                <li className="py-2 text-[12px] text-[var(--gc-ink-3)]">None.</li>
              )}
            </ul>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="flex items-center gap-1.5 pb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--gc-observed)]" />
              Pushes the forecast down
            </p>
            <ul className="border-t border-[var(--gc-rule)]">
              {negative.length ? (
                negative.map((item) => (
                  <ContributionRow key={item.factor} item={item} maxImpact={maxImpact} unit={unit} />
                ))
              ) : (
                <li className="py-2 text-[12px] text-[var(--gc-ink-3)]">None.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </Panel>
  )
}
