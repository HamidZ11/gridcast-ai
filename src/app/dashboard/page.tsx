import { ForecastChart } from "@/components/dashboard/ForecastChart"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { ApiStatusNotice } from "@/components/layout/ApiStatusNotice"
import { PageHeader, StatusChip } from "@/components/ui/primitives"
import { getOverviewPageData } from "@/lib/page-data"

export default async function OverviewPage() {
  const { metrics, forecastData, chartSummary, notice } = await getOverviewPageData()

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 lg:px-8">
      <PageHeader
        eyebrow={`${chartSummary.region} · Overview`}
        title="Demand overview"
        description="Latest observed demand and the model's next 48 hours, from the saved NESO 2024 record."
        actions={
          chartSummary.forecastStartLabel !== "Unavailable" ? (
            <StatusChip tone="neutral">Forecast basis {chartSummary.forecastStartLabel}</StatusChip>
          ) : null
        }
      />

      {notice ? <ApiStatusNotice message={notice} /> : null}

      {/* One comparable set of four - rules, not four separate cards. */}
      <section
        aria-label="Headline figures"
        className="animate-enter mt-4 grid divide-y divide-[var(--gc-rule)] rounded-[8px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] sm:grid-cols-2 sm:divide-y-0 sm:[&>*:nth-child(n+3)]:border-t sm:[&>*:nth-child(n+3)]:border-[var(--gc-rule)] sm:[&>*:nth-child(even)]:border-l sm:[&>*:nth-child(even)]:border-[var(--gc-rule)] xl:grid-cols-4 xl:[&>*:not(:first-child)]:border-l xl:[&>*:not(:first-child)]:border-[var(--gc-rule)] xl:[&>*:nth-child(n+3)]:border-t-0"
      >
        {metrics.map((metric, index) => (
          <MetricCard key={metric.title} metric={metric} index={index} />
        ))}
      </section>

      <section className="animate-enter-slow mt-3">
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
