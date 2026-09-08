"use client"

import { useMemo, useState } from "react"

import { LayerSelector } from "@/components/grid-map/LayerSelector"
import { getLayerScale } from "@/components/grid-map/map-colors"
import { RegionLeaderboard } from "@/components/grid-map/RegionLeaderboard"
import { RegionMap } from "@/components/grid-map/RegionMap"
import { RegionSidebar } from "@/components/grid-map/RegionSidebar"
import { Panel, PanelHeader } from "@/components/ui/primitives"
import {
  regionalLayerOptions,
  type RegionId,
  type RegionalDemandData,
  type RegionalLayer,
} from "@/lib/regional-data"

export function GridMapDashboard({ regions }: { regions: RegionalDemandData[] }) {
  const [layer, setLayer] = useState<RegionalLayer>("currentDemand")
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId>(regions[0]?.id ?? "london")
  const selectedRegion = useMemo(
    () => regions.find((region) => region.id === selectedRegionId) ?? regions[0],
    [regions, selectedRegionId]
  )
  const activeLayer = regionalLayerOptions.find((option) => option.value === layer)
  const activeScale = getLayerScale(layer)

  if (!selectedRegion) return null

  return (
    <>
      <section className="mt-4 grid items-start gap-3 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,1fr)]">
        <Panel className="min-w-0">
          <PanelHeader
            eyebrow="Layer"
            title="Great Britain demand map"
            note={`${activeLayer?.label} · ${activeLayer?.unit}`}
            actions={<LayerSelector value={layer} onChange={setLayer} />}
            className="flex-col items-stretch sm:flex-row sm:items-start"
          />
          <div className="relative overflow-hidden">
            <RegionMap
              regions={regions}
              layer={layer}
              selectedRegionId={selectedRegionId}
              onSelect={setSelectedRegionId}
            />
            <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-[5px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)]/95 px-2 py-1.5">
              <div className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.07em] text-[var(--gc-ink-3)]">
                <span>Low</span>
                <div className="flex gap-px">
                  {activeScale.map((color) => (
                    <span key={color} className="h-2.5 w-4" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <span>High</span>
              </div>
            </div>
            <p className="pointer-events-none absolute bottom-3 right-3 z-[500] rounded-[4px] border border-[var(--gc-rule)] bg-[var(--gc-surface)]/90 px-1.5 py-0.5 font-mono text-[9.5px] text-[var(--gc-ink-3)]">
              Boundaries: ONS Open Geography Portal
            </p>
          </div>
        </Panel>

        <RegionSidebar region={selectedRegion} layer={layer} />
      </section>

      <section className="mt-3">
        <RegionLeaderboard
          regions={regions}
          layer={layer}
          selectedRegionId={selectedRegionId}
          onSelect={setSelectedRegionId}
        />
      </section>
    </>
  )
}
