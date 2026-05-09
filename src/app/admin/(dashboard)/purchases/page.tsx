"use client";

import { useEffect, useState } from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { purchasesService } from "@/services/purchases";
import { PurchaseOrder } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/utils";

export default function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await purchasesService.getPurchaseOrders();
        setOrders(data);
      } catch {
        showToast("Failed to load purchase orders", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    received: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    partial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage supplier purchase orders</p>
        </div>
        <button className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      <div className="surface-panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">PO Number</th>
              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Supplier</th>
              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Order Date</th>
              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Expected</th>
              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Total</th>
              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No purchase orders yet</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                  <td className="px-6 py-4 text-sm font-mono text-blue-600 dark:text-blue-400">{order.po_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{order.supplier_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{new Date(order.order_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {order.expected_date ? new Date(order.expected_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(order.total_amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[order.status] ?? ""}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
