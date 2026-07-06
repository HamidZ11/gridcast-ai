import {
  getRegionalLayerPresentation,
  type RegionalDemandData,
  type RegionalLayer,
} from "@/lib/regional-data"

export function RegionTooltip({
  region,
  layer,
}: {
  region: RegionalDemandData
  layer: RegionalLayer
}) {
  const presentation = getRegionalLayerPresentation(region, layer)

  return (
    <div className="min-w-[170px]">
      <p className="text-[12px] font-semibold text-[#0F172A]">{region.name}</p>
      <div className="mt-2 space-y-1 text-[11px]">
        {presentation.tooltipMetrics.map((metric) => (
          <TooltipRow key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
    </div>
  )
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span className="font-medium text-[#64748B]">{label}</span>
      <span className="tabular-nums font-semibold text-[#0F172A]">{value}</span>
    </div>
  )
}
