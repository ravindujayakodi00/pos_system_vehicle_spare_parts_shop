-- ============================================================
-- Migration 004: Extract roles into a separate table
-- ============================================================

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Seed default roles
INSERT INTO roles (name, is_visible) VALUES
  ('owner', true),
  ('receptionist', true),
  ('developer', false)
ON CONFLICT (name) DO NOTHING;

-- 3. Add role_id column to staff
ALTER TABLE staff ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES roles(id);

-- 4. Populate role_id from existing role text column
UPDATE staff s
SET role_id = r.id
FROM roles r
WHERE s.role = r.name;

-- 5. Make role_id NOT NULL now that it's populated
ALTER TABLE staff ALTER COLUMN role_id SET NOT NULL;

-- 6. Drop old RLS policies that depend on staff.role BEFORE dropping the column
DROP POLICY IF EXISTS "Owners can update settings" ON shop_settings;
DROP POLICY IF EXISTS "Owners can insert settings" ON shop_settings;
DROP POLICY IF EXISTS "Owners can manage backup_logs" ON backup_logs;

-- 7. Now safe to drop the old role text column
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;
ALTER TABLE staff DROP COLUMN IF EXISTS role;

-- 8. RLS for roles table (read-only for authenticated users)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- 9. Recreate RLS policies using the new roles join
CREATE POLICY "Owners can update settings"
  ON shop_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff
      JOIN roles ON roles.id = staff.role_id
      WHERE staff.user_id = auth.uid()
      AND roles.name IN ('owner', 'developer')
    )
  );

CREATE POLICY "Owners can insert settings"
  ON shop_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      JOIN roles ON roles.id = staff.role_id
      WHERE staff.user_id = auth.uid()
      AND roles.name IN ('owner', 'developer')
    )
  );

CREATE POLICY "Owners can manage backup_logs"
  ON backup_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      JOIN roles ON roles.id = staff.role_id
      WHERE staff.user_id = auth.uid()
      AND roles.name IN ('owner', 'developer')
    )
  );
