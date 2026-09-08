import type { RegionalLayer } from "@/lib/regional-data"

/**
 * One hue per layer, light to dark. Only one layer is drawn at a time and each
 * ships a legend, so the hue signals which measure is on screen rather than
 * encoding a category. Never a rainbow, and never a hue at a midpoint.
 */
export const REGIONAL_LAYER_SCALES: Record<RegionalLayer, readonly string[]> = {
  currentDemand: ["#e4ecf7", "#bcd3ec", "#7fa9d8", "#3f7bbe", "#1c57b0"],
  forecastDemand: ["#fbe9dc", "#f6cbaa", "#f0a271", "#e87838", "#c24d0a"],
  gridStress: ["#f7efdd", "#ecd9ab", "#dcbb6c", "#c4993a", "#8a5200"],
  renewableGeneration: ["#e3f0e8", "#bcdcc8", "#89c1a0", "#4e9c74", "#136f3f"],
  carbonIntensity: ["#f6e7e6", "#e9c4c1", "#d79995", "#c26a66", "#b42318"],
}

export function getLayerScale(layer: RegionalLayer) {
  return REGIONAL_LAYER_SCALES[layer]
}
