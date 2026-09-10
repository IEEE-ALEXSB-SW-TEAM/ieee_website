import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { resolveUserRole } from '../lib/auth';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync role and profile state from a given auth user
  const syncUserState = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      setRole('');
      setIsAdmin(false);
      return { isAdmin: false, role: '', profile: null };
    }

    setUser(authUser);
    const resolved = await resolveUserRole(authUser);
    setProfile(resolved.profile);
    setRole(resolved.role);
    setIsAdmin(resolved.isAdmin);
    return resolved;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(currentSession);
        if (currentSession?.user) {
          await syncUserState(currentSession.user);
        } else {
          await syncUserState(null);
        }
      } catch (err) {
        console.error('[AuthProvider] Auth initialization error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        if (newSession?.user) {
          await syncUserState(newSession.user);
        } else {
          await syncUserState(null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncUserState]);

  /**
   * Authenticates user with email and password and resolves their role.
   * @param {string} email
   * @param {string} password
   */
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error, isAdmin: false, role: '' };
    }

    setSession(data.session);
    const resolved = await syncUserState(data.user);
    return {
      data,
      error: null,
      isAdmin: resolved.isAdmin,
      role: resolved.role,
      user: data.user,
    };
  };

  /**
   * Logs out the user and clears all auth state.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    await syncUserState(null);
  };

  /**
   * Refreshes the active user's profile and role.
   */
  const refreshRole = async () => {
    if (user) {
      await syncUserState(user);
    }
  };

  const value = {
    session,
    user,
    profile,
    role,
    isAdmin,
    loading,
    signIn,
    signOut,
    refreshRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
