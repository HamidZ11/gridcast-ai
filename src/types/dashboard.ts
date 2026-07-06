export type ForecastPoint = {
  timestamp: string
  demand: number | null
  forecast: number | null
  confidenceLow: number | null
  confidenceHigh: number | null
  confidenceRange: [number, number] | null
  forecastAnchor?: boolean
}

export type Metric = {
  title: string
  value: string
  unit: string
  delta: string
  deltaLabel: string
  updatedAt: string
  sparkline: number[]
}

export type ModelSummaryItem = {
  label: string
  value: string
  detail?: string
  status?: "success" | "neutral"
}

export type ModelPerformance = {
  model: string
  mae: string
  rmse: string
  mape: string
  r2: string
  status: "Evaluated" | "Production"
}

export type FeatureImportance = {
  feature: string
  importance: number
}

export type Contribution = {
  factor: string
  featureValue: string
  impact: number
}

export type TechnicalSummaryItem = {
  label: string
  value: string
}
