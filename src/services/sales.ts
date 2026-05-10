import { getSupabaseClient } from "@/lib/supabase";
import { Sale, SaleItem, PaginatedResponse } from "@/lib/types";
import { generateInvoiceNumber } from "@/lib/utils";

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
    searchQuery?: string
  ): Promise<PaginatedResponse<Sale>> {
    let query = getSupabaseClient()
      .from("sales")
      .select("*", { count: "exact" });

    if (searchQuery) {
      query = query.or(`invoice_number.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%`);
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
};
