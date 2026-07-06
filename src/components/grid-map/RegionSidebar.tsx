"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  getRegionalLayerPresentation,
  type RegionalDemandData,
  type RegionalLayer,
} from "@/lib/regional-data"
import { cn } from "@/lib/utils"

function statusClasses(tone: ReturnType<typeof getRegionalLayerPresentation>["badgeTone"]) {
  if (tone === "danger") return "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
  if (tone === "warning") return "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]"
  if (tone === "success") return "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]"
  return "border-[#E8EDF5] bg-[#F8FAFD] text-[#64748B]"
}

export function RegionSidebar({
  region,
  layer,
}: {
  region: RegionalDemandData
  layer: RegionalLayer
}) {
  const presentation = getRegionalLayerPresentation(region, layer)
  const consumers = [
    ["Residential", region.consumers.residential],
    ["Industrial", region.consumers.industrial],
    ["Commercial", region.consumers.commercial],
  ] as const

  return (
    <Card key={region.id} className="animate-enter min-h-[724px]">
      <CardHeader className="border-b border-[#E8EDF5] px-5 pb-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Selected region</p>
            <h2 className="mt-1.5 text-[25px] font-semibold leading-8 tracking-tight text-[#0F172A]">{region.name}</h2>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
              {presentation.layerLabel}
            </p>
          </div>
          <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold", statusClasses(presentation.badgeTone))}>
            {presentation.badge}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-5 pt-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          {presentation.metrics.map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">{label}</p>
              <p className="mt-2 tabular-nums text-[15px] font-semibold leading-5 text-[#0F172A]">{value}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-[#E8EDF5] pt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">24-hour demand</p>
              <p className="mt-1 text-[12px] font-medium text-[#64748B]">Regional demand profile</p>
            </div>
            <span className="tabular-nums text-[11px] font-semibold text-[#64748B]">
              {region.demandChange >= 0 ? "+" : ""}{region.demandChange.toFixed(1)}% vs yesterday
            </span>
          </div>
          <div className="mt-3 h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={region.sparkline} margin={{ top: 8, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id={`region-spark-${region.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="demand"
                  type="monotone"
                  stroke="#2563EB"
                  strokeWidth={2.2}
                  fill={`url(#region-spark-${region.id})`}
                  dot={false}
                  isAnimationActive
                  animationDuration={450}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border-t border-[#E8EDF5] pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Top consumers</p>
          <div className="mt-4 space-y-3.5">
            {consumers.map(([label, value]) => (
              <div key={label}>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-[#475569]">{label}</span>
                  <span className="tabular-nums font-semibold text-[#0F172A]">{value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#EEF2F7]">
                  <div className="h-full rounded-full bg-[#94A3B8] transition-[width] duration-300" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
