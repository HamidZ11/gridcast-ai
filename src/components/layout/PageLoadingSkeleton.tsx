export function PageLoadingSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1880px] px-5 py-5 md:px-8 lg:px-10 lg:py-6 2xl:px-12">
      <div className="h-28 animate-pulse rounded-[18px] border border-[#E8EDF5] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.045)]" />
      <section className="mt-4 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[138px] animate-pulse rounded-[18px] border border-[#E8EDF5] bg-white" />
        ))}
      </section>
      <div className="mt-3.5 h-[520px] animate-pulse rounded-[18px] border border-[#E8EDF5] bg-white" />
    </main>
  )
}
