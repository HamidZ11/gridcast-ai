import {
  getExplanation,
  getFeatureImportance,
  getForecast,
  getHealth,
  getHistory,
  getMetrics,
  getModelInfo,
} from "@/lib/api"
import type { DistributionPoint } from "@/data/mockForecastAnalyticsData"
import {
  datasetRefreshStatus,
  forecastCadenceMinutes,
  nextPlannedRetrain,
  operationsJobs,
  refreshSchedules,
  retrainingTrigger,
  type JobStatus,
} from "@/data/mockSchedulesData"
import type {
  ApiResult,
  ExplainResponse,
  FeatureImportanceResponse,
  ForecastResponse,
  HealthResponse,
  HistoryResponse,
  MetricsResponse,
  ModelInfoResponse,
} from "@/types/api"
import type {
  Contribution,
  FeatureImportance,
  ForecastPoint,
  Metric,
  ModelPerformance,
  ModelSummaryItem,
  TechnicalSummaryItem,
} from "@/types/dashboard"

type ChartSummary = {
  latestObservationLabel: string
  forecastStartTimestamp: string | null
  forecastStartLabel: string
  peakTime: string | null
  peakDemand: number | null
  modelVersion: string
  dataset: string
  trainingData: string
  forecastHorizon: string
  region: string
}

type ModelConfidence = {
  value: number | null
  text: string
}

type PeakExplanation = {
  predictedPeak: string
  basePrediction: string
  unit: string
  window: string
  contributions: Contribution[]
}

export type OverviewPageData = {
  metrics: Metric[]
  forecastData: ForecastPoint[]
  chartSummary: ChartSummary
  notice: string | null
}

export type ModelInsightsPageData = {
  productionLabel: string
  modelSummary: ModelSummaryItem[]
  performanceComparison: ModelPerformance[]
  featureImportance: FeatureImportance[]
  featureImportanceMethod: string | null
  modelConfidence: ModelConfidence
  peakExplanation: PeakExplanation
  technicalSummary: TechnicalSummaryItem[]
  notice: string | null
}

export type ForecastAnalyticsPageData = {
  distributionData: DistributionPoint[]
  distributionSummary: {
    mean: string
    p90: string
    volatilityIndex: string
  }
  insight: {
    modelName: string
    dataset: string
    validationMape: string
    forecastHorizon: string
    generatedAt: string
  }
  systemStatus: string
  notice: string | null
}

export type SchedulesPageData = {
  overview: Array<{
    label: string
    value: string
    detail: string
    source: "backend" | "operations mock"
  }>
  jobs: Array<{
    job: string
    type: string
    model: string
    started: string
    duration: string
    status: JobStatus
  }>
  retraining: Array<{
    label: string
    value: string
    source: "backend" | "operations mock"
  }>
  refreshTimeline: Array<{
    label: string
    cadence: string
    lastUpdated: string
    nextAction: string
  }>
  notice: string | null
}

function formatHour(timestamp: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(timestamp))
}

function formatDate(timestamp: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(timestamp))
}

function formatDateTime(timestamp: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(timestamp))
}

function getMetric(metrics: MetricsResponse | null, name: string) {
  return metrics?.metrics.find((metric) => metric.name.toLowerCase() === name.toLowerCase()) ?? null
}

function collectErrors(results: ApiResult<unknown>[], usedFallback: boolean): string | null {
  const errors = results.filter((result) => !result.ok).map((result) => (result.ok ? "" : result.error))
  if (errors.length > 0) {
    return `Backend data unavailable or incomplete. Unavailable values have been omitted. ${errors[0]}`
  }
  if (usedFallback) {
    return "Trained model artifacts are unavailable. Fallback API data was ignored to avoid presenting mock values as production results."
  }
  return null
}

function buildForecastData(forecast: ForecastResponse, history: HistoryResponse): ForecastPoint[] {
  const historyPoints: ForecastPoint[] = history.points.map((point) => ({
    timestamp: point.timestamp,
    demand: point.demand_gw,
    forecast: null,
    confidenceLow: null,
    confidenceHigh: null,
    confidenceRange: null,
  }))
  const forecastPoints: ForecastPoint[] = forecast.points.map((point) => ({
    timestamp: point.timestamp,
    demand: null,
    forecast: point.predicted_demand_gw,
    confidenceLow: point.confidence_low_gw,
    confidenceHigh: point.confidence_high_gw,
    confidenceRange: [point.confidence_low_gw, point.confidence_high_gw],
  }))

  const lastHistory = historyPoints.at(-1)
  if (lastHistory && lastHistory.demand !== null) {
    lastHistory.forecast = lastHistory.demand
    lastHistory.forecastAnchor = true
  }
  return [...historyPoints, ...forecastPoints]
}

