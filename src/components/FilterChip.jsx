export default function FilterChip({ active, label, onClick, colorClass }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm font-semibold border transition-colors ${
        active ? `${colorClass} border-current` : 'bg-slate-800 border-slate-700 text-slate-200'
      }`}
    >
      {label}
    </button>
  );
}
