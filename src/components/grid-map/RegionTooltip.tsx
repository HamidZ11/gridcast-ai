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
    <div className="min-w-[168px]">
      <p className="text-[12.5px] text-[var(--gc-ink)]">{region.name}</p>
      <div className="mt-1.5 space-y-0.5 text-[11.5px]">
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
      <span className="text-[var(--gc-ink-3)]">{label}</span>
      <span className="font-mono tabular-nums text-[var(--gc-ink)]">{value}</span>
    </div>
  )
}
