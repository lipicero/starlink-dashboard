export default function Loading() {
  return (
    <div className="min-h-screen bg-[#020205] p-6 text-zinc-100 relative overflow-hidden">
      <div className="mx-auto max-w-7xl space-y-8 relative z-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4 animate-pulse">
          <div className="h-8 w-48 bg-white/5 rounded-lg" />
          <div className="h-10 w-64 bg-white/5 rounded-2xl" />
        </header>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 h-[520px] bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
          <div className="space-y-4">
            <div className="h-64 bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
            <div className="h-64 bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
