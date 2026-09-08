import { GridMapDashboard } from "@/components/grid-map/GridMapDashboard"
import { ApiStatusNotice } from "@/components/layout/ApiStatusNotice"
import { PageHeader, StatusChip } from "@/components/ui/primitives"
import { getRegionalMapPageData } from "@/lib/regional-data"

function formatGeneratedAt(timestamp: string) {
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

export default async function GridMapPage() {
  const { regions, generatedAt, notice } = await getRegionalMapPageData()

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 lg:px-8">
      <PageHeader
        eyebrow="Operations"
        title="Regional demand map"
        description="The model is national. Each layer states how its regional numbers are produced — derived from the national record, heuristic, or illustrative."
        actions={
          <StatusChip tone={generatedAt ? "neutral" : "bad"}>
            {generatedAt ? `Basis ${formatGeneratedAt(generatedAt)} UTC` : "Forecast unavailable"}
          </StatusChip>
        }
      />

      {notice ? <ApiStatusNotice message={notice} /> : null}
      <GridMapDashboard regions={regions} />
    </main>
  )
}
