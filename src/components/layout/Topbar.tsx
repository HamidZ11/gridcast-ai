import { Menu } from "lucide-react"

import { AppSearch } from "@/components/layout/AppSearch"

type TopbarProps = {
  onOpenSidebar?: () => void
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E8EDF5] bg-[#F6F8FB]/90 px-5 backdrop-blur md:px-8 lg:px-10 2xl:px-12">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          aria-label="Open navigation"
          className="grid size-9 place-items-center rounded-full border border-[#E8EDF5] bg-white text-[#64748B] shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#DDE5F0] hover:text-[#0F172A] hover:shadow-[0_16px_32px_rgba(15,23,42,0.07)] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35 xl:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="size-4" />
        </button>
        <AppSearch />
      </div>

      <div
        aria-label="Environment: Live Forecast"
        className="flex h-9 items-center gap-2 rounded-full border border-[#E8EDF5] bg-white px-3 text-[12px] font-semibold text-[#0F172A] shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
      >
        <span className="size-1.5 rounded-full bg-[#10B981]" />
        <span className="hidden sm:inline">Live Forecast</span>
      </div>
    </header>
  )
}
