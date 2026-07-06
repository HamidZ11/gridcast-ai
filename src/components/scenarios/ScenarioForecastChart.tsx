"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { ScenarioForecastPoint, ScenarioResults } from "@/lib/scenario-engine"

type TooltipEntry = {
  name?: string
  value?: number | [number, number]
  color?: string
}

function ScenarioTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean
  label?: string
  payload?: TooltipEntry[]
}) {
  if (!active || !payload?.length) return null
  const values = payload.filter((item) => typeof item.value === "number")

  return (
    <div className="min-w-48 rounded-[14px] border border-[#E8EDF5] bg-white/96 p-3 shadow-[0_20px_55px_rgba(15,23,42,0.14)] backdrop-blur">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">{label}</p>
      <div className="space-y-1.5">
        {values.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-5 text-[12px]">
            <span className="flex items-center gap-2 font-medium text-[#64748B]">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="tabular-nums font-semibold text-[#0F172A]">
              {(item.value as number).toFixed(1)} GW
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function tickFormatter(value: string) {
  const [day, time] = value.split(" · ")
  return time === "00:00" ? `${day} ${time}` : time
}

export function ScenarioForecastChart({
  results,
  animationKey,
}: {
  results: ScenarioResults
  animationKey: number
}) {
  const peakPoint: ScenarioForecastPoint | undefined = results.points.find(
    (point) => point.scenario === results.peakDemand
  )

  return (
    <Card className="min-h-[530px] shadow-[0_26px_70px_rgba(15,23,42,0.075)]">
      <CardHeader className="gap-4 px-5 pb-0 md:flex md:flex-row md:items-start md:justify-between md:px-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">48-hour simulation</p>
          <h2 className="mt-1 text-[24px] font-semibold leading-8 tracking-tight text-[#0F172A]">
            Scenario demand forecast
          </h2>
          <p className="mt-1 text-[12px] font-medium text-[#64748B]">
            Model-backed simulation compared with the active baseline forecast
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#64748B]">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#CBD5E1]" />Baseline</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#2563EB]" />Scenario</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#DBEAFE]" />Confidence interval</span>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-0 sm:px-5">
        <div className="h-[410px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={results.points} margin={{ top: 34, right: 24, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="scenario-confidence-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.13} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.015} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#EEF2F7" strokeDasharray="3 10" vertical={false} />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                interval={15}
                tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
                tickFormatter={tickFormatter}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={55}
                domain={["dataMin - 2", "dataMax + 2"]}
                tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
                tickFormatter={(value) => `${Math.round(value)} GW`}
              />
              <Tooltip
                content={<ScenarioTooltip />}
                cursor={{ stroke: "#94A3B8", strokeDasharray: "3 6", strokeWidth: 1.2 }}
              />
              <Area
                key={`interval-${animationKey}`}
                dataKey="confidenceRange"
                name="Confidence interval"
                type="monotone"
                stroke="none"
                fill="url(#scenario-confidence-fill)"
                isAnimationActive
                animationDuration={420}
                animationEasing="ease-out"
              />
              <Line
                dataKey="baseline"
                name="Baseline"
                type="monotone"
                stroke="#CBD5E1"
                strokeWidth={2}
                strokeDasharray="5 6"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
              <Line
                key={`scenario-${animationKey}`}
                dataKey="scenario"
                name="Scenario"
                type="monotone"
                stroke="#2563EB"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: "#2563EB", stroke: "#FFFFFF", strokeWidth: 3 }}
                isAnimationActive
                animationDuration={480}
                animationEasing="ease-out"
              />
              {peakPoint ? (
                <ReferenceDot
                  x={peakPoint.time}
                  y={peakPoint.scenario}
                  r={6}
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  label={{
                    value: `Peak ${peakPoint.scenario.toFixed(1)} GW`,
                    position: "top",
                    fill: "#334155",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
