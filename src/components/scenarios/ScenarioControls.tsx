import {
  BatteryCharging,
  CalendarDays,
  CloudSun,
  Factory,
  Home,
  Thermometer,
  Wind,
} from "lucide-react"
import type { ComponentType } from "react"

import { Note, Panel, PanelHeader } from "@/components/ui/primitives"
import type { ScenarioInputs } from "@/lib/scenario-engine"
import { cn } from "@/lib/utils"

type ScenarioControlsProps = {
  inputs: ScenarioInputs
  onChange: <Key extends keyof ScenarioInputs>(key: Key, value: ScenarioInputs[Key]) => void
}

type RangeControlProps = {
  icon: ComponentType<{ className?: string }>
  label: string
  min: number
  max: number
  value: number
  unit: string
  onChange: (value: number) => void
}

function RangeControl({ icon: Icon, label, min, max, value, unit, onChange }: RangeControlProps) {
  const progress = ((value - min) / (max - min)) * 100
  const displayValue = `${unit === "°C" && value > 0 ? "+" : ""}${value}${unit}`
  const changed = unit === "°C" ? value !== 0 : value !== 100

  return (
    <div className="border-t border-[var(--gc-rule)] px-4 py-3 first:border-t-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[12.5px] text-[var(--gc-ink-2)]">
          <Icon className="size-3.5 shrink-0 text-[var(--gc-ink-3)]" />
          {label}
        </span>
        <span
          className={cn(
            "font-mono text-[12px] tabular-nums",
            changed ? "text-[var(--gc-model)]" : "text-[var(--gc-ink)]"
          )}
        >
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        aria-label={`${label}, ${displayValue}`}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full accent-[var(--gc-ink)]"
        style={{
          background: `linear-gradient(to right, var(--gc-ink-2) 0%, var(--gc-ink-2) ${progress}%, var(--gc-surface-sunk) ${progress}%, var(--gc-surface-sunk) 100%)`,
        }}
      />
      <div className="mt-1 flex justify-between font-mono text-[9.5px] tabular-nums text-[var(--gc-ink-3)]">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {unit === "°C" ? "+" : ""}
          {max}
          {unit}
        </span>
      </div>
    </div>
  )
}

function ToggleControl({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--gc-rule)] px-4 py-2.5">
      <span className="flex items-center gap-1.5 text-[12.5px] text-[var(--gc-ink-2)]">
        <Icon className="size-3.5 shrink-0 text-[var(--gc-ink-3)]" />
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-150",
          checked ? "bg-[var(--gc-ink)]" : "bg-[var(--gc-surface-sunk)] ring-1 ring-inset ring-[var(--gc-rule-strong)]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow-[0_1px_3px_rgba(20,22,26,0.2)] transition-transform duration-150",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  )
}

export function ScenarioControls({ inputs, onChange }: ScenarioControlsProps) {
  return (
    <Panel className="xl:sticky xl:top-16">
      <PanelHeader eyebrow="Inputs" title="Assumptions" note="The forecast re-runs as you change a control." />
      <RangeControl
        icon={Thermometer}
        label="Temperature anomaly"
        min={-10}
        max={10}
        value={inputs.temperatureAnomaly}
        unit="°C"
        onChange={(value) => onChange("temperatureAnomaly", value)}
      />
      <RangeControl
        icon={Wind}
        label="Wind generation"
        min={0}
        max={150}
        value={inputs.windGeneration}
        unit="%"
        onChange={(value) => onChange("windGeneration", value)}
      />
      <RangeControl
        icon={CloudSun}
        label="Solar generation"
        min={0}
        max={150}
        value={inputs.solarGeneration}
        unit="%"
        onChange={(value) => onChange("solarGeneration", value)}
      />
      <RangeControl
        icon={BatteryCharging}
        label="EV charging demand"
        min={0}
        max={150}
        value={inputs.evChargingDemand}
        unit="%"
        onChange={(value) => onChange("evChargingDemand", value)}
      />
      <RangeControl
        icon={Factory}
        label="Industrial demand"
        min={0}
        max={150}
        value={inputs.industrialDemand}
        unit="%"
        onChange={(value) => onChange("industrialDemand", value)}
      />
      <RangeControl
        icon={Home}
        label="Residential demand"
        min={0}
        max={150}
        value={inputs.residentialDemand}
        unit="%"
        onChange={(value) => onChange("residentialDemand", value)}
      />
      <ToggleControl
        icon={CalendarDays}
        label="Weekend"
        checked={inputs.weekend}
        onChange={(checked) => onChange("weekend", checked)}
      />
      <ToggleControl
        icon={CalendarDays}
        label="Bank holiday"
        checked={inputs.bankHoliday}
        onChange={(checked) => onChange("bankHoliday", checked)}
      />
      <Note className="border-t border-[var(--gc-rule)] px-4 py-2.5">
        None of these are model features. Each one applies a documented sensitivity adjustment on top
        of the baseline forecast.
      </Note>
    </Panel>
  )
}
