import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Conversation } from '@/types';

export const conversationsKey = ['conversations'] as const;

export function useConversations() {
  return useQuery({
    queryKey: conversationsKey,
    queryFn: async (): Promise<Conversation[]> => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('actualizado_en', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
