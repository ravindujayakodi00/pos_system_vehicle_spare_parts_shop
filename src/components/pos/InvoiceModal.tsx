"use client";

import Image from "next/image";
import { Modal } from "@/components/shared/Modal";
import { Sale, ShopSettings } from "@/lib/types";
import { printReceipt } from "@/lib/print";
import { formatDateTime } from "@/lib/utils";
import { Printer } from "lucide-react";
import logoBlack from "@/assets/logo-black.png";

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings: Partial<ShopSettings> | null;
}

export function InvoiceModal({ open, onClose, sale, settings }: InvoiceModalProps) {
  const logo = logoBlack;

  if (!sale) return null;
  const currency = settings?.currency ?? "Rs.";
  const address = settings?.address || "411/2/b Makubura, Pannipitiya";
  const formatPhone = (p: string) => p.startsWith("+94") ? "0" + p.slice(3) : p;
  const phone = formatPhone(settings?.phone || "0770460529");
  const phone2 = formatPhone(settings?.phone2 || "0740800274");
  const items = sale.items ?? [];

  const handlePrint = async () => {
    let logoBase64: string | undefined;
    try {
      const res = await fetch(logo.src);
      const blob = await res.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      // logo unavailable — print without it
    }
    printReceipt(sale, settings, logoBase64);
  };

  return (
    <Modal open={open} onClose={onClose} title="Invoice" maxWidth="md">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center pb-3 border-b border-gray-200 dark:border-gray-600">
          <div className="flex justify-center mb-2">
            <Image src={logo} alt="Seoul Motors" width={88} height={88} className="object-contain" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {settings?.shop_name ?? "Seoul Motors"}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{address}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tel: {phone}{phone2 ? ` / ${phone2}` : ""}
          </p>
        </div>

        {/* Invoice meta */}
        <div className="flex justify-between text-sm">
          <div className="space-y-1">
            <p className="text-gray-500 dark:text-gray-400">Invoice No.</p>
            <p className="font-mono font-bold text-gray-900 dark:text-white">{sale.invoice_number}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-gray-500 dark:text-gray-400">Date</p>
            <p className="text-gray-900 dark:text-white">{formatDateTime(sale.created_at)}</p>
          </div>
        </div>

        {sale.customer_name && (
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Customer: </span>
            <span className="font-medium text-gray-900 dark:text-white">{sale.customer_name}</span>
          </div>
        )}

        {/* Items */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Item</th>
                <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Qty</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Price</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.part_number}</p>
                  </td>
                  <td className="px-2 py-2 text-center text-gray-700 dark:text-gray-300">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                    {currency} {item.unit_price.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                    {currency} {item.total_price.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-1 text-sm border-t border-gray-200 dark:border-gray-600 pt-3">
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span>Subtotal</span>
            <span>{currency} {sale.subtotal.toLocaleString()}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Discount</span>
              <span>- {currency} {sale.discount_amount.toLocaleString()}</span>
            </div>
          )}
          {sale.tax_amount > 0 && (
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Tax</span>
              <span>{currency} {sale.tax_amount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
            <span>Total</span>
            <span>{currency} {sale.total_amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span>Paid ({sale.payment_method})</span>
            <span>{currency} {sale.amount_paid.toLocaleString()}</span>
          </div>
          {sale.change_amount > 0 && (
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Change</span>
              <span>{currency} {sale.change_amount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary px-4 py-2 text-sm font-semibold flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
}
