"use client"

import { geoMercator, geoPath } from "d3-geo"
import type { Feature, FeatureCollection } from "geojson"
import { useMemo, useState } from "react"

import { getLayerScale } from "@/components/grid-map/map-colors"
import { RegionTooltip } from "@/components/grid-map/RegionTooltip"
import {
  getRegionalLayerValue,
  type RegionId,
  type RegionalDemandData,
  type RegionalLayer,
} from "@/lib/regional-data"

function regionColor(
  value: number,
  min: number,
  max: number,
  scale: readonly string[],
  emphasized = false
) {
  const normalized = max === min ? 0.5 : (value - min) / (max - min)
  const index = Math.min(scale.length - 1, Math.floor(normalized * scale.length))
  return scale[Math.min(scale.length - 1, index + (emphasized ? 1 : 0))]
}

export function RegionMap({
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
  const [hoveredRegionId, setHoveredRegionId] = useState<RegionId | null>(null)
  const hoveredRegion = regions.find((region) => region.id === hoveredRegionId)
  const values = regions.map((region) => getRegionalLayerValue(region, layer))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const scale = getLayerScale(layer)
  const mapPaths = useMemo(() => {
    const features: Array<Feature> = regions.map((region) => ({
      type: "Feature",
      properties: { id: region.id, name: region.name },
      geometry: region.geometry,
    }))
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features,
    }
    // Fit directly to the enlarged viewport so all coastal extremes remain visible.
    const projection = geoMercator().fitExtent([[18, 14], [842, 746]], collection)
    const path = geoPath(projection)

    return regions.map((region, index) => ({
      region,
      path: path(features[index]) ?? "",
    }))
  }, [regions])

  return (
    <div className="relative h-[660px] overflow-hidden bg-[#F8FAFD] xl:h-[760px]">
      <svg
        viewBox="0 0 860 760"
        role="img"
        aria-label="Interactive map of electricity demand across Great Britain"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {mapPaths.map(({ region, path }) => {
          const selected = region.id === selectedRegionId
          const hovered = region.id === hoveredRegionId

          return (
            <path
              key={region.id}
              d={path}
              tabIndex={0}
              role="button"
              aria-label={`Select ${region.name}`}
              fill={regionColor(
                getRegionalLayerValue(region, layer),
                min,
                max,
                scale,
                selected
              )}
              fillOpacity={selected ? 1 : hovered ? 0.97 : 0.9}
              stroke={selected ? scale.at(-1) : hovered ? scale.at(-2) : "#FFFFFF"}
              strokeWidth={selected ? 2.8 : hovered ? 2 : 1.15}
              vectorEffect="non-scaling-stroke"
              className="cursor-pointer outline-none transition-[fill,fill-opacity,stroke,stroke-width,filter] duration-200 ease-out focus:stroke-[#1D4ED8]"
              style={{
                filter: selected
                  ? "drop-shadow(0 5px 10px rgba(15, 23, 42, 0.24))"
                  : hovered
                    ? "drop-shadow(0 3px 5px rgba(15, 23, 42, 0.13))"
                    : "none",
              }}
              onMouseEnter={() => setHoveredRegionId(region.id)}
              onMouseLeave={() => setHoveredRegionId(null)}
              onFocus={() => setHoveredRegionId(region.id)}
              onBlur={() => setHoveredRegionId(null)}
              onClick={() => onSelect(region.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onSelect(region.id)
                }
              }}
            />
          )
        })}
      </svg>

      {hoveredRegion ? (
        <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-[10px] border border-[#E8EDF5] bg-white/96 px-3 py-2.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur">
          <RegionTooltip region={hoveredRegion} layer={layer} />
        </div>
      ) : null}
    </div>
  )
}
