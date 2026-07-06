import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { HelpTooltip } from "@/components/ui/help-tooltip"

type ConfidenceCardProps = {
  value: number | null
  text: string
}

export function ConfidenceCard({ value, text }: ConfidenceCardProps) {
  return (
    <Card className="animate-enter min-h-[338px]">
      <CardHeader className="px-5 pt-5">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.16em] text-[#94A3B8]">
          Model Confidence
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="tabular-nums text-[42px] font-semibold leading-none tracking-tight text-[#0F172A]">
            {value === null ? "--" : value.toFixed(1)}
          </span>
          {value === null ? null : (
            <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">%</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-0.5 h-2.5 overflow-hidden rounded-full bg-[#EEF2F7]">
          <div
            className="h-full rounded-full bg-[#2563EB] shadow-[0_8px_18px_rgba(37,99,235,0.22)]"
            style={{ width: `${value ?? 0}%` }}
          />
        </div>
        <p className="mt-5 text-[13px] font-medium leading-6 text-[#64748B]">{text}</p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            ["Error history", null],
            ["Stability", null],
            ["Interval width", "The range of plausible demand values around the forecast. A narrower range indicates less uncertainty."],
          ].map(([label, help]) => (
            <div key={label} className="rounded-[15px] border border-[#E8EDF5] bg-[#F8FAFD] px-2.5 py-2.5">
              <p className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase leading-4 tracking-[0.12em] text-[#94A3B8]">
                {label}
                {help ? <HelpTooltip content={help} /> : null}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
