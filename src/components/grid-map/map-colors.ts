import type { RegionalLayer } from "@/lib/regional-data"

export const REGIONAL_LAYER_SCALES: Record<RegionalLayer, readonly string[]> = {
  currentDemand: ["#E8F1FF", "#BDD7FF", "#7FB3FF", "#3F82FF", "#1F5BE3"],
  forecastDemand: ["#E8F1FF", "#BDD7FF", "#7FB3FF", "#3F82FF", "#1F5BE3"],
  gridStress: ["#FFF7E6", "#FDE7B2", "#F8C96B", "#E99A31", "#C96B16"],
  renewableGeneration: ["#ECF8F1", "#BFE5CF", "#7CC69A", "#3B9B68", "#19724A"],
  carbonIntensity: ["#EEF2F6", "#CDD6E1", "#A9AFC0", "#C47777", "#A84B4B"],
}

export function getLayerScale(layer: RegionalLayer) {
  return REGIONAL_LAYER_SCALES[layer]
}
