-- ============================================================
-- Vehicle Spare Parts POS - Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- STAFF (linked to Supabase auth users)
-- ============================================================
create table if not exists staff (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  role text not null check (role in ('admin', 'manager', 'cashier', 'storekeeper')),
  phone text not null,
  email text,
  salary numeric(10, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  parent_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SUPPLIERS
-- ============================================================
create table if not exists suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_person text,
  phone text not null,
  email text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  part_number text not null unique,
  name text not null,
  description text,
  category text not null,
  brand text,
  compatible_vehicles text[],
  cost_price numeric(10, 2) not null default 0,
  selling_price numeric(10, 2) not null default 0,
  stock_quantity integer not null default 0,
  min_stock_level integer not null default 5,
  unit text not null default 'pcs',
  supplier_id uuid references suppliers(id) on delete set null,
  is_active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_part_number on products(part_number);
create index if not exists idx_products_category on products(category);

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  email text,
  address text,
  vehicle_info text,
  total_purchases numeric(12, 2) not null default 0,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_phone on customers(phone);

-- ============================================================
-- SALES
-- ============================================================
create table if not exists sales (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null unique,
  customer_id uuid references customers(id) on delete set null,
  customer_name text,
  items_count integer not null default 0,
  subtotal numeric(12, 2) not null default 0,
  discount_amount numeric(10, 2) not null default 0,
  tax_amount numeric(10, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  payment_method text not null check (payment_method in ('cash', 'card', 'credit')),
  amount_paid numeric(12, 2) not null default 0,
  change_amount numeric(10, 2) not null default 0,
  status text not null default 'completed' check (status in ('completed', 'pending', 'refunded')),
  notes text,
  created_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_created_at on sales(created_at desc);
create index if not exists idx_sales_customer_id on sales(customer_id);

-- ============================================================
-- SALE ITEMS
-- ============================================================
create table if not exists sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  product_name text not null,
  part_number text not null,
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  discount numeric(10, 2) not null default 0,
  total_price numeric(12, 2) not null
);

create index if not exists idx_sale_items_sale_id on sale_items(sale_id);
create index if not exists idx_sale_items_product_id on sale_items(product_id);

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
create table if not exists purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  po_number text not null unique,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  supplier_name text not null,
  order_date date not null default current_date,
  expected_date date,
  received_date date,
  total_amount numeric(12, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'received', 'partial', 'cancelled')),
  notes text,
  created_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PURCHASE ORDER ITEMS
-- ============================================================
create table if not exists purchase_order_items (
  id uuid primary key default uuid_generate_v4(),
  po_id uuid not null references purchase_orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  product_name text not null,
  part_number text not null,
  quantity_ordered integer not null,
  quantity_received integer not null default 0,
  unit_cost numeric(10, 2) not null,
  total_cost numeric(12, 2) not null
);

-- ============================================================
-- INVENTORY TRANSACTIONS
-- ============================================================
create table if not exists inventory_transactions (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete restrict,
  type text not null check (type in ('restock', 'sale', 'adjustment', 'return', 'damage')),
  quantity integer not null,
  reference_id uuid,
  reference_type text,
  notes text,
  created_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_transactions_product_id on inventory_transactions(product_id);
create index if not exists idx_inventory_transactions_created_at on inventory_transactions(created_at desc);

-- ============================================================
-- SHOP SETTINGS (single row)
-- ============================================================
create table if not exists shop_settings (
  id uuid primary key default uuid_generate_v4(),
  shop_name text not null default 'Vehicle Spare Parts Shop',
  phone text not null default '',
  email text,
  address text,
  currency text not null default 'LKR',
  tax_rate numeric(5, 2) not null default 0,
  invoice_prefix text not null default 'INV',
  po_prefix text not null default 'PO',
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed a default settings row
insert into shop_settings (id) values (uuid_generate_v4())
on conflict do nothing;

-- ============================================================
-- HELPER FUNCTIONS (for inventory management)
-- ============================================================
create or replace function increment_stock(product_id uuid, amount integer)
returns void as $$
  update products
  set stock_quantity = stock_quantity + amount,
      updated_at = now()
  where id = product_id;
$$ language sql;

create or replace function decrement_stock(product_id uuid, amount integer)
returns void as $$
  update products
  set stock_quantity = greatest(0, stock_quantity - amount),
      updated_at = now()
  where id = product_id;
$$ language sql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table staff enable row level security;
alter table products enable row level security;
alter table categories enable row level security;
alter table customers enable row level security;
alter table suppliers enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table inventory_transactions enable row level security;
alter table shop_settings enable row level security;

-- Authenticated users can read/write all data (tighten per role as needed)
create policy "Authenticated can read staff"
  on staff for select using (auth.role() = 'authenticated');

create policy "Authenticated can manage products"
  on products for all using (auth.role() = 'authenticated');

create policy "Authenticated can manage categories"
  on categories for all using (auth.role() = 'authenticated');

create policy "Authenticated can manage customers"
  on customers for all using (auth.role() = 'authenticated');

create policy "Authenticated can manage suppliers"
  on suppliers for all using (auth.role() = 'authenticated');

create policy "Authenticated can manage sales"
  on sales for all using (auth.role() = 'authenticated');

create policy "Authenticated can manage sale_items"
  on sale_items for all using (auth.role() = 'authenticated');

create policy "Authenticated can manage purchase_orders"
  on purchase_orders for all using (auth.role() = 'authenticated');

create policy "Authenticated can manage purchase_order_items"
  on purchase_order_items for all using (auth.role() = 'authenticated');

create policy "Authenticated can manage inventory"
  on inventory_transactions for all using (auth.role() = 'authenticated');

create policy "Authenticated can read settings"
  on shop_settings for select using (auth.role() = 'authenticated');

create policy "Admins can update settings"
  on shop_settings for update using (
    exists (
      select 1 from staff
      where staff.user_id = auth.uid()
      and staff.role = 'admin'
    )
  );
