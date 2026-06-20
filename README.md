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
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-Microservices-FF6B6B?style=flat-square" />
  <img src="https://img.shields.io/badge/Auth-JWT-000000?style=flat-square" />
  <img src="https://img.shields.io/badge/Gateway-Spring_Cloud-6DB33F?style=flat-square" />
  <img src="https://img.shields.io/badge/API_Docs-Swagger_UI-85EA2D?style=flat-square" />
  <img src="https://img.shields.io/badge/Status-Production_Ready-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/Last_Updated-June_20,_2026-blue?style=flat-square" />
</p>

---

## 📖 About

**ApexGrid** is a comprehensive F1 race ticket booking platform that allows fans to browse all 25 Grand Prix events of the 2026 season, book tickets with real-time quota management, simulate payment, and manage their reservations. Built as a microservices architecture to demonstrate scalable enterprise application design — fully containerized with Docker.

### ✨ Key Highlights

- 🔐 **JWT Authentication** — Secure stateless auth with role-based access control (USER & ADMIN)
- 🏁 **Real-time Quota** — Database-triggered quota management (auto-decrements on booking confirmation)
- 🎟️ **Booking Lifecycle** — PENDING → CONFIRMED → CANCELLED with auto-expiry (30 min)
- 💳 **Payment Simulation** — QRIS, Bank Transfer (BCA/BNI/Mandiri), and Credit Card payment flows
- ⏱️ **Live Countdown Timer** — 30-minute payment countdown for pending bookings
- 📱 **QR Code E-Tickets** — Auto-generated PDF tickets with embedded QR codes upon confirmation
- 👨‍💼 **Admin Panel** — Full CRUD race & circuit management for administrators
- 📊 **System Monitoring** — Real-time microservice health checks via Admin Dashboard
- 🗺️ **Interactive Circuit Map** — Clickable SVG seating zone map per race (GA, Grandstand, VIP)
- 🌐 **API Gateway** — Centralized routing with Spring Cloud Gateway
- 📧 **Async Email** — Non-blocking email verification & password reset (Gmail SMTP)
- 🌙 **Dark / Light Mode** — Full theme support with smooth toggle transition
- 🐳 **Docker Ready** — One-command full-stack deployment via Docker Compose

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (React + Vite + Nginx)                 │
│              http://localhost  (Docker: port 80)             │
│  ┌──────┐ ┌──────────┐ ┌───────────┐ ┌──────────────────┐  │
│  │Login │ │Race List │ │  Payment  │ │  Admin Dashboard │  │
│  └──────┘ └──────────┘ └───────────┘ └──────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP /api/* (Nginx reverse proxy)
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
│  • Email Verification  │   │  • Quota Management          │
│  • Password Reset      │   │  • Payment Confirmation      │
│  • Role Management     │   │  • Auto-expire Scheduler     │
│  • BCrypt Hashing      │   │  • PDF E-Ticket + QR Code    │
│  • Swagger UI (:8082)  │   │  • Swagger UI (:8081)        │
└──────────┬─────────────┘   └──────────────┬───────────────┘
           │                                │
           └────────────┬───────────────────┘
                        ▼
          ┌──────────────────────────┐
          │   PostgreSQL Database    │
          │   localhost:5432         │
          │   apexgrid_db            │
          │                          │
          │  • users & roles         │
          │  • 25 circuits           │
          │  • 25 races (2026)       │
          │  • bookings              │
          │  • verification_tokens   │
          │  • password_reset_tokens │
          │  • email_logs            │
          │  • triggers & 4 views    │
          └──────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Java 17** | Primary language |
| **Spring Boot 3.2** | Application framework |
| **Spring Security** | Authentication & authorization |
| **Spring Cloud Gateway** | API routing & CORS management |
| **Spring Data JPA** | ORM / database access |
| **Spring Mail** | Async email (verification & password reset) |
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
| **Vanilla CSS** | Custom design system & theme variables |
| **React Router 6** | Client-side routing |
| **Axios** | HTTP client with JWT interceptors |

### DevOps & Deployment
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-service orchestration |
| **Nginx** | Frontend production server & API reverse proxy |
| **Maven Multi-module** | Build & dependency management |
| **PostgreSQL Triggers** | Auto quota management & expiry |

---

## 🔑 Features

### Authentication & Authorization
- ✅ User registration with form validation
- ✅ Email verification via magic link (Gmail SMTP)
- ✅ Login with JWT token generation (24hr expiry)
- ✅ Password reset via secure email link
- ✅ BCrypt password hashing
- ✅ Auto-logout on 401 response
- ✅ Role-based access: `USER` and `ADMIN`

### Race Management (Admin)
- ✅ Create new races linked to circuits
- ✅ Update race details (name, date, price, quota, status)
- ✅ Delete races with confirmation modal
- ✅ Full circuit CRUD management
- ✅ Filter & search races by name, season, status

### Booking System
- ✅ Book tickets with zone & quantity selection
- ✅ Real-time quota validation
- ✅ Unique booking code generation (`APEX-XXXXXX`)
- ✅ Auto price calculation (price × quantity × zone multiplier)
- ✅ Booking lifecycle: `PENDING` → `CONFIRMED` / `CANCELLED`
- ✅ Auto-expiry after 30 minutes (scheduled job)
- ✅ Quota auto-restore on cancellation (DB trigger)
- ✅ PDF e-ticket with embedded QR code on confirmation

### Payment Flow
- ✅ Dedicated payment page with 30-minute live countdown timer
- ✅ **QRIS** — Mock QR code payment with animated scan UI
- ✅ **Bank Transfer** — BCA / BNI / Mandiri virtual account simulation
- ✅ **Credit Card** — Card number, expiry, CVV with real-time formatting
- ✅ Payment processing animation & success state
- ✅ Auto-redirect to booking history after payment

### Frontend & UI/UX
- ✅ **Dark / Light Mode** — Full theme toggle with smooth transition, CSS variables
- ✅ **F1 Dark Theme** — Ultra-premium `#0A0A0F` + `#E10600` with glassmorphism
- ✅ **Interactive Seating Zone Map** — Clickable SVG circuit segments (GA, Grandstand, VIP)
- ✅ **Live Countdown Timer** — Animated 30-minute payment countdown
- ✅ **Glassmorphism Modals** — Custom `ConfirmModal` replacing native browser popups
- ✅ **Real-Time Health Checks** — Microservice status monitoring in Admin Dashboard
- ✅ **Skeleton Loaders** — Layout-preserving cards during data fetch
- ✅ **Toast Notifications** — Dismissible alerts with progress bar auto-dismiss
- ✅ **Page Transitions** — Fluid fade & slide animations on route change
- ✅ **SVG Image Fallbacks** — Checkered flag fallback for invalid race image URLs
- ✅ **Protected Routes** — Auth-guarded navigation for users and admins

---

## 🚀 Quick Start (Docker — Recommended)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Clone & Configure

```bash
git clone https://github.com/a1fariz/ApexGrid.git
cd ApexGrid

# Copy environment template and fill in your credentials
cp .env.example .env
```

Edit `.env` with your values:

```env
DB_USERNAME=apex
DB_PASSWORD=apex123
JWT_SECRET=your-very-long-secret-key-here
INTERNAL_SECRET=your-internal-service-secret
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=your-16-char-gmail-app-password
```

### 2. Run Full Stack

```bash
docker-compose up --build -d
```

This single command will:
1. Start **PostgreSQL** and auto-seed 25 circuits + 25 F1 2026 races
2. Build & run **User Service**, **Race Service**, **API Gateway** (Spring Boot)
3. Build **React** app for production and serve via **Nginx** with API reverse proxy

### 3. Access the App

| URL | Description |
|-----|-------------|
| 🌐 **http://localhost** | Frontend App |
| 📋 http://localhost:8081/swagger-ui.html | Race Service API Docs |
| 📋 http://localhost:8082/swagger-ui.html | User Service API Docs |

> ⚠️ **First startup takes ~2 minutes** for Spring Boot services to fully initialize.

### Stop Services

```bash
docker-compose down          # Stop containers
docker-compose down -v       # Stop + delete database volume
```

---

## 🌐 Public Demo via ngrok

To share a live demo link without cloud deployment:

```bash
# 1. Download ngrok: https://ngrok.com/download
# 2. Add your auth token (from dashboard.ngrok.com)
ngrok config add-authtoken YOUR_TOKEN

# 3. Make sure Docker containers are running
docker-compose up -d

# 4. Expose to the internet
ngrok http 80
```

ngrok will generate a public URL like `https://xxxx.ngrok-free.app` — share it with anyone for live demo access.

---

## 🏃 Manual Setup (Without Docker)

### Prerequisites

| Software | Version |
|----------|---------|
| Java (JDK) | 17+ |
| Maven | 3.8+ |
| Node.js | 18+ |
| PostgreSQL | 15+ |

### Step 1: Database

```bash
psql -U postgres -c "CREATE DATABASE apexgrid_db;"
psql -U postgres -f database/setup-user.sql
psql -U postgres -d apexgrid_db -f database/schema.sql
```

### Step 2: Backend Services (3 terminals)

```bash
# Terminal 1 — User Service (port 8082)
cd user-service && mvn spring-boot:run

# Terminal 2 — Race Service (port 8081)
cd race-service && mvn spring-boot:run

# Terminal 3 — API Gateway (port 8080)
cd api-gateway && mvn spring-boot:run
```

### Step 3: Frontend

```bash
cd frontend-react
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## 👤 Creating an Admin Account

1. Register a new account at `/register`
2. Promote to admin in PostgreSQL:

```sql
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'ADMIN') 
WHERE username = 'your-username';
```

3. Re-login to get a refreshed JWT with ADMIN role

---

## 📡 API Endpoints

All endpoints accessed through API Gateway at `http://localhost:8080`.

### 🔐 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login, returns JWT |
| `GET` | `/api/auth/me` | `Bearer JWT` | Get current user info |
| `GET` | `/api/auth/verify?token=` | — | Verify email address |
| `POST` | `/api/auth/forgot-password` | — | Request password reset |
| `POST` | `/api/auth/reset-password` | — | Reset with token |

### 🏁 Races

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/races/search` | — | Search & filter races |
| `GET` | `/api/races/{id}` | — | Race detail with circuit |
| `GET` | `/api/races/upcoming` | — | Upcoming races |
| `POST` | `/api/races` | `ADMIN` | Create new race |
| `PUT` | `/api/races/{id}` | `ADMIN` | Update race |
| `DELETE` | `/api/races/{id}` | `ADMIN` | Delete race |

### 🎟️ Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/bookings` | `Bearer JWT` | Create booking |
| `GET` | `/api/bookings` | `Bearer JWT` | My bookings |
| `GET` | `/api/bookings/{code}` | `Bearer JWT` | Booking by code |
| `PUT` | `/api/bookings/{id}/confirm` | `Bearer JWT` | Confirm / pay booking |
| `PUT` | `/api/bookings/{id}/cancel` | `Bearer JWT` | Cancel booking |
| `GET` | `/api/bookings/{id}/ticket` | `Bearer JWT` | Download PDF e-ticket |

---

## 🗃️ Database Schema

### Tables
| Table | Description |
|-------|-------------|
| `roles` | User roles (USER, ADMIN) |
| `users` | User accounts with BCrypt-hashed passwords |
| `verification_tokens` | Email verification magic link tokens |
| `password_reset_tokens` | Password reset tokens (1hr expiry) |
| `circuits` | 25 real F1 circuits with lap records & location data |
| `races` | 25 race events (2026 season) with quota & pricing |
| `bookings` | Ticket bookings with full lifecycle status |
| `email_logs` | Async email audit trail with retry count |

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
| `v_admin_statistics` | Aggregate totals: revenue, tickets sold, unique customers |
| `v_race_popularity` | Tickets sold & revenue per race, ordered by popularity |

---

## 📦 Project Structure

```
apexgrid-project/
│
├── 📂 api-gateway/                    # Spring Cloud Gateway
│   ├── Dockerfile
│   └── src/main/java/.../gateway/
│       ├── config/GatewayConfig.java  # Routes & CORS
│       └── filter/AuthenticationFilter.java
│
├── 📂 user-service/                   # Auth & User Management
│   ├── Dockerfile
│   └── src/main/java/.../userservice/
│       ├── controller/AuthController.java
│       ├── service/
│       │   ├── AuthServiceImpl.java
│       │   └── UserEmailService.java  # Email verification & reset
│       ├── entity/ (User, Role, VerificationToken, PasswordResetToken)
│       └── security/ (JwtUtils, JwtAuthenticationFilter)
│
├── 📂 race-service/                   # Races, Bookings & Email
│   ├── Dockerfile
│   └── src/main/java/.../raceservice/
│       ├── race/controller/RaceController.java
│       ├── booking/
│       │   ├── controller/BookingController.java
│       │   └── service/BookingServiceImpl.java
│       └── scheduler/                 # Auto-cancel expired bookings
│
├── 📂 frontend-react/                 # React + Vite + TailwindCSS
│   ├── Dockerfile
│   ├── nginx.conf                     # Nginx config with /api proxy
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Home.jsx               # Race listing + search + pagination
│       │   ├── RaceDetail.jsx         # Detail + interactive booking
│       │   ├── Payment.jsx            # Payment page (QRIS/Bank/Card)
│       │   ├── BookingHistory.jsx
│       │   ├── VerifyAccount.jsx      # Email verification handler
│       │   ├── AdminDashboard.jsx
│       │   ├── AdminRaceManagement.jsx
│       │   └── AdminCircuitManagement.jsx
│       ├── components/
│       │   ├── Navbar.jsx             # Dark/Light mode toggle
│       │   ├── BookingCard.jsx
│       │   ├── PaymentModal.jsx       # Payment flow modal
│       │   ├── CircuitOutline.jsx     # SVG interactive seating map
│       │   ├── ConfirmModal.jsx
│       │   └── Toast.jsx
│       ├── index.css                  # F1 theme + light mode overrides
│       └── services/api.js            # Axios + JWT interceptors
│
├── 📂 database/
│   └── schema.sql                     # Tables, triggers, views + 25 races seeded
│
├── docker-compose.yml                 # Full-stack orchestration
├── .env.example                       # Environment template
└── pom.xml                            # Parent Maven POM
```

---

## ⚙️ Configuration

### Docker Ports

| Service | External Port | Description |
|---------|---------------|-------------|
| **Frontend (Nginx)** | `80` | React app + API proxy |
| **API Gateway** | `8080` | Spring Cloud Gateway |
| **Race Service** | `8081` | Race & booking microservice |
| **User Service** | `8082` | Auth & user microservice |
| **PostgreSQL** | `5432` | Database |

### Environment Variables (`.env`)

| Variable | Description |
|----------|-------------|
| `DB_USERNAME` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | Shared JWT signing secret (must match across services) |
| `INTERNAL_SECRET` | Internal service authentication key |
| `MAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `MAIL_PORT` | SMTP port (`587` for TLS) |
| `MAIL_USERNAME` | Gmail address for sending emails |
| `MAIL_PASSWORD` | Gmail App Password (16 chars, no spaces) |

> 📌 **Email is optional** — if SMTP fails, verification links are logged to Docker console as fallback.

---

## 🔄 Business Flow

```
User Registration → Email Verification
       │
       ▼
   JWT Login ──────────────► Browse Races (Public)
       │                             │
       │                             ▼
       │                   Select Race & Zone & Quantity
       │                             │
       ▼                             ▼
   Authenticated ──────────► Create Booking (PENDING)
                                     │
                          ┌──────────┼──────────┐
                          ▼                     ▼
                   Go to Payment       Auto-Expire (30 min)
                  (30min countdown)      (CANCELLED)
                          │                     │
                          ▼                     ▼
                  Choose Payment Method   Quota Restored
                  (QRIS/Bank/Card)        (DB Trigger)
                          │
                          ▼
                  Confirm Booking (CONFIRMED)
                          │
                          ▼
                  Quota Decremented (DB Trigger)
                  PDF E-Ticket + QR Code Generated
```

---

## 📄 License

This project is developed for educational purposes as part of a university/portfolio project.

---

<p align="center">
  Built with 💻 and ☕ by <strong>Muhammad Alfarizi</strong><br/>
  Last updated: June 20, 2026
</p>
