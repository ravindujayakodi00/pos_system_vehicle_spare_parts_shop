"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ShoppingBag, Calendar, Building2, Search } from "lucide-react";
import { purchasesService } from "@/services/purchases";
import { suppliersService } from "@/services/suppliers";
import { PurchaseOrder, Supplier } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/shared/Modal";
import { Pagination } from "@/components/shared/Pagination";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  received: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  partial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const emptyForm = {
  supplier_id: "",
  supplier_name: "",
  order_date: new Date().toISOString().split("T")[0],
  expected_date: "",
  total_amount: "",
  notes: "",
  status: "pending" as PurchaseOrder["status"],
};

type POForm = typeof emptyForm;

export default function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);
  const [form, setForm] = useState<POForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, suppliersData] = await Promise.all([
        purchasesService.getPurchaseOrders(page, 50, searchQuery),
        suppliersService.getSuppliers(1, 10000), // fetching suppliers is not paginated here intentionally for the dropdown
      ]);
      setOrders(ordersData.data);
      setTotalRecords(ordersData.count);
      setTotalPages(ordersData.totalPages);
      setSuppliers(suppliersData.data.filter((s) => s.is_active));
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  const openNew = () => {
    setForm({
      ...emptyForm,
      order_date: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supplier = suppliers.find((s) => s.id === e.target.value);
    setForm((p) => ({
      ...p,
      supplier_id: e.target.value,
      supplier_name: supplier?.name ?? "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier_id) {
      showToast("Please select a supplier", "error");
      return;
    }
    const amount = parseFloat(form.total_amount);
    if (isNaN(amount) || amount < 0) {
      showToast("Enter a valid total amount", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        supplier_id: form.supplier_id,
        supplier_name: form.supplier_name,
        order_date: form.order_date,
        expected_date: form.expected_date || undefined,
        total_amount: amount,
        notes: form.notes.trim() || undefined,
        status: form.status,
      };
      const created = await purchasesService.createPurchaseOrder(payload);
      showToast(`Purchase order ${created.po_number} created`, "success");
      setShowModal(false);
      loadOrders();
    } catch {
      showToast("Failed to create purchase order", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (order: PurchaseOrder, status: PurchaseOrder["status"]) => {
    try {
      await purchasesService.updateStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
      if (viewingOrder?.id === order.id) setViewingOrder((v) => v && { ...v, status });
      showToast("Status updated", "success");
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track stock orders placed with suppliers
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            id="new-purchase-order-btn"
            onClick={openNew}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      <div className="surface-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  PO Number
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  Supplier
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3 hidden sm:table-cell">
                  Order Date
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                  Expected
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  Total
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  Status
                </th>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No purchase orders yet. Create your first order.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => setViewingOrder(order)}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-blue-600 dark:text-blue-400">
                      {order.po_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {order.supplier_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                      {order.expected_date
                        ? new Date(order.expected_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          statusColors[order.status] ?? ""
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
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

      {/* New Purchase Order Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="New Purchase Order"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supplier <span className="text-red-500">*</span>
              </label>
              {suppliers.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                  No active suppliers found. Please add a supplier first.
                </p>
              ) : (
                <select
                  value={form.supplier_id}
                  onChange={handleSupplierChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Order Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.order_date}
                onChange={(e) => setForm((p) => ({ ...p, order_date: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={form.expected_date}
                min={form.order_date}
                onChange={(e) => setForm((p) => ({ ...p, expected_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Amount (Rs.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.total_amount}
                onChange={(e) => setForm((p) => ({ ...p, total_amount: e.target.value }))}
                placeholder="0.00"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Initial Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value as PurchaseOrder["status"] }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
                placeholder="e.g. Items ordered, payment terms..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || suppliers.length === 0}
              className="btn-primary px-5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View / Update Status Modal */}
      {viewingOrder && (
        <Modal
          open={!!viewingOrder}
          onClose={() => setViewingOrder(null)}
          title={`Order ${viewingOrder.po_number}`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Building2 className="w-4 h-4" />
                <span>Supplier</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white text-right">
                {viewingOrder.supplier_name}
              </span>

              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Order Date</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white text-right">
                {new Date(viewingOrder.order_date).toLocaleDateString()}
              </span>

              {viewingOrder.expected_date && (
                <>
                  <span className="text-gray-500 dark:text-gray-400">Expected</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right">
                    {new Date(viewingOrder.expected_date).toLocaleDateString()}
                  </span>
                </>
              )}

              <span className="text-gray-500 dark:text-gray-400">Total Amount</span>
              <span className="font-bold text-gray-900 dark:text-white text-right">
                {formatCurrency(viewingOrder.total_amount)}
              </span>

              {viewingOrder.notes && (
                <>
                  <span className="text-gray-500 dark:text-gray-400">Notes</span>
                  <span className="text-gray-700 dark:text-gray-300 text-right">
                    {viewingOrder.notes}
                  </span>
                </>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Update Status
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["pending", "partial", "received", "cancelled"] as PurchaseOrder["status"][]).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(viewingOrder, s)}
                      className={`py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        viewingOrder.status === s
                          ? statusColors[s]
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {s}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setViewingOrder(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
