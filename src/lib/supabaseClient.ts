import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  // In dev, we throw to make setup obvious; in prod, server routes enforce auth anyway.
  // eslint-disable-next-line no-console
  console.warn('Supabase env not configured: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url || '', anon || '');

