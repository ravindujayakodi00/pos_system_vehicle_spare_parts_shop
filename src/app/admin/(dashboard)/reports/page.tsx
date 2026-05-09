"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, Package, Users, DollarSign, Download } from "lucide-react";
import { reportsService, SalesSummary, ProductSalesReport } from "@/services/reports";
import { exportSalesReport } from "@/lib/backup";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const [salesSummary, setSalesSummary] = useState<SalesSummary[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportDate, setExportDate] = useState(new Date().toISOString().split("T")[0]);
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([
      reportsService.getDailySalesSummary(7),
      reportsService.getTopSellingProducts(10),
    ]).then(([summary, products]) => {
      setSalesSummary(summary);
      setTopProducts(products);
    }).catch(() => {
      showToast("Failed to load report data", "error");
    }).finally(() => setLoading(false));
  }, [showToast]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportSalesReport(exportDate);
      showToast(`Sales report for ${exportDate} downloaded`, "success");
    } catch {
      showToast("No sales data found for this date", "warning");
    } finally {
      setExporting(false);
    }
  };

  const totalRevenue = salesSummary.reduce((sum, d) => sum + d.total_revenue, 0);
  const totalSales = salesSummary.reduce((sum, d) => sum + d.total_sales, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Analytics for the last 7 days</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={exportDate}
            onChange={(e) => setExportDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "7-Day Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" },
          { label: "7-Day Sales", value: totalSales, icon: TrendingUp, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
          { label: "Top Products", value: topProducts.length, icon: Package, color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" },
          { label: "Avg Daily Revenue", value: formatCurrency(salesSummary.length ? totalRevenue / salesSummary.length : 0), icon: Users, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="surface-panel p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales chart */}
      <div className="surface-panel p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Daily Sales Revenue</h2>
        {loading ? (
          <div className="h-52 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
        ) : salesSummary.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-sm text-gray-400">
            No sales data for the last 7 days.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salesSummary} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: unknown) => [formatCurrency(Number(value)), "Revenue"]}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="total_revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top products */}
      <div className="surface-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Selling Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Rank</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Code</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Product</th>
                <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Units Sold</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">No sales data yet.</td>
                </tr>
              ) : (
                topProducts.map((product, idx) => (
                  <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3 text-sm font-bold text-gray-400">#{idx + 1}</td>
                    <td className="px-6 py-3">
                      <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                        {product.part_number}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{product.product_name}</td>
                    <td className="px-6 py-3 text-sm text-center text-gray-700 dark:text-gray-300">{product.quantity_sold}</td>
                    <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(product.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
