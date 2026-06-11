-- Migration V3: Add scanned_at to bookings table for QR code verification
ALTER TABLE bookings ADD COLUMN scanned_at TIMESTAMP;
