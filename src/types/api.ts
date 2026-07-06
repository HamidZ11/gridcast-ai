export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export type HealthResponse = {
  status: string
  service: string
  version: string
}

export type ForecastPointResponse = {
  timestamp: string
  predicted_demand_gw: number
  confidence_low_gw: number
  confidence_high_gw: number
}

export type ForecastResponse = {
  horizon_hours: number
  generated_at: string
  unit: string
  points: ForecastPointResponse[]
  data_source: "artifact" | "fallback"
}

export type SimulationRequest = {
  temperature_anomaly: number
  wind_generation_multiplier: number
  solar_generation_multiplier: number
  ev_demand_multiplier: number
  industrial_demand_multiplier: number
  residential_demand_multiplier: number
  weekend_flag: boolean
  bank_holiday_flag: boolean
}

export type SimulationMetricsResponse = {
  peak_demand_gw: number
  average_demand_gw: number
  total_energy_gwh: number
  carbon_estimate_ktco2: number
  peak_time: string
  peak_change_gw: number
  energy_change_gwh: number
  carbon_change_ktco2: number
  confidence_percent: number
  grid_stress: "Low" | "Medium" | "High"
}

export type SimulationResponse = {
  horizon_hours: number
  generated_at: string
  unit: string
  points: ForecastPointResponse[]
  baseline_points: ForecastPointResponse[]
  metrics: SimulationMetricsResponse
  summary: string
  limitations: string[]
  data_source: "artifact" | "fallback"
}

export type HistoryPointResponse = {
  timestamp: string
  demand_gw: number
}

export type HistoryResponse = {
  source: string
  unit: string
  points: HistoryPointResponse[]
  data_source: "artifact" | "fallback"
}

export type MetricItemResponse = {
  name: string
  value: number
  unit: string | null
}

export type MetricsResponse = {
  model_name: string
  model_version: string
  metrics: MetricItemResponse[]
  data_source: "artifact" | "fallback"
}

export type FeatureImportanceItemResponse = {
  feature: string
  importance: number
}

export type FeatureImportanceResponse = {
  model_name: string
  generated_at: string
  features: FeatureImportanceItemResponse[]
  method: string | null
  data_source: "artifact" | "fallback"
}

export type ExplainFeatureResponse = {
  name: string
  value: number
  impact: number
}

export type ExplainResponse = {
  prediction: number
  base_value: number
  features: ExplainFeatureResponse[]
  forecast_index: number
  timestamp: string
  model_name: string
  method: string
  unit: string
  data_source: "artifact"
}

export type ModelInfoResponse = {
  name: string
  version: string
  algorithm: string
  status: string
  training_date: string
  training_window: string
  forecast_horizon_hours: number
  dataset: string
  rows_trained: number
  selected_model: string | null
  target: string | null
  training_timestamp: string | null
  metrics: Record<string, number> | null
  feature_columns: string[]
  limitations: string[]
  all_model_metrics: Record<string, Record<string, number>>
  row_count: number | null
  training_rows: number | null
  test_rows: number | null
  metric_error_unit: string | null
  data_source: "artifact" | "fallback"
}
