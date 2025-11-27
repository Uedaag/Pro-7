
import { supabase } from '../lib/supabaseClient';

export interface CommunityMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export async function getCommunityMessages() {
  return supabase
    .from('community_messages')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function addCommunityMessage(data: {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
}) {
  return supabase
    .from('community_messages')
    .insert([data])
    .select()
    .single();
}

export async function updateCommunityMessage(id: string, message: string) {
  return supabase
    .from('community_messages')
    .update({ message, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

export async function deleteCommunityMessage(id: string) {
  return supabase
    .from('community_messages')
    .delete()
    .eq('id', id);
}
