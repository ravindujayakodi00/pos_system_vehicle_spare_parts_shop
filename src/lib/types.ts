// Role Types
export interface Role {
  id: string;
  name: string;
  is_visible: boolean;
  created_at: string;
}

// User & Auth Types
export interface User {
  id: string;
  email: string;
  role_id: string;
  role: Role;
  name: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

// Product Types
export interface Product {
  id: string;
  part_number: string; // exactly 6 characters
  name: string;
  description?: string;
  category: string;
  brand?: string;
  compatible_vehicles?: string[];
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_level: number;
  unit: string;
  supplier_id?: string;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  vehicle_info?: string;
  total_purchases?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Supplier Types
export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Sale Types
export type PaymentMethod = "cash" | "card" | "credit";
export type SaleStatus = "completed" | "pending" | "refunded";

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  part_number: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_price: number;
}

/** Selected sale fields for dashboard / recent-sales lists */
export interface RecentSaleListItem {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  total_amount: number;
  payment_method: PaymentMethod;
  created_at: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name?: string;
  items_count: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  change_amount: number;
  status: SaleStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
  items?: SaleItem[];
}

// Purchase Order Types
export type PurchaseOrderStatus = "pending" | "received" | "partial" | "cancelled";

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  product_id: string;
  product_name: string;
  part_number: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  order_date: string;
  expected_date?: string;
  received_date?: string;
  total_amount: number;
  status: PurchaseOrderStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
  items?: PurchaseOrderItem[];
}

// Inventory Types
export type InventoryTransactionType = "restock" | "sale" | "adjustment" | "return" | "damage";

export interface InventoryTransaction {
  id: string;
  product_id: string;
  type: InventoryTransactionType;
  quantity: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

// Staff Types
export interface StaffMember {
  id: string;
  user_id?: string;
  name: string;
  role_id: string;
  role: Role;
  phone: string;
  email?: string;
  salary?: number;
  is_active: boolean;
  created_at: string;
}

// Settings Types
export interface ShopSettings {
  id: string;
  shop_name: string;
  phone: string;
  phone2?: string;
  email?: string;
  address?: string;
  currency: string;
  tax_rate: number;
  invoice_prefix: string;
  po_prefix: string;
  logo_url?: string;
  low_stock_threshold: number;
  max_products: number;
  created_at: string;
  updated_at: string;
}

// Backup Log
export interface BackupLog {
  id: string;
  backup_date: string;
  file_name: string;
  records_count: number;
  created_at: string;
}

// Dashboard Stats
export interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  totalProducts: number;
  lowStockItems: number;
  totalCustomers: number;
  monthlyRevenue: number;
}

// Toast
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

