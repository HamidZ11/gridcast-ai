import { DecompositionChart } from "@/components/forecast-analytics/DecompositionChart"
import { DemandHeatmap } from "@/components/forecast-analytics/DemandHeatmap"
import { InsightCard } from "@/components/forecast-analytics/InsightCard"
import { PeakDemandDistribution } from "@/components/forecast-analytics/PeakDemandDistribution"
import { RegionalVarianceTable } from "@/components/forecast-analytics/RegionalVarianceTable"
import { ApiStatusNotice } from "@/components/layout/ApiStatusNotice"
import { PageHeader } from "@/components/ui/primitives"
import { decompositionData, heatmapData, regionalVariance } from "@/data/mockForecastAnalyticsData"
import { getForecastAnalyticsPageData } from "@/lib/page-data"

export default async function ForecastAnalyticsPage() {
  const { distributionData, distributionSummary, insight, notice } =
    await getForecastAnalyticsPageData()

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 lg:px-8">
      <PageHeader
        eyebrow="Analysis"
        title="Forecast analytics"
        description="How the forecast is shaped, how wide its spread is, and where the analysis is still illustrative."
      />

      {notice ? <ApiStatusNotice message={notice} /> : null}

      <section className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <DecompositionChart data={decompositionData} />
        <PeakDemandDistribution
          data={distributionData}
          mean={distributionSummary.mean}
          p90={distributionSummary.p90}
          volatilityIndex={distributionSummary.volatilityIndex}
        />
      </section>

      <section className="mt-3">
        <DemandHeatmap data={heatmapData} />
      </section>

      <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <RegionalVarianceTable rows={regionalVariance} />
        <InsightCard
          modelName={insight.modelName}
          dataset={insight.dataset}
          validationMape={insight.validationMape}
          forecastHorizon={insight.forecastHorizon}
          generatedAt={insight.generatedAt}
        />
      </section>
    </main>
  )
}
