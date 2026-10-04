import { getForecast, getHealth, getModelInfo } from "@/lib/api"

/**
 * What the application chrome is allowed to claim about its data.
 *
 * There is no live NESO feed. Everything the product serves comes from a frozen
 * 2024 dataset and a saved model artifact, so the shell reports the artifact's
 * state rather than a connection to an operator. See DESIGN.md.
 */
export type SystemStatus = {
  /** Is the FastAPI service answering at all? */
  backend: "operational" | "unavailable"
  /**
   * "artifact" - values come from the saved model and processed dataset.
   * "fallback" - the API answered but could not load an artifact, so it is
   *   serving fallback data, which the UI labels and does not show as results.
   * "unavailable" - the API did not answer.
   */
  source: "artifact" | "fallback" | "unavailable"
  /** Short label for the chrome: "Artifact data", "Fallback data" or "Backend unavailable". */
  label: string
  /** One sentence of detail for a title attribute / tooltip. */
  detail: string
  model: string | null
  dataset: string | null
}

export async function getSystemStatus(): Promise<SystemStatus> {
  // /model reads only the saved metadata, so a missing model file or dataset
  // shows up as a fallback forecast instead. Pages that chart the forecast
  // fetch the same URL, so there it is memoized; elsewhere it is served from
  // the data cache (see lib/api.ts).
  const [healthResult, modelResult, forecastResult] = await Promise.all([
    getHealth(),
    getModelInfo(),
    getForecast(),
  ])

  if (!healthResult.ok) {
    return {
      backend: "unavailable",
      source: "unavailable",
      label: "Backend unavailable",
      detail: "The forecasting API is not responding. Values that cannot be sourced are shown as Unavailable.",
      model: null,
      dataset: null,
    }
  }

  const model = modelResult.ok ? modelResult.data : null
  const isArtifact =
    model?.data_source === "artifact" &&
    !(forecastResult.ok && forecastResult.data.data_source === "fallback")

  return {
    backend: "operational",
    source: isArtifact ? "artifact" : "fallback",
    label: isArtifact ? "Artifact data" : "Fallback data",
    detail: isArtifact
      ? `Served from the saved ${model?.name} artifact and the ${model?.dataset} file. Not a live feed.`
      : "The API is running but could not load its saved artifacts, so it is serving fallback data. Model-backed values are not shown as results.",
    model: isArtifact ? `${model?.name} · ${model?.version}` : null,
    dataset: isArtifact ? (model?.dataset ?? null) : null,
  }
}
