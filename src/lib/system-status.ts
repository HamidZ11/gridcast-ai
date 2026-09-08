import { getHealth, getModelInfo } from "@/lib/api"

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
   * "fallback" - the API answered but could not load artifacts, so its numbers
   *   are placeholders and the UI omits them.
   * "unavailable" - the API did not answer.
   */
  source: "artifact" | "fallback" | "unavailable"
  /** Short label for the chrome, e.g. "Artifact data". */
  label: string
  /** One sentence of detail for a title attribute / tooltip. */
  detail: string
  model: string | null
  dataset: string | null
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const [healthResult, modelResult] = await Promise.all([getHealth(), getModelInfo()])

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
  const isArtifact = model?.data_source === "artifact"

  return {
    backend: "operational",
    source: isArtifact ? "artifact" : "fallback",
    label: isArtifact ? "Artifact data" : "Artifacts unavailable",
    detail: isArtifact
      ? `Served from the saved ${model?.name} artifact and the ${model?.dataset} file. Not a live feed.`
      : "The API is running but could not load a trained artifact, so model-backed values are omitted.",
    model: isArtifact ? `${model?.name} · ${model?.version}` : null,
    dataset: isArtifact ? (model?.dataset ?? null) : null,
  }
}
