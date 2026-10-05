import { getSystemStatus } from "@/lib/system-status"

/*
 * Polled by the dashboard chrome while the backend is waking
 * (components/layout/useDataSourceStatus.ts). Each check is bounded at 4 s so
 * polls stay 5 s apart and no request is held open through a cold start.
 */
const RECHECK_TIMEOUT_MS = 4_000

export async function GET() {
  const status = await getSystemStatus({ timeoutMs: RECHECK_TIMEOUT_MS })
  return Response.json(status, { headers: { "Cache-Control": "no-store" } })
}
