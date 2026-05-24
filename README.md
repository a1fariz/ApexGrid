<h1 align="center">🏎️ ApexGrid</h1>

<p align="center">
  <strong>Formula 1 Race Ticket Booking Platform</strong><br/>
  A full-stack microservices application built with Spring Boot, React, and PostgreSQL
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-17+-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-Microservices-FF6B6B?style=flat-square" />
  <img src="https://img.shields.io/badge/Auth-JWT-000000?style=flat-square" />
  <img src="https://img.shields.io/badge/Gateway-Spring_Cloud-6DB33F?style=flat-square" />
  <img src="https://img.shields.io/badge/API_Docs-Swagger_UI-85EA2D?style=flat-square" />
  <img src="https://img.shields.io/badge/Status-Production_Ready-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/Last_Updated-May_20,_2026-blue?style=flat-square" />
</p>

---

## 📖 About

**ApexGrid** is a comprehensive F1 race ticket booking platform that allows fans to browse upcoming Grand Prix events, book tickets with real-time quota management, and manage their reservations. Built as a microservices architecture to demonstrate scalable enterprise application design.

### ✨ Key Highlights

- 🔐 **JWT Authentication** — Secure stateless auth with role-based access control (USER & ADMIN)
- 🏁 **Real-time Quota** — Database-triggered quota management (auto-decrements on booking)
- 🎟️ **Booking Lifecycle** — PENDING → CONFIRMED → CANCELLED with auto-expiry (30 min)
- 👨‍💼 **Admin Panel** — Full CRUD race management for administrators
- 🌐 **API Gateway** — Centralized routing with Spring Cloud Gateway
- 📧 **Async Email** — Non-blocking email notifications with retry logging
- 📋 **Swagger UI** — Interactive API documentation for both services
- 🎨 **F1 Dark Theme** — Premium dark UI with glassmorphism effects

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│                      localhost:5173                          │
│  ┌──────┐ ┌──────────┐ ┌───────────┐ ┌──────────────────┐  │
│  │Login │ │Race List │ │  Booking  │ │  Admin Dashboard │  │
│  └──────┘ └──────────┘ └───────────┘ └──────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP (Vite Proxy)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              API GATEWAY (Spring Cloud Gateway)              │
│                      localhost:8080                          │
│         /api/auth/** → :8082  |  /api/races/** → :8081      │
│                               |  /api/bookings/** → :8081   │
└──────────┬──────────────────────────────────┬───────────────┘
           │                                  │
           ▼                                  ▼
┌────────────────────────┐   ┌──────────────────────────────┐
│   USER SERVICE         │   │   RACE SERVICE               │
│   localhost:8082       │   │   localhost:8081              │
│                        │   │                              │
│  • JWT Auth            │   │  • CRUD Races & Circuits     │
│  • User Registration   │   │  • Booking Management        │
│  • Login & Token Gen   │   │  • Quota Management          │
│  • Role Management     │   │  • Email Service (Async)     │
│  • Password Hashing    │   │  • Booking Scheduler         │
│    (BCrypt)            │   │  • JWT Validation            │
│  • Swagger UI (:8082)  │   │  • Swagger UI (:8081)       │
└──────────┬─────────────┘   └──────────────┬───────────────┘
           │                                │
           └────────────┬───────────────────┘
                        ▼
          ┌──────────────────────────┐
          │   PostgreSQL Database    │
          │   localhost:5432         │
          │   apexgrid_db           │
          │                         │
          │  • users & roles        │
          │  • races & circuits     │
          │  • bookings             │
          │  • email_logs           │
          │  • triggers & views     │
          └─────────────────────────┘
```

---

## 📸 Screenshots

### 🔐 Authentication

<details open>
<summary><strong>Login Page</strong></summary>
<br/>
<img src="docs/login.png" alt="Login Page" width="100%" />
<p><em>F1-themed login page with dark gradient background — supports username or email authentication with JWT token generation.</em></p>
</details>

<details>
<summary><strong>Register Page</strong></summary>
<br/>
<img src="docs/register.png" alt="Register Page" width="100%" />
<p><em>User registration form with full name, username, email, password and confirm password fields — includes input validation.</em></p>
</details>

---

### 🏠 User Features

<details open>
<summary><strong>Home Page — Hero, Search & Pagination (Level 1)</strong></summary>
<br/>
<img src="docs/images/home.png" alt="Home Page" width="100%" />
<p><em>Landing page with "Experience Formula 1" hero section, advanced search bar, season/status filters, and paginated race cards.</em></p>
</details>

<details>
<summary><strong>Race Calendar — Browse Races</strong></summary>
<br/>
<img src="docs/raceBookings.png" alt="Race Calendar" width="100%" />
<p><em>Browse all upcoming F1 Grand Prix events with race cards showing date, location, price, ticket availability bar, and status badges (UPCOMING).</em></p>
</details>

<details>
<summary><strong>Race Detail & Ticket Booking</strong></summary>
<br/>
<img src="docs/bookings.png" alt="Race Detail & Booking" width="100%" />
<p><em>Detailed race information (date, season, circuit, country, track length) with real-time ticket booking — dynamic price calculation, quantity selector, and 30-minute booking expiry notice.</em></p>
</details>

<details>
<summary><strong>My Bookings — Booking History</strong></summary>
<br/>
<img src="docs/mybookings.png" alt="My Bookings" width="100%" />
<p><em>Personal booking dashboard with summary stats (All, Pending, Confirmed, Cancelled) and booking cards showing unique booking codes (APEX-XXXXXX), status badges, race details, and total price.</em></p>
</details>

<details>
<summary><strong>User Profile & E-Tickets (Level 2)</strong></summary>
<br/>
<img src="docs/images/user_profile.png" alt="User Profile" width="100%" />
<p><em>User profile showing account details, booking statistics, and the ability to download PDF e-tickets with QR codes for confirmed F1 bookings.</em></p>
</details>

---

### 👨‍💼 Admin Panel

<details open>
<summary><strong>Admin Dashboard — Analytics (Level 2)</strong></summary>
<br/>
<img src="docs/images/admin_dashboard.png" alt="Admin Dashboard" width="100%" />
<p><em>Admin overview featuring real-time statistics (Revenue, Tickets Sold, Unique Customers) powered by database views, booking status breakdown, and race popularity charts.</em></p>
</details>

<details>
<summary><strong>Race Management — Data Table</strong></summary>
<br/>
<img src="docs/race-manajement.png" alt="Race Management Table" width="100%" />
<p><em>Full race management table with columns for Race, Circuit, Date, Quota (available/total), Price, Status badges, and Edit/Delete action buttons.</em></p>
</details>

<details>
<summary><strong>Add New Race — Create Form</strong></summary>
<br/>
<img src="docs/add-new-race-admin.png" alt="Add New Race" width="100%" />
<p><em>Modal form for creating a new race — includes Race Name, Circuit selector, Status, Date & Time, Season, Round Number, Total Quota, Ticket Price, Description, and Image URL fields.</em></p>
</details>

<details>
<summary><strong>Edit Race — Update Form</strong></summary>
<br/>
<img src="docs/edit-race.png" alt="Edit Race" width="100%" />
<p><em>Pre-filled edit form for updating existing race details — same fields as create with current data loaded for modification.</em></p>
</details>

<details>
<summary><strong>Circuit Management (Level 1)</strong></summary>
<br/>
<img src="docs/images/circuit_management.png" alt="Circuit Management Table" width="100%" />
<p><em>Full CRUD interface for managing F1 circuits. Includes track length, lap records, and location data which acts as the foundation for F1 races.</em></p>
</details>

---

### 📋 API Documentation (Swagger UI)

<details>
<summary><strong>Race Service API — Swagger UI</strong></summary>
<br/>
<img src="docs/swagger-ui1.png" alt="Race Service Swagger" width="100%" />
<p><em>Interactive Swagger UI for Race Service (port 8081) — documents all race-controller and booking-controller endpoints with request/response schemas (RaceRequest, BookingResponse, etc.).</em></p>
</details>

<details>
<summary><strong>User Service API — Swagger UI</strong></summary>
<br/>
<img src="docs/swagger-ui2.png" alt="User Service Swagger" width="100%" />
<p><em>Interactive Swagger UI for User Service (port 8082) — documents auth-controller endpoints (register, login, me) with schemas (RegisterRequest, LoginRequest, JwtResponse, UserResponse).</em></p>
</details>

---

### 🗄️ Database Design

<details>
<summary><strong>Entity Relationship Diagram</strong></summary>
<br/>
<img src="docs/diagram-schema.png" alt="Database ER Diagram" width="100%" />
<p><em>Complete database schema showing all 6 tables (users, roles, races, circuits, bookings, email_logs) and 2 views (v_race_summary, v_booking_summary) with their relationships and column definitions.</em></p>
</details>

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Java 17** | Primary language |
| **Spring Boot 3.2** | Application framework |
| **Spring Security** | Authentication & authorization |
| **Spring Cloud Gateway** | API routing & load balancing |
| **Spring Data JPA** | ORM / database access |
| **Spring Mail** | Async email notifications |
| **JWT (jjwt 0.12.5)** | Stateless token authentication |
| **PostgreSQL 15+** | Relational database |
| **Lombok** | Boilerplate reduction |
| **SpringDoc OpenAPI** | API documentation (Swagger UI) |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **Vite 5** | Build tool & dev server |
| **TailwindCSS 3.4** | Utility-first CSS |
| **React Router 6** | Client-side routing |
| **Axios** | HTTP client with interceptors |

### DevOps & Tools
| Technology | Purpose |
|------------|---------|
| **Maven** | Build & dependency management |
| **PostgreSQL Triggers** | Auto quota management & expiry |
| **Database Views** | Optimized query aggregation |

---

## 🔑 Features

### Authentication & Authorization
- ✅ User registration with validation
- ✅ Login with JWT token generation
- ✅ BCrypt password hashing
- ✅ JWT claims: userId, role, email, fullName
- ✅ Token expiry (24 hours)
- ✅ Auto-logout on 401 response
- ✅ Role-based access: `USER` and `ADMIN`

### Race Management (Admin)
- ✅ Create new races linked to circuits
- ✅ Update race details (name, date, price, quota)
- ✅ Delete races
- ✅ View all races with circuit information
- ✅ Filter upcoming races

### Booking System
- ✅ Book tickets with quantity selection
- ✅ Real-time quota validation
- ✅ Unique booking code generation (APEX-XXXXXX)
- ✅ Auto price calculation (price × quantity)
- ✅ Booking lifecycle: PENDING → CONFIRMED / CANCELLED
- ✅ Auto-expiry (30 minutes via DB trigger)
- ✅ Quota auto-restore on cancellation (DB trigger)

### Frontend & UI/UX (Premium UAS Edition)
- ✅ **Deep Dark Theme** — Ultra-premium dark theme (#0A0A0F + #E10600) with neon-glow card borders
- ✅ **Interactive Seating Zone Map** — Clickable SVG racetrack segments (GA, Grandstand, VIP) with real-time multiplier calculations
- ✅ **Custom Glassmorphism Modals** — Replaced native browser popups with beautiful floating dialogs (`ConfirmModal`)
- ✅ **Skeleton Loaders** — Layout-preserving skeleton cards preventing content shifts during fetch
- ✅ **Page Transitions** — Fluid fade & slide animations for Router navigation
- ✅ **SVG Image Fallbacks** — Checkered flag start-grid SVG fallback handling for invalid URLs
- ✅ **Protected Routes** — Auth-guarded navigation for users and admin dashboards
- ✅ **Autofill Overrides** — Prevented browser input-autofill from breaking the dark theme background
- ✅ **Circular Progress Countdowns** — SVG circular countdown timer for pending booking expiries
- ✅ **Toast Notifications** — Beautiful alerts for system messages and user feedback

### API Documentation
- ✅ Swagger UI for Race Service (port 8081)
- ✅ Swagger UI for User Service (port 8082)
- ✅ OpenAPI 3.0 specification
- ✅ Interactive API testing

---

## 🚀 Quick Start

### Prerequisites

| Software | Version | Download |
|----------|---------|----------|
| Java (JDK) | 17+ | [adoptium.net](https://adoptium.net/) |
| Maven | 3.8+ | [maven.apache.org](https://maven.apache.org/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| PostgreSQL | 15+ | [postgresql.org](https://www.postgresql.org/) |

### Step 1: Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE apexgrid_db;"

# Create application user
psql -U postgres -f database/setup-user.sql

# Run full schema (tables, triggers, views, sample data)
psql -U postgres -d apexgrid_db -f database/schema.sql
```

### Step 2: Start All Services

**Option A: One-click (Windows)**
```powershell
.\start-all.bat
```

**Option B: Manual (3 terminals)**

```bash
# Terminal 1 — User Service (port 8082)
cd user-service && mvn spring-boot:run

# Terminal 2 — Race Service (port 8081)
cd race-service && mvn spring-boot:run

# Terminal 3 — API Gateway (port 8080)
cd api-gateway && mvn spring-boot:run
```

### Step 3: Start Frontend

```bash
cd frontend-react
npm install
npm run dev
```

### Step 4: Open App

| URL | Description |
|-----|-------------|
| 🌐 http://localhost:5173 | **Frontend App** |
| 📋 http://localhost:8081/swagger-ui.html | **Race Service API Docs** |
| 📋 http://localhost:8082/swagger-ui.html | **User Service API Docs** |

---

## 👤 Creating an Admin Account

1. Register a new account at `/register`
2. Update the role in PostgreSQL:

```sql
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'ADMIN') 
WHERE username = 'your-username';
```

3. Re-login to get updated JWT token with ADMIN role

---

## 📡 API Endpoints

All endpoints are accessed through the **API Gateway** at `http://localhost:8080`.

### 🔐 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login, returns JWT |
| `GET` | `/api/auth/me` | `Bearer JWT` | Get current user info |

### 🏁 Races

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/races` | — | List all races |
| `GET` | `/api/races/upcoming` | — | List upcoming races |
| `GET` | `/api/races/{id}` | — | Race detail with circuit |
| `GET` | `/api/races/circuits` | — | List all circuits |
| `POST` | `/api/races` | `ADMIN` | Create new race |
| `PUT` | `/api/races/{id}` | `ADMIN` | Update race |
| `DELETE` | `/api/races/{id}` | `ADMIN` | Delete race |

### 🎟️ Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/bookings` | `Bearer JWT` | Create booking |
| `GET` | `/api/bookings` | `Bearer JWT` | My bookings |
| `GET` | `/api/bookings/{code}` | `Bearer JWT` | Booking by code |
| `PUT` | `/api/bookings/{id}/confirm` | `Bearer JWT` | Confirm booking |
| `PUT` | `/api/bookings/{id}/cancel` | `Bearer JWT` | Cancel booking |

---

## 🧪 API Testing with cURL

### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"fan1","email":"fan1@f1.com","password":"pass123","fullName":"F1 Fan"}'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"fan1","password":"pass123"}'
```

### Book Tickets
```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"raceId":1,"quantity":2}'
```

### Confirm Booking
```bash
curl -X PUT http://localhost:8080/api/bookings/1/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🗃️ Database Schema

### Tables
| Table | Description |
|-------|-------------|
| `roles` | User roles (USER, ADMIN) |
| `users` | User accounts with hashed passwords |
| `circuits` | F1 circuit information (6 real circuits) |
| `races` | Race events with quota & pricing |
| `bookings` | Ticket bookings with lifecycle status |
| `email_logs` | Async email audit trail |

### Triggers
| Trigger | Function |
|---------|----------|
| `update_users_updated_at` | Auto-update `updated_at` on user modification |
| `update_races_updated_at` | Auto-update `updated_at` on race modification |
| `trg_update_quota` | Auto adjust `available_quota` on booking status change |
| `trg_set_expiry` | Auto set `expired_at = created_at + 30 min` on new booking |

### Views
| View | Description |
|------|-------------|
| `v_race_summary` | Race + circuit info joined |
| `v_booking_summary` | Booking + race + circuit info joined |

---

## 📦 Project Structure

```
apexgrid-project/
│
├── 📂 api-gateway/                    # Spring Cloud Gateway
│   └── src/main/java/.../gateway/
│       ├── ApiGatewayApplication.java
│       └── config/
│           └── GatewayConfig.java     # CORS configuration
│
├── 📂 user-service/                   # Authentication & User Management
│   └── src/main/java/.../userservice/
│       ├── controller/
│       │   └── AuthController.java    # Register, Login, Me
│       ├── service/
│       │   └── impl/AuthServiceImpl.java
│       ├── security/
│       │   ├── JwtUtils.java          # JWT token operations
│       │   ├── JwtAuthenticationFilter.java
│       │   ├── UserDetailsImpl.java
│       │   └── UserDetailsServiceImpl.java
│       ├── entity/
│       │   ├── User.java
│       │   └── Role.java
│       ├── dto/                       # Request/Response DTOs
│       ├── repository/
│       ├── config/
│       │   └── SecurityConfig.java
│       └── exception/
│
├── 📂 race-service/                   # Races, Bookings & Email
│   └── src/main/java/.../raceservice/
│       ├── race/
│       │   ├── controller/RaceController.java
│       │   ├── service/RaceServiceImpl.java
│       │   ├── entity/ (Race, Circuit)
│       │   ├── dto/
│       │   └── repository/
│       ├── booking/
│       │   ├── controller/BookingController.java
│       │   ├── service/BookingServiceImpl.java
│       │   ├── entity/Booking.java
│       │   ├── dto/
│       │   └── repository/
│       ├── email/
│       │   ├── EmailServiceImpl.java  # Async email sender
│       │   └── EmailLog.java
│       ├── scheduler/                 # Auto-cancel expired bookings
│       ├── config/
│       │   ├── SecurityConfig.java
│       │   ├── JwtAuthenticationFilter.java
│       │   ├── JwtUtils.java
│       │   └── AsyncConfig.java
│       └── exception/
│
├── 📂 frontend-react/                 # React + Vite + TailwindCSS
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Home.jsx               # Race listing
│       │   ├── RaceDetail.jsx         # Detail + booking form
│       │   ├── BookingHistory.jsx
│       │   ├── AdminDashboard.jsx
│       │   └── AdminRaceManagement.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── RaceCard.jsx
│       │   ├── BookingCard.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── Toast.jsx
│       │   └── LoadingSpinner.jsx
│       ├── context/AuthContext.jsx     # JWT auth state
│       ├── services/api.js            # Axios + interceptors
│       ├── hooks/useAuth.js
│       ├── App.jsx                    # Routes
│       └── index.css                  # F1 dark theme
│
├── 📂 database/
│   ├── schema.sql                     # Full schema + triggers + views + seeds
│   └── setup-user.sql                 # DB user creation
│
├── 📂 docs/                           # Screenshots & documentation
│   ├── login.png
│   ├── register.png
│   ├── home-page-user.png
│   ├── raceBookings.png
│   ├── bookings.png
│   ├── mybookings.png
│   ├── admin-dashboard.png
│   ├── race-manajement.png
│   ├── add-new-race-admin.png
│   ├── edit-race.png
│   ├── swagger-ui1.png
│   ├── swagger-ui2.png
│   └── diagram-schema.png
│
├── start-all.bat                      # One-click start (Windows)
├── stop-all.bat                       # Stop all services
└── pom.xml                            # Parent Maven POM
```

---

## ⚙️ Configuration

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | `8080` | Entry point for all API calls |
| Race Service | `8081` | Race & booking management |
| User Service | `8082` | Auth & user management |
| Frontend | `5173` | React dev server |
| PostgreSQL | `5432` | Database |

### JWT Configuration

Both `user-service` and `race-service` share the same JWT secret:

```properties
jwt.secret=apexgrid-super-secret-key-harus-panjang-banget-biar-aman-1234567890
jwt.expiration=86400000   # 24 hours in milliseconds
```

> ⚠️ **Important**: The JWT secret must be identical across both services for token validation to work cross-service.

### Email (Optional)

Configure Gmail SMTP in `race-service/src/main/resources/application.properties`:

```properties
spring.mail.username=your-gmail@gmail.com
spring.mail.password=your-16-char-app-password
```

> Email is **optional** — if not configured, emails are logged but not sent (graceful skip).

---

##  Business Flow

```
User Registration                Admin Creates Race
      │                                │
      ▼                                ▼
  JWT Login ──────────────►  Browse Races (Public)
      │                                │
      │                                ▼
      │                    Select Race & Quantity
      │                                │
      ▼                                ▼
  Authenticated ──────────►  Create Booking (PENDING)
                                       │
                              ┌────────┼────────┐
                              ▼                  ▼
                    Confirm Booking      Auto-Expire (30 min)
                     (CONFIRMED)            (CANCELLED)
                         │                      │
                         ▼                      ▼
                  Quota Decremented     Quota Restored
                  (DB Trigger)         (DB Trigger)
```

---

## 📄 License

This project is developed for educational purposes as part of a university/portfolio project.

---

<p align="center">
  Built with me and my ☕ by <strong>ApexGrid Team</strong><br/>
  Last updated: May 20, 2026
</p>
