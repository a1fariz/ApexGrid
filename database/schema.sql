-- ============================================================
-- APEXGRID DATABASE SCHEMA
-- Database: apexgrid_db
-- PostgreSQL 15+
-- ============================================================

-- Drop tables if exist (for clean setup)
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS races CASCADE;
DROP TABLE IF EXISTS circuits CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ============================================================
-- 1. ROLES
-- ============================================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name) VALUES ('USER'), ('ADMIN');

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role_id INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ============================================================
-- 3. CIRCUITS
-- ============================================================
CREATE TABLE circuits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    length_km DECIMAL(6,3),
    number_of_laps INTEGER,
    lap_record VARCHAR(50),
    lap_record_holder VARCHAR(100),
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample circuits
INSERT INTO circuits (name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, description) VALUES
('Monza', 'Monza', 'Italy', 5.793, 53, '1:21.046', 'Rubens Barrichello', 'The Temple of Speed'),
('Silverstone', 'Silverstone', 'United Kingdom', 5.891, 52, '1:27.097', 'Max Verstappen', 'Home of British Racing'),
('Spa-Francorchamps', 'Spa', 'Belgium', 7.004, 44, '1:46.286', 'Valtteri Bottas', 'Most challenging circuit'),
('Suzuka', 'Suzuka', 'Japan', 5.807, 53, '1:30.983', 'Lewis Hamilton', 'Figure-8 layout'),
('Marina Bay', 'Singapore', 'Singapore', 5.063, 62, '1:35.867', 'Kevin Magnussen', 'Night race street circuit'),
('Interlagos', 'Sao Paulo', 'Brazil', 4.309, 71, '1:10.540', 'Valtteri Bottas', 'Anti-clockwise circuit');

-- ============================================================
-- 4. RACES
-- ============================================================
CREATE TABLE races (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    circuit_id INTEGER NOT NULL,
    race_date TIMESTAMP NOT NULL,
    race_time TIME,
    season INTEGER NOT NULL DEFAULT 2026,
    round INTEGER,
    total_quota INTEGER NOT NULL DEFAULT 1000,
    available_quota INTEGER NOT NULL DEFAULT 1000,
    ticket_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    status VARCHAR(20) DEFAULT 'UPCOMING',
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_races_circuit FOREIGN KEY (circuit_id) REFERENCES circuits(id) ON DELETE RESTRICT,
    CONSTRAINT chk_quota CHECK (available_quota >= 0 AND available_quota <= total_quota),
    CONSTRAINT chk_price CHECK (ticket_price >= 0)
);

-- Sample races
INSERT INTO races (name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, description, status) VALUES
('Italian Grand Prix 2026', 1, '2026-09-06 14:00:00', '14:00:00', 2026, 14, 5000, 5000, 299.99, 'Race at the Temple of Speed', 'UPCOMING'),
('British Grand Prix 2026', 2, '2026-07-05 15:00:00', '15:00:00', 2026, 10, 8000, 8000, 349.99, 'Home race for British drivers', 'UPCOMING'),
('Belgian Grand Prix 2026', 3, '2026-08-30 15:00:00', '15:00:00', 2026, 13, 6000, 6000, 279.99, 'The most iconic circuit in F1', 'UPCOMING'),
('Japanese Grand Prix 2026', 4, '2026-10-11 13:00:00', '13:00:00', 2026, 17, 4500, 4500, 259.99, 'Honda home race', 'UPCOMING'),
('Singapore Grand Prix 2026', 5, '2026-09-20 20:00:00', '20:00:00', 2026, 15, 3500, 3500, 499.99, 'Night race under the lights', 'UPCOMING'),
('Brazilian Grand Prix 2026', 6, '2026-11-15 14:00:00', '14:00:00', 2026, 20, 5500, 5500, 199.99, 'Season finale contender', 'UPCOMING');

-- ============================================================
-- 5. BOOKINGS
-- ============================================================
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(20) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    race_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'PENDING',
    ticket_pdf_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason VARCHAR(255),

    CONSTRAINT fk_bookings_race FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE RESTRICT,
    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT chk_total_price CHECK (total_price >= 0)
);

