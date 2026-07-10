import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { ApprovalQueueItem } from '@/types';

export const approvalQueueKey = ['approval_queue'] as const;

export function useApprovalQueue() {
  return useQuery({
    queryKey: approvalQueueKey,
    queryFn: async (): Promise<ApprovalQueueItem[]> => {
      const { data, error } = await supabase
        .from('approval_queue')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
