import { getSupabaseClient } from "@/lib/supabase";
import { Customer, PaginatedResponse } from "@/lib/types";

export const customersService = {
  async getCustomers(
    page = 1,
    limit = 50,
    searchQuery?: string
  ): Promise<PaginatedResponse<Customer>> {
    let query = getSupabaseClient()
      .from("customers_with_totals")
      .select("*", { count: "exact" });

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
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

  async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await getSupabaseClient()
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    const { data, error } = await getSupabaseClient()
      .from("customers")
      .select("*")
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order("name");
    if (error) throw error;
    return data ?? [];
  },

  async createCustomer(
    customer: Omit<Customer, "id" | "created_at" | "updated_at" | "total_purchases">
  ): Promise<Customer> {
    const { data, error } = await getSupabaseClient()
      .from("customers")
      .insert(customer)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await getSupabaseClient()
      .from("customers")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
