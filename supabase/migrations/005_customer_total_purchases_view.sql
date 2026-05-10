-- ============================================================
-- Migration 005: Drop total_purchases column, use view instead
-- ============================================================

-- 1. Drop the column
ALTER TABLE customers DROP COLUMN IF EXISTS total_purchases;

-- 2. Create a view that computes total purchases from sales
CREATE OR REPLACE VIEW customers_with_totals AS
SELECT
  c.*,
  COALESCE(s.total_purchases, 0) AS total_purchases
FROM customers c
LEFT JOIN (
  SELECT customer_id, SUM(total_amount) AS total_purchases
  FROM sales
  WHERE status = 'completed'
  GROUP BY customer_id
) s ON s.customer_id = c.id;
