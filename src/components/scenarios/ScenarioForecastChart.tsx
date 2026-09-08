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

import { ChartDataTable } from "@/components/dashboard/ChartDataTable"
import { Eyebrow, Panel, PanelHeader } from "@/components/ui/primitives"
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
    <div className="min-w-44 rounded-[6px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] p-2.5 shadow-[0_12px_32px_rgba(20,22,26,0.14)]">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.07em] text-[var(--gc-ink-3)]">{label}</p>
      <div className="space-y-1">
        {values.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-5 text-[12px]">
            <span className="flex items-center gap-1.5 text-[var(--gc-ink-2)]">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-mono tabular-nums text-[var(--gc-ink)]">
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
  const values = results.points.flatMap((point) => [point.baseline, point.scenario])
  const min = Math.floor((Math.min(...values) - 1) / 2) * 2
  const max = Math.ceil((Math.max(...values) + 1) / 2) * 2
  const ticks: number[] = []
  const stepSize = Math.max(2, Math.ceil((max - min) / 5 / 2) * 2)
  for (let value = min; value <= max; value += stepSize) ticks.push(value)

  return (
    <Panel>
      <PanelHeader
        eyebrow="48-hour simulation"
        title="Scenario against the baseline forecast"
        actions={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <LegendKey color="var(--gc-ink-3)" label="Baseline" dashed />
            <LegendKey color="var(--gc-model)" label="Scenario" />
            <LegendKey color="var(--gc-model)" label="Interval" band />
          </div>
        }
      />
      <div className="gc-scroll-x px-1 pt-3 sm:px-3" tabIndex={0} role="region" aria-label="Scenario simulation chart, scrollable">
        <p className="pl-2 font-mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">GW</p>
        <div className="h-[340px] min-w-[540px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={results.points} margin={{ top: 16, right: 28, left: 0, bottom: 6 }}>
              <defs>
                <linearGradient id="scenario-confidence-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gc-model)" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="var(--gc-model)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--gc-rule)" vertical={false} />
              <XAxis
                dataKey="time"
                axisLine={{ stroke: "var(--gc-rule-strong)" }}
                tickLine={false}
                interval={15}
                tick={{ fill: "var(--gc-ink-3)", fontSize: 11 }}
                tickFormatter={tickFormatter}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={34}
                domain={[min, max]}
                ticks={ticks}
                tick={{ fill: "var(--gc-ink-3)", fontSize: 11 }}
                tickFormatter={(value: number) => `${value}`}
                              />
              <Tooltip
                content={<ScenarioTooltip />}
                cursor={{ stroke: "var(--gc-ink-3)", strokeWidth: 1 }}
              />
              <Area
                key={`interval-${animationKey}`}
                dataKey="confidenceRange"
                name="Interval"
                type="monotone"
                stroke="none"
                fill="url(#scenario-confidence-fill)"
                isAnimationActive={false}
              />
              <Line
                dataKey="baseline"
                name="Baseline"
                type="monotone"
                stroke="var(--gc-ink-3)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
              <Line
                key={`scenario-${animationKey}`}
                dataKey="scenario"
                name="Scenario"
                type="monotone"
                stroke="var(--gc-model)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "var(--gc-model)", stroke: "var(--gc-surface)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
              {peakPoint ? (
                <ReferenceDot
                  x={peakPoint.time}
                  y={peakPoint.scenario}
                  r={4}
                  fill="var(--gc-model)"
                  stroke="var(--gc-surface)"
                  strokeWidth={2}
                  label={{
                    value: `Peak ${peakPoint.scenario.toFixed(1)} GW`,
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
      <ChartDataTable
        summary="Simulation data table"
        note="Every fourth half-hour of the 48-hour horizon."
        columns={["Time", "Baseline GW", "Scenario GW", "Interval"]}
        rows={results.points
          .filter((_, index) => index % 4 === 0)
          .map((point) => [
            point.time,
            point.baseline.toFixed(2),
            point.scenario.toFixed(2),
            `${point.confidenceRange[0].toFixed(1)}-${point.confidenceRange[1].toFixed(1)}`,
          ])}
      />
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
