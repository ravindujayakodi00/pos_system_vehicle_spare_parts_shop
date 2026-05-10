import { getSupabaseClient } from "@/lib/supabase";
import { PurchaseOrder, PaginatedResponse } from "@/lib/types";
import { generatePONumber } from "@/lib/utils";

export const purchasesService = {
  async getPurchaseOrders(
    page = 1,
    limit = 50,
    searchQuery?: string
  ): Promise<PaginatedResponse<PurchaseOrder>> {
    let query = getSupabaseClient()
      .from("purchase_orders")
      .select("*", { count: "exact" });

    if (searchQuery) {
      query = query.or(`po_number.ilike.%${searchQuery}%,supplier_name.ilike.%${searchQuery}%`);
    }

    const { data, error, count } = await query
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

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
    const { data, error } = await getSupabaseClient()
      .from("purchase_orders")
      .select("*, items:purchase_order_items(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async createPurchaseOrder(
    order: Omit<PurchaseOrder, "id" | "po_number" | "created_at" | "items">
  ): Promise<PurchaseOrder> {
    const { data, error } = await getSupabaseClient()
      .from("purchase_orders")
      .insert({ ...order, po_number: generatePONumber() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: PurchaseOrder["status"]): Promise<void> {
    const { error } = await getSupabaseClient()
      .from("purchase_orders")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
  },
};
