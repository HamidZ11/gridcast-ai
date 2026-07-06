export type DecompositionPoint = {
  time: string
  observed: number
  trend: number
  seasonal: number
  residual: number
}

export type DistributionPoint = {
  demand: number
  probability: number
}

export type HeatmapCell = {
  day: string
  hour: number
  value: number
}

export type RegionalVariance = {
  region: string
  load: string
  trend: string
  anomalyScore: string
  severity: "low" | "stable" | "critical"
}

export const decompositionData: DecompositionPoint[] = [
  { time: "00h", observed: 31.2, trend: 32.4, seasonal: 1.2, residual: -0.4 },
  { time: "02h", observed: 29.8, trend: 32.1, seasonal: -0.8, residual: 0.2 },
  { time: "04h", observed: 28.9, trend: 31.8, seasonal: -1.5, residual: -0.3 },
  { time: "06h", observed: 34.1, trend: 32.2, seasonal: 2.1, residual: 0.5 },
  { time: "08h", observed: 40.2, trend: 33.0, seasonal: 4.4, residual: 0.8 },
  { time: "10h", observed: 42.0, trend: 34.1, seasonal: 3.2, residual: -0.6 },
  { time: "12h", observed: 41.7, trend: 35.0, seasonal: 1.8, residual: 0.4 },
  { time: "14h", observed: 43.5, trend: 35.8, seasonal: 2.2, residual: 0.7 },
  { time: "16h", observed: 46.1, trend: 36.6, seasonal: 4.8, residual: -0.2 },
  { time: "18h", observed: 48.2, trend: 37.1, seasonal: 6.2, residual: 0.9 },
  { time: "20h", observed: 45.6, trend: 36.7, seasonal: 3.9, residual: -0.5 },
  { time: "22h", observed: 39.8, trend: 35.8, seasonal: 1.1, residual: 0.3 },
]

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export const heatmapData: HeatmapCell[] = days.flatMap((day, dayIndex) =>
  Array.from({ length: 24 }, (_, hour) => {
    const morning = Math.exp(-Math.pow(hour - 8, 2) / 18) * 0.32
    const evening = Math.exp(-Math.pow(hour - 18, 2) / 14) * 0.46
    const weekdayLift = dayIndex < 5 ? 0.18 : 0.02
    const weekendDrop = dayIndex > 4 && hour > 9 && hour < 19 ? -0.12 : 0
    const industrial = dayIndex < 5 && hour >= 10 && hour <= 15 ? 0.16 : 0
    const value = Math.max(0.12, Math.min(1, 0.18 + morning + evening + weekdayLift + weekendDrop + industrial))

    return { day, hour, value: Number(value.toFixed(2)) }
  })
)

export const regionalVariance: RegionalVariance[] = [
  { region: "London & SE", load: "12,402 MW", trend: "+3.8%", anomalyScore: "0.12", severity: "low" },
  { region: "North West", load: "8,910 MW", trend: "+6.1%", anomalyScore: "0.86", severity: "critical" },
  { region: "Scotland Central", load: "5,220 MW", trend: "+1.4%", anomalyScore: "0.05", severity: "stable" },
  { region: "Midlands", load: "7,450 MW", trend: "+2.9%", anomalyScore: "0.22", severity: "low" },
]

// TODO: Replace decomposition, heatmap, and regional telemetry mocks when those domain APIs are available.
