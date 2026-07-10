import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Campaign } from '@/types';

export const campaignsKey = ['campaigns'] as const;

export function useCampaigns() {
  return useQuery({
    queryKey: campaignsKey,
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
