import { ForecastChart } from "@/components/dashboard/ForecastChart"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { ApiStatusNotice } from "@/components/layout/ApiStatusNotice"
import { getOverviewPageData } from "@/lib/page-data"

export default async function OverviewPage() {
  const { metrics, forecastData, chartSummary, notice } = await getOverviewPageData()

  return (
    <main className="mx-auto w-full max-w-[1880px] px-5 py-5 md:px-8 lg:px-10 lg:py-6 2xl:px-12">
      <div className="animate-enter flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.18em] text-[#64748B]">
            {chartSummary.region}
          </p>
          <h1 className="mt-1 text-[40px] font-semibold leading-[0.98] tracking-tight text-[#0F172A] md:text-[40px]">
            GridCast AI
          </h1>
          <p className="mt-2.5 max-w-2xl text-[15px] font-medium leading-6 text-[#64748B]">
            Short-term demand forecasting from the NESO 2024 historical dataset
          </p>
        </div>
        <div className="grid w-fit gap-1 rounded-[18px] border border-[#E8EDF5] bg-white px-3.5 py-2.5 text-right shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
          <span className="flex items-center justify-end gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
            Historical forecast basis
          </span>
          <span className="text-sm font-semibold text-[#0F172A]">
            Starts {chartSummary.forecastStartLabel}
          </span>
        </div>
      </div>

      {notice ? <ApiStatusNotice message={notice} /> : null}

      <section className="mt-4 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.title} metric={metric} index={index} />
        ))}
      </section>

      <section className="mt-3.5 animate-enter-slow">
        <ForecastChart
          data={forecastData}
          latestObservationLabel={chartSummary.latestObservationLabel}
          forecastStartTimestamp={chartSummary.forecastStartTimestamp}
          forecastStartLabel={chartSummary.forecastStartLabel}
          peakTime={chartSummary.peakTime}
          peakDemand={chartSummary.peakDemand}
          modelVersion={chartSummary.modelVersion}
          dataset={chartSummary.dataset}
          trainingData={chartSummary.trainingData}
          forecastHorizon={chartSummary.forecastHorizon}
        />
      </section>
    </main>
  )
}
