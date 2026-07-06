import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { HeatmapCell } from "@/data/mockForecastAnalyticsData"
import { cn } from "@/lib/utils"

type DemandHeatmapProps = {
  data: HeatmapCell[]
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const hours = Array.from({ length: 24 }, (_, index) => index)

function intensityClass(value: number) {
  if (value > 0.82) return "bg-[#1D4ED8]"
  if (value > 0.68) return "bg-[#2563EB]"
  if (value > 0.54) return "bg-[#60A5FA]"
  if (value > 0.4) return "bg-[#93C5FD]"
  if (value > 0.26) return "bg-[#BFDBFE]"
  return "bg-[#EFF6FF]"
}

export function DemandHeatmap({ data }: DemandHeatmapProps) {
  const lookup = new Map(data.map((cell) => [`${cell.day}-${cell.hour}`, cell.value]))

  return (
    <Card className="animate-enter-slow">
      <CardHeader className="flex flex-row items-start justify-between gap-4 px-5 pt-5 md:px-6">
        <div>
          <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.16em] text-[#94A3B8]">
            Demand Heatmap
          </p>
          <h2 className="mt-1.5 text-[26px] font-semibold leading-8 tracking-tight text-[#0F172A]">
            Day vs hour demand intensity
          </h2>
        </div>
        <div className="hidden items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#94A3B8] md:flex">
          <span>Low</span>
          <div className="flex gap-1">
            {[0.18, 0.32, 0.48, 0.62, 0.76, 0.92].map((value) => (
              <span key={value} className={cn("size-3 rounded-[4px]", intensityClass(value))} />
            ))}
          </div>
          <span>High</span>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto pb-5">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[42px_repeat(24,minmax(0,1fr))] gap-1.5">
            <div />
            {hours.map((hour) => (
              <div key={hour} className="text-center text-[10px] font-semibold text-[#94A3B8]">
                {hour}h
              </div>
            ))}
            {days.map((day) => (
              <div key={day} className="contents">
                <div className="flex h-7 items-center text-[11px] font-semibold text-[#64748B]">{day}</div>
                {hours.map((hour) => {
                  const value = lookup.get(`${day}-${hour}`) ?? 0

                  return (
                    <div
                      key={`${day}-${hour}`}
                      title={`${day} ${hour}:00 - ${(value * 100).toFixed(0)}% demand intensity`}
                      className={cn("h-7 rounded-[7px] transition hover:scale-110 hover:ring-2 hover:ring-white", intensityClass(value))}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
