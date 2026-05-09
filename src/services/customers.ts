import { getSupabaseClient } from "@/lib/supabase";
import { Customer } from "@/lib/types";

export const customersService = {
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await getSupabaseClient()
      .from("customers")
      .select("*")
      .order("name");
    if (error) throw error;
    return data ?? [];
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
