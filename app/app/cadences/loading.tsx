export default function CadencesLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="h-4 w-40 rounded bg-slate-200" />
      <div className="mt-3 h-10 w-80 max-w-full rounded bg-slate-200" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div
            className="h-64 rounded-lg border border-slate-200 bg-white"
            key={item}
          />
        ))}
      </div>
    </div>
  );
}
