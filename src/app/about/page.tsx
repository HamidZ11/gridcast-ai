import {
  BookOpen,
  Database,
  ExternalLink,
  Info,
  Layers3,
  Server,
} from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getAboutPageData } from "@/lib/about-data"

const technologies = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "FastAPI",
  "scikit-learn",
  "SHAP",
  "Pandas",
  "NumPy",
]

const limitations = [
  "The production baseline currently uses historical demand and calendar features only.",
  "Live weather observations and forecasts are not yet integrated.",
  "Scenario variables without trained features use documented provisional adjustments.",
  "Regional map telemetry is deterministic and experimental until regional datasets are connected.",
]

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <CardHeader className="px-5 pt-5 md:px-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">{eyebrow}</p>
      <h2 className="mt-1 text-[22px] font-semibold leading-7 tracking-tight text-[#0F172A]">{title}</h2>
      {description ? (
        <p className="mt-1.5 max-w-3xl text-[12px] font-medium leading-5 text-[#64748B]">{description}</p>
      ) : null}
    </CardHeader>
  )
}

export default async function AboutPage() {
  const { machineLearning, system } = await getAboutPageData()

  return (
    <main className="mx-auto w-full max-w-[1880px] px-5 py-5 md:px-8 lg:px-10 lg:py-6 2xl:px-12">
      <header className="animate-enter">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.18em] text-[#64748B]">
          Product
        </p>
        <h1 className="mt-1 text-[40px] font-semibold leading-[0.98] tracking-tight text-[#0F172A]">
          About GridCast AI
        </h1>
        <p className="mt-2.5 max-w-3xl text-[15px] font-medium leading-6 text-[#64748B]">
          Architecture, data provenance, model scope, and current platform capabilities.
        </p>
      </header>

      <section className="mt-4">
        <Card className="animate-enter-slow">
          <CardContent className="grid gap-5 px-5 md:grid-cols-[auto_1fr] md:px-6">
            <div className="grid size-10 place-items-center rounded-[12px] bg-[#F3F6FB] text-[#2563EB]">
              <Info className="size-4.5" />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold leading-6 text-[#0F172A]">Electricity demand intelligence</h2>
              <p className="mt-2 max-w-5xl text-[13px] font-medium leading-6 text-[#64748B]">
                GridCast AI is a full-stack machine learning platform for short-term Great Britain electricity demand
                forecasting. It combines operational analytics, model evaluation, SHAP explainability, regional
                visualisation, and scenario analysis in one interface.
              </p>
              <p className="mt-2 text-[12px] font-medium leading-5 text-[#94A3B8]">
                This is a portfolio engineering demonstration. It is not an operational control system or a substitute
                for official NESO forecasting services.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-3.5">
        <Card>
          <SectionHeading
            eyebrow="Machine Learning"
            title="Production model foundation"
            description="Current values are read from the saved model metadata when the backend is available."
          />
          <CardContent className="grid gap-2.5 px-5 sm:grid-cols-2 lg:grid-cols-5 md:px-6">
            {machineLearning.map((item) => (
              <div key={item.label} className="rounded-[15px] border border-[#E8EDF5] bg-[#F8FAFD] p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#94A3B8]">{item.label}</p>
                <p className="mt-2.5 text-[13px] font-semibold leading-5 text-[#0F172A]">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-3.5 grid gap-3.5 xl:grid-cols-2">
        <Card>
          <SectionHeading eyebrow="System" title="Runtime information" />
          <CardContent className="grid gap-x-5 gap-y-4 px-5 sm:grid-cols-2 md:px-6">
            {system.map((item) => (
              <div key={item.label} className="border-t border-[#E8EDF5] pt-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#94A3B8]">{item.label}</p>
                <p className="mt-1.5 text-[13px] font-semibold text-[#0F172A]">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <SectionHeading eyebrow="Technology" title="Application stack" />
          <CardContent className="grid grid-cols-2 gap-x-5 gap-y-0 px-5 sm:grid-cols-3 md:px-6">
            {technologies.map((technology) => (
              <div key={technology} className="flex items-center gap-2 border-t border-[#E8EDF5] py-3">
                <Layers3 className="size-3.5 shrink-0 text-[#94A3B8]" />
                <span className="text-[12px] font-semibold text-[#334155]">{technology}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-3.5 grid gap-3.5 xl:grid-cols-2">
        <Card>
          <SectionHeading eyebrow="Data" title="NESO Historic Demand Data" />
          <CardContent className="space-y-3 px-5 md:px-6">
            {[
              ["Source", "National Energy System Operator Open Data Portal"],
              ["Licence", "NESO Open Data Licence"],
              ["Update cadence", "Published 21 days in arrears with retrospective corrections"],
              ["Training file", "Historic Demand Data 2024"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-6 border-t border-[#E8EDF5] pt-3">
                <span className="text-[11px] font-semibold text-[#64748B]">{label}</span>
                <span className="max-w-[70%] text-right text-[12px] font-semibold leading-5 text-[#0F172A]">{value}</span>
              </div>
            ))}
            <div className="flex flex-wrap gap-4 border-t border-[#E8EDF5] pt-3">
              <a
                href="https://www.neso.energy/data-portal/historic-demand-data"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2563EB] hover:underline"
              >
                Dataset source <ExternalLink className="size-3" />
              </a>
              <a
                href="https://www.neso.energy/data-portal/ngeso-open-licence"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2563EB] hover:underline"
              >
                Licence <ExternalLink className="size-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <SectionHeading eyebrow="Model Limitations" title="Current operating scope" />
          <CardContent className="space-y-3 px-5 md:px-6">
            {limitations.map((limitation) => (
              <div key={limitation} className="flex gap-3 border-t border-[#E8EDF5] pt-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#94A3B8]" />
                <p className="text-[12px] font-medium leading-5 text-[#475569]">{limitation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-3.5">
        <Card>
          <SectionHeading eyebrow="Resources" title="Project documentation" />
          <CardContent className="grid gap-2.5 px-5 md:grid-cols-3 md:px-6">
            {[
              { icon: BookOpen, label: "README", value: "README.md" },
              { icon: Database, label: "Documentation", value: "PROJECT_CONTEXT.md · ROADMAP.md" },
              { icon: Server, label: "GitHub repository", value: "Remote repository not configured" },
            ].map((resource) => (
              <div key={resource.label} className="flex items-start gap-3 rounded-[15px] border border-[#E8EDF5] bg-[#F8FAFD] p-3.5">
                <resource.icon className="mt-0.5 size-3.5 shrink-0 text-[#64748B]" />
                <div>
                  <p className="text-[11px] font-semibold text-[#334155]">{resource.label}</p>
                  <p className="mt-1 text-[11px] font-medium leading-4 text-[#94A3B8]">{resource.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
