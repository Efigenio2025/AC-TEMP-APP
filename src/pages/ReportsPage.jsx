import { useEffect, useMemo, useState } from 'react';
import {
  defaultStation,
  fetchArchivedNotes,
  fetchArchivedTails,
  fetchArchivedTempLogs,
} from '../db';

const stationOptions = [
  { value: defaultStation, label: 'OMA' },
];

const ALL_TAILS = 'ALL';

function formatDisplayDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '—';
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start.toDateString() === end.toDateString()) return formatDisplayDate(startDate);
  return `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
}

function findRecorder(logsForTail = []) {
  const recorder = logsForTail.find((log) => log.recorded_by || log.recorder || log.created_by || log.user_email);
  return recorder?.recorded_by || recorder?.recorder || recorder?.created_by || recorder?.user_email || '—';
}

function summarizeTails(tails, logs) {
  const groupedTails = tails.reduce((acc, tail) => {
    if (!acc[tail.tail_number]) acc[tail.tail_number] = [];
    acc[tail.tail_number].push(tail);
    return acc;
  }, {});

  const groupedLogs = logs.reduce((acc, log) => {
    if (!acc[log.tail_number]) acc[log.tail_number] = [];
    acc[log.tail_number].push(log);
    return acc;
  }, {});

  return Object.entries(groupedTails)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tailNumber, tailRecords]) => {
      const nights = [...new Set(tailRecords.map((t) => t.night_date))].sort();
      const latestTail = [...tailRecords].sort((a, b) => new Date(b.night_date) - new Date(a.night_date))[0];
      const logsForTail = groupedLogs[tailNumber] || [];
      const avgTemp =
        logsForTail.length > 0
          ? logsForTail.reduce((sum, log) => sum + Number(log.temp_f || 0), 0) / logsForTail.length
          : null;
      const purgedStatus =
        latestTail?.drained || latestTail?.purged_at
          ? `Purged ${latestTail?.purged_at ? new Date(latestTail.purged_at).toLocaleString() : ''}`.trim()
          : 'Not purged';

      return {
        tailNumber,
        dateLabel: nights.length > 1 ? `${formatDisplayDate(nights[0])} – ${formatDisplayDate(nights[nights.length - 1])}` : formatDisplayDate(nights[0]),
        heatSource: latestTail?.heat_source || '—',
        recordedBy: findRecorder(logsForTail),
        averageTemp: avgTemp,
        purgedStatus,
        nights,
        logs: logsForTail,
      };
    });
}

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [station, setStation] = useState(defaultStation);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [tailNumber, setTailNumber] = useState(ALL_TAILS);
  const [includeTempLogs, setIncludeTempLogs] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tails, setTails] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tailOptions, setTailOptions] = useState([]);
  const [ranReport, setRanReport] = useState(false);

  const summaryRows = useMemo(() => summarizeTails(tails, logs), [tails, logs]);

  const totals = useMemo(() => {
    const allTemps = logs.map((log) => Number(log.temp_f || 0));
    const average =
      allTemps.length > 0 ? allTemps.reduce((sum, temp) => sum + temp, 0) / allTemps.length : null;
    const purgedCount = tails.filter((tail) => tail.drained || tail.purged_at).length;
    return { average, purgedCount, totalTails: summaryRows.length };
  }, [logs, tails, summaryRows.length]);

  const loadTailOptions = async () => {
    if (!startDate || !endDate) return;
    try {
      const archiveTails = await fetchArchivedTails({ station, startDate, endDate, tailNumber: ALL_TAILS });
      const uniqueTails = [...new Set(archiveTails.map((t) => t.tail_number))].sort();
      setTailOptions(uniqueTails);
      // Preserve selection only if still available
      if (tailNumber !== ALL_TAILS && !uniqueTails.includes(tailNumber)) {
        setTailNumber(ALL_TAILS);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    loadTailOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, station]);

  const handleRunReport = async () => {
    if (!startDate || !endDate) {
      setError('Select a start and end date.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be on or before the end date.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [archiveTails, archiveLogs, archiveNotes] = await Promise.all([
        fetchArchivedTails({ station, startDate, endDate, tailNumber }),
        fetchArchivedTempLogs({ station, startDate, endDate, tailNumber }),
        includeNotes ? fetchArchivedNotes({ station, startDate, endDate, tailNumber }) : Promise.resolve([]),
      ]);
      setTails(archiveTails);
      setLogs(archiveLogs);
      setNotes(includeNotes ? archiveNotes : []);
      const uniqueTails = [...new Set(archiveTails.map((t) => t.tail_number))].sort();
      setTailOptions(uniqueTails);
      setRanReport(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!summaryRows.length) return;
    const headers = ['Tail Number', 'Date Range', 'Heat Source', 'Average Temperature (°F)', 'Recorded By', 'Purged Status'];
    const rows = summaryRows.map((row) => [
      row.tailNumber,
      row.dateLabel,
      row.heatSource,
      row.averageTemp !== null && row.averageTemp !== undefined ? row.averageTemp.toFixed(1) : '',
      row.recordedBy,
      row.purgedStatus,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `oma-aircraft-temps-report-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const previewMetadata = [
    { label: 'Station', value: station },
    { label: 'Date Range', value: formatDateRange(startDate, endDate) },
    { label: 'Tail Selection', value: tailNumber === ALL_TAILS ? 'All Tail Numbers' : tailNumber },
    { label: 'Include Temp Logs', value: includeTempLogs ? 'Yes' : 'No' },
    { label: 'Include Notes', value: includeNotes ? 'Yes' : 'No' },
  ];

  return (
    <div className="py-6 space-y-6">
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase text-brand">Archive</p>
            <h2 className="text-xl font-bold">Reports</h2>
            <p className="text-sm text-slate-400">Historical, read-only exports from archived nights.</p>
          </div>
          <div className="flex gap-2 print-hidden">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!summaryRows.length}
              className="px-3 py-2 rounded-lg text-sm font-semibold border bg-slate-900 border-slate-700 text-slate-100 disabled:opacity-60"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!summaryRows.length}
              className="px-3 py-2 rounded-lg text-sm font-semibold border bg-brand text-slate-900 border-brand disabled:opacity-60"
            >
              Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-300">Station</label>
            <select
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
              value={station}
              onChange={(e) => setStation(e.target.value)}
            >
              {stationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-300">Start Date *</label>
            <input
              type="date"
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-300">End Date *</label>
            <input
              type="date"
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-300">Tail Number</label>
            <select
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2"
              value={tailNumber}
              onChange={(e) => setTailNumber(e.target.value)}
            >
              <option value={ALL_TAILS}>All Tail Numbers</option>
              {tailOptions.map((tail) => (
                <option key={tail} value={tail}>
                  {tail}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400">Options populate from archive data in the selected date range.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                className="rounded border-slate-600 bg-slate-900"
                checked={includeTempLogs}
                onChange={(e) => setIncludeTempLogs(e.target.checked)}
              />
              Include Temperature Logs
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                className="rounded border-slate-600 bg-slate-900"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
              />
              Include Notes
            </label>
          </div>
          <div className="flex items-end justify-start">
            <button
              type="button"
              onClick={handleRunReport}
              disabled={loading}
              className="w-full md:w-auto px-4 py-3 rounded-lg bg-brand text-slate-900 font-semibold hover:bg-brand-dark transition-colors print-hidden"
            >
              {loading ? 'Running…' : 'Run Report'}
            </button>
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </div>

      {ranReport && (
        <>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow print-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase text-brand">Summary</p>
                <h3 className="text-lg font-semibold">On-screen review</h3>
              </div>
              <p className="text-xs text-slate-400">{summaryRows.length} tail(s)</p>
            </div>
            {summaryRows.length === 0 ? (
              <p className="text-slate-300">No archive records for this selection.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-slate-400">
                    <tr>
                      <th className="py-2">Tail Number</th>
                      <th>Date(s) Covered</th>
                      <th>Heat Source</th>
                      <th>Average Temp</th>
                      <th>Recorded By</th>
                      <th>Purged Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {summaryRows.map((row) => (
                      <tr key={row.tailNumber} className="hover:bg-slate-900/60">
                        <td className="py-2 font-semibold">{row.tailNumber}</td>
                        <td>{row.dateLabel}</td>
                        <td>{row.heatSource}</td>
                        <td>{row.averageTemp !== null && row.averageTemp !== undefined ? `${row.averageTemp.toFixed(1)}°F` : '—'}</td>
                        <td>{row.recordedBy}</td>
                        <td>{row.purgedStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="text-slate-200 font-semibold border-t border-slate-700">
                    <tr>
                      <td className="py-2">Totals</td>
                      <td colSpan="1">{summaryRows.length} aircraft</td>
                      <td />
                      <td>{totals.average !== null ? `${totals.average.toFixed(1)}°F avg` : '—'}</td>
                      <td />
                      <td>
                        {totals.purgedCount} purged / {totals.totalTails} total
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow print-area">
            <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-800">
              <div>
                <p className="text-xs uppercase text-brand">Printable Preview</p>
                <h3 className="text-2xl font-bold">OMA | Aircraft Temps Report</h3>
                <p className="text-sm text-slate-300">Archived, read-only snapshot</p>
              </div>
              <div className="text-right text-sm text-slate-300">
                <p className="font-semibold">{formatDateRange(startDate, endDate)}</p>
                <p className="text-slate-400">Station: {station}</p>
              </div>
            </div>
            <div className="p-4 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              {previewMetadata.map((item) => (
                <div key={item.label} className="bg-slate-800/70 rounded-lg border border-slate-700 px-3 py-2">
                  <p className="text-slate-400">{item.label}</p>
                  <p className="font-semibold text-slate-100">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="p-4 space-y-4">
              {summaryRows.length === 0 && <p className="text-slate-300">No archive data in this range.</p>}
              {summaryRows.map((row) => {
                const logsForTail = includeTempLogs ? row.logs : [];
                const notesForTail = includeNotes ? notes.filter((n) => n.tail_number === row.tailNumber) : [];
                return (
                  <div key={row.tailNumber} className="border border-slate-800 rounded-lg overflow-hidden">
                    <div className="bg-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase text-brand">Tail</p>
                        <h4 className="text-xl font-bold">{row.tailNumber}</h4>
                        <p className="text-slate-300 text-sm">{row.dateLabel}</p>
                      </div>
                      <div className="text-sm text-slate-200 space-y-1">
                        <p>Heat Source: <span className="font-semibold">{row.heatSource}</span></p>
                        <p>Average Temp: <span className="font-semibold">{row.averageTemp !== null && row.averageTemp !== undefined ? `${row.averageTemp.toFixed(1)}°F` : '—'}</span></p>
                        <p>Recorded By: <span className="font-semibold">{row.recordedBy}</span></p>
                        <p>Purged: <span className="font-semibold">{row.purgedStatus}</span></p>
                      </div>
                    </div>
                    {includeTempLogs && (
                      <div className="px-4 py-3 border-t border-slate-800">
                        <p className="text-sm font-semibold text-slate-200 mb-3">Temperature Logs ({logsForTail.length})</p>
                        {logsForTail.length === 0 ? (
                          <p className="text-slate-400 text-sm">No logs recorded.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/70">
                            <table className="min-w-full text-sm text-left">
                              <thead className="bg-slate-800/60 text-slate-300">
                                <tr>
                                  <th className="px-3 py-2 font-semibold">Temperature (°F)</th>
                                  <th className="px-3 py-2 font-semibold">Recorded At</th>
                                  <th className="px-3 py-2 font-semibold">Recorded By</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800 text-slate-100">
                                {logsForTail
                                  .slice()
                                  .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
                                  .map((log) => (
                                    <tr key={log.id || `${log.tail_number}-${log.recorded_at}`} className="hover:bg-slate-900/60">
                                      <td className="px-3 py-2 font-semibold">{Number(log.temp_f).toFixed(1)}°F</td>
                                      <td className="px-3 py-2 text-slate-200">
                                        {new Date(log.recorded_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </td>
                                      <td className="px-3 py-2 text-slate-300">
                                        {log.recorded_by || log.recorder || log.user_email || '—'}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                    {includeNotes && (
                      <div className="px-4 py-3 border-t border-slate-800">
                        <p className="text-sm font-semibold text-slate-200 mb-2">Notes ({notesForTail.length})</p>
                        {notesForTail.length === 0 ? (
                          <p className="text-slate-400 text-sm">No notes recorded.</p>
                        ) : (
                          <div className="space-y-2 text-sm">
                            {notesForTail.map((note) => (
                              <div key={note.id || note.created_at} className="bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-2">
                                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                  <span>{note.tail_number}</span>
                                  <span>{new Date(note.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-slate-100 whitespace-pre-wrap">{note.note}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-800 flex flex-wrap justify-between items-center gap-3 print-hidden">
              <p className="text-sm text-slate-400">Preview matches print layout. Buttons and filters are hidden when printing.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={!summaryRows.length}
                  className="px-3 py-2 rounded-lg text-sm font-semibold border bg-slate-900 border-slate-700 text-slate-100 disabled:opacity-60"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={!summaryRows.length}
                  className="px-3 py-2 rounded-lg text-sm font-semibold border bg-brand text-slate-900 border-brand disabled:opacity-60"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
