# Sistem Bank Soal dan Ujian Online

Aplikasi ujian online untuk SMP Kristen Kalam Kudus Sentani. Sistem ini
memungkinkan admin mengelola data sekolah, guru, siswa, kelas, mata pelajaran,
dan pengaturan; guru membuat bank soal serta paket ujian; dan siswa mengerjakan
ujian secara online.

## Fitur Utama

- Role-based access control: Admin, Guru, dan Siswa.
- Bank soal Pilihan Ganda dan Essay.
- Guru hanya dapat mengelola soal pada mata pelajaran yang diampunya.
- Generator soal menggunakan Google Gemini berdasarkan CP, TP, mata pelajaran,
  tingkat kesulitan, jumlah PG, dan jumlah Essay.
- Import soal dari PDF dan pembuatan gambar soal dengan AI jika quota tersedia.
- Import massal soal dari JSON dengan preview, konfirmasi, dan gambar Base64.
- Upload, preview, edit, dan hapus gambar soal.
- Paket ujian dengan durasi, kelas, tahun pelajaran, jumlah PG, dan jumlah Essay.
- Urutan soal PG sebelum Essay pada ujian siswa.
- Pengacakan soal dan opsi jawaban per siswa.
- Pencegahan pengerjaan ulang berdasarkan siswa dan paket ujian.
- Penilaian otomatis Pilihan Ganda.
- Penilaian Essay dengan bantuan AI Gemini dan status menunggu penilaian jika
  layanan AI tidak tersedia.
- Tombol **Generate Nilai** untuk mencoba kembali penilaian essay yang masih
  berstatus menunggu penilaian; tombol tetap tersedia jika Gemini masih sibuk
  dan hilang setelah nilai berhasil dibuat.
- Export bank soal ke PDF (PG terlebih dahulu, kemudian Essay).
- Export peserta/hasil ujian ke Excel.
- Import data siswa dari Excel atau CSV beserta template.
- Pagination bank soal maksimal 15 soal per halaman.
- Login Google Workspace untuk domain `kalamkudussentani.sch.id`.
- Akun siswa Google baru dibuat otomatis dan diarahkan untuk melengkapi NIS,
  kelas, dan jenis kelamin.
- Tampilan responsif dengan desain modern bernuansa biru Kalam Kudus.
- Homepage menampilkan foto suasana ujian sekolah dan pesan nilai Teratur, Adil,
  serta Terpercaya.
- Halaman login menampilkan foto sekolah di sisi kanan pada layar desktop.
- Kartu informasi homepage menggunakan efek emboss untuk tampilan visual yang
  lebih menonjol.

### Format JSON Import Soal

Guru dapat mengunggah JSON melalui halaman **Bank Soal Saya > Import Soal dari
JSON**. Tombol **Unduh Template JSON** menyediakan contoh struktur yang dapat
diubah. Pilih mapel, jenis ujian, dan tahun pelajaran, kemudian lakukan preview
sebelum menyimpan. Metadata tersebut juga dapat diletakkan di JSON. Gambar
disertakan sebagai data URI Base64 (PNG, JPG, WebP, atau GIF), contohnya:

```json
{
  "mapel_id": 1,
  "jenis_ujian_id": 2,
  "tahun_pelajaran": "2026/2027",
  "soal": [
    {
      "tipe_soal": "pilihan_ganda",
      "pertanyaan": "Perhatikan grafik berikut. Apa kesimpulannya?",
      "gambar": "data:image/png;base64,<BASE64_GAMBAR_ASLI>",
      "opsi": {
        "A": "Pilihan A",
        "B": "Pilihan B",
        "C": "Pilihan C",
        "D": "Pilihan D"
      },
      "jawaban_benar": "B",
      "bobot_nilai": 1
    }
  ]
}
```

Satu file dibatasi maksimal 10 MB, maksimal 100 soal, dan setiap gambar
maksimal 5 MB. Soal hanya tersimpan setelah preview dinyatakan valid dan guru
menekan tombol **Simpan ke Bank Soal**.

Nilai seperti `REQUIRES_EXTRACTION_FROM_PDF`, nama file gambar, atau teks
placeholder lainnya bukan gambar dan akan ditolak. Jika grafik berasal dari
PDF, gambar tersebut harus diekspor terlebih dahulu menjadi PNG/JPG lalu
dikonversi ke data URI Base64. Alternatifnya, gunakan `gambar: null` dan
tambahkan gambar setelah import melalui editor soal.

## Teknologi

- Frontend: React, Vite, React Router, Axios, Tailwind CSS, Vite Legacy.
- Backend: Node.js, Express, Sequelize, MySQL.
- Autentikasi: JWT, bcryptjs, Google Identity Services.
- File: Multer, ExcelJS, PDFKit.
- AI: Google Gemini API.
- Database lokal: MySQL, dapat dijalankan dengan Podman.

