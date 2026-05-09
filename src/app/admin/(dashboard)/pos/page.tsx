"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Trash2, ShoppingCart, Plus, Minus, Tag } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { productsService } from "@/services/products";
import { salesService } from "@/services/sales";
import { inventoryService } from "@/services/inventory";
import { settingsService } from "@/services/settings";
import { InvoiceModal } from "@/components/pos/InvoiceModal";
import { Product, Sale, ShopSettings, PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CartItem {
  cartId: string;
  product: Product;
  quantity: number;
}

export default function POSPage() {
  const [searchCode, setSearchCode] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountPaid, setAmountPaid] = useState("0");
  const [checkingOut, setCheckingOut] = useState(false);
  const [invoiceSale, setInvoiceSale] = useState<Sale | null>(null);
  const [settings, setSettings] = useState<Partial<ShopSettings> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    settingsService.getSettings().then(setSettings).catch(() => {});
    searchRef.current?.focus();
  }, []);

  const currency = settings?.currency ?? "Rs.";
  const subtotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  const discount = Math.min(Number(discountAmount) || 0, subtotal);
  const grandTotal = subtotal - discount;
  const paid = Number(amountPaid) || 0;
  const change = Math.max(0, paid - grandTotal);

  // Search by code (exact 6-char) or name
  const handleSearch = useCallback(async (query: string) => {
    setSearchCode(query);
    setFoundProduct(null);
    setSearchResults([]);

    if (!query.trim()) return;

    // If exactly 6 chars, try exact code lookup
    if (query.length === 6) {
      setSearching(true);
      try {
        const product = await productsService.getProductByCode(query);
        if (product) {
          setFoundProduct(product);
          setSearchResults([]);
          return;
        }
      } finally {
        setSearching(false);
      }
    }

    // Otherwise search by name
    if (query.length >= 2) {
      setSearching(true);
      try {
        const results = await productsService.searchProducts(query);
        setSearchResults(results);
      } finally {
        setSearching(false);
      }
    }
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      showToast(`${product.name} is out of stock`, "error");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          showToast(`Only ${product.stock_quantity} units available`, "warning");
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { cartId: `${product.id}-${Date.now()}`, product, quantity: 1 }];
    });

    setSearchCode("");
    setFoundProduct(null);
    setSearchResults([]);
    searchRef.current?.focus();
  };

  const updateQty = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.cartId === cartId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setDiscountAmount("0");
    setAmountPaid("0");
    searchRef.current?.focus();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { showToast("Cart is empty", "error"); return; }
    if (paymentMethod === "cash" && paid < grandTotal) {
      showToast("Amount paid is less than total", "error");
      return;
    }

    setCheckingOut(true);
    try {
      const saleItems = cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        part_number: item.product.part_number,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
        discount: 0,
        total_price: item.product.selling_price * item.quantity,
      }));

      const sale = await salesService.createSale({
        customer_name: customerName.trim() || undefined,
        items: saleItems,
        payment_method: paymentMethod,
        amount_paid: paymentMethod === "cash" ? paid : grandTotal,
        discount_amount: discount,
      });

      // Deduct stock for each item
      await Promise.all(
        cart.map((item) =>
          inventoryService.addStock(
            item.product.id,
            -item.quantity,
            "sale",
            `Sale ${sale.invoice_number}`,
            sale.id
          ).catch(() => {})
        )
      );

      // Attach items to sale for invoice display
      const fullSale: Sale = {
        ...sale,
        subtotal,
        items: saleItems.map((item, idx) => ({
          ...item,
          id: `temp-${idx}`,
          sale_id: sale.id,
        })),
      };

      setInvoiceSale(fullSale);
      clearCart();
      showToast("Sale completed!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Checkout failed";
      showToast(msg, "error");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
        {/* LEFT: Product Search */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-shrink-0">
            Point of Sale
          </h1>

          {/* Search input */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={searchCode}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Enter 6-char product code or search by name..."
              className="w-full pl-10 pr-4 py-3 border-2 border-blue-300 dark:border-blue-700 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-base"
              autoComplete="off"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Found product card (exact code match) */}
          {foundProduct && (
            <div className="surface-panel p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                      {foundProduct.part_number}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      foundProduct.stock_quantity <= foundProduct.min_stock_level
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}>
                      Stock: {foundProduct.stock_quantity}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{foundProduct.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{foundProduct.category}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Buy: <span className="font-medium text-gray-700 dark:text-gray-200">{currency} {foundProduct.cost_price.toLocaleString()}</span>
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Sell: <span className="font-bold text-blue-700 dark:text-blue-400">{currency} {foundProduct.selling_price.toLocaleString()}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => addToCart(foundProduct)}
                  disabled={foundProduct.stock_quantity <= 0}
                  className="btn-primary px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Search results list */}
          {searchResults.length > 0 && (
            <div className="surface-panel overflow-y-auto max-h-80 flex-shrink-0">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock_quantity <= 0}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {product.part_number}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </span>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span>Buy: {currency} {product.cost_price.toLocaleString()}</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Sell: {currency} {product.selling_price.toLocaleString()}</span>
                        <span>Stock: {product.stock_quantity}</span>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty state hint */}
          {!foundProduct && searchResults.length === 0 && !searching && (
            <div className="surface-panel p-8 text-center flex-shrink-0">
              <ShoppingCart className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Type a 6-character product code for instant lookup,<br />or search by product name.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Cart */}
        <div className="w-full lg:w-96 surface-panel flex flex-col gap-0 overflow-hidden">
          {/* Cart header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Cart ({cart.length})
              </h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Customer name */}
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-32">
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No items in cart</p>
            ) : (
              cart.map((item) => (
                <div key={item.cartId} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-blue-600 dark:text-blue-400">{item.product.part_number}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currency} {item.product.selling_price.toLocaleString()} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.cartId, -1)} className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 text-gray-700 dark:text-gray-200">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.cartId, 1)}
                      disabled={item.quantity >= item.product.stock_quantity}
                      className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 text-gray-700 dark:text-gray-200 disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right min-w-14">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.product.selling_price * item.quantity, currency)}
                    </p>
                  </div>
                  <button onClick={() => removeItem(item.cartId)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Discount */}
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">Discount</span>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rs.</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span>- {formatCurrency(discount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-700">
              <span>Total</span>
              <span>{formatCurrency(grandTotal, currency)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Payment Method</p>
              <div className="grid grid-cols-3 gap-1.5">
                {(["cash", "card", "credit"] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      paymentMethod === method
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">Amount paid</span>
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rs.</span>
                  <input
                    type="number"
                    min={grandTotal}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {change > 0 && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex-shrink-0">
                    Change: {formatCurrency(change, currency)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Checkout button */}
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkingOut}
              className="w-full btn-primary py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingOut ? "Processing..." : `Complete Sale — ${formatCurrency(grandTotal, currency)}`}
            </button>
          </div>
        </div>
      </div>

      <InvoiceModal
        open={!!invoiceSale}
        onClose={() => setInvoiceSale(null)}
        sale={invoiceSale}
        settings={settings}
      />
    </>
  );
}
