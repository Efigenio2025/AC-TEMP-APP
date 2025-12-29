import { getSupabaseClient } from './supabaseClient';

// Shared helpers for tonight's operations

export const tonightDate = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

const defaultStation = 'OMA';

export async function fetchNightTails() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('night_tails')
    .select('*')
    .eq('station', defaultStation)
    .eq('night_date', tonightDate())
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function upsertNightTail(payload, recordedBy) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('night_tails')
    .upsert(
      { ...payload, station: defaultStation, night_date: tonightDate(), recorded_by: recordedBy },
      { onConflict: 'station,night_date,tail_number' },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteNightTail(id) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('night_tails').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function markInTail(id, recordedBy) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('night_tails')
    .update({ marked_in_at: new Date().toISOString(), recorded_by: recordedBy })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHeatSource(id, heat_source, recordedBy) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('night_tails')
    .update({ heat_source, recorded_by: recordedBy })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHeaterMode(id, heater_mode, recordedBy) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('night_tails')
    .update({ heater_mode, recorded_by: recordedBy })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function togglePurge(id, drained, recordedBy) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('night_tails')
    .update({
      drained,
      purged_at: drained ? new Date().toISOString() : null,
      recorded_by: recordedBy,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertTempLog(payload, recordedBy) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('temp_logs')
    .insert({
      station: defaultStation,
      night_date: tonightDate(),
      recorded_at: new Date().toISOString(),
      recorded_by: recordedBy,
      ...payload,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchLatestTempLogs() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('temp_logs')
    .select('*')
    .eq('station', defaultStation)
    .eq('night_date', tonightDate())
    .order('recorded_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchNotes() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('station', defaultStation)
    .eq('night_date', tonightDate())
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function insertNote(payload, recordedBy) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('notes')
    .insert({
      station: defaultStation,
      night_date: tonightDate(),
      created_at: new Date().toISOString(),
      recorded_by: recordedBy,
      ...payload,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Dispatch an aircraft for the current night/station.
 * This calls a database function that atomically archives the aircraft's
 * night_tails row, all temp_logs, and all notes into their archive tables
 * and removes them from the active tables so dashboards stay clean.
 */
export async function dispatchAircraft(tail_number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('dispatch_aircraft', {
    p_station: defaultStation,
    p_night_date: tonightDate(),
    p_tail_number: tail_number,
  });

  if (error) throw error;
  return data;
}
