export default function Home() {
  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Overview</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Welcome to Matariya OMS</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Dealer Master, Product Master, running orders, partial dispatch, reductions, and live pending production planning are ready.
        </p>
      </div>
    </div>
  );
}
