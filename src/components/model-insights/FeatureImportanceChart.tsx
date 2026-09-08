"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { ChartDataTable } from "@/components/dashboard/ChartDataTable"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import { Note, Panel, PanelHeader } from "@/components/ui/primitives"
import type { FeatureImportance } from "@/types/dashboard"

type FeatureImportanceChartProps = {
  data: FeatureImportance[]
  method: string | null
}

function FeatureTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: FeatureImportance }[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="rounded-[6px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] px-2.5 py-1.5 shadow-[0_12px_32px_rgba(20,22,26,0.14)]">
      <p className="text-[12px] text-[var(--gc-ink)]">{item.feature}</p>
      <p className="mt-0.5 font-mono text-[11.5px] tabular-nums text-[var(--gc-ink-2)]">
        {item.importance.toFixed(2)}% of total influence
      </p>
    </div>
  )
}

export function FeatureImportanceChart({ data, method }: FeatureImportanceChartProps) {
  const isShap = method === "mean_absolute_shap"
  const max = data.length ? Math.max(...data.map((item) => item.importance)) : 0
  const upper = Math.ceil(max / 10) * 10 || 10
  const ticks = Array.from({ length: upper / 10 + 1 }, (_, index) => index * 10)

  return (
    <Panel className="animate-enter">
      <PanelHeader
        eyebrow="Drivers"
        title="What the model leans on"
        note={
          isShap
            ? "Mean absolute SHAP values across representative training rows."
            : "Model-native coefficients. SHAP is unavailable in this deployment, so the estimator's own weights are shown instead."
        }
      />
      <p className="flex items-start gap-1 border-b border-[var(--gc-rule)] px-4 py-2 text-[11.5px] leading-[1.5] text-[var(--gc-ink-3)]">
        Longer bars mean the output moves more when that input changes — influence, not cause.
        <HelpTooltip content="Global influence over the training data. It does not say that the feature causes demand, only that the model's output is sensitive to it." />
      </p>

      {data.length === 0 ? (
        <Note className="px-4 py-6">Feature influence is unavailable for the active model.</Note>
      ) : (
        <>
          <div className="gc-scroll-x px-1 pt-3 sm:px-3" tabIndex={0} role="region" aria-label="Feature influence chart, scrollable">
            <div className="h-[320px] min-w-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, left: 4, bottom: 4 }}>
                  <CartesianGrid stroke="var(--gc-rule)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, upper]}
                    ticks={ticks}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--gc-ink-3)", fontSize: 10.5 }}
                    tickFormatter={(value: number) => `${value}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    axisLine={false}
                    tickLine={false}
                    width={168}
                    tick={{ fill: "var(--gc-ink-2)", fontSize: 11 }}
                  />
                  <Tooltip content={<FeatureTooltip />} cursor={{ fill: "var(--gc-surface-sunk)" }} />
                  <Bar
                    dataKey="importance"
                    fill="var(--gc-model)"
                    radius={[0, 3, 3, 0]}
                    barSize={12}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <ChartDataTable
            summary="Feature influence data table"
            columns={["Feature", "Share of influence"]}
            rows={data.map((item) => [item.feature, `${item.importance.toFixed(2)}%`])}
          />
        </>
      )}
    </Panel>
  )
}
