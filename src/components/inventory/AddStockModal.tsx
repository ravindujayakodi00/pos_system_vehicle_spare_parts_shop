"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/shared/Modal";
import { Product, InventoryTransactionType } from "@/lib/types";
import { productsService } from "@/services/products";
import { inventoryService } from "@/services/inventory";
import { useToast } from "@/context/ToastContext";

interface AddStockModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  preselectedProduct?: Product | null;
}

const TYPES: { value: InventoryTransactionType; label: string }[] = [
  { value: "restock", label: "Restock (purchase)" },
  { value: "adjustment", label: "Stock Adjustment" },
  { value: "return", label: "Customer Return" },
  { value: "damage", label: "Damage / Write-off" },
];

export function AddStockModal({
  open,
  onClose,
  onSaved,
  preselectedProduct,
}: AddStockModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<InventoryTransactionType>("restock");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      productsService.getProducts().then(setProducts).catch(() => {});
      if (preselectedProduct) setProductId(preselectedProduct.id);
    }
  }, [open, preselectedProduct]);

  const selectedProduct = products.find((p) => p.id === productId) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) { showToast("Please select a product", "error"); return; }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty === 0) { showToast("Quantity must be non-zero", "error"); return; }

    setSaving(true);
    try {
      // For damage transactions store as negative
      const finalQty = type === "damage" ? -Math.abs(qty) : Math.abs(qty);
      await inventoryService.addStock(productId, finalQty, type, notes || undefined);
      showToast("Stock updated successfully", "success");
      onSaved();
      onClose();
      setProductId("");
      setType("restock");
      setQuantity("1");
      setNotes("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update stock";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Update Stock" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product <span className="text-red-500">*</span>
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.part_number}] {p.name} (stock: {p.stock_quantity})
              </option>
            ))}
          </select>
          {selectedProduct && (
            <p className="text-xs text-gray-400 mt-1">
              Current stock: {selectedProduct.stock_quantity} {selectedProduct.unit}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Transaction Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as InventoryTransactionType)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quantity <span className="text-red-500">*</span>
            {type === "damage" && (
              <span className="text-xs text-red-400 ml-1">(will be deducted)</span>
            )}
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional notes..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-5 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update Stock"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