function unavailableMetric(title: string, detail: string): Metric {
  return {
    title,
    value: "--",
    unit: "",
    delta: "Unavailable",
    deltaLabel: detail,
    updatedAt: "No artifact data",
    sparkline: [],
  }
}

function buildOverviewMetrics(
  forecast: ForecastResponse | null,
  history: HistoryResponse | null,
  modelMetrics: MetricsResponse | null
): Metric[] {
  const forecastValues = forecast?.points.map((point) => point.predicted_demand_gw) ?? []
  const historyValues = history?.points.map((point) => point.demand_gw) ?? []
  const peak = forecastValues.length ? Math.max(...forecastValues) : null
  const current = historyValues.at(-1) ?? null
  const mape = getMetric(modelMetrics, "MAPE")?.value ?? null

  return [
    peak === null
      ? unavailableMetric("Predicted Peak Demand", "forecast unavailable")
      : {
          title: "Predicted Peak Demand",
          value: peak.toFixed(1),
          unit: "GW",
          delta: "Model forecast",
          deltaLabel: `${forecast?.horizon_hours ?? 48}-hour horizon`,
          updatedAt: `Starts ${formatDateTime(forecast!.points[0].timestamp)} UTC`,
          sparkline: forecastValues.slice(-7),
        },
    current === null
      ? unavailableMetric("Current Demand", "history unavailable")
      : {
          title: "Latest Observed Demand",
          value: current.toFixed(1),
          unit: "GW",
          delta: "Latest observation",
          deltaLabel: history?.source ?? "",
          updatedAt: `Observed ${formatDateTime(history!.points.at(-1)!.timestamp)} UTC`,
          sparkline: historyValues.slice(-7),
        },
    mape === null
      ? unavailableMetric("Forecast Accuracy", "validation metrics unavailable")
      : {
          title: "Forecast Accuracy",
          value: (100 - mape).toFixed(1),
          unit: "%",
          delta: `${mape.toFixed(2)}% MAPE`,
          deltaLabel: "saved validation result",
          updatedAt: "From active model metadata",
          sparkline: [],
        },
    unavailableMetric("Temperature Impact", "weather features are not included"),
  ]
}

export async function getOverviewPageData(): Promise<OverviewPageData> {
  const results = await Promise.all([getForecast(), getHistory(), getMetrics(), getModelInfo()])
  const [forecastResult, historyResult, metricsResult, modelResult] = results
  const forecast =
    forecastResult.ok && forecastResult.data.data_source === "artifact" ? forecastResult.data : null
  const history = historyResult.ok && historyResult.data.data_source === "artifact" ? historyResult.data : null
  const metrics = metricsResult.ok && metricsResult.data.data_source === "artifact" ? metricsResult.data : null
  const model = modelResult.ok && modelResult.data.data_source === "artifact" ? modelResult.data : null
  const forecastValues = forecast?.points.map((point) => point.predicted_demand_gw) ?? []
  const peakDemand = forecastValues.length ? Math.max(...forecastValues) : null
  const peakPoint = forecast?.points.find((point) => point.predicted_demand_gw === peakDemand)
  const usedFallback = results.some((result) => result.ok && "data_source" in result.data && result.data.data_source === "fallback")

  return {
    metrics: buildOverviewMetrics(forecast, history, metrics),
    forecastData: forecast && history ? buildForecastData(forecast, history) : [],
    chartSummary: {
      latestObservationLabel: history?.points.at(-1)?.timestamp
        ? `${formatDateTime(history.points.at(-1)!.timestamp)} UTC`
        : "Unavailable",
      forecastStartTimestamp: forecast?.points[0]?.timestamp ?? null,
      forecastStartLabel: forecast?.points[0]?.timestamp
        ? `${formatDateTime(forecast.points[0].timestamp)} UTC`
        : "Unavailable",
      peakTime: peakPoint?.timestamp ?? null,
      peakDemand,
      modelVersion: model ? `${model.name} ${model.version}` : "Unavailable",
      dataset: model?.dataset ?? "Unavailable",
      trainingData: model?.training_window ?? "Unavailable",
      forecastHorizon: model ? `${model.forecast_horizon_hours} hours` : "Unavailable",
      region: "Great Britain",
    },
    notice: collectErrors(results, usedFallback),
  }
}

