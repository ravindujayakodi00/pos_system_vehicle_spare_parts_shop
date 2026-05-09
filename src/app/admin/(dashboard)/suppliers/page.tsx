"use client";

import { useEffect, useState } from "react";
import { Plus, Truck } from "lucide-react";
import { suppliersService } from "@/services/suppliers";
import { Supplier } from "@/lib/types";
import { useToast } from "@/context/ToastContext";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await suppliersService.getSuppliers();
        setSuppliers(data);
      } catch {
        showToast("Failed to load suppliers", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your parts suppliers</p>
        </div>
        <button className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface-panel p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))
        ) : suppliers.length === 0 ? (
          <div className="col-span-3 surface-panel p-12 text-center">
            <Truck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No suppliers yet. Add your first supplier.</p>
          </div>
        ) : (
          suppliers.map((supplier) => (
            <div key={supplier.id} className="surface-panel p-6 card-hover cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{supplier.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{supplier.contact_person}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${supplier.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                  {supplier.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p>{supplier.phone}</p>
                {supplier.email && <p>{supplier.email}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
