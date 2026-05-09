-- ============================================================
-- Migration 002: Role simplification + product code constraint
-- + settings enhancements + backup tracking
-- ============================================================

-- Simplify staff roles to owner / receptionist
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;
ALTER TABLE staff ADD CONSTRAINT staff_role_check
  CHECK (role IN ('owner', 'receptionist'));

-- Enforce 6-character product code
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_part_number_length;
ALTER TABLE products ADD CONSTRAINT products_part_number_length
  CHECK (length(part_number) = 6);

-- Add settings columns for low stock threshold and max products
ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_products integer NOT NULL DEFAULT 400;

-- Backup logs table
CREATE TABLE IF NOT EXISTS backup_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_date date NOT NULL UNIQUE,
  file_name text NOT NULL,
  records_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage backup_logs"
  ON backup_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'owner'
    )
  );
