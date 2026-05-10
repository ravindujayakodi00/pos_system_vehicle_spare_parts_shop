import { getSupabaseClient } from "@/lib/supabase";
import { InventoryTransaction, InventoryTransactionType, PaginatedResponse } from "@/lib/types";

export const inventoryService = {
  async getTransactions(
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<InventoryTransaction>> {
    const { data, error, count } = await getSupabaseClient()
      .from("inventory_transactions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
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

  async getTransactionsByProduct(productId: string): Promise<InventoryTransaction[]> {
    const { data, error } = await getSupabaseClient()
      .from("inventory_transactions")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async addStock(
    productId: string,
    quantity: number,
    type: InventoryTransactionType,
    notes?: string,
    referenceId?: string
  ): Promise<void> {
    const sb = getSupabaseClient();

    const { error: txError } = await sb.from("inventory_transactions").insert({
      product_id: productId,
      type,
      quantity,
      notes,
      reference_id: referenceId,
    });
    if (txError) throw txError;

    const { error: prodError } = await sb.rpc("increment_stock", {
      product_id: productId,
      amount: quantity,
    });
    if (prodError) throw prodError;
  },

  async deductStock(productId: string, quantity: number): Promise<void> {
    const { error } = await getSupabaseClient().rpc("decrement_stock", {
      product_id: productId,
      amount: quantity,
    });
    if (error) throw error;
  },
};
