const colorMap = {
  indigo: 'bg-brand',
  brand: 'bg-brand',
  emerald: 'bg-emerald-500',
  orange: 'bg-orange-500',
  sky: 'bg-sky-500',
};

export default function ToggleSwitch({ label, checked, onChange, color = 'indigo' }) {
  const activeClass = checked ? colorMap[color] || colorMap.indigo : 'bg-slate-600';
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <span className="text-sm text-slate-200">{label}</span>
      <div
        className={`w-12 h-7 rounded-full transition-colors ${activeClass} relative`}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        <div
          className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </div>
    </label>
  );
}