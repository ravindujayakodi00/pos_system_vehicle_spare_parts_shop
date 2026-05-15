import { getSupabaseClient } from "@/lib/supabase";
import { Sale, SaleItem, PaginatedResponse } from "@/lib/types";
import { generateInvoiceNumber } from "@/lib/utils";

export interface ReturnItem {
  product_id: string;
  quantity: number;
}

interface CreateSalePayload {
  customer_id?: string;
  customer_name?: string;
  items: Omit<SaleItem, "id" | "sale_id">[];
  payment_method: "cash" | "card" | "credit";
  amount_paid: number;
  discount_amount?: number;
  notes?: string;
}

export const salesService = {
  async getSales(
    page = 1,
    limit = 50,
    searchQuery?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<PaginatedResponse<Sale>> {
    let query = getSupabaseClient()
      .from("sales")
      .select("*", { count: "exact" });

    if (searchQuery) {
      query = query.or(`invoice_number.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%`);
    }
    if (dateFrom) {
      query = query.gte("created_at", `${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59`);
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

  async getSaleById(id: string): Promise<Sale | null> {
    const { data, error } = await getSupabaseClient()
      .from("sales")
      .select("*, items:sale_items(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async getSalesByDateRange(from: string, to: string): Promise<Sale[]> {
    const { data, error } = await getSupabaseClient()
      .from("sales")
      .select("*")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async createSale(payload: CreateSalePayload): Promise<Sale> {
    const sb = getSupabaseClient();
    const subtotal = payload.items.reduce((sum, item) => sum + item.total_price, 0);
    const discount = payload.discount_amount ?? 0;
    const total = subtotal - discount;

    const { data: sale, error: saleError } = await sb
      .from("sales")
      .insert({
        invoice_number: generateInvoiceNumber(),
        customer_id: payload.customer_id,
        customer_name: payload.customer_name,
        items_count: payload.items.length,
        subtotal,
        discount_amount: discount,
        tax_amount: 0,
        total_amount: total,
        payment_method: payload.payment_method,
        amount_paid: payload.amount_paid,
        change_amount: payload.amount_paid - total,
        status: "completed",
        notes: payload.notes,
      })
      .select()
      .single();

    if (saleError) throw saleError;

    const { error: itemsError } = await sb
      .from("sale_items")
      .insert(payload.items.map((item) => ({ ...item, sale_id: sale.id })));

    if (itemsError) throw itemsError;

    return sale;
  },

  async refundSale(id: string): Promise<void> {
    const { error } = await getSupabaseClient()
      .from("sales")
      .update({ status: "refunded" })
      .eq("id", id);
    if (error) throw error;
  },

  async getReturnedQuantities(saleId: string): Promise<Record<string, number>> {
    const { data, error } = await getSupabaseClient()
      .from("inventory_transactions")
      .select("product_id, quantity")
      .eq("type", "return")
      .eq("reference_id", saleId);
    if (error) throw error;

    const result: Record<string, number> = {};
    for (const row of data ?? []) {
      result[row.product_id] = (result[row.product_id] ?? 0) + row.quantity;
    }
    return result;
  },

  async returnSaleItems(saleId: string, items: ReturnItem[], sale: Sale): Promise<void> {
    const sb = getSupabaseClient();

    // Restore inventory for each returned item and log the transaction
    for (const item of items) {
      const { error: txError } = await sb.from("inventory_transactions").insert({
        product_id: item.product_id,
        type: "return",
        quantity: item.quantity,
        reference_id: saleId,
        reference_type: "sale",
        notes: `Return from invoice ${sale.invoice_number}`,
      });
      if (txError) throw txError;

      const { error: stockError } = await sb.rpc("increment_stock", {
        product_id: item.product_id,
        amount: item.quantity,
      });
      if (stockError) throw stockError;
    }

    // Check if all sale items are now fully returned
    const returnedQtys = await this.getReturnedQuantities(saleId);
    const saleItems = sale.items ?? [];
    const allReturned = saleItems.every(
      (si) => (returnedQtys[si.product_id] ?? 0) >= si.quantity
    );

    if (allReturned) {
      const { error } = await sb.from("sales").update({ status: "refunded" }).eq("id", saleId);
      if (error) throw error;
    }
  },
};
