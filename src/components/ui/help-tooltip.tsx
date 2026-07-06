"use client"

import { CircleHelp } from "lucide-react"
import { Tooltip } from "radix-ui"

import { cn } from "@/lib/utils"

type HelpTooltipProps = {
  content: string
  label?: string
  className?: string
  iconClassName?: string
  side?: "top" | "right" | "bottom" | "left"
}

export function HelpTooltip({
  content,
  label = "More information",
  className,
  iconClassName,
  side = "top",
}: HelpTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={180} skipDelayDuration={80}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label={label}
            className={cn(
              "inline-grid size-5 shrink-0 cursor-help place-items-center rounded-full text-[#94A3B8] transition-colors duration-150 hover:text-[#475569] focus-visible:text-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/30",
              className
            )}
          >
            <CircleHelp className={cn("size-3.5", iconClassName)} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={7}
            collisionPadding={12}
            className="z-[100] max-w-[300px] rounded-[10px] border border-[#E8EDF5] bg-white px-3 py-2 text-left text-[12px] font-medium normal-case leading-5 tracking-normal text-[#475569] shadow-[0_16px_40px_rgba(15,23,42,0.14)]"
          >
            {content}
            <Tooltip.Arrow className="fill-white" width={10} height={5} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
