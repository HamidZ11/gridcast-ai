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

import { ChartDataTable } from "@/components/dashboard/ChartDataTable"
import { Eyebrow, Note, Panel, PanelHeader } from "@/components/ui/primitives"
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
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(timestamp))} UTC`
}

function formatAxisTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }).format(date)
  }
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date)
}

/** Clean, round y ticks rather than whatever the data extremes happen to be. */
function buildYAxis(data: ForecastPoint[]) {
  const values = data.flatMap((point) =>
    [point.demand, point.forecast, point.confidenceLow, point.confidenceHigh].filter(
      (value): value is number => typeof value === "number"
    )
  )
  if (!values.length) return { domain: [0, 10] as [number, number], ticks: [0, 5, 10] }
  const min = Math.floor((Math.min(...values) - 1) / 5) * 5
  const max = Math.ceil((Math.max(...values) + 1) / 5) * 5
  const ticks: number[] = []
  for (let value = min; value <= max; value += 5) ticks.push(value)
  return { domain: [min, max] as [number, number], ticks }
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
  if (!active || !payload?.length) return null

  return (
    <div className="min-w-[196px] rounded-[6px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] p-2.5 shadow-[0_12px_32px_rgba(20,22,26,0.14)]">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.07em] text-[var(--gc-ink-3)]">
        {label ? formatTimestamp(label) : "Timestamp unavailable"}
      </p>
      <div className="space-y-1">
        {payload.map((item) => {
          if (item.value === null || (item.payload?.forecastAnchor && item.name === "Model forecast")) {
            return null
          }
          const value = Array.isArray(item.value)
            ? `${item.value[0].toFixed(1)}–${item.value[1].toFixed(1)}`
            : `${item.value.toFixed(1)}`

          return (
            <div key={item.name} className="flex items-center justify-between gap-6 text-[12px]">
              <span className="flex items-center gap-1.5 text-[var(--gc-ink-2)]">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: item.color ?? "var(--gc-ink-3)" }}
                />
                {item.name}
              </span>
              <span className="font-mono tabular-nums text-[var(--gc-ink)]">{value} GW</span>
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

  const { domain, ticks } = buildYAxis(data)

  const tableRows = data
    .filter((_, index) => index % 4 === 0)
    .map((point) => [
      formatTimestamp(point.timestamp),
      point.demand === null ? null : point.demand.toFixed(2),
      point.forecast === null || point.forecastAnchor ? null : point.forecast.toFixed(2),
      point.confidenceLow === null || point.confidenceHigh === null
        ? null
        : `${point.confidenceLow.toFixed(1)}–${point.confidenceHigh.toFixed(1)}`,
    ])

  return (
    <Panel>
      <PanelHeader
        eyebrow="Demand"
        title="Observed demand and the 48-hour forecast"
        actions={
          data.length === 0 ? null : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <LegendKey color="var(--gc-observed)" label="Observed" />
              <LegendKey color="var(--gc-model)" label="Model forecast" dashed />
              <LegendKey color="var(--gc-model)" label="90% interval" band />
            </div>
          )
        }
      />

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-b border-[var(--gc-rule)] px-4 py-2.5 sm:grid-cols-3 xl:grid-cols-5">
        {[
          { label: "Latest observation", value: latestObservationLabel },
          { label: "Forecast starts", value: forecastStartLabel },
          { label: "Horizon", value: forecastHorizon },
          { label: "Model", value: modelVersion },
          { label: "Source", value: dataset === "Unavailable" ? trainingData : dataset },
        ].map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
              {item.label}
            </dt>
            <dd className="mt-0.5 truncate text-[11.5px] text-[var(--gc-ink-2)]" title={item.value}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {data.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-[13.5px] text-[var(--gc-ink)]">No forecast to plot</p>
          <Note className="mx-auto mt-1.5 max-w-[46ch]">
            The demand series could not be sourced, so nothing is drawn. An empty axis is not a
            forecast of zero.
          </Note>
        </div>
      ) : (
      <div className="gc-scroll-x px-1 pb-1 pt-3 sm:px-3">
        <p className="pl-2 font-mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">GW</p>
        <div className="h-[400px] min-w-[560px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 14, right: 26, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="gc-confidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gc-model)" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="var(--gc-model)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--gc-rule)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                axisLine={{ stroke: "var(--gc-rule-strong)" }}
                tickLine={false}
                ticks={axisTicks}
                interval="preserveStartEnd"
                minTickGap={40}
                tick={{ fill: "var(--gc-ink-3)", fontSize: 11 }}
                tickFormatter={formatAxisTimestamp}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--gc-ink-3)", fontSize: 11 }}
                domain={domain}
                ticks={ticks}
                tickFormatter={(value: number) => `${value}`}
                width={34}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "var(--gc-ink-3)", strokeWidth: 1 }}
                wrapperStyle={{ outline: "none" }}
              />
              <Area
                name="90% interval"
                dataKey="confidenceRange"
                type="monotone"
                stroke="none"
                fill="url(#gc-confidence)"
                connectNulls
                isAnimationActive={false}
              />
              <Line
                name="Observed"
                dataKey="demand"
                type="monotone"
                stroke="var(--gc-observed)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "var(--gc-observed)", stroke: "var(--gc-surface)", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                name="Model forecast"
                dataKey="forecast"
                type="monotone"
                stroke="var(--gc-model)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4, fill: "var(--gc-model)", stroke: "var(--gc-surface)", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              {forecastStartTimestamp ? (
                <ReferenceLine
                  x={forecastStartTimestamp}
                  stroke="var(--gc-rule-strong)"
                  label={{
                    value: "Forecast starts",
                    position: "top",
                    fill: "var(--gc-ink-3)",
                    fontSize: 10.5,
                  }}
                />
              ) : null}
              {peakTime && peakDemand !== null ? (
                <ReferenceDot
                  x={peakTime}
                  y={peakDemand}
                  r={4}
                  fill="var(--gc-model)"
                  stroke="var(--gc-surface)"
                  strokeWidth={2}
                  label={{
                    value: `Peak ${peakDemand.toFixed(1)} GW`,
                    position: "top",
                    fill: "var(--gc-ink)",
                    fontSize: 10.5,
                  }}
                />
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {data.length === 0 ? null : (
      <Note className="px-4 pb-3">
        The forecast is produced recursively — each half-hour is fed back in as the next step&apos;s
        input — so error compounds across the horizon. The interval is approximated from validation
        RMSE and is not calibrated per step.
      </Note>
      )}

      {data.length === 0 ? null : (
      <ChartDataTable
        summary="Forecast data table"
        note="Every second hour of the plotted window."
        columns={["Timestamp", "Observed GW", "Forecast GW", "90% interval"]}
        rows={tableRows}
      />
      )}
    </Panel>
  )
}

function LegendKey({
  color,
  label,
  dashed = false,
  band = false,
}: {
  color: string
  label: string
  dashed?: boolean
  band?: boolean
}) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="14" height="8" aria-hidden className="shrink-0">
        {band ? (
          <rect x="0" y="1" width="14" height="6" fill={color} opacity="0.16" />
        ) : (
          <line
            x1="0"
            y1="4"
            x2="14"
            y2="4"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={dashed ? "4 3" : undefined}
          />
        )}
      </svg>
      <Eyebrow className="normal-case tracking-[0.04em]">{label}</Eyebrow>
    </span>
  )
}
