import type { SimulationRequest, SimulationResponse } from "@/types/api"

export type ScenarioInputs = {
  temperatureAnomaly: number
  windGeneration: number
  solarGeneration: number
  evChargingDemand: number
  industrialDemand: number
  residentialDemand: number
  weekend: boolean
  bankHoliday: boolean
}

export type ScenarioForecastPoint = {
  period: number
  time: string
  baseline: number
  scenario: number
  confidenceRange: [number, number]
}

export type GridStress = "Low" | "Medium" | "High"

export type ScenarioResults = {
  points: ScenarioForecastPoint[]
  peakDemand: number
  averageDemand: number
  forecastEnergy: number
  carbonImpact: number
  peakTime: string
  peakChange: number
  energyChange: number
  carbonChange: number
  gridStress: GridStress
  confidence: number
  summary: string
}

export const DEFAULT_SCENARIO: ScenarioInputs = {
  temperatureAnomaly: 0,
  windGeneration: 100,
  solarGeneration: 100,
  evChargingDemand: 100,
  industrialDemand: 100,
  residentialDemand: 100,
  weekend: false,
  bankHoliday: false,
}

export function toSimulationRequest(inputs: ScenarioInputs): SimulationRequest {
  return {
    temperature_anomaly: inputs.temperatureAnomaly,
    wind_generation_multiplier: inputs.windGeneration / 100,
    solar_generation_multiplier: inputs.solarGeneration / 100,
    ev_demand_multiplier: inputs.evChargingDemand / 100,
    industrial_demand_multiplier: inputs.industrialDemand / 100,
    residential_demand_multiplier: inputs.residentialDemand / 100,
    weekend_flag: inputs.weekend,
    bank_holiday_flag: inputs.bankHoliday,
  }
}

function pointLabel(timestamp: string, period: number) {
  const date = new Date(timestamp)
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date)
  return `Day ${Math.floor(period / 48) + 1} · ${time}`
}

export function toScenarioResults(response: SimulationResponse): ScenarioResults {
  const baselineByTimestamp = new Map(
    response.baseline_points.map((point) => [
      point.timestamp,
      point.predicted_demand_gw,
    ])
  )
  const points = response.points.map((point, period) => ({
    period,
    time: pointLabel(point.timestamp, period),
    baseline:
      baselineByTimestamp.get(point.timestamp) ??
      response.baseline_points[period]?.predicted_demand_gw ??
      point.predicted_demand_gw,
    scenario: point.predicted_demand_gw,
    confidenceRange: [
      point.confidence_low_gw,
      point.confidence_high_gw,
    ] as [number, number],
  }))
  const peakPeriod = response.points.findIndex(
    (point) => point.timestamp === response.metrics.peak_time
  )

  return {
    points,
    peakDemand: response.metrics.peak_demand_gw,
    averageDemand: response.metrics.average_demand_gw,
    forecastEnergy: response.metrics.total_energy_gwh,
    carbonImpact: response.metrics.carbon_estimate_ktco2,
    peakTime:
      peakPeriod >= 0
        ? pointLabel(response.metrics.peak_time, peakPeriod)
        : response.metrics.peak_time,
    peakChange: response.metrics.peak_change_gw,
    energyChange: response.metrics.energy_change_gwh,
    carbonChange: response.metrics.carbon_change_ktco2,
    gridStress: response.metrics.grid_stress,
    confidence: response.metrics.confidence_percent,
    summary: response.summary,
  }
}
