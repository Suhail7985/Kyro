export default function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="text-xl sm:text-2xl font-bold text-brand-600">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
