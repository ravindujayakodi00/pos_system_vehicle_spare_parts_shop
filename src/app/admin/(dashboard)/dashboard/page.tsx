"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/shared/StatCard";
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { reportsService } from "@/services/reports";
import { productsService } from "@/services/products";
import { customersService } from "@/services/customers";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Product, RecentSaleListItem } from "@/lib/types";

interface Stats {
  todaySales: number;
  todayRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  monthlyRevenue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    todaySales: 0,
    todayRevenue: 0,
    totalProducts: 0,
    lowStockCount: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
  });
  const [recentSales, setRecentSales] = useState<RecentSaleListItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        todayStats,
        monthlyRevenue,
        totalProducts,
        customers,
        lowStock,
        recent,
      ] = await Promise.all([
        reportsService.getTodayStats(),
        reportsService.getMonthlyRevenue(),
        productsService.getProductCount(),
        customersService.getCustomers(),
        productsService.getLowStockProducts(),
        reportsService.getRecentSales(5),
      ]);

      setStats({
        todaySales: todayStats.sales,
        todayRevenue: todayStats.revenue,
        totalProducts,
        lowStockCount: lowStock.length,
        totalCustomers: customers.length,
        monthlyRevenue,
      });
      setLowStockItems(lowStock.slice(0, 5));
      setRecentSales(recent);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of your spare parts shop
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Today's Sales" value={stats.todaySales} icon={ShoppingCart} color="blue" />
        <StatCard title="Today's Revenue" value={formatCurrency(stats.todayRevenue)} icon={DollarSign} color="green" />
        <StatCard title="Total Products" value={`${stats.totalProducts} / 400`} icon={Package} color="purple" />
        <StatCard title="Low Stock Items" value={stats.lowStockCount} icon={AlertTriangle} color="red" />
        <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} color="indigo" />
        <StatCard title="Monthly Revenue" value={formatCurrency(stats.monthlyRevenue)} icon={TrendingUp} color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="surface-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Sales</h2>
          </div>
          {recentSales.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No sales today yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentSales.map((sale) => (
                <div key={sale.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400">
                      {sale.invoice_number}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {sale.customer_name ?? "Walk-in"} · {formatDateTime(sale.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(sale.total_amount)}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{sale.payment_method}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="surface-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Low Stock Alerts</h2>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">
              All products are adequately stocked.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {lowStockItems.map((product) => (
                <div key={product.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-xs font-mono text-gray-400">{product.part_number}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {product.stock_quantity} left
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">min: {product.min_stock_level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
