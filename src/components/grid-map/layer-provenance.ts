import type { RegionalLayer } from "@/lib/regional-data"

/**
 * What each map layer's numbers actually are.
 *
 * The model is national. Every regional figure is produced in
 * `src/lib/regional-data.ts`, and the layers differ in kind:
 *
 *  - currentDemand  observed national demand x a fixed regional share
 *  - forecastDemand the model's national forecast x a fixed share x a fixed factor
 *  - gridStress     a ratio of the two above, with hand-chosen thresholds
 *  - renewable      a fixed per-region constant - not measured, not modelled
 *  - carbon         a fixed per-region constant; emissions scale with derived demand
 *
 * Calling all five "derived from the national forecast" would be wrong, so each
 * layer states its own provenance.
 */
export type LayerProvenance = {
  /** Short tag shown beside the layer. */
  tag: "Derived" | "Heuristic" | "Illustrative"
  /** One sentence, shown under the region detail. */
  note: string
}

export const LAYER_PROVENANCE: Record<RegionalLayer, LayerProvenance> = {
  currentDemand: {
    tag: "Derived",
    note: "Observed national demand split by fixed regional shares. The shares are constants, not measurements.",
  },
  forecastDemand: {
    tag: "Derived",
    note: "The model's national forecast split by fixed regional shares and a fixed per-region factor. The model does not forecast regions.",
  },
  gridStress: {
    tag: "Heuristic",
    note: "Regional demand as a share of regional forecast peak, with hand-chosen thresholds. Reserve margin and peak risk follow from the same formula.",
  },
  renewableGeneration: {
    tag: "Illustrative",
    note: "Fixed per-region renewable shares held in the frontend. Not measured, not modelled, and not connected to a generation feed.",
  },
  carbonIntensity: {
    tag: "Illustrative",
    note: "Fixed per-region carbon intensity held in the frontend. Emissions impact scales that constant by the derived regional demand.",
  },
}