## Struktur Proyek

```text
WEB-UJIAN/
├── backend/
│   ├── src/
│   │   ├── config/          # Koneksi database
│   │   ├── controllers/     # Logika fitur
│   │   ├── middleware/      # JWT dan pembatasan role
│   │   ├── models/          # Model Sequelize dan relasi
│   │   ├── routes/          # Endpoint REST API
│   │   ├── utils/           # Sinkronisasi database dan utilitas AI
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── school-classroom.png # Foto homepage dan halaman login
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── .env.example
│   └── package.json
├── schema.sql
├── Panduan.md
└── README.md
```

## Persyaratan

- Node.js 18 atau lebih baru.
- npm.
- MySQL 8 atau MariaDB yang kompatibel.
- Podman Desktop (opsional, digunakan pada setup development saat ini).
- Safe Exam Browser 2.4.1 pada Windows 8.1 didukung melalui bundle Firefox/XUL
  legacy.
- Foto homepage dan login tersedia secara lokal sehingga tidak bergantung pada
  layanan gambar eksternal.
- Google Cloud project (opsional, hanya diperlukan untuk login Google).
- Gemini API key (opsional, hanya diperlukan untuk generator dan penilaian AI).

## Menjalankan dengan Podman dan npm

### 1. Menyiapkan database MySQL

Jika container `web-ujian` sudah tersedia dan berjalan:

```powershell
podman ps
```

Pastikan port MySQL tersedia pada `127.0.0.1:3306`. Jika belum ada container,
contoh membuat database container:

```powershell
podman run -d --name web-ujian `
  -e MYSQL_ROOT_PASSWORD=change-this-password `
  -e MYSQL_DATABASE=bank_soal `
  -p 3306:3306 `
  docker.io/library/mysql:8.0
```

Untuk instalasi baru, tunggu sampai MySQL siap sebelum menjalankan sinkronisasi
database.

### 2. Menyiapkan backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run db:sync
npm run dev
```

Backend berjalan pada `http://localhost:5000`. Cek kesehatan server:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

### 3. Menyiapkan frontend

Buka terminal baru:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Frontend berjalan pada `http://localhost:5173`.

Frontend Vite mem-proxy `/api` dan `/uploads` ke backend port 5000 selama
development.

### Menjalankan mode ujian dengan Safe Exam Browser

Untuk penggunaan ujian, terutama pada komputer Windows 8.1 dengan Safe Exam
Browser 2.4.1, gunakan script:

```powershell
.\START-WEB-UJIAN.cmd
```

Script tersebut akan:

1. Menyalakan dan menunggu database MySQL siap.
2. Membuat production build frontend dengan bundle legacy untuk engine
   Firefox/XUL lama milik SEB 2.4.1.
3. Menjalankan backend yang sekaligus menyajikan frontend production.
4. Menjalankan Ngrok ke backend pada port `5000`.

Masukkan URL Ngrok terbaru ke konfigurasi/start URL SEB. Untuk mode ini,
gunakan URL yang mengarah ke port `5000`, bukan URL frontend development pada
port `5173`. URL lokal production adalah:

```text
http://localhost:5000
```

Jika SEB masih menampilkan halaman kosong, tutup SEB sepenuhnya, jalankan ulang
script, dan gunakan URL Ngrok terbaru. Jangan menjalankan `npm run dev` sebagai
server ujian karena mode development tidak menggunakan konfigurasi production
legacy yang diperlukan SEB 2.4.1.

### Menjalankan di PC server agar dapat diakses melalui LAN

PC server dan komputer pengguna harus berada pada jaringan yang sama. Jalankan
backend dan frontend pada PC server seperti biasa, lalu cari alamat IP lokal
PC server:

```powershell
ipconfig
```

Buka aplikasi dari komputer lain menggunakan:

```text
http://ALAMAT-IP-SERVER:5173
```

Contoh:

```text
http://192.168.1.25:5173
```

Alamat tersebut berlaku untuk mode development. Untuk mode ujian production
yang kompatibel dengan SEB, gunakan backend pada port `5000`:

```text
http://192.168.1.25:5000
```

Frontend sudah dikonfigurasi mendengarkan pada `0.0.0.0`, sehingga dapat
diakses dari LAN. Jika Windows Firewall menampilkan permintaan izin, izinkan
Node.js pada jaringan **Private**. Jangan membuka port ini ke internet tanpa
HTTPS dan pengamanan tambahan.

Pada mode development, frontend meneruskan request `/api` dan `/uploads` ke
backend pada PC server, sehingga komputer pengguna tidak perlu mengakses
`localhost:5000` secara langsung.

## Konfigurasi Environment

Salin `backend/.env.example` menjadi `backend/.env`, lalu isi nilainya.

