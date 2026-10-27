# ApexGrid: naskah demo dan wawancara

**Format:** panduan presentasi 1–2 menit, bukan rekaman video atau bukti bahwa sesi demo sudah dijalankan.

[Source code](https://github.com/a1fariz/ApexGrid) · [Studi kasus](https://alfarizi.my.id/work/apexgrid)

## Persiapan

Jalankan project dengan data contoh mengikuti README. Siapkan halaman katalog balapan, detail balapan, pembayaran demo, dan riwayat booking. Untuk penjelasan kode, buka API gateway, booking service, scheduler, serta query/trigger database. Jangan gunakan pembayaran, akun, atau data pribadi nyata.

## Alur sekitar 105 detik

| Waktu | Tampilan | Narasi |
| --- | --- | --- |
| 0–15 detik | Katalog dan detail balapan | “ApexGrid adalah project pemesanan tiket balap dengan React dan tiga tanggung jawab backend: gateway, pengguna, dan balapan/reservasi.” |
| 15–35 detik | Pilih tiket, lalu booking berstatus pending | “Client mengakses service melalui Spring Cloud Gateway. Login memakai JWT, sedangkan otorisasi membedakan akses pengguna dan administrator.” |
| 35–55 detik | Halaman pembayaran demo dan riwayat booking | “Pembayaran di antarmuka ini disimulasikan. Konfirmasi mengubah status booking melalui API; bukan transaksi dengan provider pembayaran nyata.” |
| 55–80 detik | Kode konfirmasi booking dan repository | “Saat konfirmasi, backend memeriksa pemilik booking, status pending, waktu kedaluwarsa, dan kuota. Pessimistic row lock serta trigger PostgreSQL membantu mengoordinasikan perubahan status dan inventori.” |
| 80–105 detik | Scheduler dan ringkasan arsitektur | “Reservasi memiliki batas 30 menit dan scheduler menangani booking kedaluwarsa. Saya bisa menjelaskan pembagian service dan aturan konsistensinya; demo ini belum membuktikan kapasitas concurrency atau SLA production.” |

## Bukti kode untuk diskusi

- `api-gateway/src/main/java/com/apexgrid/gateway/filter/AuthenticationFilter.java`: validasi token dan penerusan identitas ke service terkait.
- `race-service/src/main/java/com/apexgrid/raceservice/booking/service/impl/BookingServiceImpl.java`: pemeriksaan pemilik/status/expiry serta proses konfirmasi.
- `race-service/src/main/java/com/apexgrid/raceservice/race/repository/RaceRepository.java`: query dengan pessimistic lock.
- `race-service/src/main/java/com/apexgrid/raceservice/scheduler/BookingScheduler.java`: penanganan reservasi kedaluwarsa.
- `frontend-react/src/pages/Payment.jsx`: UI dan konfirmasi pembayaran simulasi.

## Pertanyaan wawancara yang perlu disiapkan

- Bagaimana API menangani dua konfirmasi yang bersaing atas kuota yang sama?
- Apa perbedaan validasi gateway dengan pemeriksaan kepemilikan di service?
- Bagaimana status pending, confirmed, dan cancelled memengaruhi kuota?
- Apa yang terjadi bila scheduler terlambat berjalan?

**Batas klaim:** aturan 30 menit bukan metrik performa. Waktu kedaluwarsa yang ditegakkan backend adalah acuannya; countdown di browser bukan sumber otoritas.
