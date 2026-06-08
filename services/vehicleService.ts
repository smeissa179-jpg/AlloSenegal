import { Database } from '../types/database';
import { supabase } from './supabase';

export type ChauffeurDetailsInsert = Database['public']['Tables']['chauffeur_details']['Insert'];

export const vehicleService = {
  uploadVehiclePhoto: async (userId: string, uri: string): Promise<string> => {
    if (!uri) return '';

    try {
      // fetch the file from the local uri and convert to blob
      console.log('[vehicleService] Uploading photo from URI:', uri);
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('[vehicleService] Blob created, size:', blob.size);

      const extMatch = uri.split('.').pop();
      const ext = extMatch ? extMatch.split('?')[0] : 'jpg';
      const fileName = `${Date.now()}.${ext}`;
      const path = `vehicles/${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-photos')
        .upload(path, blob, { upsert: true });

      if (uploadError) {
        console.error('[vehicleService] Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage.from('vehicle-photos').getPublicUrl(path);
      console.log('[vehicleService] Photo uploaded successfully. Public URL:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('[vehicleService] uploadVehiclePhoto failed:', error);
      throw error;
    }
  },

  addOrUpdateVehicle: async (userId: string, payload: any) => {
    if (!userId) throw new Error('User id required');

    // Map payload to the existing `Véhicule` table columns
    const record: any = {
      immatriculation: payload.vehicle_plate ?? null,
      marque: payload.brand ?? null,
      modele: payload.vehicle_model ?? null,
      couleur: payload.color ?? null,
      typeVehicule: payload.vehicle_type ?? payload.vehicleType ?? null,
      photo_url: payload.vehicle_insurance_url ?? payload.photo_url ?? null,
      id_chauffeur: userId,
      created_at: new Date().toISOString(),
    };

    // Insert into the Supabase table named "Véhicule" (table exists in the project)
    console.log('[vehicleService] Inserting vehicle record:', record);
    const { data, error } = await (supabase.from('Véhicule') as any).insert(record).select().maybeSingle();
    if (error) {
      console.error('[vehicleService] Insert error:', error);
      throw error;
    }
    console.log('[vehicleService] Vehicle record inserted successfully:', data);
    return data;
  },

  fetchAllVehicles: async () => {
    try {
      console.log('[vehicleService] Fetching all vehicles...');
      const { data, error } = await (supabase.from('Véhicule') as any).select('*');
      if (error) {
        console.error('[vehicleService] Fetch error:', error);
        throw error;
      }
      console.log('[vehicleService] Vehicles fetched:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('[vehicleService] fetchAllVehicles failed:', error);
      throw error;
    }
  },
};

export default vehicleService;
