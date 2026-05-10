"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, AlertTriangle, Package } from "lucide-react";
import { inventoryService } from "@/services/inventory";
import { productsService } from "@/services/products";
import { InventoryTransaction, Product } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { AddStockModal } from "@/components/inventory/AddStockModal";
import { Pagination } from "@/components/shared/Pagination";
import { formatDateTime } from "@/lib/utils";

const typeColors: Record<string, string> = {
  restock: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  sale: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  adjustment: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  return: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  damage: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function InventoryPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showAddStock, setShowAddStock] = useState(false);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txData, products, lowStock] = await Promise.all([
        inventoryService.getTransactions(page, 50),
        productsService.getProducts(1, 10000), // keep all products to map ID to name for now, or just leave it
        productsService.getLowStockProducts(),
      ]);
      setTransactions(txData.data);
      setTotalRecords(txData.count);
      setTotalPages(txData.totalPages);
      setLowStockItems(lowStock);
      const map: Record<string, Product> = {};
      products.data.forEach((p) => { map[p.id] = p; });
      setProductMap(map);
    } catch {
      showToast("Failed to load inventory data", "error");
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Stock levels and transaction history</p>
          </div>
          <button
            onClick={() => setShowAddStock(true)}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Update Stock
          </button>
        </div>

        {/* Low stock panel */}
        {lowStockItems.length > 0 && (
          <div className="surface-panel overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-semibold text-amber-800 dark:text-amber-400">
                Low Stock Alerts ({lowStockItems.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {lowStockItems.map((product) => (
                <div key={product.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 mr-2">
                      {product.part_number}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Min: {product.min_stock_level}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <AlertTriangle className="w-3 h-3" />
                      {product.stock_quantity} left
                    </span>
                    <button
                      onClick={() => setShowAddStock(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div className="surface-panel overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Recent Transactions
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Product</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Type</th>
                  <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Qty Change</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No inventory transactions yet.</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const product = productMap[tx.product_id];
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {formatDateTime(tx.created_at)}
                        </td>
                        <td className="px-5 py-3">
                          {product ? (
                            <>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                              <p className="text-xs font-mono text-gray-400">{product.part_number}</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-400">{tx.product_id}</p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${typeColors[tx.type] ?? ""}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-sm font-bold ${tx.quantity > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {tx.quantity > 0 ? "+" : ""}{tx.quantity}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {tx.notes ?? "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            limit={50}
            onPageChange={setPage}
          />
        </div>
      </div>

      <AddStockModal
        open={showAddStock}
        onClose={() => setShowAddStock(false)}
        onSaved={fetchData}
      />
    </>
  );
}
