"use client"

import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import type { DistributionPoint } from "@/data/mockForecastAnalyticsData"

type PeakDemandDistributionProps = {
  data: DistributionPoint[]
  mean: string
  p90: string
  volatilityIndex: string
}

export function PeakDemandDistribution({ data, mean, p90, volatilityIndex }: PeakDemandDistributionProps) {
  return (
    <Card className="animate-enter min-h-[560px]">
      <CardHeader className="px-5 pt-5">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.16em] text-[#94A3B8]">
          Peak Demand PDF
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <h2 className="text-[22px] font-semibold leading-7 tracking-tight text-[#0F172A]">
            Probability distribution
          </h2>
          <HelpTooltip content="Shows the likelihood of different peak demand values occurring. The centre of the curve represents the most likely outcome." />
        </div>
        <p className="mt-2 text-[13px] font-medium leading-6 text-[#64748B]">
          Distribution of expected peak demand across the upcoming demand cycle.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[278px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pdf-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <XAxis dataKey="demand" hide />
              <YAxis hide />
              <Tooltip
                cursor={{ stroke: "#94A3B8", strokeDasharray: "3 6" }}
                contentStyle={{ borderColor: "#E8EDF5", borderRadius: 14, boxShadow: "0 18px 40px rgba(15,23,42,0.12)" }}
                formatter={(value) => [Number(value ?? 0).toFixed(3), "Probability"]}
                labelFormatter={(label) => `${label} GW`}
              />
              <Area dataKey="probability" type="monotone" stroke="#2563EB" strokeWidth={2.2} fill="url(#pdf-fill)" animationDuration={900} />
              <ReferenceLine x={34.4} stroke="#334155" strokeDasharray="4 6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-3">
          {[
            ["Mean", mean, null],
            ["P90 confidence", p90, "A conservative demand threshold that 90% of forecast outcomes are expected to remain below. It helps operators plan extra capacity."],
            ["Volatility index", volatilityIndex, null],
          ].map(([label, value, help]) => (
            <div key={label} className="flex items-center justify-between border-t border-[#E8EDF5] pt-3">
              <span className="flex items-center gap-1 text-[12px] font-semibold text-[#64748B]">
                {label}
                {help ? <HelpTooltip content={help} /> : null}
              </span>
              <span className="tabular-nums text-[13px] font-semibold text-[#0F172A]">{value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
