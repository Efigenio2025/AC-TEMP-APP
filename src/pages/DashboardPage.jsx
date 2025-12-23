import { useEffect, useMemo, useState } from 'react';
import { fetchLatestTempLogs, fetchNightTails } from '../db';
import { getTempStatus } from '../utils/status';
import FilterChip from '../components/FilterChip';
import TailCard from '../components/TailCard';
import Modal from '../components/Modal';

const statusFilters = [
  { key: 'cold', label: 'Cold', className: 'bg-red-900/70 text-red-200' },
  { key: 'normal', label: 'Normal', className: 'bg-green-900/70 text-green-200' },
  { key: 'above', label: 'Above Target', className: 'bg-orange-900/70 text-orange-200' },
  { key: 'critical', label: 'Critical Hot', className: 'bg-red-900/80 text-red-100 border border-red-700' },
];

export default function DashboardPage() {
  const [tails, setTails] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTail, setSelectedTail] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tailData, logData] = await Promise.all([fetchNightTails(), fetchLatestTempLogs()]);
      setTails(tailData);
      setLogs(logData);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const latestLogForTail = (tailNumber) =>
    [...logs]
      .filter((log) => log.tail_number === tailNumber)
      .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))[0];

  const tailsWithStatus = useMemo(
    () =>
      tails.map((tail) => {
        const latest = latestLogForTail(tail.tail_number);
        const status = getTempStatus(latest?.temp_f);
        return { tail, latest, status };
      }),
    [tails, logs],
  );

  const filtered = filters.length
    ? tailsWithStatus.filter(({ status }) => filters.includes(status.key))
    : tailsWithStatus;

  const counts = statusFilters.reduce((acc, f) => {
    acc[f.key] = tailsWithStatus.filter(({ status }) => status.key === f.key).length;
    return acc;
  }, {});

  const historicalByTail = useMemo(() => {
    const grouped = {};
    logs.forEach((log) => {
      if (!grouped[log.tail_number]) grouped[log.tail_number] = [];
      grouped[log.tail_number].push(log);
    });
    Object.values(grouped).forEach((arr) => arr.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at)));
    return grouped;
  }, [logs]);

  const renderChart = (tailNumber) => {
    const data = historicalByTail[tailNumber] || [];
    if (!data.length) return <p className="text-sm text-slate-400">No logs yet.</p>;
    const temps = data.map((d) => Number(d.temp_f));
    const min = Math.min(...temps) - 5;
    const max = Math.max(...temps) + 5;
    const points = data
      .map((d, idx) => {
        const x = (idx / Math.max(data.length - 1, 1)) * 100;
        const y = max === min ? 50 : 100 - ((Number(d.temp_f) - min) / (max - min)) * 100;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg viewBox="0 0 100 100" className="w-full h-32 bg-slate-900/70 rounded-lg border border-slate-800">
        <polyline fill="none" stroke="rgb(99, 102, 241)" strokeWidth="2" points={points} />
        {data.map((d, idx) => {
          const x = (idx / Math.max(data.length - 1, 1)) * 100;
          const y = max === min ? 50 : 100 - ((Number(d.temp_f) - min) / (max - min)) * 100;
          return <circle key={d.id} cx={x} cy={y} r={2} fill="white" />;
        })}
      </svg>
    );
  };

  return (
    <div className="py-6 space-y-6">
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase text-indigo-300">Snapshot</p>
            <h2 className="text-xl font-bold">Tonight's Temperature Status</h2>
          </div>
          <button
            onClick={loadData}
            className="text-sm px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <FilterChip
              key={filter.key}
              label={`${filter.label} (${counts[filter.key] || 0})`}
              colorClass={filter.className}
              active={filters.includes(filter.key)}
              onClick={() =>
                setFilters((prev) =>
                  prev.includes(filter.key)
                    ? prev.filter((f) => f !== filter.key)
                    : [...prev, filter.key],
                )
              }
            />
          ))}
          <FilterChip
            label="Clear Filters"
            colorClass="bg-slate-700 text-slate-100"
            active={filters.length === 0}
            onClick={() => setFilters([])}
          />
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Tonight's Aircraft</h3>
          <p className="text-sm text-slate-400">Tap a card for full detail</p>
        </div>
        {loading ? (
          <p className="text-slate-300">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(({ tail, latest }) => (
              <TailCard
                key={tail.id}
                tail={tail}
                latestTemp={latest}
                onClick={() => setSelectedTail({ tail, latest })}
              />
            ))}
            {filtered.length === 0 && (
              <p className="text-slate-400">No aircraft match the selected filters.</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Historical Temps – Tonight</h3>
          <p className="text-sm text-slate-400">All tails regardless of filters</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(historicalByTail).length === 0 && <p className="text-slate-400">No logs recorded yet.</p>}
          {Object.entries(historicalByTail).map(([tail, logs]) => (
            <div key={tail} className="border border-slate-800 rounded-lg p-3 bg-slate-900/50">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">{tail}</p>
                <p className="text-xs text-slate-400">{logs.length} logs</p>
              </div>
              {renderChart(tail)}
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={!!selectedTail}
        onClose={() => setSelectedTail(null)}
        title={selectedTail ? `${selectedTail.tail.tail_number} Details` : ''}
      >
        {selectedTail && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-400">Location</p>
                <p className="text-lg font-semibold">{selectedTail.tail.location}</p>
              </div>
              <div>
                <p className="text-slate-400">Heat Source</p>
                <p className="text-lg font-semibold">{selectedTail.tail.heat_source}</p>
              </div>
              <div>
                <p className="text-slate-400">Mark In</p>
                <p className="font-semibold">
                  {selectedTail.tail.marked_in_at
                    ? new Date(selectedTail.tail.marked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Pending'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Purge</p>
                <p className="font-semibold">
                  {selectedTail.tail.drained
                    ? `On @ ${selectedTail.tail.purged_at
                        ? new Date(selectedTail.tail.purged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}`
                    : 'Off'}
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Recent Logs</h4>
              <div className="space-y-2">
                {[...(historicalByTail[selectedTail.tail.tail_number] || [])]
                  .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
                  .slice(0, 6)
                  .map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-sm border border-slate-800 rounded-lg px-3 py-2">
                      <span className="font-semibold">{Number(log.temp_f).toFixed(1)}°F</span>
                      <span className="text-slate-400">{new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                {!(historicalByTail[selectedTail.tail.tail_number] || []).length && (
                  <p className="text-slate-400 text-sm">No logs yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
