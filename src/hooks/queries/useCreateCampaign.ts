import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { TablesInsert } from '@/types/database';
import { campaignsKey } from './useCampaigns';

export type CreateCampaignInput = Omit<TablesInsert<'campaigns'>, 'owner_id' | 'canal'>;

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CreateCampaignInput) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ ...values, canal: 'email' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignsKey });
    },
  });
}
