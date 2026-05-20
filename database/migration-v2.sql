-- ============================================================
-- APEXGRID MIGRATION v2 — Level 1 & Level 2 Features
-- Run this on an existing apexgrid_db to add new columns/views
-- ============================================================

-- Add ticket_pdf_url column to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ticket_pdf_url TEXT;

-- Create statistics view
CREATE OR REPLACE VIEW v_admin_statistics AS
SELECT 
    COUNT(*) FILTER (WHERE b.status = 'CONFIRMED') AS total_confirmed_bookings,
    COUNT(*) FILTER (WHERE b.status = 'PENDING') AS total_pending_bookings,
    COUNT(*) FILTER (WHERE b.status = 'CANCELLED') AS total_cancelled_bookings,
    COALESCE(SUM(b.total_price) FILTER (WHERE b.status = 'CONFIRMED'), 0) AS total_revenue,
    COALESCE(SUM(b.quantity) FILTER (WHERE b.status = 'CONFIRMED'), 0) AS total_tickets_sold,
    COUNT(DISTINCT b.user_id) AS total_unique_customers
FROM bookings b;

-- Race popularity view
CREATE OR REPLACE VIEW v_race_popularity AS
SELECT 
    r.id AS race_id,
    r.name AS race_name,
    c.name AS circuit_name,
    c.country,
    r.race_date,
    r.total_quota,
    r.available_quota,
    COALESCE(SUM(b.quantity) FILTER (WHERE b.status = 'CONFIRMED'), 0) AS tickets_sold,
    COALESCE(SUM(b.total_price) FILTER (WHERE b.status = 'CONFIRMED'), 0) AS revenue,
    COUNT(b.id) FILTER (WHERE b.status = 'CONFIRMED') AS confirmed_bookings
FROM races r
JOIN circuits c ON r.circuit_id = c.id
LEFT JOIN bookings b ON b.race_id = r.id
GROUP BY r.id, r.name, c.name, c.country, r.race_date, r.total_quota, r.available_quota
ORDER BY tickets_sold DESC;

-- Done
SELECT 'Migration v2 completed successfully' AS result;
