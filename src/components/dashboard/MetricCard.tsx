"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"

import { Eyebrow } from "@/components/ui/primitives"
import type { Metric } from "@/types/dashboard"
import { cn } from "@/lib/utils"

/**
 * One figure in the overview's headline row.
 *
 * Rendered as a rule-separated cell rather than a card: these four values are a
 * single comparable set, not four independent objects. A value that could not
 * be sourced renders in the muted ink with a neutral marker, so "Unavailable"
 * can never read as healthy.
 */
export function MetricCard({ metric }: { metric: Metric; index?: number }) {
  const unavailable = metric.value === "--"
  const sparklineData = metric.sparkline.map((value, index) => ({ index, value }))
  const gradientId = `spark-${metric.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`

  return (
    <div className="flex min-w-0 items-stretch justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <Eyebrow>{metric.title}</Eyebrow>
        <p
          className={cn(
            "mt-2 flex items-baseline gap-1.5 leading-none tracking-[-0.02em]",
            unavailable ? "text-[24px] text-[var(--gc-ink-3)]" : "text-[28px] text-[var(--gc-ink)]"
          )}
        >
          {metric.value}
          {metric.unit ? <span className="text-[13px] text-[var(--gc-ink-3)]">{metric.unit}</span> : null}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--gc-ink-2)]">
          <span
            aria-hidden
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              unavailable ? "bg-[var(--gc-rule-strong)]" : "bg-[var(--gc-ok)]"
            )}
          />
          <span className="truncate">{metric.delta}</span>
        </p>
        <p className="mt-1 text-[11.5px] leading-[1.45] text-[var(--gc-ink-3)]">{metric.deltaLabel}</p>
        <p className="mt-1 font-mono text-[10px] uppercase leading-[1.4] tracking-[0.06em] text-[var(--gc-ink-3)]">
          {metric.updatedAt}
        </p>
      </div>

      {sparklineData.length > 1 ? (
        <div aria-hidden className="mt-auto h-8 w-[72px] shrink-0 self-end">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gc-ink-3)" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="var(--gc-ink-3)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                dataKey="value"
                type="monotone"
                stroke="var(--gc-ink-3)"
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  )
}
