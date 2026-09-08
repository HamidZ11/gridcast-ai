export function PageLoadingSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 lg:px-8" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="h-14 animate-pulse rounded-[6px] bg-[var(--gc-surface-sunk)]" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[104px] animate-pulse rounded-[8px] bg-[var(--gc-surface-sunk)]" />
        ))}
      </div>
      <div className="mt-3 h-[460px] animate-pulse rounded-[8px] bg-[var(--gc-surface-sunk)]" />
    </main>
  )
}
