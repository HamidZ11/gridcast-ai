import { CheckCircle2 } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import type { ModelPerformance } from "@/types/dashboard"
import { cn } from "@/lib/utils"

type PerformanceTableProps = {
  rows: ModelPerformance[]
}

export function PerformanceTable({ rows }: PerformanceTableProps) {
  return (
    <Card className="animate-enter-slow">
      <CardHeader className="px-5 pt-5 md:px-6">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.16em] text-[#94A3B8]">
          Performance Comparison
        </p>
        <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-tight text-[#0F172A]">
          Model evaluation leaderboard
        </h2>
      </CardHeader>
      <CardContent className="px-0 pb-2.5 pt-1">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-y border-[#E8EDF5] bg-[#F8FAFD] text-[11px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
                <th className="px-6 py-2.5">Model</th>
                <MetricHeading label="MAE" help="Mean Absolute Error is the average size of forecast mistakes. Lower values mean predictions are closer to actual demand." />
                <MetricHeading label="RMSE" help="Root Mean Squared Error gives extra weight to large forecast mistakes. Lower values indicate fewer costly prediction misses." />
                <MetricHeading label="MAPE" help="Mean Absolute Percentage Error expresses average forecast error as a percentage. It makes accuracy easier to compare across demand levels." />
                <MetricHeading label="R²" help="Shows how much of the variation in demand the model explains. Values closer to 1 indicate a better fit to observed patterns." />
                <th className="px-6 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF5]">
              {rows.map((row) => {
                const selected = row.status === "Production"

                return (
                  <tr key={row.model} className={cn("text-[13px] transition", selected ? "bg-[#F8FAFD]" : "hover:bg-[#FBFCFE]")}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            selected ? "bg-[#2563EB] shadow-[0_0_0_5px_rgba(37,99,235,0.1)]" : "bg-[#CBD5E1]"
                          )}
                        />
                        <span className="font-semibold text-[#0F172A]">{row.model}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 font-medium tabular-nums text-[#64748B]">{row.mae}</td>
                    <td className="px-3.5 py-3 font-medium tabular-nums text-[#64748B]">{row.rmse}</td>
                    <td className="px-3.5 py-3 font-medium tabular-nums text-[#64748B]">{row.mape}</td>
                    <td className="px-3.5 py-3 font-medium tabular-nums text-[#64748B]">{row.r2}</td>
                    <td className="px-6 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                          selected
                            ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                            : "border-[#E8EDF5] bg-white text-[#64748B]"
                        )}
                      >
                        {selected ? <CheckCircle2 className="size-3.5" /> : null}
                        {row.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricHeading({ label, help }: { label: string; help: string }) {
  return (
    <th className="px-3.5 py-2.5">
      <span className="flex items-center gap-1">
        {label}
        <HelpTooltip content={help} />
      </span>
    </th>
  )
}
