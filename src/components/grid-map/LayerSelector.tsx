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
    <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-[11px] border border-[#E8EDF5] bg-white p-1 shadow-[0_8px_20px_rgba(15,23,42,0.035)]">
      {regionalLayerOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-8 shrink-0 cursor-pointer rounded-[8px] px-3 text-[11px] font-semibold transition duration-200 focus-visible:ring-2 focus-visible:ring-[#2563EB]/35",
            value === option.value
              ? "bg-[#F3F6FB] text-[#0F172A] shadow-[inset_0_0_0_1px_rgba(232,237,245,0.9)]"
              : "text-[#64748B] hover:bg-[#F8FAFD] hover:text-[#334155]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