function buildModelSummary(model: ModelInfoResponse | null): ModelSummaryItem[] {
  if (!model) return []
  const limitations = model.limitations.length
    ? model.limitations.join(" ")
    : "No limitations supplied by the model registry."

  return [
    { label: "Production model", value: model.name, detail: model.algorithm, status: "success" },
    { label: "Model version", value: model.version, detail: "Saved artifact version" },
    { label: "Dataset", value: model.dataset, detail: "Training data source" },
    { label: "Training date", value: formatDate(model.training_date), detail: "Latest saved training run" },
    { label: "Target", value: model.target ?? "Unavailable", detail: "Forecast variable" },
    { label: "Forecast horizon", value: `${model.forecast_horizon_hours} hours`, detail: "96 half-hourly points" },
    { label: "Training rows", value: model.rows_trained.toLocaleString("en-GB"), detail: "Chronological training split" },
    { label: "Feature count", value: model.feature_columns.length.toLocaleString("en-GB"), detail: "Engineered model inputs" },
    {
      label: "Training timestamp",
      value: model.training_timestamp ? `${formatDateTime(model.training_timestamp)} UTC` : "Unavailable",
      detail: "Artifact creation time",
    },
    { label: "Model limitations", value: `${model.limitations.length} documented`, detail: limitations },
  ]
}

function formatStoredMetric(metrics: Record<string, number>, name: string, unit: string): string {
  const value = metrics[name]
  if (typeof value !== "number") return "--"
  if (name === "mae" || name === "rmse") return `${value.toFixed(1)} ${unit}`
  if (name === "mape") return `${value.toFixed(2)}%`
  return value.toFixed(4)
}

function buildPerformanceRows(model: ModelInfoResponse | null): ModelPerformance[] {
  if (!model) return []
  const selected = model.selected_model ?? model.name
  const errorUnit = model.metric_error_unit ?? "MW"

  return Object.entries(model.all_model_metrics).map(([modelName, metrics]) => ({
    model: modelName,
    mae: formatStoredMetric(metrics, "mae", errorUnit),
    rmse: formatStoredMetric(metrics, "rmse", errorUnit),
    mape: formatStoredMetric(metrics, "mape", errorUnit),
    r2: formatStoredMetric(metrics, "r2", errorUnit),
    status: modelName === selected ? "Production" : "Evaluated",
  }))
}

function formatFeatureName(feature: string): string {
  const labels: Record<string, string> = {
    hour: "Hour of day",
    day: "Day of month",
    month: "Month",
    day_of_week: "Day of week",
    is_weekend: "Weekend flag",
    demand_lag_1: "Previous half-hour demand",
    demand_lag_48: "Previous day demand",
    demand_lag_336: "Previous week demand",
    demand_rolling_3: "3-period rolling demand",
    demand_rolling_48: "24-hour rolling demand",
    demand_rolling_336: "7-day rolling demand",
  }
  return labels[feature] ?? feature.replaceAll("_", " ")
}

function buildFeatureImportance(response: FeatureImportanceResponse | null): FeatureImportance[] {
  if (!response) return []
  return response.features
    .map((feature) => ({
      feature: formatFeatureName(feature.feature),
      importance: feature.importance,
    }))
    .sort((left, right) => right.importance - left.importance)
}

function formatExplanationFeatureValue(feature: ExplainResponse["features"][number]): string {
  if (feature.name.startsWith("demand_")) {
    return `${feature.value.toLocaleString("en-GB", { maximumFractionDigits: 0 })} MW`
  }
  if (feature.name === "is_weekend") return feature.value === 1 ? "Yes" : "No"
  return feature.value.toLocaleString("en-GB", { maximumFractionDigits: 2 })
}

function buildTechnicalSummary(model: ModelInfoResponse | null): TechnicalSummaryItem[] {
  if (!model) return []
  return [
    { label: "Target", value: model.target ?? "Unavailable" },
    { label: "Dataset rows", value: model.row_count?.toLocaleString("en-GB") ?? "Unavailable" },
    {
      label: "Evaluation split",
      value:
        model.training_rows !== null && model.test_rows !== null
          ? `${model.training_rows.toLocaleString("en-GB")} train / ${model.test_rows.toLocaleString("en-GB")} test`
          : "Unavailable",
    },
    { label: "Feature schema", value: model.feature_columns.join(", ") || "Unavailable" },
    { label: "Limitations", value: model.limitations.join(" ") || "None supplied" },
  ]
}

