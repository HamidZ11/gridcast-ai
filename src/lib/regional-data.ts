import type { FeatureCollection, Geometry } from "geojson"
import { feature } from "topojson-client"
import type { GeometryCollection, Topology } from "topojson-specification"

import gbRegionsTopology from "@/data/gb-regions.topo.json"
import { regionalDefinitions, type RegionId } from "@/data/mockRegionalData"
import { getForecast, getHistory, getMetrics } from "@/lib/api"

export type { RegionId } from "@/data/mockRegionalData"

export type RegionalLayer =
  | "currentDemand"
  | "forecastDemand"
  | "gridStress"
  | "renewableGeneration"
  | "carbonIntensity"

export type RegionalDemandData = {
  id: RegionId
  name: string
  geometry: Geometry
  currentDemand: number
  forecastPeak: number
  peakTime: string
  demandChange: number
  confidence: number
  renewableGeneration: number
  windContribution: number
  solarContribution: number
  carbonIntensity: number
  emissionsImpact: number
  gridStress: number
  reserveMargin: number
  peakRisk: "Low" | "Moderate" | "High"
  sparkline: Array<{ time: string; demand: number }>
  consumers: {
    residential: number
    industrial: number
    commercial: number
  }
}

export type RegionalLayerPresentation = {
  layerLabel: string
  badge: string
  badgeTone: "neutral" | "success" | "warning" | "danger"
  metrics: Array<{ label: string; value: string }>
  tooltipMetrics: Array<{ label: string; value: string }>
}

export type RegionalLeaderboardPresentation = {
  heading: string
  headers: [string, string, string]
  values: [string, string, string]
}

export type RegionalMapPageData = {
  regions: RegionalDemandData[]
  generatedAt: string | null
  notice: string | null
}

export const regionalLayerOptions: Array<{ value: RegionalLayer; label: string; unit: string }> = [
  { value: "currentDemand", label: "Current Demand", unit: "GW" },
  { value: "forecastDemand", label: "Forecast Demand", unit: "GW" },
  { value: "gridStress", label: "Grid Stress", unit: "%" },
  { value: "renewableGeneration", label: "Renewable Generation", unit: "%" },
  { value: "carbonIntensity", label: "Carbon Intensity", unit: "gCO₂/kWh" },
]

const boundaryNameToRegionId: Record<string, RegionId> = {
  "North East": "north-east",
  "North West": "north-west",
  "Yorkshire and The Humber": "yorkshire-humber",
  "East Midlands": "east-midlands",
  "West Midlands": "west-midlands",
  "East of England": "east-england",
  London: "london",
  "South East": "south-east",
  "South West": "south-west",
  Scotland: "scotland",
  Wales: "wales",
}

const topology = gbRegionsTopology as unknown as Topology
const boundaryCollection = feature(
  topology,
  topology.objects.GBregion as GeometryCollection
) as FeatureCollection<Geometry, { AREACD: string; AREANM: string }>
const geometryByRegionId = new Map(
  boundaryCollection.features.map((boundary) => [
    boundaryNameToRegionId[boundary.properties.AREANM],
    boundary.geometry,
  ])
)

function formatHour(timestamp: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(timestamp))
}

function signedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
}

function forecastChange(region: RegionalDemandData) {
  return region.currentDemand > 0
    ? ((region.forecastPeak - region.currentDemand) / region.currentDemand) * 100
    : 0
}

