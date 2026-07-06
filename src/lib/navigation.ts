import type { ComponentType } from "react"
import {
  Activity,
  BarChart3,
  Bolt,
  BrainCircuit,
  CalendarClock,
  Gauge,
  Info,
  RadioTower,
} from "lucide-react"

export type NavigationItem = {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  keywords: string[]
}

export type NavigationSection = {
  label: string
  items: NavigationItem[]
}

export const navigationSections: NavigationSection[] = [
  {
    label: "Workspace",
    items: [
      {
        label: "Overview",
        icon: Gauge,
        href: "/dashboard",
        keywords: ["dashboard", "home", "demand", "kpi"],
      },
      {
        label: "Forecasts",
        icon: Activity,
        href: "/dashboard/forecast",
        keywords: ["analytics", "demand forecast", "heatmap", "decomposition"],
      },
      {
        label: "AI Insights",
        icon: BrainCircuit,
        href: "/dashboard/model-insights",
        keywords: ["model", "machine learning", "shap", "explainability"],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Grid Map",
        icon: Bolt,
        href: "/dashboard/grid-map",
        keywords: ["regions", "regional demand", "map", "telemetry"],
      },
      {
        label: "Scenarios",
        icon: BarChart3,
        href: "/dashboard/scenarios",
        keywords: ["simulation", "what if", "temperature", "demand"],
      },
      {
        label: "Schedules",
        icon: CalendarClock,
        href: "/dashboard/schedules",
        keywords: ["jobs", "training", "refresh", "operations"],
      },
    ],
  },
]

export const aboutNavigationItem: NavigationItem = {
  label: "About",
  icon: Info,
  href: "/dashboard/about",
  keywords: ["project", "technology", "system", "documentation"],
}

export const searchNavigationItems: NavigationItem[] = [
  ...navigationSections.flatMap((section) => section.items),
  {
    label: "Grid Signals",
    icon: RadioTower,
    href: "/dashboard/grid-map",
    keywords: ["grid map", "telemetry", "signals", "regional"],
  },
  aboutNavigationItem,
]
