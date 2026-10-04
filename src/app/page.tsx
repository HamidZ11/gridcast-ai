import type { Metadata } from "next"
import Link from "next/link"

import { DashboardTour } from "@/components/landing/DashboardTour"
import { ErrorByHourChart, PeakDayChart, ResidualChart } from "@/components/landing/EvidenceCharts"
import { HeldOutChart } from "@/components/landing/HeldOutChart"
import { LandingHeader } from "@/components/landing/LandingHeader"
import {
  DATASET,
  DEMAND_RANGE,
  HELD_OUT,
  HERO_WEEK,
  MODEL_LIMITATIONS,
  MODEL_SCOREBOARD,
  SCENARIO_LIMITATIONS,
} from "@/data/landing-evidence"

const GITHUB_URL = "https://github.com/HamidZ11/gridcast-ai"

export const metadata: Metadata = {
  title: "GridCast AI — forecasting Great Britain's electricity demand",
  description:
    "An engineering case study: a half-hourly demand forecasting system for Great Britain, built on the NESO 2024 record, with its held-out evaluation and its limitations shown in full.",
}

/* ---------------------------------------------------------------- helpers */

function SectionMark({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.1em]">
      <span className="text-[var(--gc-model)]">{n}</span>
      <span className="text-[var(--gc-ink-3)]">{label}</span>
    </div>
  )
}

