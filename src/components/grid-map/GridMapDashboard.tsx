"use client"

import { useMemo, useState } from "react"

import { LayerSelector } from "@/components/grid-map/LayerSelector"
import { getLayerScale } from "@/components/grid-map/map-colors"
import { RegionLeaderboard } from "@/components/grid-map/RegionLeaderboard"
import { RegionMap } from "@/components/grid-map/RegionMap"
import { RegionSidebar } from "@/components/grid-map/RegionSidebar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
      <section className="mt-4 grid items-start gap-3.5 xl:grid-cols-[minmax(0,1.85fr)_minmax(340px,1fr)]">
        <Card className="min-w-0 shadow-[0_26px_70px_rgba(15,23,42,0.075)]">
          <CardHeader className="gap-3 px-5 pt-5 md:flex md:flex-row md:items-start md:justify-between md:px-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Regional layer</p>
              <h2 className="mt-1.5 text-[24px] font-semibold leading-8 tracking-tight text-[#0F172A]">
                Great Britain demand map
              </h2>
              <p className="mt-1 text-[12px] font-medium text-[#64748B]">
                {activeLayer?.label} intensity · {activeLayer?.unit}
              </p>
            </div>
            <LayerSelector value={layer} onChange={setLayer} />
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="relative overflow-hidden border-t border-[#E8EDF5]">
              <RegionMap
                regions={regions}
                layer={layer}
                selectedRegionId={selectedRegionId}
                onSelect={setSelectedRegionId}
              />
              <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-[10px] border border-[#E8EDF5] bg-white/94 px-3 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.1)] backdrop-blur">
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
                  <span>Low</span>
                  <div className="flex gap-0.5">
                    {activeScale.map((color) => (
                      <span key={color} className="h-2.5 w-4 first:rounded-l-[3px] last:rounded-r-[3px]" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <span>High</span>
                </div>
              </div>
              <div className="pointer-events-none absolute bottom-4 right-4 z-[500] rounded-[8px] border border-[#E8EDF5] bg-white/90 px-2 py-1 text-[9px] font-semibold text-[#64748B] backdrop-blur">
                Boundaries: ONS Open Geography Portal
              </div>
            </div>
          </CardContent>
        </Card>

        <RegionSidebar region={selectedRegion} layer={layer} />
      </section>

      <section className="mt-3.5">
        <RegionLeaderboard regions={regions} layer={layer} onSelect={setSelectedRegionId} />
      </section>
    </>
  )
}
