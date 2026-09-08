"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartDataTable } from "@/components/dashboard/ChartDataTable"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import { Eyebrow, Note, Panel, PanelHeader, ProvenanceTag } from "@/components/ui/primitives"
import type { DecompositionPoint } from "@/data/mockForecastAnalyticsData"

type DecompositionChartProps = {
  data: DecompositionPoint[]
}

/*
 * Small multiples over one shared x axis - four panels, one measure each,
 * rather than four scales on one plot. Every series here describes the observed
 * signal, so all four use the observation blue / neutral ink. Orange is
 * reserved for model output.
 */

const AXIS = { stroke: "var(--gc-rule)" }

function MiniFrame({ children, label, help }: { children: React.ReactNode; label: string; help?: string }) {
  return (
    <div className="border-t border-[var(--gc-rule)] px-4 py-3 first:border-t-0">
      <div className="mb-1.5 flex items-center gap-1">
        <Eyebrow>{label}</Eyebrow>
        {help ? <HelpTooltip content={help} /> : null}
      </div>
      <div className="h-[74px]">{children}</div>
    </div>
  )
}

function MiniTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
  unit: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[5px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] px-2 py-1 font-mono text-[11px] tabular-nums text-[var(--gc-ink)] shadow-[0_8px_24px_rgba(20,22,26,0.12)]">
      {label} · {payload[0].value.toFixed(1)} {unit}
    </div>
  )
}

export function DecompositionChart({ data }: DecompositionChartProps) {
  const rows = data.map((point) => [
    point.time,
    point.observed.toFixed(1),
    point.trend.toFixed(1),
    point.seasonal.toFixed(1),
    point.residual.toFixed(1),
  ])

  return (
    <Panel className="animate-enter">
      <PanelHeader
        eyebrow="Decomposition"
        title="Demand signal components"
        note="Observed demand split into trend, repeating daily shape, and what is left over."
        actions={<ProvenanceTag title="Fixed sample series shipped with the frontend, not a model output.">Illustrative</ProvenanceTag>}
      />

      <MiniFrame label="Observed demand · GW">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gc-observed-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gc-observed)" stopOpacity={0.14} />
                <stop offset="100%" stopColor="var(--gc-observed)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={AXIS.stroke} vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
            <Tooltip content={<MiniTooltip unit="GW" />} cursor={{ stroke: "var(--gc-ink-3)", strokeWidth: 1 }} />
            <Area
              dataKey="observed"
              type="monotone"
              stroke="var(--gc-observed)"
              strokeWidth={2}
              fill="url(#gc-observed-fill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </MiniFrame>

      <MiniFrame label="Linear trend · GW">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={AXIS.stroke} vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
            <Tooltip content={<MiniTooltip unit="GW" />} cursor={{ stroke: "var(--gc-ink-3)", strokeWidth: 1 }} />
            <Line
              dataKey="trend"
              type="monotone"
              stroke="var(--gc-ink-2)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </MiniFrame>

      <MiniFrame label="Seasonal component · GW">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gc-seasonal-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gc-observed)" stopOpacity={0.12} />
                <stop offset="100%" stopColor="var(--gc-observed)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={AXIS.stroke} vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
            <Tooltip content={<MiniTooltip unit="GW" />} cursor={{ stroke: "var(--gc-ink-3)", strokeWidth: 1 }} />
            <Area
              dataKey="seasonal"
              type="monotone"
              stroke="var(--gc-observed)"
              strokeWidth={1.5}
              fill="url(#gc-seasonal-fill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </MiniFrame>

      <MiniFrame
        label="Unexplained residual · GW"
        help="What is left after trend and the repeating daily shape are removed. Smaller residuals mean the known patterns explain more of the demand."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={AXIS.stroke} vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis hide domain={["dataMin - 0.5", "dataMax + 0.5"]} />
            <Tooltip content={<MiniTooltip unit="GW" />} cursor={{ fill: "var(--gc-surface-sunk)" }} />
            <Bar dataKey="residual" fill="var(--gc-ink-3)" radius={[3, 3, 0, 0]} barSize={14} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </MiniFrame>

      <div className="flex justify-between border-t border-[var(--gc-rule)] px-4 pb-1 pt-1.5" aria-hidden>
        {data
          .filter((_, index) => index % 3 === 0)
          .map((point) => (
            <span
              key={point.time}
              className="font-mono text-[9.5px] tabular-nums text-[var(--gc-ink-3)]"
            >
              {point.time}
            </span>
          ))}
      </div>

      <Note className="border-t border-[var(--gc-rule)] px-4 py-2.5">
        This decomposition is a fixed sample series bundled with the frontend. It shows the shape of
        the analysis, not a result computed from the NESO record.
      </Note>

      <ChartDataTable
        summary="Decomposition data table"
        columns={["Time", "Observed", "Trend", "Seasonal", "Residual"]}
        rows={rows}
      />
    </Panel>
  )
}