-- ============================================================
-- 6. EMAIL LOGS
-- ============================================================
CREATE TABLE email_logs (
    id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT,
    email_type VARCHAR(50) DEFAULT 'BOOKING_CONFIRMATION',
    booking_id INTEGER,
    status VARCHAR(20) DEFAULT 'PENDING',
    retry_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_email_logs_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role_id);

CREATE INDEX idx_races_circuit ON races(circuit_id);
CREATE INDEX idx_races_date ON races(race_date);
CREATE INDEX idx_races_status ON races(status);
CREATE INDEX idx_races_season ON races(season);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_race ON bookings(race_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_code ON bookings(booking_code);
CREATE INDEX idx_bookings_expired ON bookings(expired_at) WHERE status = 'PENDING';

CREATE INDEX idx_email_logs_booking ON email_logs(booking_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto update updated_at for users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto update updated_at for races
DROP TRIGGER IF EXISTS update_races_updated_at ON races;
CREATE TRIGGER update_races_updated_at
    BEFORE UPDATE ON races
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto update available_quota when booking confirmed/cancelled
CREATE OR REPLACE FUNCTION update_race_quota()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CONFIRMED' AND OLD.status = 'PENDING' THEN
        UPDATE races SET available_quota = available_quota - NEW.quantity WHERE id = NEW.race_id;
    ELSIF NEW.status = 'CANCELLED' AND OLD.status IN ('PENDING', 'CONFIRMED') THEN
        UPDATE races SET available_quota = available_quota + NEW.quantity WHERE id = NEW.race_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_update_quota ON bookings;
CREATE TRIGGER trg_update_quota
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_race_quota();

-- Auto set expired_at when booking created
CREATE OR REPLACE FUNCTION set_booking_expiry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expired_at = NEW.created_at + INTERVAL '30 minutes';
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_set_expiry ON bookings;
CREATE TRIGGER trg_set_expiry
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_booking_expiry();

-- ============================================================
-- VIEWS
-- ============================================================

-- Race summary with circuit info
CREATE OR REPLACE VIEW v_race_summary AS
SELECT 
    r.id,
    r.name,
    r.race_date,
    r.race_time,
    r.season,
    r.round,
    r.total_quota,
    r.available_quota,
    r.ticket_price,
    r.currency,
    r.status,
    c.name AS circuit_name,
    c.location,
    c.country,
    c.image_url AS circuit_image
FROM races r
JOIN circuits c ON r.circuit_id = c.id;

-- Booking summary
CREATE OR REPLACE VIEW v_booking_summary AS
SELECT 
    b.id,
    b.booking_code,
    b.user_id,
    b.race_id,
    b.quantity,
    b.total_price,
    b.status,
    b.created_at,
    b.expired_at,
    r.name AS race_name,
    r.race_date,
    c.name AS circuit_name,
    c.country
FROM bookings b
JOIN races r ON b.race_id = r.id
JOIN circuits c ON r.circuit_id = c.id;

-- Admin statistics - overview metrics
CREATE OR REPLACE VIEW v_admin_statistics AS
SELECT 
    COUNT(*) FILTER (WHERE b.status = 'CONFIRMED') AS total_confirmed_bookings,
    COUNT(*) FILTER (WHERE b.status = 'PENDING') AS total_pending_bookings,
    COUNT(*) FILTER (WHERE b.status = 'CANCELLED') AS total_cancelled_bookings,
    COALESCE(SUM(b.total_price) FILTER (WHERE b.status = 'CONFIRMED'), 0) AS total_revenue,
    COALESCE(SUM(b.quantity) FILTER (WHERE b.status = 'CONFIRMED'), 0) AS total_tickets_sold,
    COUNT(DISTINCT b.user_id) AS total_unique_customers
FROM bookings b;

-- Race popularity - tickets sold per race
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

-- ============================================================
-- END OF SCHEMA
-- ============================================================
