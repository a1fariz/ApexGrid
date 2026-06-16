-- ============================================================
-- APEXGRID MIGRATION v4 — Email Verification (Magic Link)
-- Run this on an existing apexgrid_db
-- ============================================================

-- Add is_verified to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Automatically verify existing users (like Admin) so they don't get locked out
UPDATE users SET is_verified = TRUE;

-- Create verification_tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expired_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_verif_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Done
SELECT 'Migration v4 completed successfully' AS result;
