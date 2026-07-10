import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { campaignsKey } from './useCampaigns';
import { prospectsKey } from './useProspects';

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { error: deleteProspectsError } = await supabase
        .from('prospects')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('estado', 'encontrado');

      if (deleteProspectsError) throw deleteProspectsError;

      const { error: deleteCampaignError } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (deleteCampaignError) throw deleteCampaignError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignsKey });
      queryClient.invalidateQueries({ queryKey: prospectsKey });
    },
  });
}