Variabel penting:

| Variabel | Keterangan |
|---|---|
| `DB_HOST`, `DB_PORT` | Host dan port MySQL |
| `DB_NAME`, `DB_USER`, `DB_PASS` | Database dan kredensial MySQL |
| `JWT_SECRET` | Secret acak untuk token login |
| `JWT_EXPIRES_IN` | Masa berlaku JWT, contoh `8h` |
| `UPLOAD_DIR` | Folder penyimpanan gambar dan file upload |
| `GOOGLE_CLIENT_ID` | Fallback Web OAuth Client ID |
| `GOOGLE_WORKSPACE_DOMAIN` | Domain yang diizinkan untuk login Google |
| `GEMINI_API_KEY` | Fallback API key Gemini |
| `GEMINI_MODEL` | Model teks Gemini |
| `GEMINI_IMAGE_MODEL` | Model gambar Gemini |
| `GEMINI_SETTINGS_ENCRYPTION_KEY` | Kunci enkripsi API key yang disimpan di database |

API key Gemini dapat diatur ulang melalui **Admin > Pengaturan > Integrasi AI
Gemini**. Nilai yang disimpan di database dienkripsi dan tidak dikirim kembali
ke frontend.

Google OAuth Client ID dapat diatur melalui **Admin > Pengaturan > Login Google
Workspace**. Sistem memprioritaskan Client ID di database, lalu menggunakan
`GOOGLE_CLIENT_ID` dari `.env` sebagai fallback.

## Akun Awal

Perintah `npm run db:sync` membuat akun admin jika belum ada:

```text
Username: admin
Password: admin123
```

Segera ubah password atau buat akun admin baru setelah login pertama kali.
Jangan menggunakan password default pada server yang dapat diakses publik.

## Konfigurasi Google Workspace

1. Buat OAuth Client ID tipe **Web application** di Google Cloud Console.
2. Tambahkan Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
   - domain produksi jika aplikasi sudah di-deploy.
3. Pastikan OAuth consent screen dan domain Workspace sudah dikonfigurasi.
4. Masukkan Client ID pada menu pengaturan admin.
5. Uji login menggunakan akun `@kalamkudussentani.sch.id`.

Login Google memeriksa token Google, email terverifikasi, hosted domain, dan
domain email. Siswa baru dibuat otomatis sebagai akun siswa sementara dan harus
melengkapi NIS, kelas, serta jenis kelamin.

## Alur Penggunaan Singkat

1. Admin membuat kelas, guru, mata pelajaran, dan akun siswa.
2. Admin menetapkan mata pelajaran yang diampu guru.
3. Guru membuat soal manual atau menggunakan generator AI.
4. Guru membuat paket ujian dan menetapkan kelas serta komposisi soal.
5. Siswa login, memilih ujian, mengerjakan PG lalu Essay, dan mengirim jawaban.
6. Sistem menghitung nilai PG dan mengirim Essay ke Gemini jika AI aktif.
7. Jika penilaian Gemini gagal atau sedang sibuk, jawaban tetap tersimpan dengan
   status **menunggu penilaian**.
8. Guru membuka daftar peserta, menekan **Generate Nilai**, lalu dapat mencoba
   kembali sampai Gemini berhasil. Setelah berhasil, nilai total dibuat dan
   tombol tersebut hilang otomatis.
9. Guru dapat meninjau hasil dan export data.

Panduan operasional lengkap tersedia di [Panduan.md](./Panduan.md).

## Endpoint REST Utama

Semua endpoint berada di bawah prefix `/api`.

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| `POST` | `/auth/login` | Semua | Login lokal |
| `GET` | `/auth/google-config` | Publik | Status Google login |
| `POST` | `/auth/google` | Publik | Login dengan Google ID token |
| `POST` | `/auth/google/complete-profile` | Siswa | Melengkapi profil siswa |
| `GET/POST/PUT/DELETE` | `/kelas` | Admin | Kelola kelas |
| `GET/POST/PUT/DELETE` | `/siswa` | Admin | Kelola dan import siswa |
| `GET/POST/PUT/DELETE` | `/guru` | Admin | Kelola guru dan mapel |
| `GET/POST/PUT/DELETE` | `/mapel` | Admin | Kelola mata pelajaran |
| `GET/POST/PUT/DELETE` | `/soal` | Guru | Kelola bank soal |
| `POST` | `/soal/generate` | Guru | Generate/import soal berbantuan AI |
| `GET` | `/soal/export-pdf` | Guru | Export bank soal ke PDF |
| `GET/POST/PUT/DELETE` | `/ujian` | Guru/Admin | Kelola paket ujian |
| `GET` | `/ujian/siswa/tersedia` | Siswa | Daftar ujian tersedia |
| `POST` | `/ujian/:id/mulai` | Siswa | Mulai atau lanjutkan ujian |
| `POST` | `/ujian/submit` | Siswa | Kirim jawaban |
| `GET` | `/ujian/hasil/:id` | Siswa/Guru | Lihat hasil |
| `GET` | `/ujian/hasil/:id/peserta` | Guru/Admin | Daftar peserta dan status penilaian |
| `POST` | `/ujian/hasil/generate-nilai/:id` | Guru/Admin | Coba ulang generate nilai essay dengan Gemini |
| `GET` | `/ujian/hasil/detail/:id` | Guru/Admin | Detail jawaban peserta |
| `POST` | `/ujian/hasil/nilai-essay/:id` | Guru/Admin | Simpan penilaian essay manual |
| `GET/PUT` | `/pengaturan` | Admin | Pengaturan sekolah |
| `GET/PUT` | `/pengaturan/ai` | Admin | Status dan konfigurasi Gemini |
| `GET/PUT` | `/pengaturan/google` | Admin | Konfigurasi Google Client ID |
| `GET/PUT` | `/kelas` dan `/kelas/:id` | Admin | Data kelas dan petunjuk ujian per kelas |

