import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Score } from '@/types';

export const scoresKey = ['scores'] as const;

export function useScores() {
  return useQuery({
    queryKey: scoresKey,
    queryFn: async (): Promise<Score[]> => {
      const { data, error } = await supabase.from('scores').select('*').order('fecha', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}
