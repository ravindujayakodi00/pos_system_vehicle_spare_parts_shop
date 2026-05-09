"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Users } from "lucide-react";
import { customersService } from "@/services/customers";
import { Customer } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/shared/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  vehicle_info: "",
  notes: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await customersService.getCustomers();
      setCustomers(data);
    } catch {
      showToast("Failed to load customers", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const openAdd = () => {
    setEditCustomer(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email ?? "",
      address: c.address ?? "",
      vehicle_info: c.vehicle_info ?? "",
      notes: c.notes ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      showToast("Name and phone are required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        vehicle_info: form.vehicle_info.trim() || undefined,
        notes: form.notes.trim() || undefined,
        is_active: true,
      };
      if (editCustomer) {
        await customersService.updateCustomer(editCustomer.id, payload);
        showToast("Customer updated", "success");
      } else {
        await customersService.createCustomer(payload);
        showToast("Customer added", "success");
      }
      setShowForm(false);
      fetchCustomers();
    } catch {
      showToast("Failed to save customer", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {customers.length} customer{customers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={openAdd} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="surface-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Phone</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Vehicle Info</th>
                  <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Total Purchases</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Joined</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery ? "No customers match your search" : "No customers yet."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{customer.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{customer.phone}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{customer.vehicle_info ?? "—"}</td>
                      <td className="px-5 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(customer.total_purchases ?? 0)}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => openEdit(customer)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editCustomer ? "Edit Customer" : "Add Customer"} maxWidth="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone <span className="text-red-500">*</span></label>
              <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Info</label>
            <input value={form.vehicle_info} onChange={(e) => setForm((p) => ({ ...p, vehicle_info: e.target.value }))} placeholder="e.g. Toyota Corolla 2020, WP ABC-1234" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <textarea value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm font-semibold disabled:opacity-50">
              {saving ? "Saving..." : editCustomer ? "Update" : "Add Customer"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
