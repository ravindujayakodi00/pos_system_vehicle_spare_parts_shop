import { getSupabaseClient } from "@/lib/supabase";
import { ShopSettings } from "@/lib/types";

export const settingsService = {
  async getSettings(): Promise<ShopSettings | null> {
    const { data, error } = await getSupabaseClient()
      .from("shop_settings")
      .select("*")
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data ?? null;
  },

  async saveSettings(updates: Partial<ShopSettings>): Promise<ShopSettings> {
    const sb = getSupabaseClient();
    // Get existing row id
    const { data: existing } = await sb
      .from("shop_settings")
      .select("id")
      .single();

    if (existing) {
      const { data, error } = await sb
        .from("shop_settings")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await sb
        .from("shop_settings")
        .insert(updates)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },
};
