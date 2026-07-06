"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import type { DecompositionPoint } from "@/data/mockForecastAnalyticsData"

type DecompositionChartProps = {
  data: DecompositionPoint[]
}

function MiniAxis() {
  return (
    <>
      <CartesianGrid stroke="#EEF2F7" strokeDasharray="3 10" vertical={false} />
      <XAxis dataKey="time" hide />
      <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
    </>
  )
}

export function DecompositionChart({ data }: DecompositionChartProps) {
  return (
    <Card className="animate-enter-slow min-h-[560px] shadow-[0_26px_70px_rgba(15,23,42,0.075)]">
      <CardHeader className="px-5 pt-5 md:px-6 md:pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.16em] text-[#94A3B8]">
              Time-Series Decomposition
            </p>
            <h2 className="mt-1.5 text-[26px] font-semibold leading-8 tracking-tight text-[#0F172A]">
              Demand signal components
            </h2>
          </div>
          <div className="hidden items-center gap-3 rounded-full border border-[#E8EDF5] bg-[#F8FAFD] px-3 py-1.5 text-[11px] font-bold text-[#64748B] sm:flex">
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#334155]" />Observed</span>
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#2563EB]" />Trend</span>
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#CBD5E1]" />Residual</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-5">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Observed demand</p>
          <div className="h-[98px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="observed-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#334155" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#334155" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <MiniAxis />
                <Area dataKey="observed" type="monotone" stroke="#334155" strokeWidth={2.2} fill="url(#observed-fill)" animationDuration={850} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Linear trend</p>
          <div className="h-[82px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <MiniAxis />
                <Line dataKey="trend" type="monotone" stroke="#2563EB" strokeWidth={2.2} dot={false} animationDuration={850} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">Seasonal variance</p>
          <div className="h-[82px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="seasonal-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <MiniAxis />
                <Area dataKey="seasonal" type="monotone" stroke="#2563EB" strokeWidth={2} fill="url(#seasonal-fill)" animationDuration={850} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
            Unexplained residuals
            <HelpTooltip content="The difference left after trend and repeating patterns are removed. Smaller residuals mean the known patterns explain demand more effectively." />
          </p>
          <div className="h-[78px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <MiniAxis />
                <Bar dataKey="residual" fill="#CBD5E1" radius={[8, 8, 0, 0]} barSize={18} animationDuration={850} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
