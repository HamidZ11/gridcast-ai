"use client"

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import type { FeatureImportance } from "@/types/dashboard"

type FeatureImportanceChartProps = {
  data: FeatureImportance[]
  method: string | null
}

type TooltipPayload = {
  payload: FeatureImportance
  value: number
}

function FeatureTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayload[]
}) {
  if (!active || !payload?.length) return null

  const item = payload[0].payload

  return (
    <div className="rounded-[18px] border border-[#E8EDF5] bg-white/96 p-3.5 shadow-[0_24px_70px_rgba(15,23,42,0.16)] ring-1 ring-white/70 backdrop-blur">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Feature impact</p>
      <div className="mt-2 flex min-w-[206px] items-center justify-between gap-7">
        <span className="text-[13px] font-semibold text-[#0F172A]">{item.feature}</span>
        <span className="tabular-nums text-[13px] font-semibold text-[#2563EB]">{item.importance}%</span>
      </div>
    </div>
  )
}

export function FeatureImportanceChart({ data, method }: FeatureImportanceChartProps) {
  const isShap = method === "mean_absolute_shap"
  return (
    <Card className="animate-enter-slow min-h-[550px] shadow-[0_26px_70px_rgba(15,23,42,0.075)]">
      <CardHeader className="px-5 pt-5 md:px-6 md:pt-6">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.16em] text-[#94A3B8]">
          Feature Importance
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <h2 className="text-[26px] font-semibold leading-8 tracking-tight text-[#0F172A]">
            Drivers behind forecast demand
          </h2>
          <HelpTooltip content="Shows which input variables have the greatest influence on the model's predictions. Longer bars indicate that the model relies more heavily on that information." />
        </div>
        <p className="mt-2.5 max-w-3xl text-[13px] font-medium leading-6 text-[#64748B]">
          {isShap
            ? "Mean absolute SHAP values show each feature's average influence across representative training rows."
            : "Model-native coefficients or feature importances show the active estimator's global feature influence."}
        </p>
      </CardHeader>
      <CardContent className="px-2 pb-5 pt-1 sm:px-6">
        <div className="h-[410px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 12, right: 28, left: 12, bottom: 4 }}>
              <CartesianGrid stroke="#EEF2F7" strokeDasharray="3 10" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, "dataMax"]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 12, fontWeight: 700 }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="feature"
                axisLine={false}
                tickLine={false}
                width={160}
                tick={{ fill: "#0F172A", fontSize: 12, fontWeight: 650 }}
              />
              <Tooltip content={<FeatureTooltip />} cursor={{ fill: "#F8FAFD" }} />
              <Bar dataKey="importance" radius={[0, 12, 12, 0]} barSize={20} animationDuration={900} animationEasing="ease-out">
                {data.map((entry, index) => (
                  <Cell key={entry.feature} fill={index < 3 ? "#2563EB" : "#CBD5E1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
