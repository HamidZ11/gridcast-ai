"use client"

import { useEffect, useMemo, useState } from "react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Metric } from "@/types/dashboard"

type MetricCardProps = {
  metric: Metric
  index?: number
}

function useCountUp(displayValue: string) {
  const target = useMemo(() => Number(displayValue.replace(/[^\d.-]/g, "")), [displayValue])
  const decimals = displayValue.includes(".") ? displayValue.split(".")[1]?.replace(/[^\d]/g, "").length ?? 0 : 0
  const prefix = displayValue.trim().startsWith("+") ? "+" : ""
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!Number.isFinite(target)) {
      return
    }

    let frame = 0
    const duration = 820
    const startedAt = performance.now()

    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [target])

  if (!Number.isFinite(target)) {
    return displayValue
  }

  return `${prefix}${value.toFixed(decimals)}`
}

export function MetricCard({ metric, index = 0 }: MetricCardProps) {
  const sparklineData = metric.sparkline.map((value, index) => ({ index, value }))
  const gradientId = `spark-${metric.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`
  const animatedValue = useCountUp(metric.value)

  return (
    <Card
      className="animate-enter min-h-[138px] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-[12px] font-semibold leading-5 text-[#64748B]">{metric.title}</CardTitle>
          <span className="mt-1 size-2 rounded-full bg-[#10B981] shadow-[0_0_0_4px_rgba(16,185,129,0.11)]" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="tabular-nums text-[33px] font-semibold leading-none tracking-tight text-[#0F172A]">
                {animatedValue}
              </span>
              <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                {metric.unit}
              </span>
            </div>
            <div className="mt-2.5 space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#047857]">
                  <span className="size-1.5 rounded-full bg-[#10B981]" />
                {metric.delta}
              </span>
                <span className="font-medium text-[#64748B]">{metric.deltaLabel}</span>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
                {metric.updatedAt}
              </p>
            </div>
          </div>
          <div className="h-[50px] w-[100px] shrink-0 opacity-95">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ left: 1, right: 1, top: 8, bottom: 2 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#94A3B8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="value"
                  type="monotone"
                  stroke="#64748B"
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  isAnimationActive
                  animationDuration={720}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
