import { supabase } from './base44Client';

const PROFILE_CACHE_KEY = 'mdb_profile_cache';

// Current auth user merged with their `profiles` row (full_name, role, statut).
// Uses the locally persisted session (no network round-trip) so it keeps
// working in the field with no signal, instead of logging the user out.
export async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.user) throw new Error('Not authenticated');

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (profileError) throw profileError;
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    return { ...session.user, ...profile };
  } catch {
    // Hors ligne : on retombe sur la dernière copie connue du profil
    // plutôt que de considérer l'utilisateur comme déconnecté.
    const cached = JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY) || 'null');
    return cached ? { ...session.user, ...cached } : session.user;
  }
}
