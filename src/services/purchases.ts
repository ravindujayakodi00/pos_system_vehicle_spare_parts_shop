import { getSupabaseClient } from "@/lib/supabase";
import { PurchaseOrder } from "@/lib/types";
import { generatePONumber } from "@/lib/utils";

export const purchasesService = {
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const { data, error } = await getSupabaseClient()
      .from("purchase_orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
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