## Menyiapkan Repository untuk GitHub

Sebelum `git add`, pastikan:

1. `backend/.env` dan `frontend/.env` tidak ikut di-commit.
2. API key Gemini, password database, JWT secret, dan kredensial lain tidak
   ditulis di source code, dokumentasi, issue, atau commit.
3. Folder `node_modules`, `dist`, log, dan upload runtime tidak di-commit.
4. Tidak ada dump database berisi data siswa nyata.
5. Gunakan API key baru pada deployment. API key yang pernah dibagikan di chat
   atau tersimpan di komputer sebaiknya segera di-rotate/revoke.

Root `.gitignore` sudah disediakan untuk kebutuhan tersebut. Contoh perintah:

```powershell
git init
git add .
git status
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPOSITORY.git
git push -u origin main
```

Ganti `USERNAME/NAMA-REPOSITORY` dengan repository milik Anda. Periksa hasil
`git status` sebelum commit untuk memastikan file `.env` dan data pribadi tidak
tercantum.

## Deployment Produksi

Untuk production, gunakan HTTPS, secret yang berbeda dari development, database
terkelola, backup terjadwal, rate limiting, dan reverse proxy. Batasi CORS ke
domain frontend resmi, jangan membuka port database ke internet, dan gunakan
akun admin dengan password kuat.

### Bunny.net

Bunny Edge Scripting tidak menjalankan aplikasi ini secara langsung. Template
`Hello from Bunny Edge Scripting` adalah script contoh Bunny, bukan hasil build
frontend atau server Express dari repository ini. Aplikasi memerlukan tiga
komponen deployment:

1. Frontend React hasil `npm run build` pada hosting static/CDN.
2. Backend Node.js/Express pada hosting yang mendukung proses Node.js.
3. MySQL yang dapat diakses backend.

Bunny dapat digunakan untuk menyajikan file frontend statis, tetapi jangan
mengganti backend dengan Edge Script. Jika frontend dan backend memakai domain
berbeda, ubah URL API frontend dan batasi CORS backend ke domain frontend resmi.

### Vercel

Repository ini adalah monorepo sehingga buat **dua project Vercel** dari
repository yang sama:

#### Project frontend

1. Import repository ke Vercel.
2. Set **Root Directory** menjadi `frontend`.
3. Pilih framework preset `Vite`.
4. Gunakan build command `npm run build` dan output directory `dist`.
5. Tambahkan `VITE_API_URL=https://URL-BACKEND-VERCEL/api`.
6. Tambahkan `VITE_GOOGLE_CLIENT_ID` hanya jika memakai fallback Client ID.

#### Project backend

1. Import repository yang sama sebagai project kedua.
2. Set **Root Directory** menjadi `backend`.
3. Pilih `Other` atau biarkan Vercel mendeteksi Node.js/Express.
4. Tambahkan seluruh variabel dari `backend/.env.example` pada Environment
   Variables.
5. Isi kredensial MySQL publik dari provider database. Jika provider
   mewajibkan TLS, gunakan `DB_SSL=true`.

Tes backend setelah deploy melalui:

```text
https://URL-BACKEND-VERCEL/api/health
```

Respons yang diharapkan:

```json
{"status":"OK"}
```

Vercel menggunakan filesystem sementara untuk Function. Gambar dan logo yang
diunggah diarahkan ke `/tmp` saat berjalan di Vercel dan tidak dijamin bertahan
setelah instance diganti. Untuk production, gunakan object storage persisten.

`sequelize.sync({ alter: true })` ditujukan untuk development. Untuk production
gunakan proses migrasi database yang terkontrol dan lakukan backup sebelum
mengubah struktur tabel.
