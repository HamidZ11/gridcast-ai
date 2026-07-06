import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  Clock3,
  Code2,
  Cpu,
  Database,
  FileCode2,
  Gauge,
  GitBranch,
  Map,
  Network,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wrench,
} from "lucide-react"

import { LandingHeader } from "@/components/landing/LandingHeader"
import { Reveal } from "@/components/landing/Reveal"
import { ScreenshotFrame } from "@/components/landing/ScreenshotFrame"

const GITHUB_URL = "https://github.com/HamidZ11/gridcast-ai"

export const metadata: Metadata = {
  title: "GridCast AI | Electricity Demand Forecasting",
  description:
    "Explainable machine learning for short-term Great Britain electricity demand forecasting.",
}

const capabilities = [
  {
    icon: Clock3,
    title: "48-hour demand forecasting",
    description: "Recursive half-hourly inference with updated lag and rolling-demand features.",
  },
  {
    icon: ShieldCheck,
    title: "Forecast confidence intervals",
    description: "Point-level uncertainty bands derived from saved validation error.",
  },
  {
    icon: BrainCircuit,
    title: "SHAP explainability",
    description: "Local prediction contributions and global feature importance from the active model.",
  },
  {
    icon: SlidersHorizontal,
    title: "Interactive scenario simulation",
    description: "Model-backed what-if analysis for demand, generation, weather, and calendar assumptions.",
  },
  {
    icon: Map,
    title: "Regional demand analytics",
    description: "Great Britain regional layers for demand, stress, renewables, and carbon intensity.",
  },
  {
    icon: Server,
    title: "REST API backend",
    description: "Typed FastAPI endpoints for forecasts, model metadata, simulation, and explainability.",
  },
]

const productGroups = [
  {
    eyebrow: "Forecasting",
    title: "From historical demand to an operational forecast.",
    description:
      "A continuous 48-hour demand horizon built from half-hourly NESO observations and recursively updated model features.",
    bullets: ["48-hour prediction", "Historical comparison", "Peak demand detection", "Confidence intervals"],
    image: "/project_screenshots/Forecast.png",
    imageAlt: "GridCast AI forecast analytics and demand heatmap",
    imagePosition: "center",
  },
  {
    eyebrow: "Operations",
    title: "Demand signals organised for grid-level decisions.",
    description:
      "Operational views connect national forecasts, regional demand allocation, scenario assumptions, and model confidence.",
    bullets: ["Grid signals", "Regional map", "Operational monitoring", "Scenario simulation"],
    image: "/project_screenshots/Grid_Map.png",
    imageAlt: "GridCast AI Great Britain regional demand map",
    imagePosition: "center",
  },
  {
    eyebrow: "Explainability",
    title: "Model behaviour made inspectable.",
    description:
      "Saved validation metrics and SHAP contributions show which engineered features influence both the model globally and an individual forecast.",
    bullets: ["SHAP values", "Feature importance", "Forecast drivers", "Model insights"],
    image: "/project_screenshots/ModelInsights.png",
    imageAlt: "GridCast AI model metadata and performance dashboard",
    imagePosition: "center",
  },
]

const architecture = [
  { icon: Database, label: "NESO Dataset", detail: "Half-hourly demand" },
  { icon: Wrench, label: "Feature Engineering", detail: "Lags, rolling, time" },
  { icon: Cpu, label: "Model Training", detail: "Baseline estimators" },
  { icon: Gauge, label: "Model Evaluation", detail: "MAE, RMSE, MAPE, R²" },
  { icon: Server, label: "FastAPI API", detail: "Typed inference services" },
  { icon: BarChart3, label: "Next.js Dashboard", detail: "Interactive analytics" },
]

const stack = [
  "Python",
  "FastAPI",
  "scikit-learn",
  "SHAP",
  "Pandas",
  "NumPy",
  "Next.js",
  "TypeScript",
  "Tailwind",
  "Recharts",
]

const metrics = [
  { value: "17,232", label: "Historical observations" },
  { value: "30 min", label: "Sampling interval" },
  { value: "48 hrs", label: "Forecast horizon" },
  { value: "1.36%", label: "Validation MAPE" },
  { value: "11", label: "Engineered features" },
  { value: "Real", label: "SHAP explainability" },
  { value: "Live", label: "REST API" },
  { value: "Interactive", label: "Scenario engine" },
]

