import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { TechnicalSummaryItem } from "@/types/dashboard"

type TechnicalSummaryProps = {
  items: TechnicalSummaryItem[]
}

export function TechnicalSummary({ items }: TechnicalSummaryProps) {
  return (
    <Card className="animate-enter-slow">
      <CardHeader className="px-5 pt-5 md:px-6">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.16em] text-[#94A3B8]">
          Technical Summary
        </p>
        <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-tight text-[#0F172A]">
          Training and deployment foundation
        </h2>
      </CardHeader>
      <CardContent className="grid gap-2.5 md:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="rounded-[15px] border border-[#E8EDF5] bg-[#F8FAFD] p-3.5">
            <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.14em] text-[#94A3B8]">{item.label}</p>
            <p className="mt-2.5 text-[13px] font-semibold leading-5 text-[#0F172A]">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
