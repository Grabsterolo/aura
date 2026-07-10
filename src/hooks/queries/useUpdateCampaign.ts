import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { TablesUpdate } from '@/types/database';
import { campaignsKey } from './useCampaigns';

export type UpdateCampaignValues = Omit<TablesUpdate<'campaigns'>, 'owner_id' | 'canal' | 'id'>;

interface UpdateCampaignInput {
  id: string;
  values: UpdateCampaignValues;
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: UpdateCampaignInput) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(values)
        .eq('id', id)
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
