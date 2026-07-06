import {
  BatteryCharging,
  Building2,
  CloudSun,
  Factory,
  Gauge,
  Home,
  Thermometer,
  Wind,
} from "lucide-react"
import type { ComponentType } from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
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

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-[#334155]">
          <Icon className="size-3.5 text-[#64748B]" />
          {label}
        </span>
        <span className="tabular-nums text-[12px] font-bold text-[#0F172A]">{displayValue}</span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#E8EDF5] accent-[#2563EB]"
        style={{
          background: `linear-gradient(to right, #2563EB 0%, #2563EB ${progress}%, #E8EDF5 ${progress}%, #E8EDF5 100%)`,
        }}
      />
      <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-[#94A3B8]">
        <span>{min}{unit}</span>
        <span>{unit === "°C" ? "+" : ""}{max}{unit}</span>
      </div>
    </div>
  )
}

function ToggleControl({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-[12px] font-semibold text-[#334155]">
        <Building2 className="size-3.5 text-[#64748B]" />
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-10 cursor-pointer rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#2563EB]/35",
          checked ? "bg-[#2563EB]" : "bg-[#DCE3ED]"
        )}
      >
        <span
          className={cn(
            "absolute left-0 top-1 size-4 rounded-full bg-white shadow-[0_2px_6px_rgba(15,23,42,0.18)] transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  )
}

export function ScenarioControls({ inputs, onChange }: ScenarioControlsProps) {
  return (
    <Card className="xl:sticky xl:top-20">
      <CardHeader className="border-b border-[#E8EDF5] px-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-[10px] bg-[#F3F6FB] text-[#2563EB]">
            <Gauge className="size-4" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold leading-5 text-[#0F172A]">Scenario controls</h2>
            <p className="text-[11px] font-medium leading-4 text-[#64748B]">Changes apply instantly</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 px-5">
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
        <div className="space-y-3.5 border-t border-[#E8EDF5] pt-4">
          <ToggleControl
            label="Weekend"
            checked={inputs.weekend}
            onChange={(checked) => onChange("weekend", checked)}
          />
          <ToggleControl
            label="Bank Holiday"
            checked={inputs.bankHoliday}
            onChange={(checked) => onChange("bankHoliday", checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
