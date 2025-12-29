import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return <AuthContext.Provider value={{ session, user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
