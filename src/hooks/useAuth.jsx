import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      setProfileError('');
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    setProfileError('');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, station, is_active, created_at, last_sign_in_at')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Profile load failed', error);
      setProfile(null);
      setProfileError(error.message || 'Unable to load your profile.');
    } else {
      setProfile(data);
      setProfileError('');
    }
    setProfileLoading(false);
  };

  useEffect(() => {
    loadProfile(user?.id);
  }, [user?.id]);

  const loading = sessionLoading || (user && profileLoading);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        profileError,
        profileLoading,
        loading,
        refreshProfile: () => loadProfile(user?.id),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
