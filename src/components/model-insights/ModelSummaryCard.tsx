import { CheckCircle2 } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { ModelSummaryItem } from "@/types/dashboard"

type ModelSummaryCardProps = {
  item: ModelSummaryItem
  index?: number
}

export function ModelSummaryCard({ item, index = 0 }: ModelSummaryCardProps) {
  return (
    <Card
      className="animate-enter min-h-[106px] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <CardContent className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.16em] text-[#94A3B8]">
            {item.label}
          </p>
          {item.status === "success" ? <CheckCircle2 className="size-4 text-[#10B981]" /> : null}
        </div>
        <div className="mt-3.5">
          <p className="text-[18px] font-semibold leading-6 tracking-tight text-[#0F172A]">{item.value}</p>
          {item.detail ? <p className="mt-1.5 text-[12px] font-medium leading-5 text-[#64748B]">{item.detail}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
