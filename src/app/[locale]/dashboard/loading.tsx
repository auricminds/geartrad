export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="h-8 w-48 rounded bg-white/10 animate-pulse mb-8" />
      <div className="flex gap-3 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-xl bg-white/10 animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-surface border border-border animate-pulse" />
        ))}
      </div>
    </div>
  );
}
