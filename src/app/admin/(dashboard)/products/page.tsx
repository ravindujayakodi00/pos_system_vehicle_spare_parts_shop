"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Package, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { productsService } from "@/services/products";
import { Product } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { formatCurrency } from "@/lib/utils";

const MAX_PRODUCTS = 400;
const WARN_AT = 380;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productsService.getProducts();
      setProducts(data);
    } catch {
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.part_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      await productsService.deleteProduct(deleteProduct.id);
      showToast("Product removed", "success");
      setDeleteProduct(null);
      fetchProducts();
    } catch {
      showToast("Failed to remove product", "error");
    } finally {
      setDeleting(false);
    }
  };

  const openAdd = () => { setEditProduct(null); setShowForm(true); };
  const openEdit = (p: Product) => { setEditProduct(p); setShowForm(true); };

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {products.length} / {MAX_PRODUCTS} items
            </p>
          </div>
          <button
            onClick={openAdd}
            disabled={products.length >= MAX_PRODUCTS}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
            title={products.length >= MAX_PRODUCTS ? `Maximum ${MAX_PRODUCTS} products reached` : ""}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* 400-item warning */}
        {products.length >= WARN_AT && products.length < MAX_PRODUCTS && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Approaching the 400-item limit. You have {MAX_PRODUCTS - products.length} slots remaining.
            </p>
          </div>
        )}
        {products.length >= MAX_PRODUCTS && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">
              Maximum product limit of {MAX_PRODUCTS} reached. Remove a product to add a new one.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code or name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <div className="surface-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Code</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Category</th>
                  <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Buy Price</th>
                  <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Sell Price</th>
                  <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Stock</th>
                  <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery ? "No products match your search" : "No products yet. Add your first product."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => {
                    const isLowStock = product.stock_quantity <= product.min_stock_level;
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                            {product.part_number}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                          {product.brand && <p className="text-xs text-gray-400">{product.brand}</p>}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{product.category}</td>
                        <td className="px-5 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                          {formatCurrency(product.cost_price)}
                        </td>
                        <td className="px-5 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(product.selling_price)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isLowStock
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          }`}>
                            {isLowStock && <AlertTriangle className="w-3 h-3" />}
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEdit(product)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteProduct(product)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ProductFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={fetchProducts}
        product={editProduct}
      />

      <ConfirmationDialog
        open={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
        title="Remove Product"
        message={`Are you sure you want to remove "${deleteProduct?.name}"? This will deactivate it from the system.`}
        confirmLabel="Remove"
        loading={deleting}
        variant="danger"
      />
    </>
  );
}
