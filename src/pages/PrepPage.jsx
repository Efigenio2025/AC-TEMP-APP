import { useEffect, useMemo, useState } from 'react';
import { deleteNightTail, fetchNightTails, tonightDate, upsertNightTail } from '../db';
import { heatSources, locations } from '../utils/constants';
import ToggleSwitch from '../components/ToggleSwitch';

export default function PrepPage() {
  const [tails, setTails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formState, setFormState] = useState({
    id: null,
    tail_number: '',
    in_time: '',
    location: locations[0],
    heat_source: heatSources[0],
    drained: false,
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const resetForm = () => {
    setFormState({
      id: null,
      tail_number: '',
      in_time: '',
      location: locations[0],
      heat_source: heatSources[0],
      drained: false,
    });
  };

  const loadTails = async () => {
    try {
      setLoading(true);
      const data = await fetchNightTails();
      setTails(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTails();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.tail_number || !formState.in_time) {
      setError('Tail number and In-Time are required');
      return;
    }
    setSaving(true);
    try {
      await upsertNightTail({
        id: formState.id || undefined,
        tail_number: formState.tail_number.trim().toUpperCase(),
        in_time: formState.in_time,
        location: formState.location,
        heat_source: formState.heat_source,
        drained: formState.drained,
        purged_at: formState.drained ? new Date().toISOString() : null,
      });
      resetForm();
      await loadTails();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteNightTail(id);
      await loadTails();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const editingLabel = formState.id ? 'Update Aircraft' : 'Add Aircraft';

  const sortedTails = useMemo(
    () =>
      [...tails].sort((a, b) => a.tail_number.localeCompare(b.tail_number)),
    [tails],
  );

  return (
    <div className="py-6 space-y-6">
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase text-indigo-300">Tonight</p>
            <h2 className="text-xl font-bold">Prep Aircraft for {tonightDate()}</h2>
          </div>
          <button
            onClick={loadTails}
            className="text-sm px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 w-auto"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-300">Tail Number *</label>
            <input
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-indigo-500"
              value={formState.tail_number}
              onChange={(e) => setFormState((s) => ({ ...s, tail_number: e.target.value }))}
              placeholder="N12345"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-300">In-Time *</label>
            <input
              type="time"
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-indigo-500"
              value={formState.in_time}
              onChange={(e) => setFormState((s) => ({ ...s, in_time: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-300">Gate / Parking Location</label>
            <select
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-indigo-500"
              value={formState.location}
              onChange={(e) => setFormState((s) => ({ ...s, location: e.target.value }))}
            >
              {locations.map((loc) => (
                <option key={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-300">Heat Source</label>
            <select
              className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-indigo-500"
              value={formState.heat_source}
              onChange={(e) => setFormState((s) => ({ ...s, heat_source: e.target.value }))}
            >
              {heatSources.map((heat) => (
                <option key={heat}>{heat}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <ToggleSwitch
              label="Purged & Drained"
              checked={formState.drained}
              onChange={(val) => setFormState((s) => ({ ...s, drained: val }))}
              color="emerald"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full md:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold"
              disabled={saving}
            >
              {saving ? 'Saving…' : editingLabel}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Tonight's Aircraft ({sortedTails.length})</h3>
          <p className="text-sm text-slate-400">Auto-syncs with Log + Dashboard</p>
        </div>
        {loading ? (
          <p className="text-slate-300">Loading…</p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {sortedTails.map((t) => (
                <div key={t.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs uppercase text-indigo-300">Tail</p>
                      <p className="text-lg font-bold">{t.tail_number}</p>
                    </div>
                    <p className="text-sm text-slate-300">{t.in_time}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div>
                      <p className="text-slate-400">Location</p>
                      <p className="font-semibold">{t.location}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Heat</p>
                      <p className="font-semibold">{t.heat_source}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Marked In</p>
                      <p className="font-semibold">
                        {t.marked_in_at
                          ? new Date(t.marked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Purge</p>
                      <p className="font-semibold">
                        {t.drained
                          ? t.purged_at
                            ? new Date(t.purged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'On'
                          : 'Off'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="flex-1 px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-sm"
                      onClick={() =>
                        setFormState({
                          id: t.id,
                          tail_number: t.tail_number,
                          in_time: t.in_time,
                          location: t.location,
                          heat_source: t.heat_source,
                          drained: t.drained,
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="flex-1 px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-sm"
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                    >
                      {deletingId === t.id ? 'Removing…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto hidden md:block">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-400">
                  <tr>
                    <th className="py-2">Tail</th>
                    <th>Location</th>
                    <th>Heat</th>
                    <th>In-Time</th>
                    <th>Marked In</th>
                    <th>Purge</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedTails.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/60">
                      <td className="py-2 font-semibold">{t.tail_number}</td>
                      <td>{t.location}</td>
                      <td>{t.heat_source}</td>
                      <td>{t.in_time}</td>
                      <td>
                        {t.marked_in_at ? (
                          <span className="px-2 py-1 rounded bg-green-900/60 text-green-300 text-xs">
                            {new Date(t.marked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-yellow-900/60 text-yellow-300 text-xs">Pending</span>
                        )}
                      </td>
                      <td>
                        {t.drained ? (
                          <span className="px-2 py-1 rounded bg-emerald-900/60 text-emerald-300 text-xs">
                            {t.purged_at
                              ? new Date(t.purged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'On'}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs">Off</span>
                        )}
                      </td>
                      <td className="text-right space-x-2">
                        <button
                          className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600"
                          onClick={() =>
                            setFormState({
                              id: t.id,
                              tail_number: t.tail_number,
                              in_time: t.in_time,
                              location: t.location,
                              heat_source: t.heat_source,
                              drained: t.drained,
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-500"
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                        >
                          {deletingId === t.id ? 'Removing…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedTails.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-slate-400">
                        No aircraft added for tonight yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
