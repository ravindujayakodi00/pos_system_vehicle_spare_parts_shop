import { getSupabaseClient } from "@/lib/supabase";
import { Supplier, PaginatedResponse } from "@/lib/types";

export const suppliersService = {
  async getSuppliers(
    page = 1,
    limit = 50,
    searchQuery?: string
  ): Promise<PaginatedResponse<Supplier>> {
    let query = getSupabaseClient()
      .from("suppliers")
      .select("*", { count: "exact" });

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,contact_person.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
    }

    const { data, error, count } = await query
      .order("name")
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    
    return {
      data: data ?? [],
      count: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
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
