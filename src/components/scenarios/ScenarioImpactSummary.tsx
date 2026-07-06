import { Activity, BrainCircuit, Gauge, Leaf, Zap } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { GridStress, ScenarioResults } from "@/lib/scenario-engine"
import { cn } from "@/lib/utils"

function levelClasses(level: GridStress) {
  if (level === "High") return "bg-[#FEF2F2] text-[#DC2626]"
  if (level === "Medium") return "bg-[#FFFBEB] text-[#B45309]"
  return "bg-[#ECFDF5] text-[#047857]"
}

export function ScenarioImpactSummary({ results }: { results: ScenarioResults }) {
  const peakLevel: GridStress =
    Math.abs(results.peakChange) >= 3 ? "High" : Math.abs(results.peakChange) >= 1.2 ? "Medium" : "Low"
  const energyLevel: GridStress =
    Math.abs(results.energyChange) >= 70 ? "High" : Math.abs(results.energyChange) >= 25 ? "Medium" : "Low"
  const carbonLevel: GridStress =
    Math.abs(results.carbonChange) >= 12 ? "High" : Math.abs(results.carbonChange) >= 4 ? "Medium" : "Low"
  const impacts = [
    {
      label: "Peak change",
      value: `${results.peakChange >= 0 ? "+" : ""}${results.peakChange.toFixed(1)} GW`,
      detail: "Compared with baseline",
      level: peakLevel,
      icon: Gauge,
    },
    {
      label: "Energy change",
      value: `${results.energyChange >= 0 ? "+" : ""}${results.energyChange.toFixed(1)} GWh`,
      detail: "Across 48 hours",
      level: energyLevel,
      icon: Zap,
    },
    {
      label: "Carbon change",
      value: `${results.carbonChange >= 0 ? "+" : ""}${results.carbonChange.toFixed(1)} ktCO₂`,
      detail: "Estimated marginal impact",
      level: carbonLevel,
      icon: Leaf,
    },
    {
      label: "Grid stress indicator",
      value: results.gridStress,
      detail: "Based on peak and uplift",
      level: results.gridStress,
      icon: Activity,
    },
  ]

  return (
    <section className="mt-3.5 space-y-3.5">
      <Card className="border-[#BFDBFE] bg-[#F8FBFF] shadow-[0_18px_44px_rgba(37,99,235,0.07)]">
        <CardContent className="flex items-start gap-4 px-5">
          <div className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[#2563EB] text-white shadow-[0_10px_22px_rgba(37,99,235,0.2)]">
            <BrainCircuit className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-[14px] font-semibold text-[#0F172A]">Scenario impact summary</h2>
              <span className="text-[11px] font-semibold text-[#2563EB]">
                {results.confidence.toFixed(1)}% simulation confidence
              </span>
            </div>
            <p className="mt-1.5 max-w-5xl text-[13px] font-medium leading-5 text-[#475569]">{results.summary}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {impacts.map((impact) => (
          <Card key={impact.label} className="transition duration-200 hover:shadow-[0_22px_52px_rgba(15,23,42,0.075)]">
            <CardContent className="flex items-start justify-between gap-4 px-4">
              <div>
                <p className="text-[11px] font-semibold text-[#64748B]">{impact.label}</p>
                <p className="mt-1.5 tabular-nums text-[24px] font-semibold leading-7 tracking-tight text-[#0F172A]">
                  {impact.value}
                </p>
                <p className="mt-1.5 text-[11px] font-medium text-[#94A3B8]">{impact.detail}</p>
              </div>
              <div className={cn("grid size-9 shrink-0 place-items-center rounded-[11px]", levelClasses(impact.level))}>
                <impact.icon className="size-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
