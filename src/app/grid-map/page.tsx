import { GridMapDashboard } from "@/components/grid-map/GridMapDashboard"
import { ApiStatusNotice } from "@/components/layout/ApiStatusNotice"
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
    <main className="mx-auto w-full max-w-[1880px] px-5 py-5 md:px-8 lg:px-10 lg:py-6 2xl:px-12">
      <header className="animate-enter flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.18em] text-[#64748B]">
            Operations
          </p>
          <h1 className="mt-1 text-[40px] font-semibold leading-[0.98] tracking-tight text-[#0F172A]">
            Grid Map
          </h1>
          <p className="mt-2.5 max-w-3xl text-[15px] font-medium leading-6 text-[#64748B]">
            Interactive regional electricity demand and operational signals across Great Britain.
          </p>
        </div>
        <div className="grid w-fit gap-1 rounded-[18px] border border-[#E8EDF5] bg-white px-3.5 py-2.5 text-right shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#94A3B8]">
            National forecast basis
          </span>
          <span className="text-[12px] font-semibold text-[#0F172A]">
            {generatedAt ? `${formatGeneratedAt(generatedAt)} UTC` : "Unavailable"}
          </span>
        </div>
      </header>

      {notice ? <ApiStatusNotice message={notice} /> : null}
      <GridMapDashboard regions={regions} />
    </main>
  )
}
