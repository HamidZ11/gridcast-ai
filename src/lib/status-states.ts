import type { SystemStatus } from "@/lib/system-status"

/*
 * The two backend states the chrome reports without any model information.
 * Kept free of server imports so the client-side recheck can use them too.
 */

export const BACKEND_WAKING: SystemStatus = {
  backend: "waking",
  source: "waking",
  label: "Waking backend",
  detail:
    "The forecasting API sleeps when idle and takes about a minute to start. Rechecking every 5 seconds.",
  model: null,
  dataset: null,
}

export const BACKEND_UNAVAILABLE: SystemStatus = {
  backend: "unavailable",
  source: "unavailable",
  label: "Backend unavailable",
  detail: "The forecasting API is not responding. Values that cannot be sourced are shown as Unavailable.",
  model: null,
  dataset: null,
}
