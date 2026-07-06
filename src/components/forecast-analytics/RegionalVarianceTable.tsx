import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { RegionalVariance } from "@/data/mockForecastAnalyticsData"
import { cn } from "@/lib/utils"

type RegionalVarianceTableProps = {
  rows: RegionalVariance[]
}

export function RegionalVarianceTable({ rows }: RegionalVarianceTableProps) {
  return (
    <Card className="animate-enter min-h-[300px]">
      <CardHeader className="px-5 pt-5">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.16em] text-[#94A3B8]">
          Regional Demand Variance
        </p>
        <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-tight text-[#0F172A]">
          Load deviation by region
        </h2>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-y border-[#E8EDF5] bg-[#F8FAFD] text-[11px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
              <th className="px-5 py-2.5">Region</th>
              <th className="px-3.5 py-2.5">Load</th>
              <th className="px-3.5 py-2.5">Trend</th>
              <th className="px-5 py-2.5">Anomaly Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8EDF5]">
            {rows.map((row) => (
              <tr key={row.region} className="transition hover:bg-[#FBFCFE]">
                <td className="px-5 py-3 font-semibold text-[#0F172A]">{row.region}</td>
                <td className="px-3.5 py-3 font-medium tabular-nums text-[#64748B]">{row.load}</td>
                <td className="px-3.5 py-3 font-medium tabular-nums text-[#64748B]">{row.trend}</td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                      row.severity === "critical"
                        ? "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
                        : row.severity === "stable"
                          ? "border-[#E8EDF5] bg-white text-[#64748B]"
                          : "border-[#E8EDF5] bg-[#F8FAFD] text-[#64748B]"
                    )}
                  >
                    {row.anomalyScore}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
