import { reportsService } from "@/services/reports";

export async function exportSalesReport(date: string): Promise<void> {
  const sales = await reportsService.getSalesForDate(date);

  if (sales.length === 0) {
    throw new Error(`No sales found for ${date}`);
  }

  // Dynamic import to keep XLSX out of the initial bundle
  const XLSX = await import("xlsx");

  // Build flat rows for the spreadsheet
  const rows: Record<string, string | number>[] = [];

  for (const sale of sales) {
    const items = sale.items ?? [];
    if (items.length === 0) {
      rows.push({
        Date: date,
        Invoice: sale.invoice_number,
        Customer: sale.customer_name ?? "Walk-in",
        "Part #": "",
        "Product": "",
        Qty: "",
        "Unit Price": "",
        "Item Total": "",
        Subtotal: sale.subtotal,
        Discount: sale.discount_amount,
        Tax: sale.tax_amount,
        Total: sale.total_amount,
        Payment: sale.payment_method,
        "Amount Paid": sale.amount_paid,
        Change: sale.change_amount,
      });
    } else {
      (items as { part_number: string; product_name: string; quantity: number; unit_price: number; total_price: number }[]).forEach((item, idx: number) => {
        rows.push({
          Date: date,
          Invoice: sale.invoice_number,
          Customer: idx === 0 ? (sale.customer_name ?? "Walk-in") : "",
          "Part #": item.part_number,
          "Product": item.product_name,
          Qty: item.quantity,
          "Unit Price": item.unit_price,
          "Item Total": item.total_price,
          Subtotal: idx === 0 ? sale.subtotal : "",
          Discount: idx === 0 ? sale.discount_amount : "",
          Tax: idx === 0 ? sale.tax_amount : "",
          Total: idx === 0 ? sale.total_amount : "",
          Payment: idx === 0 ? sale.payment_method : "",
          "Amount Paid": idx === 0 ? sale.amount_paid : "",
          Change: idx === 0 ? sale.change_amount : "",
        });
      });
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales");

  const fileName = `sales_backup_${date}.xlsx`;
  XLSX.writeFile(wb, fileName);

  console.log(`[Backup] Exported ${sales.length} sales to ${fileName}`);
}

