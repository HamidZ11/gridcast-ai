import type {
  ApiResult,
  ExplainResponse,
  FeatureImportanceResponse,
  ForecastResponse,
  HealthResponse,
  HistoryResponse,
  MetricsResponse,
  ModelInfoResponse,
  SimulationRequest,
  SimulationResponse,
} from "@/types/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8001"

type Validator<T> = (value: unknown) => value is T

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === "string"
}

function hasNumber(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === "number"
}

function hasDataSource(value: Record<string, unknown>): boolean {
  return value.data_source === "artifact" || value.data_source === "fallback"
}

async function fetchJson<T>(
  path: string,
  validate: Validator<T>,
  init?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      ...init,
      ...(init?.body
        ? {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              ...init.headers,
            },
          }
        : {}),
    })

    if (!response.ok) {
      return { ok: false, error: `Backend request failed: ${response.status}` }
    }

    const data: unknown = await response.json()
    if (!validate(data)) {
      return { ok: false, error: "Backend returned an invalid response shape." }
    }

    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Backend is unavailable.",
    }
  }
}

function isHealthResponse(value: unknown): value is HealthResponse {
  return isRecord(value) && hasString(value, "status") && hasString(value, "service") && hasString(value, "version")
}

function isForecastResponse(value: unknown): value is ForecastResponse {
  return (
    isRecord(value) &&
    hasNumber(value, "horizon_hours") &&
    hasString(value, "generated_at") &&
    hasString(value, "unit") &&
    hasDataSource(value) &&
    Array.isArray(value.points) &&
    value.points.every(
      (point) =>
        isRecord(point) &&
        hasString(point, "timestamp") &&
        hasNumber(point, "predicted_demand_gw") &&
        hasNumber(point, "confidence_low_gw") &&
        hasNumber(point, "confidence_high_gw")
    )
  )
}

function isForecastPoint(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasString(value, "timestamp") &&
    hasNumber(value, "predicted_demand_gw") &&
    hasNumber(value, "confidence_low_gw") &&
    hasNumber(value, "confidence_high_gw")
  )
}

function isSimulationResponse(value: unknown): value is SimulationResponse {
  if (
    !isRecord(value) ||
    !hasNumber(value, "horizon_hours") ||
    !hasString(value, "generated_at") ||
    !hasString(value, "unit") ||
    !hasString(value, "summary") ||
    !hasDataSource(value) ||
    !Array.isArray(value.points) ||
    !value.points.every(isForecastPoint) ||
    !Array.isArray(value.baseline_points) ||
    !value.baseline_points.every(isForecastPoint) ||
    !Array.isArray(value.limitations) ||
    !value.limitations.every((item) => typeof item === "string") ||
    !isRecord(value.metrics)
  ) {
    return false
  }

  const metrics = value.metrics
  return (
    hasNumber(metrics, "peak_demand_gw") &&
    hasNumber(metrics, "average_demand_gw") &&
    hasNumber(metrics, "total_energy_gwh") &&
    hasNumber(metrics, "carbon_estimate_ktco2") &&
    hasString(metrics, "peak_time") &&
    hasNumber(metrics, "peak_change_gw") &&
    hasNumber(metrics, "energy_change_gwh") &&
    hasNumber(metrics, "carbon_change_ktco2") &&
    hasNumber(metrics, "confidence_percent") &&
    (metrics.grid_stress === "Low" ||
      metrics.grid_stress === "Medium" ||
      metrics.grid_stress === "High")
  )
}

function isHistoryResponse(value: unknown): value is HistoryResponse {
  return (
    isRecord(value) &&
    hasString(value, "source") &&
    hasString(value, "unit") &&
    hasDataSource(value) &&
    Array.isArray(value.points) &&
    value.points.every((point) => isRecord(point) && hasString(point, "timestamp") && hasNumber(point, "demand_gw"))
  )
}

