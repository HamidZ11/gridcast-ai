import { Clock3, Gauge, Leaf, Sigma, Zap } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { ScenarioResults } from "@/lib/scenario-engine"

export function ScenarioKpis({ results }: { results: ScenarioResults }) {
  const items = [
    { label: "Peak demand", value: `${results.peakDemand.toFixed(1)} GW`, icon: Gauge },
    { label: "Average demand", value: `${results.averageDemand.toFixed(1)} GW`, icon: Sigma },
    { label: "Forecast energy", value: `${results.forecastEnergy.toFixed(0)} GWh`, icon: Zap },
    { label: "Carbon impact", value: `${results.carbonImpact.toFixed(0)} ktCO₂`, icon: Leaf },
    { label: "Peak time", value: results.peakTime, icon: Clock3 },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label} className="min-h-[106px]">
          <CardContent className="flex h-full items-start justify-between gap-3 px-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#94A3B8]">{item.label}</p>
              <p className="mt-2 text-[18px] font-semibold leading-6 tracking-tight text-[#0F172A]">{item.value}</p>
            </div>
            <div className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#F3F6FB] text-[#64748B]">
              <item.icon className="size-3.5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
