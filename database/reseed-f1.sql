-- ============================================================
-- APEXGRID DATABASE RE-SEED (OFFICIAL F1 2026 DATA)
-- Run this as user apex to update the database
-- ============================================================

-- Delete existing booking history, email logs, races and circuits
DELETE FROM email_logs;
DELETE FROM bookings;
DELETE FROM races;
DELETE FROM circuits;

-- Insert circuits
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

-- Insert races
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
