import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Truck,
  FileText,
  ShoppingBag,
  UserCog,
  BarChart2,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  ownerOnly?: boolean;
  disabled?: boolean;
}

export const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "POS", href: "/admin/pos", icon: ShoppingCart },
  { label: "Sales", href: "/admin/sales", icon: FileText },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Inventory", href: "/admin/inventory", icon: Layers },
  // { label: "Purchase Orders", href: "/admin/purchases", icon: ShoppingBag },
  { label: "Customers", href: "/admin/customers", icon: Users },
  // { label: "Suppliers", href: "/admin/suppliers", icon: Truck },
  { label: "Staff", href: "/admin/staff", icon: UserCog, ownerOnly: true },
  { label: "Reports", href: "/admin/reports", icon: BarChart2, ownerOnly: true },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
