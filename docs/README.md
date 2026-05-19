# 🏎️ ApexGrid

Formula 1 Race Management Platform — Microservices Architecture

## Architecture

```
Frontend React (5173)
        ↓
API Gateway (8080)
        ↓
--------------------------------
| USER SERVICE (8082)         |
| Authentication & Users      |
--------------------------------
--------------------------------
| RACE SERVICE (8081)         |
| Races, Bookings, Email      |
--------------------------------
        ↓
PostgreSQL (5432)
```

## Prerequisites

- Java 17
- Maven 3.9+
- PostgreSQL 15+
- Node.js 18+

## Database Setup

1. Create database `apexgrid_db`
2. Run `database/schema.sql`
3. Update credentials in `application.properties` if needed

## Running the Services

### 1. Start PostgreSQL
Make sure PostgreSQL is running on port 5432.

### 2. Run User Service
```bash
cd user-service
mvn spring-boot:run
```
Port: 8082

### 3. Run Race Service
```bash
cd race-service
mvn spring-boot:run
```
Port: 8081

### 4. Run API Gateway
```bash
cd api-gateway
mvn spring-boot:run
```
Port: 8080

### 5. Run Frontend
```bash
cd frontend-react
npm install
npm run dev
```
Port: 5173

## API Endpoints (via Gateway)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login & get JWT |
| `/api/races` | GET | List all races |
| `/api/races/{id}` | GET | Race detail |
| `/api/races` | POST | Create race (Admin) |
| `/api/bookings` | POST | Create booking |
| `/api/bookings` | GET | Booking history |

## Development Order

1. Database Foundation
2. User Service (JWT Auth)
3. Race Service (CRUD)
4. Booking Logic
5. Email SMTP
6. Scheduler
7. API Gateway
8. Frontend React
9. Testing & Polish

## Tech Stack

**Backend:** Java 17, Spring Boot, Spring Security, JWT, JPA/Hibernate  
**Frontend:** React, Vite, TailwindCSS, Axios  
**Database:** PostgreSQL  
**Tools:** Maven, Postman, VS Code

---
Built for portfolio & academic presentation.
