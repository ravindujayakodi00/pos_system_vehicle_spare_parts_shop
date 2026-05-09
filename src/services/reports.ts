import { getSupabaseClient } from "@/lib/supabase";

export interface SalesSummary {
  date: string;
  total_sales: number;
  total_revenue: number;
  total_items: number;
}

export interface ProductSalesReport {
  product_id: string;
  product_name: string;
  part_number: string;
  quantity_sold: number;
  revenue: number;
}

export const reportsService = {
  async getDailySalesSummary(days = 7): Promise<SalesSummary[]> {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const { data, error } = await getSupabaseClient()
      .from("sales")
      .select("created_at, total_amount, items_count")
      .eq("status", "completed")
      .gte("created_at", from.toISOString())
      .order("created_at");

    if (error) throw error;

    const grouped: Record<string, SalesSummary> = {};
    for (const sale of data ?? []) {
      const date = sale.created_at.split("T")[0];
      if (!grouped[date]) {
        grouped[date] = { date, total_sales: 0, total_revenue: 0, total_items: 0 };
      }
      grouped[date].total_sales++;
      grouped[date].total_revenue += sale.total_amount;
      grouped[date].total_items += sale.items_count;
    }

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  },

  async getTopSellingProducts(limit = 10): Promise<ProductSalesReport[]> {
    const { data, error } = await getSupabaseClient()
      .from("sale_items")
      .select("product_id, product_name, part_number, quantity, total_price")
      .limit(limit * 10);

    if (error) throw error;

    const grouped: Record<string, ProductSalesReport> = {};
    for (const item of data ?? []) {
      if (!grouped[item.product_id]) {
        grouped[item.product_id] = {
          product_id: item.product_id,
          product_name: item.product_name,
          part_number: item.part_number,
          quantity_sold: 0,
          revenue: 0,
        };
      }
      grouped[item.product_id].quantity_sold += item.quantity;
      grouped[item.product_id].revenue += item.total_price;
    }

    return Object.values(grouped)
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, limit);
  },

  async getTodayStats(): Promise<{ sales: number; revenue: number; items: number }> {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await getSupabaseClient()
      .from("sales")
      .select("total_amount, items_count")
      .eq("status", "completed")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    if (error) throw error;

    return {
      sales: data?.length ?? 0,
      revenue: data?.reduce((sum, s) => sum + s.total_amount, 0) ?? 0,
      items: data?.reduce((sum, s) => sum + s.items_count, 0) ?? 0,
    };
  },

  async getMonthlyRevenue(): Promise<number> {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data, error } = await getSupabaseClient()
      .from("sales")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", from);

    if (error) throw error;
    return data?.reduce((sum, s) => sum + s.total_amount, 0) ?? 0;
  },

  async getRecentSales(limit = 5) {
    const { data, error } = await getSupabaseClient()
      .from("sales")
      .select("id, invoice_number, customer_name, total_amount, payment_method, created_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },

  async getSalesForDate(date: string) {
    const { data, error } = await getSupabaseClient()
      .from("sales")
      .select("*, items:sale_items(*)")
      .eq("status", "completed")
      .gte("created_at", `${date}T00:00:00`)
      .lte("created_at", `${date}T23:59:59`)
      .order("created_at");

    if (error) throw error;
    return data ?? [];
  },
};
