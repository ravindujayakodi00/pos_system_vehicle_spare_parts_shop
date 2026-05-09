import { getSupabaseClient } from "@/lib/supabase";
import { Product } from "@/lib/types";

export const productsService = {
  async getProducts(): Promise<Product[]> {
    const { data, error } = await getSupabaseClient()
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return data ?? [];
  },

  async getProductCount(): Promise<number> {
    const { count, error } = await getSupabaseClient()
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);
    if (error) throw error;
    return count ?? 0;
  },

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await getSupabaseClient()
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async getProductByCode(partNumber: string): Promise<Product | null> {
    const { data, error } = await getSupabaseClient()
      .from("products")
      .select("*")
      .eq("part_number", partNumber.toUpperCase())
      .eq("is_active", true)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data ?? null;
  },

  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await getSupabaseClient()
      .from("products")
      .select("*")
      .or(`name.ilike.%${query}%,part_number.ilike.%${query}%`)
      .eq("is_active", true)
      .order("name")
      .limit(20);
    if (error) throw error;
    return data ?? [];
  },

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const sb = getSupabaseClient();
    let query = sb
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("stock_quantity");

    // Use provided threshold or a safe default; column-to-column comparisons
    // require a DB function, so we use a reasonable fallback instead.
    query = query.lte("stock_quantity", threshold ?? 10);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async createProduct(
    product: Omit<Product, "id" | "created_at" | "updated_at">
  ): Promise<Product> {
    const { data, error } = await getSupabaseClient()
      .from("products")
      .insert({ ...product, part_number: product.part_number.toUpperCase() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    if (payload.part_number) {
      payload.part_number = payload.part_number.toUpperCase();
    }
    const { data, error } = await getSupabaseClient()
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};
