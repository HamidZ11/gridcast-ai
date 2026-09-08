"use client"

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { ChartDataTable } from "@/components/dashboard/ChartDataTable"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import { DefinitionList, Note, Panel, PanelHeader } from "@/components/ui/primitives"
import type { DistributionPoint } from "@/data/mockForecastAnalyticsData"

type PeakDemandDistributionProps = {
  data: DistributionPoint[]
  mean: string
  p90: string
  volatilityIndex: string
}

/**
 * The spread implied by the model's forecast and its saved validation error, so
 * the series wears the model colour.
 */
export function PeakDemandDistribution({ data, mean, p90, volatilityIndex }: PeakDemandDistributionProps) {
  const meanValue = Number.parseFloat(mean)
  const hasData = data.length > 0
  // Five distinct ticks - formatting the raw float values to 0dp repeated them.
  const xTicks = hasData
    ? Array.from({ length: 5 }, (_, index) => data[Math.round((index * (data.length - 1)) / 4)].demand)
    : []

  return (
    <Panel className="animate-enter flex flex-col self-start">
      <PanelHeader
        eyebrow="Forecast spread"
        title="Where the forecast is likely to land"
        note="Built from the model's 48-hour forecast and its saved validation RMSE."
      />

      {hasData ? (
        <>
          <div className="px-2 pt-3 sm:px-3">
            <div className="h-[196px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 14, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gc-pdf-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gc-model)" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="var(--gc-model)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--gc-rule)" vertical={false} />
                  <XAxis
                    dataKey="demand"
                    axisLine={{ stroke: "var(--gc-rule-strong)" }}
                    tickLine={false}
                    tick={{ fill: "var(--gc-ink-3)", fontSize: 10.5 }}
                    ticks={xTicks}
                    tickFormatter={(value: number) => value.toFixed(1)}
                    dy={4}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ stroke: "var(--gc-ink-3)", strokeWidth: 1 }}
                    contentStyle={{
                      borderColor: "var(--gc-rule-strong)",
                      borderRadius: 6,
                      background: "var(--gc-surface)",
                      fontSize: 12,
                      boxShadow: "0 12px 32px rgba(20,22,26,0.12)",
                    }}
                    labelStyle={{ color: "var(--gc-ink-3)", fontSize: 11 }}
                    formatter={(value) => [Number(value ?? 0).toFixed(3), "Relative likelihood"]}
                    labelFormatter={(label) => `${label} GW`}
                  />
                  <Area
                    dataKey="probability"
                    type="monotone"
                    stroke="var(--gc-model)"
                    strokeWidth={2}
                    fill="url(#gc-pdf-fill)"
                    isAnimationActive={false}
                  />
                  {Number.isFinite(meanValue) ? (
                    <ReferenceLine
                      x={data.reduce((closest, point) =>
                        Math.abs(point.demand - meanValue) < Math.abs(closest.demand - meanValue) ? point : closest
                      ).demand}
                      stroke="var(--gc-ink-2)"
                      label={{
                        value: "Mean",
                        position: "top",
                        fill: "var(--gc-ink-3)",
                        fontSize: 10.5,
                      }}
                    />
                  ) : null}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="pb-1 text-center font-mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
              Demand · GW
            </p>
          </div>

          <div className="px-4 pb-3">
            <DefinitionList
              items={[
                { label: "Mean of the horizon", value: <span className="font-mono tabular-nums">{mean}</span> },
                {
                  label: "Upper interval bound",
                  value: <span className="font-mono tabular-nums">{p90}</span>,
                },
                {
                  label: "Interval width vs mean",
                  value: <span className="font-mono tabular-nums">{volatilityIndex}</span>,
                },
              ]}
            />
            <Note className="mt-2 flex items-start gap-1">
              Interval width is an RMSE approximation, uniform across the horizon rather than
              calibrated per step.
              <HelpTooltip content="The band is derived from the model's overall validation error, so it does not widen further into the forecast the way a calibrated interval would." />
            </Note>
          </div>

          <ChartDataTable
            summary="Distribution data table"
            columns={["Demand GW", "Relative likelihood"]}
            rows={data.map((point) => [point.demand.toFixed(2), point.probability.toFixed(4)])}
          />
        </>
      ) : (
        <div className="flex flex-1 items-center px-4 py-8">
          <Note>
            No forecast artifact is available, so the spread cannot be derived. Nothing is shown
            rather than a placeholder curve.
          </Note>
        </div>
      )}
    </Panel>
  )
}
