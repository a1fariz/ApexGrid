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
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ============================================================
-- 2.5. VERIFICATION TOKENS
-- ============================================================
CREATE TABLE verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expired_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_verif_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 2.6. PASSWORD RESET TOKENS
-- ============================================================
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expired_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reset_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 2.7. REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
INSERT INTO circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, description) VALUES
(1, 'Albert Park Circuit', 'Melbourne', 'Australia', 5.278, 58, '1:19.813', 'Charles Leclerc', 'Street circuit around Albert Park Lake'),
(2, 'Shanghai International Circuit', 'Shanghai', 'China', 5.451, 56, '1:32.238', 'Michael Schumacher', 'Features a demanding layout shaped like the Chinese character "Shang"'),
(3, 'Suzuka International Racing Course', 'Suzuka', 'Japan', 5.807, 53, '1:30.983', 'Lewis Hamilton', 'Unique figure-of-eight layout with challenging corner sequences'),
(4, 'Bahrain International Circuit', 'Sakhir', 'Bahrain', 5.412, 57, '1:30.252', 'Michael Schumacher', 'Spectacular desert night race with long straights and heavy braking zones'),
(5, 'Jeddah Corniche Circuit', 'Jeddah', 'Saudi Arabia', 6.174, 50, '1:30.734', 'Lewis Hamilton', 'The fastest street circuit in Formula 1 history'),
(6, 'Miami International Autodrome', 'Miami', 'USA', 5.412, 57, '1:29.708', 'Max Verstappen', 'Constructed around the Hard Rock Stadium complex in Miami Gardens'),
(7, 'Autodromo Enzo e Dino Ferrari', 'Imola', 'Italy', 4.909, 63, '1:15.484', 'Lewis Hamilton', 'Classic, fast parkland circuit filled with rich F1 history'),
(8, 'Circuit de Monaco', 'Monte Carlo', 'Monaco', 3.337, 78, '1:12.909', 'Lewis Hamilton', 'The jewel in the crown of Formula 1, tight and narrow street circuit'),
(9, 'Circuit de Barcelona-Catalunya', 'Barcelona', 'Spain', 4.657, 66, '1:16.330', 'Max Verstappen', 'All-rounder circuit with high-speed corners and a long main straight'),
(10, 'Circuit Gilles Villeneuve', 'Montreal', 'Canada', 4.361, 70, '1:13.078', 'Valtteri Bottas', 'Located on Notre Dame Island, famous for the Wall of Champions'),
(11, 'Red Bull Ring', 'Spielberg', 'Austria', 4.318, 71, '1:05.619', 'Carlos Sainz', 'Short, fast, high-altitude track nestled in the Styrian hills'),
(12, 'Silverstone Circuit', 'Silverstone', 'United Kingdom', 5.891, 52, '1:27.097', 'Max Verstappen', 'Historical home of British motorsport, famous for high-speed corners'),
(13, 'Hungaroring', 'Budapest', 'Hungary', 4.381, 70, '1:16.627', 'Lewis Hamilton', 'Twisty, dusty track with high downforce demands, often called Monaco without walls'),
(14, 'Circuit de Spa-Francorchamps', 'Spa-Francorchamps', 'Belgium', 7.004, 44, '1:40.510', 'Oscar Piastri', 'Breathtaking track in the Ardennes forest featuring the legendary Eau Rouge'),
(15, 'Circuit Zandvoort', 'Zandvoort', 'Netherlands', 4.259, 72, '1:11.097', 'Lewis Hamilton', 'Undulating circuit with steep banking curves by the North Sea dunes'),
(16, 'Autodromo Nazionale Monza', 'Monza', 'Italy', 5.793, 53, '1:21.046', 'Rubens Barrichello', 'The Temple of Speed, fastest track on the F1 calendar'),
(17, 'Madrid Street Circuit', 'Madrid', 'Spain', 5.474, 55, 'N/A', 'N/A', 'New semi-street circuit in Madrid making its debut on the F1 calendar'),
(18, 'Baku City Circuit', 'Baku', 'Azerbaijan', 6.003, 51, '1:43.009', 'Charles Leclerc', 'Combines tight historic Old City sections with a massive 2.2km main straight'),
(19, 'Marina Bay Street Circuit', 'Singapore', 'Singapore', 4.940, 62, '1:35.867', 'Kevin Magnussen', 'Physically demanding night street race in the heart of Singapore'),
(20, 'Circuit of The Americas', 'Austin', 'USA', 5.513, 56, '1:36.169', 'Charles Leclerc', 'Modern classic facility with design inspired by famous corners worldwide'),
(21, 'Autodromo Hermanos Rodriguez', 'Mexico City', 'Mexico', 4.304, 71, '1:17.774', 'Valtteri Bottas', 'Highest-altitude track on the calendar, featuring the vibrant stadium section'),
(22, 'Autodromo Jose Carlos Pace', 'Sao Paulo', 'Brazil', 4.309, 71, '1:10.540', 'Valtteri Bottas', 'Undulating, anti-clockwise circuit with passionate carnival atmosphere'),
(23, 'Las Vegas Strip Circuit', 'Las Vegas', 'USA', 6.201, 50, '1:35.490', 'Oscar Piastri', 'High-speed street track racing past iconic Las Vegas casinos and landmarks'),
(24, 'Lusail International Circuit', 'Lusail', 'Qatar', 5.419, 57, '1:24.319', 'Max Verstappen', 'Fast, flowing track with medium-to-high speed corners under floodlights'),
(25, 'Yas Marina Circuit', 'Yas Island', 'Abu Dhabi', 5.281, 58, '1:25.637', 'Kevin Magnussen', 'State-of-the-art twilight race to close out the Formula 1 season');

