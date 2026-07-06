"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { searchNavigationItems, type NavigationItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function fuzzyScore(query: string, item: NavigationItem) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return 1

  const label = normalize(item.label)
  const searchable = normalize(`${item.label} ${item.keywords.join(" ")}`)
  if (label === normalizedQuery) return 120
  if (label.startsWith(normalizedQuery)) return 100 - (label.length - normalizedQuery.length)
  if (searchable.includes(normalizedQuery)) return 80 - searchable.indexOf(normalizedQuery)

  let queryIndex = 0
  let gapPenalty = 0
  let previousMatch = -1
  for (let index = 0; index < searchable.length && queryIndex < normalizedQuery.length; index += 1) {
    if (searchable[index] === normalizedQuery[queryIndex]) {
      if (previousMatch >= 0) gapPenalty += index - previousMatch - 1
      previousMatch = index
      queryIndex += 1
    }
  }
  return queryIndex === normalizedQuery.length ? Math.max(10, 55 - gapPenalty) : -1
}

export function AppSearch() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const results = useMemo(
    () =>
      searchNavigationItems
        .map((item) => ({ item, score: fuzzyScore(query, item) }))
        .filter((result) => result.score >= 0)
        .sort((left, right) => right.score - left.score || left.item.label.localeCompare(right.item.label))
        .slice(0, 8)
        .map((result) => result.item),
    [query]
  )

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  function navigate(item: NavigationItem) {
    setOpen(false)
    setQuery("")
    inputRef.current?.blur()
    router.push(item.href)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      setOpen(true)
      if (!results.length) return
      setActiveIndex((current) => {
        const direction = event.key === "ArrowDown" ? 1 : -1
        return (current + direction + results.length) % results.length
      })
      return
    }
    if (event.key === "Enter" && open && results[activeIndex]) {
      event.preventDefault()
      navigate(results[activeIndex])
    }
  }

  return (
    <div ref={containerRef} className="relative min-w-0 md:w-[360px]">
      <div
        className={cn(
          "flex min-w-0 items-center gap-2.5 rounded-full border bg-white px-3.5 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition duration-200",
          open
            ? "border-[#CBD5E1] shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
            : "border-[#E8EDF5] hover:border-[#DDE5F0] hover:shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
        )}
      >
        <Search className="size-4 shrink-0 text-[#64748B]" />
        <input
          ref={inputRef}
          value={query}
          type="search"
          role="combobox"
          aria-label="Search pages"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="gridcast-search-results"
          aria-activedescendant={open && results[activeIndex] ? `search-result-${activeIndex}` : undefined}
          placeholder="Search pages"
          className="h-4 min-w-0 flex-1 bg-transparent text-[12px] font-medium text-[#0F172A] outline-none placeholder:text-[#64748B] [&::-webkit-search-cancel-button]:hidden"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
            setOpen(true)
          }}
          onKeyDown={handleKeyDown}
        />
        <kbd className="hidden text-[9px] font-semibold text-[#94A3B8] md:block">ESC</kbd>
      </div>

      {open ? (
        <div
          id="gridcast-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[14px] border border-[#E8EDF5] bg-white p-1.5 shadow-[0_24px_65px_rgba(15,23,42,0.15)]"
        >
          {results.length ? (
            results.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  id={`search-result-${index}`}
                  key={`${item.label}-${item.href}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigate(item)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2 text-left transition-colors",
                    index === activeIndex ? "bg-[#F3F6FB] text-[#0F172A]" : "text-[#64748B] hover:bg-[#F8FAFD]"
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{item.label}</span>
                  <span className="text-[10px] font-medium text-[#94A3B8]">{item.href}</span>
                </button>
              )
            })
          ) : (
            <p className="px-3 py-4 text-center text-[12px] font-medium text-[#94A3B8]">No matching pages</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