export function getRegionalLayerPresentation(
  region: RegionalDemandData,
  layer: RegionalLayer
): RegionalLayerPresentation {
  const confidence = `${region.confidence.toFixed(1)}%`
  const forecastDelta = forecastChange(region)

  if (layer === "forecastDemand") {
    const badge =
      forecastDelta > 3
        ? "Rising Forecast"
        : forecastDelta < -1
          ? "Falling Forecast"
          : "Stable Forecast"
    return {
      layerLabel: "Forecast Demand Layer",
      badge,
      badgeTone: badge === "Rising Forecast" ? "warning" : badge === "Falling Forecast" ? "neutral" : "success",
      metrics: [
        { label: "Forecast peak", value: `${region.forecastPeak.toFixed(2)} GW` },
        { label: "Peak time", value: `${region.peakTime} UTC` },
        { label: "Change vs current", value: signedPercent(forecastDelta) },
        { label: "Forecast confidence", value: confidence },
      ],
      tooltipMetrics: [
        { label: "Forecast peak", value: `${region.forecastPeak.toFixed(2)} GW` },
        { label: "Peak time", value: region.peakTime },
        { label: "Change", value: signedPercent(forecastDelta) },
        { label: "Confidence", value: confidence },
      ],
    }
  }

  if (layer === "gridStress") {
    const badge = region.gridStress >= 92 ? "Grid Stress" : region.gridStress >= 82 ? "Elevated" : "Stable"
    return {
      layerLabel: "Grid Stress Layer",
      badge,
      badgeTone: badge === "Grid Stress" ? "danger" : badge === "Elevated" ? "warning" : "success",
      metrics: [
        { label: "Grid stress score", value: `${region.gridStress.toFixed(1)} / 100` },
        { label: "Reserve margin", value: `${region.reserveMargin.toFixed(1)}%` },
        { label: "Peak risk", value: region.peakRisk },
        { label: "Forecast confidence", value: confidence },
      ],
      tooltipMetrics: [
        { label: "Stress score", value: `${region.gridStress.toFixed(1)} / 100` },
        { label: "Reserve margin", value: `${region.reserveMargin.toFixed(1)}%` },
        { label: "Peak risk", value: region.peakRisk },
      ],
    }
  }

  if (layer === "renewableGeneration") {
    const badge =
      region.renewableGeneration >= 50
        ? "High Renewable"
        : region.renewableGeneration >= 30
          ? "Moderate Renewable"
          : "Low Renewable"
    return {
      layerLabel: "Renewable Generation Layer",
      badge,
      badgeTone: badge === "High Renewable" ? "success" : badge === "Low Renewable" ? "warning" : "neutral",
      metrics: [
        { label: "Estimated renewable", value: `${region.renewableGeneration}%` },
        { label: "Wind contribution", value: `${region.windContribution.toFixed(1)}%` },
        { label: "Solar contribution", value: `${region.solarContribution.toFixed(1)}%` },
        { label: "Carbon intensity", value: `${region.carbonIntensity} gCO₂/kWh` },
      ],
      tooltipMetrics: [
        { label: "Renewable", value: `${region.renewableGeneration}%` },
        { label: "Wind", value: `${region.windContribution.toFixed(1)}%` },
        { label: "Solar", value: `${region.solarContribution.toFixed(1)}%` },
        { label: "Carbon", value: `${region.carbonIntensity} gCO₂/kWh` },
      ],
    }
  }

  if (layer === "carbonIntensity") {
    const badge =
      region.carbonIntensity <= 110
        ? "Low Carbon"
        : region.carbonIntensity <= 160
          ? "Moderate Carbon"
          : "High Carbon"
    return {
      layerLabel: "Carbon Intensity Layer",
      badge,
      badgeTone: badge === "Low Carbon" ? "success" : badge === "High Carbon" ? "danger" : "neutral",
      metrics: [
        { label: "Carbon intensity", value: `${region.carbonIntensity} gCO₂/kWh` },
        { label: "Estimated renewable", value: `${region.renewableGeneration}%` },
        { label: "Emissions impact", value: `${region.emissionsImpact.toFixed(2)} tCO₂/h` },
        { label: "Demand level", value: `${region.currentDemand.toFixed(2)} GW` },
      ],
      tooltipMetrics: [
        { label: "Carbon", value: `${region.carbonIntensity} gCO₂/kWh` },
        { label: "Renewable", value: `${region.renewableGeneration}%` },
        { label: "Emissions", value: `${region.emissionsImpact.toFixed(2)} tCO₂/h` },
        { label: "Demand", value: `${region.currentDemand.toFixed(2)} GW` },
      ],
    }
  }

  const badge = region.demandChange > 2 ? "High Demand" : region.demandChange < 0 ? "Low Demand" : "Normal Demand"
  return {
    layerLabel: "Current Demand Layer",
    badge,
    badgeTone: badge === "High Demand" ? "warning" : badge === "Normal Demand" ? "success" : "neutral",
    metrics: [
      { label: "Current demand", value: `${region.currentDemand.toFixed(2)} GW` },
      { label: "Forecast peak", value: `${region.forecastPeak.toFixed(2)} GW` },
      { label: "Peak time", value: `${region.peakTime} UTC` },
      { label: "Forecast confidence", value: confidence },
    ],
    tooltipMetrics: [
      { label: "Current demand", value: `${region.currentDemand.toFixed(2)} GW` },
      { label: "Forecast peak", value: `${region.forecastPeak.toFixed(2)} GW` },
      { label: "Confidence", value: confidence },
    ],
  }
}

export function getRegionalLeaderboardPresentation(
  region: RegionalDemandData,
  layer: RegionalLayer
): RegionalLeaderboardPresentation {
  if (layer === "forecastDemand") {
    return {
      heading: "Forecast demand ranking",
      headers: ["Forecast Peak", "Change vs Current", "Peak Time"],
      values: [
        `${region.forecastPeak.toFixed(2)} GW`,
        signedPercent(forecastChange(region)),
        `${region.peakTime} UTC`,
      ],
    }
  }
  if (layer === "gridStress") {
    return {
      heading: "Grid stress ranking",
      headers: ["Stress Score", "Reserve Margin", "Peak Risk"],
      values: [
        `${region.gridStress.toFixed(1)} / 100`,
        `${region.reserveMargin.toFixed(1)}%`,
        region.peakRisk,
      ],
    }
  }
  if (layer === "renewableGeneration") {
    return {
      heading: "Renewable generation ranking",
      headers: ["Renewable", "Wind / Solar", "Carbon Intensity"],
      values: [
        `${region.renewableGeneration}%`,
        `${region.windContribution.toFixed(1)}% / ${region.solarContribution.toFixed(1)}%`,
        `${region.carbonIntensity} gCO₂/kWh`,
      ],
    }
  }
  if (layer === "carbonIntensity") {
    return {
      heading: "Carbon intensity ranking",
      headers: ["Carbon Intensity", "Emissions Impact", "Demand Level"],
      values: [
        `${region.carbonIntensity} gCO₂/kWh`,
        `${region.emissionsImpact.toFixed(2)} tCO₂/h`,
        `${region.currentDemand.toFixed(2)} GW`,
      ],
    }
  }
  return {
    heading: "Current demand ranking",
    headers: ["Current Demand", "Forecast Peak", "Δ vs Yesterday"],
    values: [
      `${region.currentDemand.toFixed(2)} GW`,
      `${region.forecastPeak.toFixed(2)} GW`,
      signedPercent(region.demandChange),
    ],
  }
}