SELECT setval('circuits_id_seq', (SELECT MAX(id) FROM circuits));

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
INSERT INTO races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, description, status) VALUES
(1, 'Australian Grand Prix 2026', 1, '2026-03-08 15:00:00', '15:00:00', 2026, 1, 5000, 5000, 199.99, 'Season opener at Albert Park', 'UPCOMING'),
(2, 'Chinese Grand Prix 2026', 2, '2026-03-15 15:00:00', '15:00:00', 2026, 2, 6000, 6000, 149.99, 'Sprint weekend in Shanghai', 'UPCOMING'),
(3, 'Japanese Grand Prix 2026', 3, '2026-03-29 14:00:00', '14:00:00', 2026, 3, 5500, 5500, 249.99, 'Race at the iconic Suzuka circuit', 'UPCOMING'),
(4, 'Bahrain Grand Prix 2026', 4, '2026-04-12 18:00:00', '18:00:00', 2026, 4, 4500, 4500, 299.99, 'Night race under the desert lights', 'UPCOMING'),
(5, 'Saudi Arabian Grand Prix 2026', 5, '2026-04-19 20:00:00', '20:00:00', 2026, 5, 4000, 4000, 349.99, 'High-speed street fight in Jeddah', 'UPCOMING'),
(6, 'Miami Grand Prix 2026', 6, '2026-05-03 16:00:00', '16:00:00', 2026, 6, 5000, 5000, 499.99, 'Sprint weekend in Miami Gardens', 'UPCOMING'),
(7, 'Emilia Romagna Grand Prix 2026', 7, '2026-05-17 15:00:00', '15:00:00', 2026, 7, 4000, 4000, 279.99, 'Returning to the historic Imola circuit', 'UPCOMING'),
(8, 'Monaco Grand Prix 2026', 8, '2026-06-07 15:00:00', '15:00:00', 2026, 8, 3000, 3000, 699.99, 'The legendary Monaco street race', 'UPCOMING'),
(9, 'Spanish Grand Prix 2026', 9, '2026-06-14 15:00:00', '15:00:00', 2026, 9, 6500, 6500, 299.99, 'Battle at Barcelona-Catalunya', 'UPCOMING'),
(10, 'Canadian Grand Prix 2026', 10, '2026-05-24 14:00:00', '14:00:00', 2026, 10, 5500, 5500, 329.99, 'Action-packed race in Montreal', 'UPCOMING'),
(11, 'Austrian Grand Prix 2026', 11, '2026-06-28 15:00:00', '15:00:00', 2026, 11, 6000, 6000, 259.99, 'Home race for Red Bull Racing', 'UPCOMING'),
(12, 'British Grand Prix 2026', 12, '2026-07-05 15:00:00', '15:00:00', 2026, 12, 8000, 8000, 399.99, 'Home race for British drivers at Silverstone', 'UPCOMING'),
(13, 'Hungarian Grand Prix 2026', 13, '2026-07-26 15:00:00', '15:00:00', 2026, 13, 5000, 5000, 239.99, 'High downforce race at Hungaroring', 'UPCOMING'),
(14, 'Belgian Grand Prix 2026', 14, '2026-07-19 15:00:00', '15:00:00', 2026, 14, 6000, 6000, 349.99, 'The Ardennes classic at Spa-Francorchamps', 'UPCOMING'),
(15, 'Dutch Grand Prix 2026', 15, '2026-08-30 15:00:00', '15:00:00', 2026, 15, 5000, 5000, 289.99, 'Oranje army home race at Zandvoort', 'UPCOMING'),
(16, 'Italian Grand Prix 2026', 16, '2026-09-06 15:00:00', '15:00:00', 2026, 16, 5000, 5000, 319.99, 'Tifosi celebration at Monza', 'UPCOMING'),
(17, 'Madrid Grand Prix 2026', 17, '2026-09-13 15:00:00', '15:00:00', 2026, 17, 4500, 4500, 399.99, 'Debut of the Madrid Street Circuit', 'UPCOMING'),
(18, 'Azerbaijan Grand Prix 2026', 18, '2026-09-27 15:00:00', '15:00:00', 2026, 18, 4000, 4000, 299.99, 'Street race chaos in Baku', 'UPCOMING'),
(19, 'Singapore Grand Prix 2026', 19, '2026-10-11 20:00:00', '20:00:00', 2026, 19, 3500, 3500, 499.99, 'F1 original night street race', 'UPCOMING'),
(20, 'United States Grand Prix 2026', 20, '2026-10-25 14:00:00', '14:00:00', 2026, 20, 6000, 6000, 399.99, 'American spectacle in Austin', 'UPCOMING'),
(21, 'Mexico City Grand Prix 2026', 21, '2026-11-01 14:00:00', '14:00:00', 2026, 21, 5000, 5000, 249.99, 'Fiesta in the high altitude of Mexico City', 'UPCOMING'),
(22, 'Brazilian Grand Prix 2026', 22, '2026-11-15 14:00:00', '14:00:00', 2026, 22, 5500, 5500, 199.99, 'Title battle at Interlagos', 'UPCOMING'),
(23, 'Las Vegas Grand Prix 2026', 23, '2026-11-21 22:00:00', '22:00:00', 2026, 23, 4000, 4000, 599.99, 'High stakes night race along the Strip', 'UPCOMING'),
(24, 'Qatar Grand Prix 2026', 24, '2026-11-29 20:00:00', '20:00:00', 2026, 24, 4500, 4500, 349.99, 'Flowing speed at Lusail International Circuit', 'UPCOMING'),
(25, 'Abu Dhabi Grand Prix 2026', 25, '2026-12-06 17:00:00', '17:00:00', 2026, 25, 5000, 5000, 449.99, 'Sunset season finale at Yas Marina', 'UPCOMING');

SELECT setval('races_id_seq', (SELECT MAX(id) FROM races));

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
    scanned_at TIMESTAMP,
    cancellation_reason VARCHAR(255),
    zone VARCHAR(10) DEFAULT 'GA',

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

    -- Reduce quota when booking confirmed
    IF OLD.status = 'PENDING'
       AND NEW.status = 'CONFIRMED' THEN

        UPDATE races
        SET available_quota = available_quota - NEW.quantity
        WHERE id = NEW.race_id;

    END IF;

    -- Restore quota ONLY if previously confirmed
    IF OLD.status = 'CONFIRMED'
       AND NEW.status = 'CANCELLED' THEN

        UPDATE races
        SET available_quota = available_quota + NEW.quantity
        WHERE id = NEW.race_id;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
