"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { ForecastPoint } from "@/types/dashboard"

type ForecastChartProps = {
  data: ForecastPoint[]
  latestObservationLabel: string
  forecastStartTimestamp: string | null
  forecastStartLabel: string
  peakTime: string | null
  peakDemand: number | null
  modelVersion: string
  dataset: string
  trainingData: string
  forecastHorizon: string
}

type TooltipPayload = {
  name: string
  value: number | [number, number] | null
  color?: string
  payload?: ForecastPoint
}

function formatTimestamp(timestamp: string) {
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(timestamp))} UTC`
}

function formatAxisTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }).format(date)
  }
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date)
}

function ChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean
  label?: string
  payload?: TooltipPayload[]
}) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="min-w-[224px] rounded-[18px] border border-[#E8EDF5] bg-white/96 p-3.5 shadow-[0_24px_70px_rgba(15,23,42,0.16)] ring-1 ring-white/70 backdrop-blur">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
        {label ? formatTimestamp(label) : "Timestamp unavailable"}
      </p>
      <div className="space-y-1.5">
        {payload.map((item) => {
          if (item.value === null || (item.payload?.forecastAnchor && item.name === "Forecast demand")) return null
          const value = Array.isArray(item.value)
            ? `${item.value[0].toFixed(1)}-${item.value[1].toFixed(1)} GW`
            : `${item.value.toFixed(1)} GW`

          return (
            <div key={item.name} className="flex items-center justify-between gap-7 text-[13px]">
              <span className="flex items-center gap-2 font-medium text-[#64748B]">
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color ?? "#94A3B8" }} />
                {item.name}
              </span>
              <span className="tabular-nums font-semibold text-[#0F172A]">{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ForecastChart({
  data,
  latestObservationLabel,
  forecastStartTimestamp,
  forecastStartLabel,
  peakTime,
  peakDemand,
  modelVersion,
  dataset,
  trainingData,
  forecastHorizon,
}: ForecastChartProps) {
  const axisTicks = data
    .filter((point, index) => {
      if (index === 0 || index === data.length - 1) return true
      const timestamp = new Date(point.timestamp)
      return timestamp.getUTCMinutes() === 0 && timestamp.getUTCHours() % 6 === 0
    })
    .map((point) => point.timestamp)

  return (
    <Card className="min-h-[640px] shadow-[0_26px_70px_rgba(15,23,42,0.075)]">
      <CardHeader className="flex flex-col gap-3.5 px-5 pt-5 md:flex-row md:items-start md:justify-between md:px-6 md:pt-6">
        <div>
          <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.16em] text-[#94A3B8]">Demand Forecast</p>
          <h2 className="mt-1.5 text-[26px] font-semibold leading-8 tracking-tight text-[#0F172A]">
            Historical demand and 48-hour forecast
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-semibold text-[#64748B]">
            <span>Latest observation: {latestObservationLabel}</span>
            <span>Forecast starts: {forecastStartLabel}</span>
            {forecastHorizon !== "Unavailable" ? <span>Forecast horizon: {forecastHorizon}</span> : null}
            {dataset !== "Unavailable" ? <span>Source: {dataset}</span> : null}
            {modelVersion !== "Unavailable" ? <span>Model: {modelVersion}</span> : null}
            {trainingData !== "Unavailable" ? <span>Training data: {trainingData}</span> : null}
          </div>
        </div>
        <div className="hidden items-center gap-3.5 rounded-full border border-[#E8EDF5] bg-[#F8FAFD] px-3 py-1.5 text-[11px] font-bold text-[#64748B] sm:flex">
          <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#334155]" />Historical</span>
          <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#2563EB]" />Forecast</span>
          <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#CBD5E1]" />90% interval</span>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-5 pt-0 sm:px-6">
        <div className="h-[530px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 30, right: 26, left: 4, bottom: 14 }}>
              <defs>
                <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.045} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#EEF2F7" strokeDasharray="3 10" vertical={false} />
              <XAxis
                dataKey="timestamp"
                axisLine={false}
                tickLine={false}
                ticks={axisTicks}
                interval="preserveStartEnd"
                minTickGap={48}
                tick={{ fill: "#64748B", fontSize: 12, fontWeight: 700 }}
                tickFormatter={formatAxisTimestamp}
                dy={14}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 12, fontWeight: 700 }}
                domain={["dataMin - 2", "dataMax + 2"]}
                tickFormatter={(value) => `${value} GW`}
                width={58}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "#94A3B8", strokeDasharray: "3 6", strokeWidth: 1.4 }}
                wrapperStyle={{ outline: "none" }}
              />
              <Area
                name="90% confidence"
                dataKey="confidenceRange"
                type="monotone"
                stroke="none"
                fill="url(#confidenceBand)"
                connectNulls
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
              <Line
                name="Historical demand"
                dataKey="demand"
                type="monotone"
                stroke="#334155"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5.5, fill: "#334155", stroke: "#FFFFFF", strokeWidth: 3 }}
                connectNulls={false}
                isAnimationActive
                animationDuration={860}
                animationEasing="ease-out"
              />
              <Line
                name="Forecast demand"
                dataKey="forecast"
                type="monotone"
                stroke="#2563EB"
                strokeWidth={3}
                strokeDasharray="6 7"
                dot={false}
                activeDot={{ r: 6, fill: "#2563EB", stroke: "#FFFFFF", strokeWidth: 3 }}
                connectNulls={false}
                isAnimationActive
                animationDuration={1040}
                animationEasing="ease-out"
              />
              {forecastStartTimestamp ? (
                <ReferenceLine
                  x={forecastStartTimestamp}
                  stroke="#94A3B8"
                  strokeDasharray="4 6"
                  label={{ value: "Forecast starts", position: "top", fill: "#64748B", fontSize: 12, fontWeight: 800 }}
                />
              ) : null}
              {peakDemand !== null ? (
                <ReferenceLine
                  y={peakDemand}
                  stroke="#D7DEE9"
                  strokeDasharray="4 6"
                  label={{ value: `Peak ${peakDemand.toFixed(1)} GW`, position: "insideTopRight", fill: "#64748B", fontSize: 12, fontWeight: 800 }}
                />
              ) : null}
              {peakTime && peakDemand !== null ? (
                <ReferenceDot
                  x={peakTime}
                  y={peakDemand}
                  r={7}
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth={3.5}
                />
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
