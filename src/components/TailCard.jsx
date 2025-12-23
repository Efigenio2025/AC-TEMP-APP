import { getTempStatus, statusToGlow } from '../utils/status';

export default function TailCard({ tail, latestTemp, latestTime, onClick }) {
  const status = getTempStatus(latestTemp?.temp_f);
  const glow = statusToGlow(status.key);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border border-slate-700 bg-slate-800/60 p-4 text-left hover:border-indigo-500 transition relative ${
        glow
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs uppercase text-indigo-300">Tail</p>
          <p className="text-lg font-bold">{tail.tail_number}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${status.badge}`}>{status.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
        <div>
          <p className="text-slate-400">Location</p>
          <p className="font-semibold">{tail.location}</p>
        </div>
        <div>
          <p className="text-slate-400">Heat</p>
          <p className="font-semibold">{tail.heat_source}</p>
        </div>
        <div>
          <p className="text-slate-400">Last Temp</p>
          <p className="font-semibold">{latestTemp?.temp_f ?? '—'}</p>
        </div>
        <div>
          <p className="text-slate-400">Last Time</p>
          <p className="font-semibold">{latestTemp ? new Date(latestTemp.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
        <span className={`px-2 py-1 rounded ${tail.marked_in_at ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
          {tail.marked_in_at ? 'Marked In' : 'Not Marked In'}
        </span>
        <span className={`px-2 py-1 rounded ${tail.drained ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
          {tail.drained ? `Purged @ ${tail.purged_at ? new Date(tail.purged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}` : 'Purge Pending'}
        </span>
      </div>
    </button>
  );
}
