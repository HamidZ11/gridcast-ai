import { getForecast, getHealth, getModelInfo } from "@/lib/api"
import { BACKEND_UNAVAILABLE, BACKEND_WAKING } from "@/lib/status-states"

/**
 * What the application chrome is allowed to claim about its data.
 *
 * There is no live NESO feed. Everything the product serves comes from a frozen
 * 2024 dataset and a saved model artifact, so the shell reports the artifact's
 * state rather than a connection to an operator. See DESIGN.md.
 */
export type SystemStatus = {
  /** Is the FastAPI service answering at all? */
  backend: "operational" | "waking" | "unavailable"
  /**
   * "artifact" - values come from the saved model and processed dataset.
   * "fallback" - the API answered but could not load an artifact, so it is
   *   serving fallback data, which the UI labels and does not show as results.
   * "waking" - no answer within the read timeout, as on a cold start; the
   *   chrome keeps rechecking (useDataSourceStatus).
   * "unavailable" - the API did not answer, or was still down after rechecking.
   */
  source: "artifact" | "fallback" | "waking" | "unavailable"
  /**
   * Short label for the chrome: "Artifact data", "Fallback data",
   * "Waking backend" or "Backend unavailable".
   */
  label: string
  /** One sentence of detail for a title attribute / tooltip. */
  detail: string
  model: string | null
  dataset: string | null
}

export async function getSystemStatus(options: { timeoutMs?: number } = {}): Promise<SystemStatus> {
  // Live reads, never cached: a cached entry would let the chrome report
  // artifact data after the API has started serving fallback. /model reads
  // only the saved metadata, so a missing model file or dataset shows up as a
  // fallback forecast instead.
  const read = { live: true, timeoutMs: options.timeoutMs }
  const results = await Promise.all([getHealth(read), getModelInfo(read), getForecast(read)])
  const [healthResult, modelResult, forecastResult] = results

  // No answer in time is what a sleeping backend looks like, not an outage.
  if (results.some((result) => !result.ok && result.timedOut)) return BACKEND_WAKING
  if (!healthResult.ok) return BACKEND_UNAVAILABLE

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
