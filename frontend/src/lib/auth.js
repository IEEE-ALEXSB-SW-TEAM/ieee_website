import { supabase } from './supabase';

/**
 * Normalizes a role string to lowercase and removes outer whitespace.
 * @param {string | null | undefined} role
 * @returns {string}
 */
export function normalizeRole(role) {
  if (!role || typeof role !== 'string') return '';
  return role.trim().toLowerCase();
}

/**
 * Fetches the user profile from the `profiles` table.
 * @param {string} userId - User UUID
 * @returns {Promise<{ profile: object | null, error: any }>}
 */
export async function fetchUserProfile(userId) {
  if (!userId) {
    return { profile: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return { profile: data, error };
  } catch (err) {
    return { profile: null, error: err };
  }
}

/**
 * Resolves the effective role and admin status for a given user.
 * Checks the `profiles` table first, and falls back to Supabase auth metadata.
 *
 * @param {object | null} user - Supabase user object
 * @returns {Promise<{ isAdmin: boolean, role: string, profile: object | null }>}
 */
export async function resolveUserRole(user) {
  if (!user || !user.id) {
    return { isAdmin: false, role: '', profile: null };
  }

  // 1. Check Supabase is_admin() RPC function (SECURITY DEFINER)
  let rpcAdmin = null;
  try {
    const { data: isRpcAdmin, error: rpcError } = await supabase.rpc('is_admin');
    if (!rpcError && typeof isRpcAdmin === 'boolean') {
      rpcAdmin = isRpcAdmin;
    }
  } catch {
    // Ignore RPC failure if function is not defined
  }

  // 2. Fetch public.profiles database table
  const { profile } = await fetchUserProfile(user.id);
  const profileRole = normalizeRole(profile?.role);

  // 3. Check Supabase Auth metadata (app_metadata or user_metadata)
  const metaRole = normalizeRole(
    user.app_metadata?.role || user.user_metadata?.role
  );

  // Determine effective admin status (RPC > DB table > Auth metadata)
  const isAdmin = rpcAdmin === true || profileRole === 'admin' || metaRole === 'admin';
  const effectiveRole = isAdmin ? 'admin' : (profileRole || metaRole || 'user');

  return {
    isAdmin,
    role: effectiveRole,
    profile,
  };
}

/**
 * Quick helper to verify if the currently active user or provided user is an admin.
 * @param {object} [user] - Optional Supabase user object. If omitted, checks active session.
 * @returns {Promise<boolean>}
 */
export async function checkIsAdmin(user) {
  if (!user) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    user = session.user;
  }
  const { isAdmin } = await resolveUserRole(user);
  return isAdmin;
}
