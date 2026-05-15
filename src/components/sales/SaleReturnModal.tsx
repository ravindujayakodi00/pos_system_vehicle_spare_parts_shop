"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { Sale, SaleItem } from "@/lib/types";
import { salesService } from "@/services/sales";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/utils";

interface SaleReturnModalProps {
  open: boolean;
  onClose: () => void;
  sale: Sale;
  onReturned: () => void;
}

interface ReturnRow extends SaleItem {
  returnQty: number;
  alreadyReturned: number;
}

export function SaleReturnModal({ open, onClose, sale, onReturned }: SaleReturnModalProps) {
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const load = async () => {
      try {
        const [saleWithItems, returnedQtys] = await Promise.all([
          salesService.getSaleById(sale.id),
          salesService.getReturnedQuantities(sale.id),
        ]);

        const items = saleWithItems?.items ?? [];
        setRows(
          items.map((item) => ({
            ...item,
            alreadyReturned: returnedQtys[item.product_id] ?? 0,
            returnQty: 0,
          }))
        );
      } catch {
        showToast("Failed to load sale items", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, sale.id, showToast]);

  const setQty = (index: number, value: number) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const max = r.quantity - r.alreadyReturned;
        return { ...r, returnQty: Math.min(Math.max(0, value), max) };
      })
    );
  };

  const handleSubmit = async () => {
    const itemsToReturn = rows
      .filter((r) => r.returnQty > 0)
      .map((r) => ({ product_id: r.product_id, quantity: r.returnQty }));

    if (itemsToReturn.length === 0) {
      showToast("Select at least one item to return", "warning");
      return;
    }

    setSubmitting(true);
    try {
      // Need full sale with items for the status check
      const fullSale = await salesService.getSaleById(sale.id);
      await salesService.returnSaleItems(sale.id, itemsToReturn, fullSale!);
      showToast("Return processed successfully", "success");
      onReturned();
      onClose();
    } catch {
      showToast("Failed to process return", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const totalReturnAmount = rows.reduce(
    (sum, r) => sum + r.returnQty * r.unit_price,
    0
  );
  const hasSelection = rows.some((r) => r.returnQty > 0);

  return (
    <Modal open={open} onClose={onClose} title={`Return — ${sale.invoice_number}`} maxWidth="lg">
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Item</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Sold</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Returned</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Return Qty</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {rows.map((row, i) => {
                    const available = row.quantity - row.alreadyReturned;
                    const fullyReturned = available === 0;
                    return (
                      <tr key={row.id} className={fullyReturned ? "opacity-40" : ""}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">{row.product_name}</p>
                          <p className="text-xs text-gray-400 font-mono">{row.part_number}</p>
                        </td>
                        <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{row.quantity}</td>
                        <td className="px-3 py-3 text-center text-gray-500 dark:text-gray-400">{row.alreadyReturned}</td>
                        <td className="px-3 py-3 text-center">
                          {fullyReturned ? (
                            <span className="text-xs text-gray-400 dark:text-gray-500">Done</span>
                          ) : (
                            <input
                              type="number"
                              min={0}
                              max={available}
                              value={row.returnQty === 0 ? "" : row.returnQty}
                              onChange={(e) => setQty(i, parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="w-16 text-center px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                          {row.returnQty > 0 ? formatCurrency(row.returnQty * row.unit_price) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasSelection && (
              <div className="flex justify-end text-sm font-semibold text-gray-900 dark:text-white">
                Total Refund: {formatCurrency(totalReturnAmount)}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !hasSelection}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Processing..." : "Process Return"}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
