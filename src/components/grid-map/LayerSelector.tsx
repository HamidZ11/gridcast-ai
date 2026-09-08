import type { RegionalLayer } from "@/lib/regional-data"
import { regionalLayerOptions } from "@/lib/regional-data"
import { cn } from "@/lib/utils"

export function LayerSelector({
  value,
  onChange,
}: {
  value: RegionalLayer
  onChange: (value: RegionalLayer) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Map layer"
      className="gc-scroll-x -mx-1 flex max-w-full items-center gap-px px-1"
    >
      {regionalLayerOptions.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-7 shrink-0 cursor-pointer whitespace-nowrap rounded-[5px] border px-2.5 text-[12px] transition-colors duration-150",
              active
                ? "border-[var(--gc-rule-strong)] bg-[var(--gc-surface-sunk)] text-[var(--gc-ink)]"
                : "border-transparent text-[var(--gc-ink-2)] hover:bg-[var(--gc-surface-sunk)] hover:text-[var(--gc-ink)]"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
