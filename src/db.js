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

export async function upsertNightTail(payload) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('night_tails')
    .upsert({ ...payload, station: defaultStation, night_date: tonightDate() }, { onConflict: 'station,night_date,tail_number' })
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

export async function markInTail(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('night_tails')
    .update({ marked_in_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHeatSource(id, heat_source) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('night_tails')
    .update({ heat_source })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHeaterMode(id, heater_mode) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('night_tails')
    .update({ heater_mode })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function togglePurge(id, drained) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('night_tails')
    .update({
      drained,
      purged_at: drained ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertTempLog(payload) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('temp_logs')
    .insert({
      station: defaultStation,
      night_date: tonightDate(),
      recorded_at: new Date().toISOString(),
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

export async function insertNote(payload) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('notes')
    .insert({
      station: defaultStation,
      night_date: tonightDate(),
      created_at: new Date().toISOString(),
      ...payload,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}