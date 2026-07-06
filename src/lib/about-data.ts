import packageInfo from "../../package.json"

import { getHealth, getModelInfo } from "@/lib/api"

function titleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatBuildTimestamp(value: string | undefined) {
  if (!value) return "Unavailable"
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(value))} UTC`
}

export async function getAboutPageData() {
  const [healthResult, modelResult] = await Promise.all([
    getHealth(),
    getModelInfo(),
  ])
  const health = healthResult.ok ? healthResult.data : null
  const model =
    modelResult.ok && modelResult.data.data_source === "artifact"
      ? modelResult.data
      : null

  return {
    machineLearning: [
      { label: "Active model", value: model?.name ?? "Unavailable" },
      { label: "Dataset", value: model?.dataset ?? "Unavailable" },
      { label: "Training cadence", value: "On-demand artifact release" },
      {
        label: "Forecast horizon",
        value: model ? `${model.forecast_horizon_hours} hours` : "Unavailable",
      },
      {
        label: "Feature count",
        value: model ? model.feature_columns.length.toLocaleString("en-GB") : "Unavailable",
      },
    ],
    system: [
      {
        label: "Backend status",
        value: health ? titleCase(health.status) : "Unavailable",
      },
      { label: "Frontend version", value: `v${packageInfo.version}` },
      {
        label: "API status",
        value: healthResult.ok ? "Connected" : "Unavailable",
      },
      {
        label: "Build timestamp",
        value: formatBuildTimestamp(process.env.GRIDCAST_BUILD_TIMESTAMP),
      },
    ],
  }
}
