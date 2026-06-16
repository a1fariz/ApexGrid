-- ============================================================
-- APEXGRID MIGRATION v3 — Add scanned_at & zone columns
-- Run this on an existing apexgrid_db
-- ============================================================

-- Add scanned_at column (untuk QR ticket scan)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMP;

-- Add zone column (GA, GS, VIP)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS zone VARCHAR(10) DEFAULT 'GA';

-- Done
SELECT 'Migration v3 completed successfully' AS result;