function isMetricsResponse(value: unknown): value is MetricsResponse {
  return (
    isRecord(value) &&
    hasString(value, "model_name") &&
    hasString(value, "model_version") &&
    hasDataSource(value) &&
    Array.isArray(value.metrics) &&
    value.metrics.every(
      (metric) =>
        isRecord(metric) &&
        hasString(metric, "name") &&
        hasNumber(metric, "value") &&
        (typeof metric.unit === "string" || metric.unit === null)
    )
  )
}

function isFeatureImportanceResponse(value: unknown): value is FeatureImportanceResponse {
  return (
    isRecord(value) &&
    hasString(value, "model_name") &&
    hasString(value, "generated_at") &&
    hasDataSource(value) &&
    (typeof value.method === "string" || value.method === null) &&
    Array.isArray(value.features) &&
    value.features.every((feature) => isRecord(feature) && hasString(feature, "feature") && hasNumber(feature, "importance"))
  )
}

function isExplainResponse(value: unknown): value is ExplainResponse {
  return (
    isRecord(value) &&
    hasNumber(value, "prediction") &&
    hasNumber(value, "base_value") &&
    hasNumber(value, "forecast_index") &&
    hasString(value, "timestamp") &&
    hasString(value, "model_name") &&
    hasString(value, "method") &&
    hasString(value, "unit") &&
    value.data_source === "artifact" &&
    Array.isArray(value.features) &&
    value.features.every(
      (feature) =>
        isRecord(feature) &&
        hasString(feature, "name") &&
        hasNumber(feature, "value") &&
        hasNumber(feature, "impact")
    )
  )
}

function isModelInfoResponse(value: unknown): value is ModelInfoResponse {
  return (
    isRecord(value) &&
    hasString(value, "name") &&
    hasString(value, "version") &&
    hasString(value, "algorithm") &&
    hasString(value, "status") &&
    hasString(value, "training_date") &&
    hasString(value, "training_window") &&
    hasNumber(value, "forecast_horizon_hours") &&
    hasString(value, "dataset") &&
    hasNumber(value, "rows_trained") &&
    hasDataSource(value) &&
    Array.isArray(value.feature_columns) &&
    value.feature_columns.every((feature) => typeof feature === "string") &&
    Array.isArray(value.limitations) &&
    value.limitations.every((limitation) => typeof limitation === "string") &&
    isRecord(value.all_model_metrics)
  )
}

export function getHealth(): Promise<ApiResult<HealthResponse>> {
  return fetchJson("/health", isHealthResponse)
}

export function getForecast(): Promise<ApiResult<ForecastResponse>> {
  return fetchJson("/forecast", isForecastResponse)
}

export function simulateScenario(
  request: SimulationRequest
): Promise<ApiResult<SimulationResponse>> {
  return fetchJson("/simulate", isSimulationResponse, {
    method: "POST",
    body: JSON.stringify(request),
  })
}

export function getHistory(): Promise<ApiResult<HistoryResponse>> {
  return fetchJson("/history", isHistoryResponse)
}

export function getMetrics(): Promise<ApiResult<MetricsResponse>> {
  return fetchJson("/metrics", isMetricsResponse)
}

export function getFeatureImportance(): Promise<ApiResult<FeatureImportanceResponse>> {
  return fetchJson("/feature-importance", isFeatureImportanceResponse)
}

export function getExplanation(
  options: { forecastIndex?: number; timestamp?: string } = {}
): Promise<ApiResult<ExplainResponse>> {
  const parameters = new URLSearchParams()
  if (options.forecastIndex !== undefined) {
    parameters.set("forecast_index", String(options.forecastIndex))
  }
  if (options.timestamp) parameters.set("timestamp", options.timestamp)
  const query = parameters.size ? `?${parameters.toString()}` : ""
  return fetchJson(`/explain${query}`, isExplainResponse)
}

export function getModelInfo(): Promise<ApiResult<ModelInfoResponse>> {
  return fetchJson("/model", isModelInfoResponse)
}
