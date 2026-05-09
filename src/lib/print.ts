import { Sale, ShopSettings } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";

export function printReceipt(sale: Sale, settings: Partial<ShopSettings> | null): void {
  const shopName = settings?.shop_name ?? "Spare Parts Shop";
  const address = settings?.address ?? "";
  const phone = settings?.phone ?? "";
  const currency = settings?.currency ?? "Rs.";

  const items = sale.items ?? [];

  const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Receipt - ${sale.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: 80mm;
      max-width: 80mm;
      padding: 4mm;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .shop-name { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 2px; }
    .divider { border-top: 1px dashed #000; margin: 4px 0; }
    .row { display: flex; justify-content: space-between; margin: 1px 0; }
    .row .label { flex: 1; }
    .row .value { text-align: right; min-width: 60px; }
    .item-name { font-size: 11px; }
    .totals-section { margin-top: 4px; }
    .grand-total { font-size: 14px; font-weight: bold; }
    .footer { text-align: center; margin-top: 8px; font-size: 11px; }
    @media print {
      body { margin: 0; }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="shop-name">${shopName}</div>
  ${address ? `<div class="center">${address}</div>` : ""}
  ${phone ? `<div class="center">Tel: ${phone}</div>` : ""}

  <div class="divider"></div>

  <div class="row">
    <span class="label">Invoice:</span>
    <span class="value bold">${sale.invoice_number}</span>
  </div>
  <div class="row">
    <span class="label">Date:</span>
    <span class="value">${formatDateTime(sale.created_at)}</span>
  </div>
  ${sale.customer_name ? `
  <div class="row">
    <span class="label">Customer:</span>
    <span class="value">${sale.customer_name}</span>
  </div>` : ""}

  <div class="divider"></div>

  <div class="row bold">
    <span style="flex:2">Item</span>
    <span style="text-align:center;min-width:30px">Qty</span>
    <span style="text-align:right;min-width:60px">Amount</span>
  </div>
  <div class="divider"></div>

  ${items.map((item) => `
  <div style="margin-bottom:3px">
    <div class="item-name">${item.part_number} - ${item.product_name}</div>
    <div class="row">
      <span class="label" style="font-size:11px">${currency} ${item.unit_price.toLocaleString()} x ${item.quantity}</span>
      <span class="value">${currency} ${item.total_price.toLocaleString()}</span>
    </div>
  </div>`).join("")}

  <div class="divider"></div>

  <div class="totals-section">
    <div class="row">
      <span class="label">Subtotal</span>
      <span class="value">${currency} ${sale.subtotal.toLocaleString()}</span>
    </div>
    ${sale.discount_amount > 0 ? `
    <div class="row">
      <span class="label">Discount</span>
      <span class="value">- ${currency} ${sale.discount_amount.toLocaleString()}</span>
    </div>` : ""}
    ${sale.tax_amount > 0 ? `
    <div class="row">
      <span class="label">Tax</span>
      <span class="value">${currency} ${sale.tax_amount.toLocaleString()}</span>
    </div>` : ""}
  </div>

  <div class="divider"></div>

  <div class="row grand-total">
    <span class="label">TOTAL</span>
    <span class="value">${currency} ${sale.total_amount.toLocaleString()}</span>
  </div>
  <div class="row">
    <span class="label">Payment (${sale.payment_method.toUpperCase()})</span>
    <span class="value">${currency} ${sale.amount_paid.toLocaleString()}</span>
  </div>
  ${sale.change_amount > 0 ? `
  <div class="row">
    <span class="label">Change</span>
    <span class="value">${currency} ${sale.change_amount.toLocaleString()}</span>
  </div>` : ""}

  <div class="divider"></div>

  <div class="footer">
    <p>Thank you for your purchase!</p>
    <p>Please keep this receipt for your records.</p>
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=320,height=600");
  if (!printWindow) {
    alert("Please allow pop-ups to print receipts.");
    return;
  }

  printWindow.document.write(receiptHtml);
  printWindow.document.close();
  printWindow.focus();

  // Small delay to allow rendering before print dialog
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}

// Unused but exported for reference
export { formatDate };
