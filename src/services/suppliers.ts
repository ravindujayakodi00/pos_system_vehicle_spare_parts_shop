import { getSupabaseClient } from "@/lib/supabase";
import { Supplier } from "@/lib/types";

export const suppliersService = {
  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await getSupabaseClient()
      .from("suppliers")
      .select("*")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },

  async getSupplierById(id: string): Promise<Supplier | null> {
    const { data, error } = await getSupabaseClient()
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async createSupplier(
    supplier: Omit<Supplier, "id" | "created_at" | "updated_at">
  ): Promise<Supplier> {
    const { data, error } = await getSupabaseClient()
      .from("suppliers")
      .insert(supplier)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await getSupabaseClient()
      .from("suppliers")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
