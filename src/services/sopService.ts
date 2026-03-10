import { supabase } from '../lib/supabase';

export type SopMetadata = {
  id?: string;
  user_id: string;
  nama_sop: string;
  nomor_sop?: string;
  status?: string;
  gdrive_link?: string;
  created_at?: string;
};

/**
 * Insert a new SOP record into the sop_metadata table
 */
export const insertSopMetadata = async (data: SopMetadata) => {
  const { data: result, error } = await supabase
    .from('sop_metadata')
    .insert([data])
    .select();

  if (error) {
    console.error('Error inserting SOP:', error);
    throw error;
  }
  return result;
};

/**
 * Fetch all SOP records from the sop_metadata table
 */
export const fetchSopMetadata = async () => {
  const { data, error } = await supabase
    .from('sop_metadata')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching SOPs:', error);
    throw error;
  }
  return data;
};
