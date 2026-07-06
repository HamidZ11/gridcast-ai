"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { Contribution } from "@/types/dashboard"

type ExplainabilityPanelProps = {
  predictedPeak: string
  basePrediction: string
  unit: string
  window: string
  contributions: Contribution[]
}

function ContributionRow({
  item,
  maxImpact,
}: {
  item: Contribution
  maxImpact: number
}) {
  const isPositive = item.impact >= 0
  const width = `${Math.max((Math.abs(item.impact) / maxImpact) * 50, 1.5)}%`

  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-[#0F172A]">{item.factor}</p>
          <p className="mt-0.5 truncate text-[10px] font-medium text-[#94A3B8]">
            Feature value {item.featureValue}
          </p>
        </div>
        <span
          className={
            isPositive
              ? "shrink-0 tabular-nums text-[12px] font-semibold text-[#047857]"
              : "shrink-0 tabular-nums text-[12px] font-semibold text-[#DC2626]"
          }
        >
          {isPositive ? "+" : ""}
          {item.impact.toFixed(3)} GW
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-[#F1F5F9]">
        <span className="absolute inset-y-0 left-1/2 w-px bg-[#CBD5E1]" />
        <span
          className={
            isPositive
              ? "absolute inset-y-0 left-1/2 rounded-r-full bg-[#10B981] transition-[width] duration-700 ease-out"
              : "absolute inset-y-0 right-1/2 rounded-l-full bg-[#EF6B6B] transition-[width] duration-700 ease-out"
          }
          style={{ width }}
        />
      </div>
    </div>
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
    <Card className="animate-enter min-h-[338px]">
      <CardHeader className="border-b border-[#E8EDF5] px-5 pb-4 pt-5">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.16em] text-[#94A3B8]">
          Prediction Explainability
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
              Final prediction
            </p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="tabular-nums text-[36px] font-semibold leading-none tracking-tight text-[#0F172A]">
                {predictedPeak}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                {unit}
              </span>
            </div>
          </div>
          <div className="border-l border-[#E8EDF5] pl-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
              Base prediction
            </p>
            <p className="mt-1.5 tabular-nums text-[20px] font-semibold leading-6 text-[#334155]">
              {basePrediction} {unit}
            </p>
          </div>
        </div>
        <p className="mt-2.5 text-[12px] font-medium leading-5 text-[#64748B]">{window}</p>
      </CardHeader>
      <CardContent className="px-5 pt-5">
        {contributions.length === 0 ? (
          <div className="rounded-[15px] border border-[#E8EDF5] bg-[#F8FAFD] p-4">
            <p className="text-[13px] font-medium leading-6 text-[#64748B]">
              A local SHAP explanation is not available for this forecast point.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#047857]">
                Positive contributors
              </p>
              <div className="space-y-4">
                {positive.length ? (
                  positive.map((item) => (
                    <ContributionRow key={item.factor} item={item} maxImpact={maxImpact} />
                  ))
                ) : (
                  <p className="text-[12px] font-medium text-[#94A3B8]">No positive contributions.</p>
                )}
              </div>
            </div>
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B91C1C]">
                Negative contributors
              </p>
              <div className="space-y-4">
                {negative.length ? (
                  negative.map((item) => (
                    <ContributionRow key={item.factor} item={item} maxImpact={maxImpact} />
                  ))
                ) : (
                  <p className="text-[12px] font-medium text-[#94A3B8]">No negative contributions.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
