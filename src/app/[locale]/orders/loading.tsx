export default function OrdersLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="h-5 w-16 rounded bg-white/10 animate-pulse mb-8" />
      <div className="h-8 w-40 rounded bg-white/10 animate-pulse mb-8" />
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-surface border border-border animate-pulse" />
        ))}
      </div>
    </div>
  );
}
