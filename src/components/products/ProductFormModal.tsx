"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/shared/Modal";
import { Product } from "@/lib/types";
import { productsService } from "@/services/products";
import { useToast } from "@/context/ToastContext";

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: Product | null;
}

const CATEGORIES = [
  "Engine Parts",
  "Brakes",
  "Suspension",
  "Electrical",
  "Filters",
  "Body Parts",
  "Transmission",
  "Cooling System",
  "Fuel System",
  "Exhaust",
  "Tyres & Wheels",
  "Lights",
  "Other",
];

const UNITS = ["pcs", "set", "pair", "litre", "kg", "m"];

const emptyForm = {
  part_number: "",
  name: "",
  description: "",
  category: "Engine Parts",
  brand: "",
  cost_price: "",
  selling_price: "",
  stock_quantity: "0",
  min_stock_level: "5",
  unit: "pcs",
};

export function ProductFormModal({
  open,
  onClose,
  onSaved,
  product,
}: ProductFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (product) {
      setForm({
        part_number: product.part_number,
        name: product.name,
        description: product.description ?? "",
        category: product.category,
        brand: product.brand ?? "",
        cost_price: String(product.cost_price),
        selling_price: String(product.selling_price),
        stock_quantity: String(product.stock_quantity),
        min_stock_level: String(product.min_stock_level),
        unit: product.unit,
      });
    } else {
      setForm(emptyForm);
    }
  }, [product, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "part_number" ? value.toUpperCase().slice(0, 6) : value,
    }));
  };

  const validate = (): string | null => {
    if (form.part_number.length !== 6) return "Product code must be exactly 6 characters.";
    if (!form.name.trim()) return "Product name is required.";
    if (!form.category) return "Category is required.";
    if (isNaN(Number(form.cost_price)) || Number(form.cost_price) < 0) return "Invalid buying price.";
    if (isNaN(Number(form.selling_price)) || Number(form.selling_price) <= 0) return "Selling price must be greater than 0.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { showToast(err, "error"); return; }

    setSaving(true);
    try {
      const payload = {
        part_number: form.part_number,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        brand: form.brand.trim() || undefined,
        cost_price: Number(form.cost_price),
        selling_price: Number(form.selling_price),
        stock_quantity: Number(form.stock_quantity),
        min_stock_level: Number(form.min_stock_level),
        unit: form.unit,
        is_active: true,
      };

      if (product) {
        await productsService.updateProduct(product.id, payload);
        showToast("Product updated successfully", "success");
      } else {
        await productsService.createProduct(payload);
        showToast("Product added successfully", "success");
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? "Edit Product" : "Add Product"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Part Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Part Code <span className="text-red-500">*</span>
              <span className="text-xs font-normal text-gray-400 ml-1">(6 chars)</span>
            </label>
            <input
              name="part_number"
              value={form.part_number}
              onChange={handleChange}
              maxLength={6}
              placeholder="ABC123"
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono ${
                form.part_number.length > 0 && form.part_number.length !== 6
                  ? "border-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              required
            />
            <p className="text-xs text-gray-400 mt-0.5">{form.part_number.length}/6</p>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unit
            </label>
            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Oil Filter - Toyota Corolla"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brand
            </label>
            <input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder="e.g. Bosch"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Buying Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buying Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs.</span>
              <input
                name="cost_price"
                type="number"
                min="0"
                step="0.01"
                value={form.cost_price}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Selling Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs.</span>
              <input
                name="selling_price"
                type="number"
                min="0"
                step="0.01"
                value={form.selling_price}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Stock Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Stock
            </label>
            <input
              name="stock_quantity"
              type="number"
              min="0"
              value={form.stock_quantity}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Min Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Low Stock Alert At
            </label>
            <input
              name="min_stock_level"
              type="number"
              min="0"
              value={form.min_stock_level}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            placeholder="Optional notes about this product..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-5 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : product ? "Update Product" : "Add Product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
