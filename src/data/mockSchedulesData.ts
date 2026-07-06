export type JobStatus = "Completed" | "Scheduled" | "Monitoring"

export type OperationsJob = {
  id: "forecast" | "metrics" | "validation" | "features"
  job: string
  type: string
  started: string
  duration: string
  status: JobStatus
}

export type RefreshSchedule = {
  id: "raw" | "processed" | "metadata" | "cache"
  label: string
  cadence: string
  nextAction: string
}

// Isolated operations mocks. Replace these values when a scheduler, job
// registry, and dataset freshness service are added to the backend.
export const forecastCadenceMinutes = 60
export const datasetRefreshStatus = "Awaiting next NESO release"
export const nextPlannedRetrain = "01 Oct 2026"
export const retrainingTrigger = "Quarterly, or when validation MAPE exceeds 5%"

export const operationsJobs: OperationsJob[] = [
  {
    id: "forecast",
    job: "48h demand forecast",
    type: "Inference",
    started: "From forecast API",
    duration: "Not recorded",
    status: "Completed",
  },
  {
    id: "metrics",
    job: "Model metrics refresh",
    type: "Evaluation",
    started: "After model training",
    duration: "Not recorded",
    status: "Monitoring",
  },
  {
    id: "validation",
    job: "NESO data validation",
    type: "Data quality",
    started: "Daily at 02:15 UTC",
    duration: "Not recorded",
    status: "Scheduled",
  },
  {
    id: "features",
    job: "Feature pipeline generation",
    type: "Data pipeline",
    started: "After dataset refresh",
    duration: "Not recorded",
    status: "Scheduled",
  },
]

export const refreshSchedules: RefreshSchedule[] = [
  { id: "raw", label: "Raw NESO dataset", cadence: "Annual static CSV", nextAction: "Await NESO publication" },
  { id: "processed", label: "Processed training dataset", cadence: "After raw validation", nextAction: "Run feature pipeline" },
  { id: "metadata", label: "Model metadata", cadence: "After successful training", nextAction: "Publish selected model" },
  { id: "cache", label: "Forecast API cache", cadence: "Hourly target cadence", nextAction: "Generate next 48h window" },
]
