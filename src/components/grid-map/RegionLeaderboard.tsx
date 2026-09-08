"use client"

import { Note, Panel, PanelHeader } from "@/components/ui/primitives"
import {
  getRegionalLayerValue,
  getRegionalLeaderboardPresentation,
  type RegionId,
  type RegionalDemandData,
  type RegionalLayer,
} from "@/lib/regional-data"
import { cn } from "@/lib/utils"

export function RegionLeaderboard({
  regions,
  layer,
  selectedRegionId,
  onSelect,
}: {
  regions: RegionalDemandData[]
  layer: RegionalLayer
  selectedRegionId: RegionId
  onSelect: (regionId: RegionId) => void
}) {
  const sortedRegions = [...regions].sort(
    (left, right) => getRegionalLayerValue(right, layer) - getRegionalLayerValue(left, layer)
  )
  const tablePresentation = getRegionalLeaderboardPresentation(sortedRegions[0], layer)

  return (
    <Panel>
      <PanelHeader
        eyebrow="Ranking"
        title={tablePresentation.heading}
        note="Select a row to load that region in the detail panel."
      />
      <div className="gc-scroll-x" tabIndex={0} role="region" aria-label="Regional ranking, scrollable">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--gc-rule-strong)]">
              <th
                scope="col"
                className="px-4 py-2 font-mono text-[10px] font-normal uppercase tracking-[0.07em] text-[var(--gc-ink-3)]"
              >
                Region
              </th>
              {tablePresentation.headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-3 py-2 text-right font-mono text-[10px] font-normal uppercase tracking-[0.07em] text-[var(--gc-ink-3)]"
                >
                  {header}
                </th>
              ))}
              <th
                scope="col"
                className="px-4 py-2 text-right font-mono text-[10px] font-normal uppercase tracking-[0.07em] text-[var(--gc-ink-3)]"
              >
                Confidence
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRegions.map((region, index) => {
              const presentation = getRegionalLeaderboardPresentation(region, layer)
              const selected = region.id === selectedRegionId
              return (
                <tr
                  key={region.id}
                  aria-selected={selected}
                  className={cn(
                    "border-b border-[var(--gc-rule)] last:border-b-0",
                    selected && "bg-[var(--gc-surface-sunk)]/70"
                  )}
                >
                  <th scope="row" className="p-0 text-left font-normal">
                    <button
                      type="button"
                      onClick={() => onSelect(region.id)}
                      className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-[12.5px] text-[var(--gc-ink)]"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          selected ? "bg-[var(--gc-model)]" : "bg-transparent"
                        )}
                      />
                      <span className="w-4 shrink-0 font-mono text-[10.5px] tabular-nums text-[var(--gc-ink-3)]">
                        {index + 1}
                      </span>
                      <span className="truncate">{region.name}</span>
                      {selected ? <span className="sr-only">, selected</span> : null}
                    </button>
                  </th>
                  {presentation.values.map((value, valueIndex) => (
                    <td
                      key={presentation.headers[valueIndex]}
                      className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-[12px] tabular-nums text-[var(--gc-ink-2)]"
                    >
                      {value}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-[12px] tabular-nums text-[var(--gc-ink-2)]">
                    {region.confidence.toFixed(1)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Note className="border-t border-[var(--gc-rule)] px-4 py-2.5">
        Confidence is derived from the national one-step-ahead MAPE with a per-region penalty. It is
        a heuristic, not a measured regional accuracy.
      </Note>
    </Panel>
  )
}