const documentation = [
  {
    icon: Network,
    title: "Architecture",
    description: "Project structure, service boundaries, and data flow.",
    href: `${GITHUB_URL}/blob/main/PROJECT_CONTEXT.md`,
  },
  {
    icon: GitBranch,
    title: "Machine Learning",
    description: "Ingestion, feature engineering, training, inference, and SHAP.",
    href: `${GITHUB_URL}/tree/main/backend/ml`,
  },
  {
    icon: FileCode2,
    title: "REST API",
    description: "FastAPI routes, Pydantic contracts, and model-backed services.",
    href: `${GITHUB_URL}/tree/main/backend/app`,
  },
  {
    icon: Code2,
    title: "GitHub Repository",
    description: "Source code, setup instructions, roadmap, and model limitations.",
    href: GITHUB_URL,
  },
]

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="max-w-[760px]">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#64748B]">{eyebrow}</p>
      <h2 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-tight text-[#0F172A] sm:text-[44px]">
        {title}
      </h2>
      <p className="mt-4 text-[15px] font-medium leading-7 text-[#64748B]">{description}</p>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      <LandingHeader />

      <main>
        <section
          className="relative isolate overflow-hidden px-5 pb-20 pt-36 md:px-8 md:pb-24 md:pt-40 lg:px-10 lg:pb-28 lg:pt-44"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.09) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        >
          <div className="absolute inset-0 -z-10 bg-[rgba(255,255,255,0.76)]" />
          <div className="mx-auto w-full max-w-[1480px]">
            <div className="mx-auto max-w-[1040px] text-center">
              <h1 className="text-[42px] font-semibold leading-[1.04] tracking-tight text-[#0F172A] sm:text-[60px] sm:leading-[1.02] lg:text-[74px]">
                Machine learning for short-term electricity demand forecasting.
              </h1>
              <p className="mx-auto mt-6 max-w-[820px] text-[16px] font-medium leading-7 text-[#64748B] md:text-[18px] md:leading-8">
                An end-to-end engineering project combining NESO historical data, trained forecasting models, SHAP
                explainability, interactive analytics, a FastAPI backend, and a Next.js frontend.
              </p>
              <div className="mx-auto mt-8 flex max-w-[360px] flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
                <Link
                  href="/dashboard"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#2563EB] px-5 text-[13px] font-semibold text-white shadow-[0_14px_32px_rgba(37,99,235,0.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-[0_18px_38px_rgba(37,99,235,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
                >
                  Launch Dashboard
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#DCE3ED] bg-white px-5 text-[13px] font-semibold text-[#334155] shadow-[0_10px_26px_rgba(15,23,42,0.055)] transition duration-200 hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:text-[#0F172A] hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
                >
                  <Code2 className="size-4" />
                  View GitHub
                </a>
              </div>
            </div>

            <figure className="mx-auto mt-14 max-w-[1320px] md:mt-16">
              <ScreenshotFrame
                src="/project_screenshots/Overview.png"
                alt="GridCast AI electricity demand forecasting overview"
                priority
                sizes="(max-width: 1024px) 100vw, 1320px"
              />
              <figcaption className="mt-3 flex items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
                <span>GridCast AI operational dashboard</span>
                <span className="hidden sm:inline">NESO Historic Demand Data 2024</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="border-y border-[#E8EDF5] bg-white px-5 py-20 md:px-8 md:py-24 lg:px-10">
          <Reveal className="mx-auto w-full max-w-[1320px]">
            <SectionHeading
              eyebrow="Capabilities"
              title="Platform capabilities"
              description="The complete forecasting workflow is exposed through focused analytical tools rather than disconnected model experiments."
            />
            <div className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((capability) => (
                <article
                  key={capability.title}
                  className="group rounded-[16px] border border-[#E8EDF5] bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#D7DEE9] hover:shadow-[0_20px_44px_rgba(15,23,42,0.07)]"
                >
                  <div className="grid size-9 place-items-center rounded-[10px] bg-[#F3F6FB] text-[#2563EB]">
                    <capability.icon className="size-4" />
                  </div>
                  <h3 className="mt-5 text-[16px] font-semibold leading-5 text-[#0F172A]">{capability.title}</h3>
                  <p className="mt-2 text-[12px] font-medium leading-5 text-[#64748B]">{capability.description}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="product" className="scroll-mt-16 bg-[#F6F8FB] px-5 py-20 md:px-8 md:py-28 lg:px-10">
          <div className="mx-auto w-full max-w-[1320px]">
            <Reveal>
              <SectionHeading
                eyebrow="Product"
                title="One system, organised by engineering capability."
                description="Forecast production, operational interpretation, and model explanation remain connected to the same saved artifacts and API contracts."
              />
            </Reveal>

            <div className="mt-16 space-y-24 md:mt-20 md:space-y-32">
              {productGroups.map((group, index) => (
                <Reveal
                  key={group.eyebrow}
                  className="grid items-center gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16"
                >
                  <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563EB]">
                      {group.eyebrow}
                    </p>
                    <h3 className="mt-3 text-[28px] font-semibold leading-[1.12] tracking-tight text-[#0F172A] sm:text-[34px]">
                      {group.title}
                    </h3>
                    <p className="mt-4 text-[14px] font-medium leading-7 text-[#64748B]">{group.description}</p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {group.bullets.map((bullet) => (
                        <div key={bullet} className="flex items-center gap-2.5 text-[12px] font-semibold text-[#334155]">
                          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#EAF1FF] text-[#2563EB]">
                            <Check className="size-3" />
                          </span>
                          {bullet}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={index % 2 === 1 ? "lg:order-1" : undefined}>
                    <ScreenshotFrame
                      src={group.image}
                      alt={group.imageAlt}
                      objectPosition={group.imagePosition}
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="architecture" className="scroll-mt-16 bg-white px-5 py-20 md:px-8 md:py-28 lg:px-10">
          <Reveal className="mx-auto w-full max-w-[1320px]">
            <SectionHeading
              eyebrow="Architecture"
              title="A traceable path from raw data to an interactive forecast."
              description="Each stage has a clear responsibility, typed boundary, and output that can be inspected independently."
            />

            <div className="mt-12 flex flex-col items-stretch gap-3 xl:flex-row xl:items-center">
              {architecture.map((stage, index) => (
                <div key={stage.label} className="contents">
                  <article className="min-w-0 flex-1 rounded-[14px] border border-[#E8EDF5] bg-[#F8FAFD] p-4">
                    <stage.icon className="size-4 text-[#2563EB]" />
                    <h3 className="mt-4 text-[12px] font-semibold leading-5 text-[#0F172A]">{stage.label}</h3>
                    <p className="mt-1 text-[10px] font-medium leading-4 text-[#64748B]">{stage.detail}</p>
                  </article>
                  {index < architecture.length - 1 ? (
                    <>
                      <ArrowDown className="mx-auto size-4 shrink-0 text-[#94A3B8] xl:hidden" />
                      <ArrowRight className="hidden size-4 shrink-0 text-[#94A3B8] xl:block" />
                    </>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-[#E8EDF5] pt-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Technology stack</p>
              <div className="mt-4 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-5">
                {stack.map((technology) => (
                  <div key={technology} className="flex items-center gap-2 border-b border-[#E8EDF5] py-3">
                    <Sparkles className="size-3 shrink-0 text-[#94A3B8]" />
                    <span className="text-[12px] font-semibold text-[#334155]">{technology}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section
          id="machine-learning"
          className="scroll-mt-16 border-y border-[#E8EDF5] bg-[#F6F8FB] px-5 py-20 md:px-8 md:py-28 lg:px-10"
        >
          <Reveal className="mx-auto w-full max-w-[1320px]">
            <SectionHeading
              eyebrow="Machine Learning"
              title="Measured as an engineering system."
              description="The platform reports dataset scale, model performance, forecast cadence, and explainability as first-class operational facts."
            />
            <div className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <article
                  key={metric.label}
                  className="min-h-[150px] rounded-[16px] border border-[#E8EDF5] bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,23,42,0.07)]"
                >
                  <p className="text-[31px] font-semibold leading-none tracking-tight text-[#0F172A]">{metric.value}</p>
                  <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748B]">{metric.label}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="documentation" className="scroll-mt-16 bg-white px-5 py-20 md:px-8 md:py-28 lg:px-10">
          <Reveal className="mx-auto w-full max-w-[1320px]">
            <SectionHeading
              eyebrow="Documentation"
              title="Follow the implementation, not just the interface."
              description="The repository documents the architecture, machine-learning workflow, API services, and known model limitations."
            />
            <div className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {documentation.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-h-[210px] flex-col rounded-[16px] border border-[#E8EDF5] bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#D7DEE9] hover:shadow-[0_20px_44px_rgba(15,23,42,0.07)]"
                >
                  <item.icon className="size-4 text-[#2563EB]" />
                  <h3 className="mt-8 text-[16px] font-semibold text-[#0F172A]">{item.title}</h3>
                  <p className="mt-2 text-[12px] font-medium leading-5 text-[#64748B]">{item.description}</p>
                  <ArrowRight className="mt-auto size-4 text-[#94A3B8] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#2563EB]" />
                </a>
              ))}
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[#E8EDF5] bg-[#F8FAFD] px-5 py-12 md:px-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[620px]">
            <span className="text-[14px] font-semibold">GridCast AI</span>
            <p className="mt-4 text-[12px] font-medium leading-6 text-[#64748B]">
              An end-to-end electricity demand forecasting platform built using machine learning, FastAPI and Next.js.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <div className="flex items-center gap-5">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-semibold text-[#475569] hover:text-[#0F172A]"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/hamid-aziz-05858a33b/"
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-semibold text-[#475569] hover:text-[#0F172A]"
              >
                LinkedIn
              </a>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
              © 2026 GridCast AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
