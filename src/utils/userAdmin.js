import { getEphemeralSupabaseClient, getServiceSupabaseClient, getSupabaseClient } from '../supabaseClient';

const profileColumns = 'id, full_name, email, role, station, is_active, created_at, last_sign_in_at';

const generateTempPassword = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${crypto.randomUUID().replace(/-/g, '')}Aa!1`;
  }
  return `${Date.now()}Aa!1`;
};

const resetRedirect = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;

export async function fetchAllProfiles() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('profiles').select(profileColumns).order('full_name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function upsertProfile(userId, payload) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...payload }, { onConflict: 'id' })
    .select(profileColumns)
    .single();
  if (error) throw error;
  return data;
}

export async function createUserAccount({ full_name, email, role, station }) {
  const serviceSupabase = getServiceSupabaseClient();
  const tempPassword = generateTempPassword();
  let userId = null;

  if (serviceSupabase) {
    const { data, error } = await serviceSupabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name, role, station },
    });
    if (error) throw error;
    userId = data?.user?.id || null;
    if (resetRedirect) {
      await serviceSupabase.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: resetRedirect } });
    }
  } else {
    const ephemeral = getEphemeralSupabaseClient();
    const { data, error } = await ephemeral.auth.signUp({
      email,
      password: tempPassword,
      options: {
        emailRedirectTo: resetRedirect,
        data: { full_name, role, station },
      },
    });
    if (error) throw error;
    userId = data?.user?.id || null;
  }

  if (!userId) throw new Error('Unable to create user in Supabase Auth.');

  return upsertProfile(userId, { full_name, email, role, station, is_active: true });
}

export async function updateUserProfile(id, updates) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select(profileColumns)
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserStatus(id, is_active) {
  return updateUserProfile(id, { is_active });
}

export async function sendPasswordReset(email) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, resetRedirect ? { redirectTo: resetRedirect } : undefined);
  if (error) throw error;
  return true;
}
