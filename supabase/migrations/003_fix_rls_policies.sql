-- ============================================================
-- Migration 003: Fix RLS policy using stale 'admin' role
-- ============================================================

-- Drop the old settings update policy that referenced the removed 'admin' role
DROP POLICY IF EXISTS "Admins can update settings" ON shop_settings;

-- Recreate with correct 'owner' role
CREATE POLICY "Owners can update settings"
  ON shop_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'owner'
    )
  );

-- Also allow owners to insert settings (in case settings row is missing)
CREATE POLICY "Owners can insert settings"
  ON shop_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'owner'
    )
  );