/* ------------------------------------------------------------------- page */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--gc-paper)] font-sans text-[var(--gc-ink)]">
      <LandingHeader />

      <main>
        {/* ============================================================ HERO */}
        <section className="mx-auto w-full max-w-[1180px] px-5 pb-14 pt-10 sm:px-8 md:pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,10fr)] lg:items-end lg:gap-12">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--gc-ink-3)]">
                Engineering case study
              </p>
              <h1 className="mt-5 max-w-[19ch] text-balance text-[30px] leading-[1.08] tracking-[-0.028em] text-[var(--gc-ink)] sm:text-[36px] lg:text-[40px]">
                Great Britain&apos;s electricity demand moves{" "}
                <span className="whitespace-nowrap text-[var(--gc-model)]">13 GW</span> in an ordinary day. GridCast
                forecasts it half-hour by half-hour.
              </h1>
              <p className="mt-5 max-w-[50ch] text-[14.5px] leading-[1.62] text-[var(--gc-ink-2)]">
                A full forecasting system built end to end — NESO&apos;s 2024 half-hourly record, an
                engineered feature set, a trained and versioned model artifact, a typed FastAPI
                service, and an analytics dashboard that reads from all of it.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex h-10 items-center rounded-[5px] bg-[var(--gc-ink)] px-4 text-[13.5px] font-medium text-white transition-colors hover:bg-[#2A2E36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-model)]/50"
                >
                  Open the dashboard
                </Link>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center rounded-[5px] border border-[var(--gc-rule-strong)] px-4 text-[13.5px] font-medium text-[var(--gc-ink)] transition-colors hover:border-[var(--gc-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-model)]/50"
                >
                  Read the source
                </a>
              </div>
            </div>

            {/* the evidence, immediately */}
            <div className="min-w-0 rounded-[8px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--gc-rule)] pb-3">
                <h2 className="text-[14px] font-medium tracking-[-0.01em] text-[var(--gc-ink)]">
                  Held-out week, {HERO_WEEK.label}
                </h2>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.07em] text-[var(--gc-ink-3)]">
                  Worst week of the test split · {HERO_WEEK.mape}% MAPE
                </p>
              </div>
              <HeldOutChart />
              <p className="mt-4 border-t border-[var(--gc-rule)] pt-3 text-[12.5px] leading-[1.55] text-[var(--gc-ink-3)]">
                Observed national demand against the saved model&apos;s prediction for the same
                half-hour, on data it never trained on. At grid scale the two lines are hard to
                separate, so the lower panel magnifies the difference. This is the{" "}
                <span className="text-[var(--gc-ink-2)]">weakest</span> week in the held-out period;
                the split as a whole comes in at {HELD_OUT.mape}% MAPE.
              </p>
            </div>
          </div>

          {/* provenance rail — facts, not decoration */}
          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-[var(--gc-rule)] pt-6 sm:grid-cols-4">
            {[
              { value: "17,232", unit: "", label: "Half-hourly rows · NESO 2024" },
              { value: "11", unit: "", label: "Engineered model features" },
              { value: "3,447", unit: "", label: "Held-out rows · 21 Oct – 31 Dec" },
              { value: HELD_OUT.mape.toFixed(2), unit: "%", label: "MAPE, one step ahead" },
            ].map((item) => (
              <div key={item.label}>
                <dd className="text-[26px] leading-none tracking-[-0.02em] text-[var(--gc-ink)]">
                  {item.value}
                  {item.unit ? <span className="ml-0.5 text-[16px] text-[var(--gc-ink-3)]">{item.unit}</span> : null}
                </dd>
                <dt className="mt-2 font-mono text-[10.5px] uppercase leading-[1.4] tracking-[0.07em] text-[var(--gc-ink-3)]">
                  {item.label}
                </dt>
              </div>
            ))}
          </dl>
        </section>

        {/* ========================================================= PROBLEM */}
        <section id="problem" className="scroll-mt-16 border-t border-[var(--gc-rule)] bg-[var(--gc-surface)]">
          <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8 md:py-20">
            <SectionMark n="01" label="The problem" />
            <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
              <div>
                <h2 className="max-w-[20ch] text-[28px] leading-[1.12] tracking-[-0.025em] text-[var(--gc-ink)] sm:text-[32px]">
                  Electricity cannot be stored at grid scale, so supply has to be scheduled against
                  a demand that has not happened yet.
                </h2>
                <div className="mt-7 space-y-5 text-[14.5px] leading-[1.65] text-[var(--gc-ink-2)]">
                  <p>
                    Across 2024, national demand ran from{" "}
                    <span className="font-mono text-[0.92em] text-[var(--gc-ink)]">
                      {DEMAND_RANGE.minGw} GW
                    </span>{" "}
                    on an August night to{" "}
                    <span className="font-mono text-[0.92em] text-[var(--gc-ink)]">
                      {DEMAND_RANGE.maxGw} GW
                    </span>{" "}
                    on a January evening — a threefold spread. A median day swings{" "}
                    <span className="font-mono text-[0.92em] text-[var(--gc-ink)]">
                      {DEMAND_RANGE.medianDailySwingGw} GW
                    </span>{" "}
                    between its trough and its peak.
                  </p>
                  <p>
                    Those swings are fast. The steepest half-hour in the record moves{" "}
                    <span className="font-mono text-[0.92em] text-[var(--gc-ink)]">
                      {DEMAND_RANGE.largestHalfHourRampMw.toLocaleString("en-GB")} MW
                    </span>{" "}
                    — eight per cent of the whole year&apos;s peak, arriving in thirty minutes.
                    Generation has to be committed before the ramp does, which makes a good
                    short-horizon forecast the input everything else depends on.
                  </p>
                </div>
              </div>

              <div>
                <div className="rounded-[8px] border border-[var(--gc-rule)] bg-[var(--gc-paper)] p-4 sm:p-5">
                  <p className="mb-1 text-[13.5px] font-medium text-[var(--gc-ink)]">
                    15 January 2024 — the year&apos;s largest single-day swing
                  </p>
                  <p className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.07em] text-[var(--gc-ink-3)]">
                    Observed demand · 48 half-hourly settlement periods
                  </p>
                  <PeakDayChart />
                </div>
                <p className="mt-3 text-[12.5px] leading-[1.55] text-[var(--gc-ink-3)]">
                  21.8 GW between trough and peak on a single winter day. Every point on this curve
                  is a measured value from the NESO record — no model is involved.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== EVIDENCE */}
        <section id="evidence" className="scroll-mt-16 border-t border-[var(--gc-rule)]">
          <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8 md:py-20">
            <SectionMark n="02" label="Does it work?" />
            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-[26ch] text-[24px] leading-[1.14] tracking-[-0.022em] sm:text-[28px] lg:text-[32px]">
                Two baselines, one chronological split, and the numbers the artifact actually stores.
              </h2>
              <p className="max-w-[46ch] text-[14px] leading-[1.6] text-[var(--gc-ink-2)]">
                The split is by time, not at random: the model trains on 13,785 rows up to 21
                October 2024 and is scored on the 3,447 rows that follow. Nothing from the test
                period is available at training time.
              </p>
            </div>

            {/* scoreboard */}
            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[620px] max-w-[900px] border-collapse text-left">
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[13%]" />
                  <col className="w-[13%]" />
                  <col className="w-[11%]" />
                  <col className="w-[12%]" />
                  <col className="w-[17%]" />
                </colgroup>
                <caption className="sr-only">
                  Held-out evaluation metrics for each model trained, from
                  backend/models/model_metadata.json
                </caption>
                <thead>
                  <tr className="border-y border-[var(--gc-rule-strong)]">
                    {["Model", "MAE (MW)", "RMSE (MW)", "MAPE", "R²", "State"].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={[
                          "py-2.5 font-mono text-[10.5px] font-normal uppercase tracking-[0.08em] text-[var(--gc-ink-3)]",
                          i === 0 ? "" : "text-right",
                          i === 5 ? "!text-right" : "",
                        ].join(" ")}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODEL_SCOREBOARD.map((row) => (
                    <tr key={row.name} className="border-b border-[var(--gc-rule)]">
                      <th scope="row" className="py-3.5 pr-6 text-[14px] font-medium text-[var(--gc-ink)]">
                        {row.name}
                      </th>
                      {[row.mae, row.rmse, `${row.mape}%`, row.r2].map((v, i) => (
                        <td
                          key={i}
                          className="py-3.5 text-right font-mono text-[13px] tabular-nums text-[var(--gc-ink-2)]"
                        >
                          {v}
                        </td>
                      ))}
                      <td className="py-3.5 text-right">
                        <span
                          className={[
                            "inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.07em]",
                            row.state === "active" ? "text-[var(--gc-ink)]" : "text-[var(--gc-ink-3)]",
                          ].join(" ")}
                        >
                          {row.state === "active" ? (
                            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--gc-model)]" />
                          ) : null}
                          {row.state === "active" ? "Saved artifact" : "Evaluated"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 max-w-[76ch] text-[12.5px] leading-[1.6] text-[var(--gc-ink-3)]">
              Both baselines are scored on the same held-out split, and training keeps the one with
              the lower RMSE: Linear Regression, by 0.15 MW (492.03 vs 492.18 MW). That is the
              artifact saved and served. Random Forest is slightly better on MAE (374.4 vs 385.7 MW)
              and MAPE (1.29% vs 1.36%). A gap this small doesn&apos;t pick a winner. It&apos;s why
              the model interface is swappable.
            </p>

            {/* two readings of the same error */}
            <div className="mt-12 grid gap-6 border-t border-[var(--gc-rule)] pt-10 md:grid-cols-2 md:gap-10">
              <figure className="m-0">
                <figcaption>
                  <h3 className="text-[14px] font-medium text-[var(--gc-ink)]">
                    The error is centred, not biased
                  </h3>
                  <p className="mt-1 mb-3 font-mono text-[10.5px] uppercase tracking-[0.07em] text-[var(--gc-ink-3)]">
                    predicted − observed · all 3,447 held-out half-hours
                  </p>
                </figcaption>
                <ResidualChart />
                <p className="mt-3 text-[12.5px] leading-[1.55] text-[var(--gc-ink-3)]">
                  {HELD_OUT.within1Pct}% of half-hours land within 1% of the observed value and{" "}
                  {HELD_OUT.within2Pct}% within 2%, with no systematic tendency to over- or
                  under-forecast.
                </p>
              </figure>

              <figure className="m-0">
                <figcaption>
                  <h3 className="text-[14px] font-medium text-[var(--gc-ink)]">
                    It is weakest overnight, strongest at peak
                  </h3>
                  <p className="mt-1 mb-3 font-mono text-[10.5px] uppercase tracking-[0.07em] text-[var(--gc-ink-3)]">
                    mean absolute % error by hour of day
                  </p>
                </figcaption>
                <ErrorByHourChart />
                <p className="mt-3 text-[12.5px] leading-[1.55] text-[var(--gc-ink-3)]">
                  Error peaks at 01:00 (2.86%) and on the 06:00 morning ramp, and falls to 0.65% at
                  the 19:00 evening peak — the half-hours the grid is most sensitive to.
                </p>
              </figure>
            </div>

            <div className="mt-10 border-t border-[var(--gc-rule)] pt-5">
              <p className="max-w-[82ch] text-[13px] leading-[1.65] text-[var(--gc-ink-2)]">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--gc-model)]">
                  Read this carefully
                </span>
                <br />
                Every figure above is <em className="not-italic text-[var(--gc-ink)]">one step
                ahead</em>. The feature set includes the previous half-hour&apos;s observed demand,
                so {HELD_OUT.mape}% MAPE describes the next-half-hour prediction. The dashboard&apos;s
                48-hour horizon is produced recursively — each prediction is fed back in as the next
                row&apos;s lag — so error compounds across the horizon, and that horizon has not been
                separately backtested.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================== BUILD */}
        <section id="build" className="scroll-mt-16 border-t border-[var(--gc-rule)] bg-[var(--gc-surface)]">
          <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8 md:py-20">
            <SectionMark n="03" label="How it is built" />
            <h2 className="mt-8 max-w-[24ch] text-[24px] leading-[1.14] tracking-[-0.022em] sm:text-[28px] lg:text-[32px]">
              Six stages, each with an artifact you can open.
            </h2>

            <ol className="mt-10 border-t border-[var(--gc-rule)]">
              {[
                {
                  stage: "Ingest",
                  what: "NESO Historic Demand Data 2024, half-hourly settlement periods.",
                  artifact: "backend/ml/ingestion",
                  out: "17,232 validated rows",
                },
                {
                  stage: "Engineer",
                  what: "Calendar parts, plus lag and rolling-demand windows at 1, 48 and 336 periods — a half-hour, a day, a week.",
                  artifact: "backend/ml/features",
                  out: "11 feature columns",
                },
                {
                  stage: "Split",
                  what: "Chronological 80/20. Random shuffling would leak the future into training on a time series.",
                  artifact: "backend/ml/training",
                  out: "13,785 train / 3,447 test",
                },
                {
                  stage: "Train & compare",
                  what: "Linear Regression and Random Forest scored on the same held-out window; metrics written beside the model.",
                  artifact: "backend/models/model_metadata.json",
                  out: "model.pkl + metadata",
                },
                {
                  stage: "Serve",
                  what: "Typed FastAPI endpoints for forecast, history, metrics, model metadata, SHAP explanation and simulation.",
                  artifact: "backend/app/api",
                  out: "8 REST endpoints",
                },
                {
                  stage: "Present",
                  what: "Next.js App Router reads the API and refuses to render fallback values as if they were results.",
                  artifact: "src/lib/page-data.ts",
                  out: "6 dashboard views",
                },
              ].map((step, index) => (
                <li
                  key={step.stage}
                  className="grid grid-cols-1 gap-x-6 gap-y-2 border-b border-[var(--gc-rule)] py-5 md:grid-cols-[auto_minmax(0,180px)_minmax(0,1fr)_minmax(0,190px)] md:items-baseline"
                >
                  <span className="font-mono text-[11px] tabular-nums text-[var(--gc-ink-3)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] font-medium tracking-[-0.01em] text-[var(--gc-ink)]">
                    {step.stage}
                  </span>
                  <span className="text-[13.5px] leading-[1.6] text-[var(--gc-ink-2)]">{step.what}</span>
                  <span className="flex flex-col gap-1 md:items-end md:text-right">
                    <span className="font-mono text-[11px] text-[var(--gc-model)]">{step.out}</span>
                    <span className="font-mono text-[10.5px] text-[var(--gc-ink-3)]">{step.artifact}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
              <div className="border-l-2 border-[var(--gc-model)] pl-5">
                <h3 className="text-[14px] font-medium text-[var(--gc-ink)]">
                  The decision that mattered most: leakage
                </h3>
                <p className="mt-2 max-w-[52ch] text-[13.5px] leading-[1.6] text-[var(--gc-ink-2)]">
                  The raw file ships three demand columns. Transmission System Demand and England
                  &amp; Wales Demand are near-perfect proxies for the target and are recorded at the
                  same instant — including them would have produced a spectacular score and a
                  useless model. Both are dropped, and the metadata says so in writing.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
                  Feature set, in full
                </p>
                <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-2">
                  {DATASET.features.map((f) => (
                    <li
                      key={f}
                      className="rounded-[4px] border border-[var(--gc-rule)] bg-[var(--gc-paper)] px-2 py-1 font-mono text-[11px] text-[var(--gc-ink-2)]"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[12.5px] leading-[1.55] text-[var(--gc-ink-3)]">
                  Target: {DATASET.target}. No weather, no holiday flag, no generation mix — the
                  model is a demand-and-time baseline, and the page says so rather than implying
                  otherwise.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================= DASHBOARD */}
        <section id="dashboard" className="scroll-mt-16 border-t border-[var(--gc-rule)]">
          <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8 md:py-20">
            <SectionMark n="04" label="The application" />
            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-[24ch] text-[24px] leading-[1.14] tracking-[-0.022em] sm:text-[28px] lg:text-[32px]">
                Five views over the same artifacts.
              </h2>
              <p className="max-w-[46ch] text-[14px] leading-[1.6] text-[var(--gc-ink-2)]">
                Screenshots of the running application — plus a sixth, Schedules, that tracks
                forecast and training runs. Every view is reachable now, with no sign-in.
              </p>
            </div>
            <div className="mt-10">
              <DashboardTour />
            </div>
          </div>
        </section>

        {/* ========================================================== LIMITS */}
        <section id="limits" className="scroll-mt-16 border-t border-[var(--gc-rule)] bg-[var(--gc-surface)]">
          <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8 md:py-20">
            <SectionMark n="05" label="What it does not do" />
            <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
              <div>
                <h2 className="max-w-[18ch] text-[24px] leading-[1.14] tracking-[-0.022em] sm:text-[28px] lg:text-[32px]">
                  The limitations are part of the deliverable.
                </h2>
                <p className="mt-6 max-w-[46ch] text-[14px] leading-[1.6] text-[var(--gc-ink-2)]">
                  These strings are not marketing copy written for this page. They are stored beside
                  the model and returned by the API, and the dashboard renders the same list. If a
                  value cannot be sourced from a real artifact, the UI shows{" "}
                  <span className="font-mono text-[0.92em] text-[var(--gc-ink)]">Unavailable</span>{" "}
                  instead of a placeholder.
                </p>

                <p className="mt-10 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
                  What would close them
                </p>
                <ul className="mt-3 border-t border-[var(--gc-rule)]">
                  {[
                    { next: "Rolling-origin backtesting", why: "measures the 48-hour horizon, not just one step" },
                    { next: "Live NESO ingestion", why: "replaces the frozen 2024 file with a running feed" },
                    { next: "Weather ingestion", why: "the largest missing driver of demand" },
                    { next: "Probabilistic forecasting", why: "calibrated intervals instead of an RMSE proxy" },
                    { next: "XGBoost + LSTM comparison", why: "a third and fourth entry on the leaderboard" },
                  ].map((item) => (
                    <li key={item.next} className="border-b border-[var(--gc-rule)] py-3">
                      <p className="text-[13.5px] font-medium text-[var(--gc-ink)]">{item.next}</p>
                      <p className="mt-0.5 text-[12.5px] leading-[1.5] text-[var(--gc-ink-3)]">{item.why}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[12px] leading-[1.5] text-[var(--gc-ink-3)]">
                  Planned work, listed in the repository README. None of it is implemented yet.
                </p>
              </div>

              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
                  Model · documented in model_metadata.json and the API
                </p>
                <ul className="mt-3 border-t border-[var(--gc-rule)]">
                  {MODEL_LIMITATIONS.map((item) => (
                    <li
                      key={item}
                      className="border-b border-[var(--gc-rule)] py-3 text-[13.5px] leading-[1.6] text-[var(--gc-ink-2)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
                  Scenario simulator · documented in simulation_service.py
                </p>
                <ul className="mt-3 border-t border-[var(--gc-rule)]">
                  {SCENARIO_LIMITATIONS.map((item) => (
                    <li
                      key={item}
                      className="border-b border-[var(--gc-rule)] py-3 text-[13.5px] leading-[1.6] text-[var(--gc-ink-2)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>

                <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
                  Scope
                </p>
                <ul className="mt-3 border-t border-[var(--gc-rule)]">
                  {[
                    "Forecasts run from the saved 2024 dataset and model artifact. There is no live NESO feed.",
                    "The 48-hour recursive horizon has no rolling-origin backtest yet, so only one-step-ahead error is measured.",
                    "Regional map layers allocate the national forecast by fixed shares; the model is not regional.",
                  ].map((item) => (
                    <li
                      key={item}
                      className="border-b border-[var(--gc-rule)] py-3 text-[13.5px] leading-[1.6] text-[var(--gc-ink-2)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================= CTA */}
        <section className="border-t border-[var(--gc-rule)]">
          <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8 md:py-20">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:gap-8">
              <Link
                href="/dashboard"
                className="group flex flex-col justify-between rounded-[8px] border border-[var(--gc-rule-strong)] bg-[var(--gc-surface)] p-6 transition-colors hover:border-[var(--gc-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-model)]/50 sm:p-8"
              >
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--gc-model)]">
                    Use it
                  </p>
                  <h2 className="mt-3 text-[26px] leading-[1.15] tracking-[-0.02em] sm:text-[30px]">
                    Open the dashboard
                  </h2>
                  <p className="mt-3 max-w-[36ch] text-[13.5px] leading-[1.6] text-[var(--gc-ink-2)]">
                    The forecast, the model, the regional picture and the run schedule. No account
                    needed.
                  </p>
                </div>
                <span className="mt-8 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--gc-ink)] transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
                  /dashboard →
                </span>
              </Link>

              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col justify-between rounded-[8px] border border-[var(--gc-rule)] p-6 transition-colors hover:border-[var(--gc-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc-model)]/50 sm:p-7"
              >
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--gc-ink-3)]">
                    Read it
                  </p>
                  <h2 className="mt-3 text-[20px] leading-[1.18] tracking-[-0.02em]">
                    Read the source
                  </h2>
                  <p className="mt-3 max-w-[36ch] text-[13.5px] leading-[1.6] text-[var(--gc-ink-2)]">
                    The ML pipeline, the FastAPI services, the schemas, the roadmap, and the
                    limitations — all in the open.
                  </p>
                </div>
                <span className="mt-8 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--gc-ink)] transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
                  github.com/HamidZ11/gridcast-ai →
                </span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--gc-rule)]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[48ch]">
            <span className="flex items-center gap-2">
              <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--gc-model)]" />
              <span className="text-[14px] font-medium tracking-[-0.015em]">GridCast AI</span>
            </span>
            <p className="mt-3 text-[12.5px] leading-[1.6] text-[var(--gc-ink-3)]">
              A personal engineering project by Hamid Aziz. Demand data © National Energy System
              Operator, Historic Demand Data 2024. Not affiliated with NESO or National Grid, and
              not intended for operational use.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--gc-ink-2)] transition-colors hover:text-[var(--gc-ink)]"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/hamid-aziz-05858a33b/"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--gc-ink-2)] transition-colors hover:text-[var(--gc-ink)]"
            >
              LinkedIn
            </a>
            <Link
              href="/dashboard"
              className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--gc-ink-2)] transition-colors hover:text-[var(--gc-ink)]"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
