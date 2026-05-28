export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-white/10 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-36 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-surface border border-border animate-pulse" />
        ))}
      </div>
    </div>
  );
}
