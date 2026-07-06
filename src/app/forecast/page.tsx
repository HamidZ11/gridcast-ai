import { CalendarDays, Download } from "lucide-react"

import { DecompositionChart } from "@/components/forecast-analytics/DecompositionChart"
import { DemandHeatmap } from "@/components/forecast-analytics/DemandHeatmap"
import { InsightCard } from "@/components/forecast-analytics/InsightCard"
import { PeakDemandDistribution } from "@/components/forecast-analytics/PeakDemandDistribution"
import { RegionalVarianceTable } from "@/components/forecast-analytics/RegionalVarianceTable"
import { ApiStatusNotice } from "@/components/layout/ApiStatusNotice"
import {
  decompositionData,
  heatmapData,
  regionalVariance,
} from "@/data/mockForecastAnalyticsData"
import { getForecastAnalyticsPageData } from "@/lib/page-data"

export default async function ForecastAnalyticsPage() {
  const { distributionData, distributionSummary, insight, systemStatus, notice } =
    await getForecastAnalyticsPageData()

  return (
    <main className="mx-auto w-full max-w-[1880px] px-5 py-5 md:px-8 lg:px-10 lg:py-6 2xl:px-12">
      <div className="animate-enter flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.18em] text-[#64748B]">
            Forecast Intelligence
          </p>
          <h1 className="mt-1 text-[40px] font-semibold leading-[0.98] tracking-tight text-[#0F172A]">
            Forecast Analytics
          </h1>
          <p className="mt-2.5 max-w-3xl text-[15px] font-medium leading-6 text-[#64748B]">
            Decomposing demand variance and forecast drivers across the next demand cycle.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button className="flex h-9 items-center gap-2 rounded-full border border-[#E8EDF5] bg-white px-3 text-[12px] font-semibold text-[#0F172A] shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#DDE5F0] hover:shadow-[0_16px_32px_rgba(15,23,42,0.07)]">
            <CalendarDays className="size-4 text-[#64748B]" />
            Last 30 days
          </button>
          <button className="flex h-9 items-center gap-2 rounded-full border border-[#2563EB] bg-[#2563EB] px-3.5 text-[12px] font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.18)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(37,99,235,0.24)]">
            <Download className="size-4" />
            Export Dataset
          </button>
        </div>
      </div>

      {notice ? <ApiStatusNotice message={notice} /> : null}

      <section className="mt-4 grid gap-3.5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <DecompositionChart data={decompositionData} />
        <PeakDemandDistribution
          data={distributionData}
          mean={distributionSummary.mean}
          p90={distributionSummary.p90}
          volatilityIndex={distributionSummary.volatilityIndex}
        />
      </section>

      <section className="mt-3.5">
        <DemandHeatmap data={heatmapData} />
      </section>

      <section className="mt-3.5 grid gap-3.5 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
        <RegionalVarianceTable rows={regionalVariance} />
        <InsightCard
          modelName={insight.modelName}
          dataset={insight.dataset}
          validationMape={insight.validationMape}
          forecastHorizon={insight.forecastHorizon}
          generatedAt={insight.generatedAt}
        />
      </section>

      <footer className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8EDF5] py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
        <span>
          System Status: <span className="text-[#047857]">{systemStatus}</span>
        </span>
        <span>GridCast AI © 2026</span>
        <span>Utility Intelligence Platform</span>
      </footer>
    </main>
  )
}