export function getRegionalLayerValue(region: RegionalDemandData, layer: RegionalLayer) {
  if (layer === "forecastDemand") return region.forecastPeak
  if (layer === "gridStress") return region.gridStress
  if (layer === "renewableGeneration") return region.renewableGeneration
  if (layer === "carbonIntensity") return region.carbonIntensity
  return region.currentDemand
}

export async function getRegionalMapPageData(): Promise<RegionalMapPageData> {
  const [historyResult, forecastResult, metricsResult] = await Promise.all([
    getHistory(),
    getForecast(),
    getMetrics(),
  ])
  const history =
    historyResult.ok && historyResult.data.data_source === "artifact" ? historyResult.data : null
  const forecast =
    forecastResult.ok && forecastResult.data.data_source === "artifact" ? forecastResult.data : null
  const metrics =
    metricsResult.ok && metricsResult.data.data_source === "artifact" ? metricsResult.data : null
  const nationalCurrent = history?.points.at(-1)?.demand_gw ?? 0
  const nationalPeakPoint = forecast?.points.length
    ? forecast.points.reduce((peak, point) =>
        point.predicted_demand_gw > peak.predicted_demand_gw ? point : peak
      )
    : null
  const mape = metrics?.metrics.find((metric) => metric.name === "MAPE")?.value ?? null
  const confidence = mape === null ? 0 : 100 - mape
  const recentHistory = history?.points.slice(-48) ?? []

  const regions = regionalDefinitions
    .map((definition, regionIndex): RegionalDemandData => {
      const geometry = geometryByRegionId.get(definition.id)
      if (!geometry) {
        throw new Error(`Missing ONS boundary geometry for ${definition.name}.`)
      }
      const currentDemand = nationalCurrent * definition.nationalShare
      const forecastPeak =
        (nationalPeakPoint?.predicted_demand_gw ?? nationalCurrent) *
        definition.nationalShare *
        definition.forecastFactor
      const gridStress = forecastPeak > 0 ? Math.min(100, (currentDemand / forecastPeak) * 100) : 0
      const reserveMargin = Math.max(2, 18 - gridStress * 0.12)
      const windShare = 0.64 + (regionIndex % 4) * 0.04
      const windContribution = definition.renewableShare * windShare
      const solarContribution = definition.renewableShare - windContribution
      const regionConfidence = Math.max(0, confidence - Math.abs(definition.forecastFactor - 1) * 20)
      const sparkline = recentHistory.map((point, pointIndex) => {
        const regionalShape = 1 + Math.sin((pointIndex / 48) * Math.PI * 2 + regionIndex * 0.37) * 0.018
        return {
          time: formatHour(point.timestamp),
          demand: Number((point.demand_gw * definition.nationalShare * regionalShape).toFixed(3)),
        }
      })

      return {
        id: definition.id,
        name: definition.name,
        geometry,
        currentDemand: Number(currentDemand.toFixed(3)),
        forecastPeak: Number(forecastPeak.toFixed(3)),
        peakTime: nationalPeakPoint ? formatHour(nationalPeakPoint.timestamp) : "Unavailable",
        demandChange: definition.yesterdayChange,
        confidence: Number(regionConfidence.toFixed(1)),
        renewableGeneration: definition.renewableShare,
        windContribution: Number(windContribution.toFixed(1)),
        solarContribution: Number(solarContribution.toFixed(1)),
        carbonIntensity: definition.carbonIntensity,
        emissionsImpact: Number(((currentDemand * definition.carbonIntensity) / 1000).toFixed(3)),
        gridStress: Number(gridStress.toFixed(1)),
        reserveMargin: Number(reserveMargin.toFixed(1)),
        peakRisk: gridStress >= 92 ? "High" : gridStress >= 82 ? "Moderate" : "Low",
        sparkline,
        consumers: definition.consumers,
      }
    })
    .sort((left, right) => right.currentDemand - left.currentDemand)

  const errors = [historyResult, forecastResult, metricsResult].filter((result) => !result.ok)
  const fallbackUsed = [historyResult, forecastResult, metricsResult].some(
    (result) =>
      result.ok && result.data.data_source === "fallback"
  )
  const notice =
    errors.length > 0
      ? "Regional values are unavailable because national backend data could not be loaded."
      : fallbackUsed
        ? "Fallback national data was ignored. Start the trained-model backend to populate regional values."
        : null

  return {
    regions,
    generatedAt: forecast?.generated_at ?? null,
    notice,
  }
}
