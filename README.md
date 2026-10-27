# 🏎️ ApexGrid — Formula 1 Race Ticket Booking Platform

<p align="center">
  <img src="https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 17"/>
  <img src="https://img.shields.io/badge/Spring_Boot-3.2.0-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" alt="Spring Boot 3.2"/>
  <img src="https://img.shields.io/badge/Spring_Cloud-Gateway-6DB33F?style=for-the-badge&logo=spring&logoColor=white" alt="Spring Cloud Gateway"/>
  <img src="https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 18"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Compose"/>
  <img src="https://img.shields.io/badge/Security-JWT_RBAC-FF0055?style=for-the-badge" alt="JWT RBAC"/>
</p>

**ApexGrid** adalah platform pemesanan tiket balap Formula 1 berbasis arsitektur **Microservices**. Sistem ini dilengkapi dengan gerbang rute API terpusat (*API Gateway*), manajemen kuota tiket *real-time* berbasis *PostgreSQL triggers*, scheduler pembatalan otomatis untuk reservasi kedaluwarsa, otentikasi JWT dengan *Role-Based Access Control* (RBAC), pembuatan e-tiket PDF otomatis dengan kode QR unik, serta dashboard interaktif React.

---

## 📑 Daftar Isi
- [Arsitektur Microservices](#-arsitektur-microservices)
- [Fitur Utama](#-fitur-utama)
- [Alur Bisnis Pemesanan](#-alur-bisnis-pemesanan)
- [Spesifikasi API Endpoints](#-spesifikasi-api-endpoints)
- [Simulasi Pemindaian Tiket (QR Scan)](#-simulasi-pemindaian-tiket-qr-scan)
- [Skema & Trigger Database](#-skema--trigger-database)
- [Struktur Proyek](#-struktur-proyek)
- [Panduan Menjalankan Sistem](#-panduan-menjalankan-sistem)
- [Author & Lisensi](#-author--lisensi)

---

## 🏗️ Arsitektur Microservices

Sistem dibagi menjadi layanan independen yang diorkestrasi menggunakan Docker Compose:

```
                      ┌────────────────────────────────────────┐
                      │          React Frontend (Nginx)        │
                      │               Port: 80                 │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          Spring Cloud Gateway          │
                      │               Port: 8080               │
                      └──────────┬──────────────────┬──────────┘
                                 │                  │
                ┌────────────────┴────┐        ┌────┴────────────────┐
                │    User Service     │        │    Race Service     │
                │     Port: 8082      │        │     Port: 8081      │
                │  - Auth (JWT/BCrypt)│        │  - Races & Circuits │
                │  - Email Verify     │        │  - Booking Engine   │
                │  - Password Reset   │        │  - PDF + QR Ticket  │
                └──────────┬──────────┘        │  - Auto-Expiry Sched│
                           │                   └────┬────────────────┘
                           │                        │
                           └───────────┬────────────┘
                                       ▼
                      ┌────────────────────────────────────────┐
                      │             PostgreSQL 16              │
                      │               Port: 5432               │
                      │  - Atomic Quota Triggers               │
                      │  - Auto-Expiry Timestamp Triggers      │
                      │  - Analytical Materialized Views       │
                      └────────────────────────────────────────┘
```

---

## ✨ Fitur Utama

- 🔐 **Autentikasi & Keamanan Terenkripsi**: Registrasi akun dengan verifikasi email *magic link*, reset password, hashing kata sandi BCrypt, dan otorisasi JWT berbasis Role (USER & ADMIN).
- 🏎️ **Katalog Balapan F1 2026**: Menampilkan 25 seri balapan resmi dunia lengkap dengan sirkuit, panjang lintasan, rekor putaran, dan kategori tribun tempat duduk.
- 🗺️ **Peta Kursi Sirkuit Interaktif**: Komponen peta sirkuit SVG responsif dengan pilihan zona tribun (Grandstand, Paddock Club, Pit Straight).
- ⚡ **Manajemen Kuota Tiket Atomik**: Proteksi *race condition* dan *overbooking* menggunakan trigger database PostgreSQL transaksi tingkat tinggi.
- ⏳ **Reservasi Auto-Expiry (30 Menit)**: Tiket berstatus `PENDING` memiliki batas waktu pembayaran 30 menit. Scheduler otomatis membatalkan transaksi dan mengembalikan kuota secara atomik jika kedaluwarsa.
- 🎟️ **E-Tiket PDF & Validasi QR Code**: Setelah konfirmasi pembayaran, sistem men-generate e-tiket PDF siap unduh yang memuat kode QR unik.
- 📊 **Panel Administrator & Analisis**: Manajemen penuh data balapan & sirkuit, statistik pendapatan, tiket terjual, dan pemindai tiket QR untuk verifikasi di pintu masuk sirkuit.

---

## 🔄 Alur Bisnis Pemesanan

```
[User Register] ──► [Email Verification Link] ──► [Login (JWT)]
                                                         │
                                                         ▼
[Konfirmasi Bayar] ◄── [Pilih Metode Bayar] ◄── [Pilih Balapan & Kursi]
        │              (QRIS / Transfer / Card)          │
        │                                                ▼
        ▼                                      [Booking Status PENDING]
[Booking CONFIRMED]                                      │
        │                                      (Hitung Mundur 30 Menit)
        ▼                                                │
[Generate E-Tiket PDF + QR]                     [Kedaluwarsa / Batal]
        │                                                │
        ▼                                                ▼
[Scan QR di Gerbang Masuk]                     [Status CANCELLED & Kuota Kembali]
```

---

## 📡 Spesifikasi API Endpoints

### 🔐 Autentikasi & Pengguna (`user-service`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/auth/register` | Publik | Registrasi akun baru |
| `POST` | `/api/auth/login` | Publik | Login & mendapatkan JWT Token |
| `GET` | `/api/auth/verify-email` | Publik | Verifikasi email pengguna |
| `POST` | `/api/auth/forgot-password` | Publik | Permintaan tautan reset password |
| `POST` | `/api/auth/reset-password` | Publik | Eksekusi reset password baru |
| `GET` | `/api/users/me` | `Bearer JWT` | Ambil profil pengguna saat ini |

### 🏎️ Balapan & Sirkuit (`race-service`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/races` | Publik | Menampilkan daftar seluruh balapan |
| `GET` | `/api/races/{id}` | Publik | Detail informasi balapan & kuota |
| `GET` | `/api/races/upcoming` | Publik | Daftar balapan yang akan datang |
| `POST` | `/api/races` | `ADMIN` | Tambah jadwal balapan baru |
| `PUT` | `/api/races/{id}` | `ADMIN` | Perbarui data balapan |
| `DELETE` | `/api/races/{id}` | `ADMIN` | Hapus data balapan |

### 🎟️ Pemesanan & Tiket (`race-service`)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/bookings` | `Bearer JWT` | Buat reservasi pemesanan tiket baru |
| `GET` | `/api/bookings` | `Bearer JWT` | Riwayat seluruh pesanan pengguna |
| `GET` | `/api/bookings/{code}` | `Bearer JWT` | Ambil detail pemesanan via kode unik |
| `PUT` | `/api/bookings/{id}/confirm` | `Bearer JWT` | Konfirmasi pembayaran tiket |
| `PUT` | `/api/bookings/{id}/cancel` | `Bearer JWT` | Batalkan reservasi tiket |
| `GET` | `/api/bookings/{id}/ticket` | `Bearer JWT` | Unduh berkas E-Tiket PDF |
| `POST` | `/api/bookings/{code}/scan` | `ADMIN` | Scan QR code & validasi tiket di lokasi |

---

## 📱 Simulasi Pemindaian Tiket (QR Scan)

Untuk menguji alur validasi tiket QR di pintu masuk:
1. Login sebagai Admin via `POST /api/auth/login` untuk mendapatkan token `ADMIN`.
2. Lakukan request `POST /api/bookings/{booking-code}/scan` dengan header `Authorization: Bearer <ADMIN_TOKEN>`.
3. Sistem akan memvalidasi keaslian tiket:
   - Tiket valid: Status berubah menjadi `SCANNED` dan mengembalikan data penonton.
   - Tiket sudah pernah di-scan: Sistem mengembalikan pesan error tiket telah terpakai.

---

## 🗄️ Skema & Trigger Database

### Tabel Utama
- `users`, `roles`, `verification_tokens`, `password_reset_tokens`
- `circuits` (25 Sirkuit F1 resmi dunia)
- `races` (Jadwal balapan musim 2026, kuota, harga)
- `bookings` (Data pesanan, status siklus hidup, waktu kedaluwarsa)
- `email_logs` (Audit log pengiriman notifikasi email)

### Trigger Database
- **`trg_update_quota`**: Mengurangi `available_quota` saat status berubah menjadi `CONFIRMED`, dan otomatis mengembalikan kuota jika booking `CANCELLED`.
- **`trg_set_expiry`**: Otomatis menyetel `expired_at = created_at + 30 minutes` pada saat reservasi dibuat.

---

## 🚀 Panduan Menjalankan Sistem

### Menggunakan Docker Compose (Direkomendasikan)

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/a1fariz/ApexGrid.git
   cd ApexGrid
   ```

2. **Siapkan Konfigurasi Lingkungan (`.env`)**:
   ```bash
   cp .env.example .env
   ```

3. **Build & Jalankan Seluruh Layanan**:
   ```bash
   docker compose up --build -d
   ```

4. **Akses Layanan**:
   - **Frontend Web**: `http://localhost`
   - **API Gateway**: `http://localhost:8080`
   - **User Microservice**: `http://localhost:8082`
   - **Race Microservice**: `http://localhost:8081`

---

## 👨‍💻 Author

Dikembangkan oleh **Muhammad Hafiz Alfarizi** ([@a1fariz](https://github.com/a1fariz)).  
*Dibuat untuk portofolio rekayasa perangkat lunak berskala enterprise dan arsitektur microservices.*

## Cakupan verifikasi

Repositori ini mendemonstrasikan arsitektur layanan, autentikasi, dan alur reservasi. Aturan kedaluwarsa 30 menit adalah aturan bisnis; angka tersebut bukan metrik performa. Klaim kapasitas, latensi, dan kesiapan production memerlukan hasil pengujian serta bukti operasional tersendiri.

---

[Portfolio Alfa Rizi](https://alfarizi.my.id) · [GitHub profile](https://github.com/a1fariz) · [Contact](mailto:alfarizi.developer@gmail.com)

## Demo walkthrough

[Read the 1–2 minute walkthrough and interview guide](docs/portfolio-demo.md). This is a presentation script, not a recording or a performance benchmark.