export async function getModelInsightsPageData(): Promise<ModelInsightsPageData> {
  const results = await Promise.all([
    getModelInfo(),
    getMetrics(),
    getFeatureImportance(),
    getExplanation(),
  ])
  const [modelResult, metricsResult, featureResult, explainResult] = results
  const model = modelResult.ok && modelResult.data.data_source === "artifact" ? modelResult.data : null
  const metrics = metricsResult.ok && metricsResult.data.data_source === "artifact" ? metricsResult.data : null
  const features =
    featureResult.ok && featureResult.data.data_source === "artifact" ? featureResult.data : null
  const explanation =
    explainResult.ok && explainResult.data.data_source === "artifact" ? explainResult.data : null
  const mape = getMetric(metrics, "MAPE")?.value ?? null
  const usedFallback = results.some((result) => result.ok && "data_source" in result.data && result.data.data_source === "fallback")

  return {
    productionLabel: model ? `${model.name} · ${model.version}` : "Model unavailable",
    modelSummary: buildModelSummary(model),
    performanceComparison: buildPerformanceRows(model),
    featureImportance: buildFeatureImportance(features),
    featureImportanceMethod: features?.method ?? null,
    modelConfidence: {
      value: mape === null ? null : Number((100 - mape).toFixed(1)),
      text:
        mape === null
          ? "Saved validation metrics are unavailable."
          : `Derived from the active model's saved ${mape.toFixed(2)}% validation MAPE. Horizon-specific calibration is not yet available.`,
    },
    peakExplanation: {
      predictedPeak: explanation ? explanation.prediction.toFixed(1) : "--",
      basePrediction: explanation ? explanation.base_value.toFixed(1) : "--",
      unit: explanation ? explanation.unit : "",
      window: explanation
        ? `Explaining forecast at ${formatHour(explanation.timestamp)} UTC · ${explanation.method}`
        : "Local model explanation unavailable",
      contributions:
        explanation?.features.map((feature) => ({
          factor: formatFeatureName(feature.name),
          featureValue: formatExplanationFeatureValue(feature),
          impact: feature.impact,
        })) ?? [],
    },
    technicalSummary: buildTechnicalSummary(model),
    notice: collectErrors(results, usedFallback),
  }
}

function buildDistribution(forecast: ForecastResponse | null): DistributionPoint[] {
  if (!forecast?.points.length) return []
  const mean =
    forecast.points.reduce((sum, point) => sum + point.predicted_demand_gw, 0) / forecast.points.length
  const averageHalfWidth =
    forecast.points.reduce(
      (sum, point) => sum + (point.confidence_high_gw - point.confidence_low_gw) / 2,
      0
    ) / forecast.points.length
  const standardDeviation = Math.max(averageHalfWidth / 1.645, 0.1)

  return Array.from({ length: 31 }, (_, index) => {
    const demand = mean - standardDeviation * 3 + (standardDeviation * 6 * index) / 30
    const probability = Math.exp(-0.5 * ((demand - mean) / standardDeviation) ** 2)
    return { demand: Number(demand.toFixed(2)), probability: Number(probability.toFixed(4)) }
  })
}

export async function getForecastAnalyticsPageData(): Promise<ForecastAnalyticsPageData> {
  const results = await Promise.all([getHealth(), getForecast(), getModelInfo(), getMetrics()])
  const [healthResult, forecastResult, modelResult, metricsResult] = results
  const health: HealthResponse | null = healthResult.ok ? healthResult.data : null
  const forecast =
    forecastResult.ok && forecastResult.data.data_source === "artifact" ? forecastResult.data : null
  const model = modelResult.ok && modelResult.data.data_source === "artifact" ? modelResult.data : null
  const metrics = metricsResult.ok && metricsResult.data.data_source === "artifact" ? metricsResult.data : null
  const predicted = forecast?.points.map((point) => point.predicted_demand_gw) ?? []
  const highValues = forecast?.points.map((point) => point.confidence_high_gw) ?? []
  const mean = predicted.length ? predicted.reduce((sum, value) => sum + value, 0) / predicted.length : null
  const averageInterval =
    forecast?.points.length
      ? forecast.points.reduce(
          (sum, point) => sum + point.confidence_high_gw - point.confidence_low_gw,
          0
        ) / forecast.points.length
      : null
  const volatility = mean && averageInterval ? (averageInterval / mean) * 100 : null
  const mape = getMetric(metrics, "MAPE")
  const usedFallback = results.some((result) => result.ok && "data_source" in result.data && result.data.data_source === "fallback")

  return {
    distributionData: buildDistribution(forecast),
    distributionSummary: {
      mean: mean === null ? "--" : `${mean.toFixed(1)} GW`,
      p90: highValues.length ? `${Math.max(...highValues).toFixed(1)} GW` : "--",
      volatilityIndex: volatility === null ? "--" : `${volatility.toFixed(1)}%`,
    },
    insight: {
      modelName: model?.name ?? "Unavailable",
      dataset: model?.dataset ?? "Unavailable",
      validationMape: mape ? `${mape.value.toFixed(2)}${mape.unit ?? "%"}` : "--",
      forecastHorizon: model ? `${model.forecast_horizon_hours} hours` : "--",
      generatedAt: forecast ? `${formatDateTime(forecast.generated_at)} UTC` : "Unavailable",
    },
    systemStatus: health?.status ?? "unavailable",
    notice: collectErrors(results, usedFallback),
  }
}

