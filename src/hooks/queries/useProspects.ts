import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Campaign, Prospect } from '@/types';

export type ProspectWithCampaign = Prospect & {
  campaigns: Pick<Campaign, 'nombre'> | null;
};

export const prospectsKey = ['prospects'] as const;

export function useProspects() {
  return useQuery({
    queryKey: prospectsKey,
    queryFn: async (): Promise<ProspectWithCampaign[]> => {
      const { data, error } = await supabase
        .from('prospects')
        .select('*, campaigns(nombre)')
        .order('creado_en', { ascending: false });

      if (error) throw error;
      return (data ?? []) as ProspectWithCampaign[];
    },
  });
}
