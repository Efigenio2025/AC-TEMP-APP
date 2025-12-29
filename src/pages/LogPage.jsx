import { useEffect, useMemo, useState } from 'react';
import {
  fetchLatestTempLogs,
  fetchNightTails,
  insertTempLog,
  fetchNotes,
  insertNote,
  markInTail,
  togglePurge,
  updateHeatSource,
  updateHeaterMode,
  dispatchAircraft,
} from '../db';
import { heatSources, heaterModes } from '../utils/constants';
import { getTempStatus } from '../utils/status';
import ToggleSwitch from '../components/ToggleSwitch';

export default function LogPage() {
  const [tails, setTails] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [heatOverride, setHeatOverride] = useState('');
  const [heaterMode, setHeaterMode] = useState(heaterModes[0]);
  const [tempF, setTempF] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [markingIn, setMarkingIn] = useState(false);
  const [purgingId, setPurgingId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const selectedTail = useMemo(() => tails.find((t) => t.id === selectedId), [tails, selectedId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tailData, logData, noteData] = await Promise.all([fetchNightTails(), fetchLatestTempLogs(), fetchNotes()]);
      setTails(tailData);
      setLogs(logData);
      setNotes(noteData);
      setError('');
      if (tailData.length && !selectedId) setSelectedId(tailData[0].id);
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

  useEffect(() => {
    if (selectedTail) {
      setHeatOverride(selectedTail.heat_source);
      setHeaterMode(selectedTail.heater_mode || heaterModes[0]);
    }
  }, [selectedTail]);

  const handleAddNote = async () => {
    if (!selectedTail || !noteText.trim()) return;
    setSavingNote(true);
    try {
      await insertNote({ tail_number: selectedTail.tail_number, note: noteText.trim() });
      setNoteText('');
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTail) return;
    if (!tempF) {
      setError('Enter a temperature');
      return;
    }
    setSubmitting(true);
    try {
      if (heatOverride && heatOverride !== selectedTail.heat_source) {
        await updateHeatSource(selectedTail.id, heatOverride);
      }
      if (heaterMode && heaterMode !== selectedTail.heater_mode) {
        await updateHeaterMode(selectedTail.id, heaterMode);
      }
      await insertTempLog({ tail_number: selectedTail.tail_number, temp_f: Number(tempF) });
      setTempF('');
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkIn = async () => {
    if (!selectedTail || selectedTail.marked_in_at) return;
    setMarkingIn(true);
    try {
      await markInTail(selectedTail.id);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setMarkingIn(false);
    }
  };

  const handlePurgeToggle = async () => {
    if (!selectedTail) return;
    setPurgingId(selectedTail.id);
    try {
      await togglePurge(selectedTail.id, !selectedTail.drained);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setPurgingId(null);
    }
  };

  const handleDispatch = async () => {
    if (!selectedTail) return;
    const confirmed = window.confirm(
      `Dispatch ${selectedTail.tail_number}? This archives tonight's logs + notes and removes the aircraft from active lists.`,
    );
    if (!confirmed) return;
    setDispatching(true);
    try {
      await dispatchAircraft(selectedTail.tail_number);
      setSelectedId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setDispatching(false);
    }
  };

  const latestForTail = (tailNumber) =>
    [...logs]
      .filter((log) => log.tail_number === tailNumber)
      .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))[0];

  const status = selectedTail ? getTempStatus(latestForTail(selectedTail.tail_number)?.temp_f) : null;

  return (
    <div className="py-6 space-y-4">
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase text-brand">On-the-go</p>
            <h2 className="text-xl font-bold">Log Temperature</h2>
          </div>
          <button
            className="text-sm px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600"
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-300">Aircraft *</label>
              <select
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-indigo-500"
                value={selectedId || ''}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {tails.map((tail) => (
                  <option key={tail.id} value={tail.id}>
                    {tail.tail_number} — {tail.location}
                  </option>
                ))}
              </select>
              {loading && <p className="text-xs text-slate-400">Loading tonight's aircraft…</p>}
              <div className="flex gap-2 overflow-x-auto pt-1 pb-1 -mx-1 px-1">
                {tails.map((tail) => (
                  <button
                    key={tail.id}
                    type="button"
                    onClick={() => setSelectedId(tail.id)}
                    className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap border ${
                      selectedId === tail.id ? 'bg-brand text-slate-900 border-brand' : 'bg-slate-900 border-slate-700 text-slate-200'
                    }`}
                  >
                    {tail.tail_number}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-400">Location</p>
                <p className="text-lg font-semibold">{selectedTail?.location ?? '—'}</p>
              </div>
              <div>
                <p className="text-slate-400">Heat Source</p>
                <select
                  className="mt-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 w-full"
                  value={heatOverride}
                  onChange={(e) => setHeatOverride(e.target.value)}
                >
                  {heatSources.map((heat) => (
                    <option key={heat}>{heat}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400">Heater Mode</p>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {heaterModes.map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setHeaterMode(mode)}
                      className={`px-3 py-2 rounded-lg text-sm border uppercase ${
                        heaterMode === mode
                          ? 'bg-brand text-slate-900 border-brand'
                          : 'bg-slate-900 border-slate-700 text-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {selectedTail && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
                <p className="text-slate-400">Mark-In</p>
                <button
                  type="button"
                  onClick={handleMarkIn}
                  disabled={!!selectedTail.marked_in_at || markingIn}
                  className={`mt-2 w-full px-3 py-2 rounded-lg font-semibold ${
                    selectedTail.marked_in_at
                      ? 'bg-green-600 hover:bg-green-500'
                      : 'bg-yellow-500 text-slate-900 hover:bg-yellow-400'
                  }`}
                >
                  {selectedTail.marked_in_at
                    ? `Marked at ${new Date(selectedTail.marked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : markingIn
                    ? 'Marking…'
                    : 'Mark In Now'}
                </button>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
                <p className="text-slate-400">Purge</p>
                <div className="mt-2">
                  <ToggleSwitch
                    label={selectedTail.drained ? 'Purged' : 'Off'}
                    checked={!!selectedTail.drained}
                    onChange={handlePurgeToggle}
                    color="emerald"
                  />
                  {selectedTail.purged_at && (
                    <p className="text-xs text-emerald-300 mt-1">
                      {new Date(selectedTail.purged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {purgingId === selectedTail.id && <p className="text-xs text-slate-400">Saving…</p>}
                </div>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
                <p className="text-slate-400">Status</p>
                <div className="mt-2">
                  <p className={`text-lg font-bold ${status?.color}`}>{status?.label ?? '—'}</p>
                  <p className="text-xs text-slate-400">Auto-updates from latest log</p>
                </div>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
                <p className="text-slate-400">Dispatch</p>
                <p className="text-xs text-slate-400 mb-2">Move tonight&apos;s records to archive and hide from dashboards.</p>
                <button
                  type="button"
                  onClick={handleDispatch}
                  disabled={dispatching}
                  className="mt-1 w-full px-3 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-60"
                >
                  {dispatching ? 'Dispatching…' : `Dispatch ${selectedTail.tail_number}`}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-slate-300">Temperature (°F) *</label>
              <input
                type="number"
                step="0.1"
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-indigo-500"
                value={tempF}
                onChange={(e) => setTempF(e.target.value)}
                placeholder="75.0"
              />
            </div>
            <div className="text-sm text-slate-400">
              <p>Cold: below 69.9°F</p>
              <p>Normal: 70–80.9°F</p>
              <p>Above Target: 81–89.9°F</p>
              <p>Critical: 90°F+</p>
            </div>
            <button
              type="submit"
              className="px-4 py-3 rounded-lg bg-brand hover:bg-brand-dark font-semibold w-full text-slate-900"
              disabled={submitting || !selectedTail}
            >
              {submitting ? 'Submitting…' : 'Submit Temp Log'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Notes</h3>
          <p className="text-sm text-slate-400">Stored in Supabase with tonight's date</p>
        </div>
        <div className="space-y-3">
          <textarea
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-indigo-500"
            rows="3"
            placeholder={selectedTail ? `Note for ${selectedTail.tail_number}` : 'Select an aircraft first'}
            disabled={!selectedTail}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <button
            type="button"
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold disabled:opacity-50"
            disabled={!selectedTail || savingNote || !noteText.trim()}
            onClick={handleAddNote}
          >
            {savingNote ? 'Saving…' : 'Add Note'}
          </button>
          <div className="divide-y divide-slate-800 text-sm">
            {[...notes]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 20)
              .map((note) => (
                <div key={note.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{note.tail_number}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap">{note.note}</p>
                </div>
              ))}
            {notes.length === 0 && <p className="text-slate-400">No notes yet for tonight.</p>}
          </div>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Recent Logs</h3>
          <p className="text-sm text-slate-400">Auto-refresh on submit</p>
        </div>
        <div className="divide-y divide-slate-800 text-sm">
          {[...logs]
            .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
            .slice(0, 20)
            .map((log) => (
              <div key={log.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{log.tail_number}</p>
                  <p className="text-xs text-slate-400">{new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{Number(log.temp_f).toFixed(1)}°F</p>
                  <p className="text-xs text-slate-400">{getTempStatus(log.temp_f).label}</p>
                </div>
              </div>
            ))}
          {logs.length === 0 && <p className="text-slate-400">No logs yet for tonight.</p>}
        </div>
      </div>
    </div>
  );
}