export async function getSchedulesPageData(): Promise<SchedulesPageData> {
  const results = await Promise.all([getForecast(), getModelInfo(), getHistory()])
  const [forecastResult, modelResult, historyResult] = results
  const forecast =
    forecastResult.ok && forecastResult.data.data_source === "artifact" ? forecastResult.data : null
  const model =
    modelResult.ok && modelResult.data.data_source === "artifact" ? modelResult.data : null
  const history =
    historyResult.ok && historyResult.data.data_source === "artifact" ? historyResult.data : null
  const forecastGeneratedAt = forecast ? new Date(forecast.generated_at) : null
  const nextForecastAt = forecastGeneratedAt
    ? new Date(forecastGeneratedAt.getTime() + forecastCadenceMinutes * 60_000)
    : null
  const latestProcessedTimestamp = history?.points.at(-1)?.timestamp ?? null
  const usedFallback = results.some(
    (result) =>
      result.ok && "data_source" in result.data && result.data.data_source === "fallback"
  )

  return {
    overview: [
      {
        label: "Last forecast run",
        value: forecastGeneratedAt ? `${formatDateTime(forecastGeneratedAt.toISOString())} UTC` : "Unavailable",
        detail: forecast ? `${forecast.points.length} half-hourly predictions` : "Forecast artifact unavailable",
        source: "backend",
      },
      {
        label: "Next forecast run",
        value: nextForecastAt ? `${formatDateTime(nextForecastAt.toISOString())} UTC` : "Not scheduled",
        detail: `${forecastCadenceMinutes}-minute target cadence`,
        source: "operations mock",
      },
      {
        label: "Last model training",
        value: model?.training_timestamp ? `${formatDateTime(model.training_timestamp)} UTC` : "Unavailable",
        detail: model?.name ?? "Model metadata unavailable",
        source: "backend",
      },
      {
        label: "Dataset refresh status",
        value: datasetRefreshStatus,
        detail: model?.dataset ?? "Dataset metadata unavailable",
        source: "operations mock",
      },
    ],
    jobs: operationsJobs.map((job) => ({
      job: job.job,
      type: job.type,
      model: model?.name ?? "Unavailable",
      started:
        job.id === "forecast" && forecast
          ? `${formatDateTime(forecast.generated_at)} UTC`
          : job.started,
      duration: job.duration,
      status: job.status,
    })),
    retraining: [
      { label: "Current model", value: model?.name ?? "Unavailable", source: "backend" },
      {
        label: "Last trained",
        value: model?.training_timestamp ? `${formatDateTime(model.training_timestamp)} UTC` : "Unavailable",
        source: "backend",
      },
      { label: "Next planned retrain", value: nextPlannedRetrain, source: "operations mock" },
      { label: "Trigger condition", value: retrainingTrigger, source: "operations mock" },
      { label: "Training dataset", value: model?.dataset ?? "Unavailable", source: "backend" },
    ],
    refreshTimeline: refreshSchedules.map((item) => ({
      label: item.label,
      cadence: item.cadence,
      lastUpdated:
        item.id === "processed" && latestProcessedTimestamp
          ? `${formatDateTime(latestProcessedTimestamp)} UTC`
          : item.id === "metadata" && model?.training_timestamp
            ? `${formatDateTime(model.training_timestamp)} UTC`
            : item.id === "cache" && forecast
              ? `${formatDateTime(forecast.generated_at)} UTC`
              : item.id === "raw"
                ? model?.dataset ?? "Unavailable"
                : "Unavailable",
      nextAction: item.nextAction,
    })),
    notice: collectErrors(results, usedFallback),
  }
}
