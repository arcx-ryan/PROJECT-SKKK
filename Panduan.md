# Panduan Penggunaan Sistem Bank Soal dan Ujian Online

Panduan ini ditujukan untuk admin sekolah, guru, dan siswa SMP Kristen Kalam
Kudus Sentani.

## Daftar Isi

1. [Menjalankan aplikasi](#1-menjalankan-aplikasi)
2. [Login](#2-login)
3. [Admin](#3-admin)
4. [Guru](#4-guru)
5. [Siswa](#5-siswa)
6. [Google Workspace](#6-google-workspace)
7. [Gemini AI](#7-gemini-ai)
8. [Import dan export](#8-import-dan-export)
9. [Pemecahan masalah](#9-pemecahan-masalah)
10. [Checklist sebelum digunakan](#10-checklist-sebelum-digunakan)

## 1. Menjalankan Aplikasi

### Backend

```powershell
cd backend
npm install
npm run db:sync
npm run dev
```

Backend tersedia di `http://localhost:5000`.

### Frontend

Buka terminal baru:

```powershell
cd frontend
npm install
npm run dev
```

Frontend tersedia di `http://localhost:5173`.

### Database Podman

Pastikan container database bernama `web-ujian` berjalan dan port `3306`
dipetakan ke komputer host:

```powershell
podman ps
```

Nilai `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, dan `DB_PASS` pada
`backend/.env` harus sesuai dengan database tersebut.

### Menjalankan pada PC server untuk jaringan sekolah

Untuk memindahkan aplikasi ke PC lain:

1. Install Git, Node.js, Podman Desktop, dan npm pada PC server baru.
2. Clone repository:

   ```powershell
   git clone https://github.com/arcx-ryan/WEB-UJIAN26.git
   cd WEB-UJIAN26
   ```

3. Siapkan database MySQL/Podman dan sesuaikan `backend/.env`.
4. Jalankan `npm install`, `npm run db:sync`, backend, dan frontend sesuai
   bagian sebelumnya.
5. Jalankan `ipconfig` untuk menemukan IPv4 PC server.
6. Pastikan PC server dan PC pengguna memakai jaringan yang sama.
7. Dari PC pengguna, buka:

   ```text
   http://IP-PC-SERVER:5173
   ```

Contoh:

```text
http://192.168.1.25:5173
```

Jika tidak dapat dibuka, izinkan Node.js/Vite pada Windows Firewall untuk
jaringan Private dan pastikan port 5173 tidak diblokir. Selama memakai Vite
development server, URL API tetap relatif dan otomatis diteruskan ke backend
PC server.

## 2. Login

### Login lokal

Masukkan username dan password yang dibuat admin.

Akun admin default setelah sinkronisasi pertama:

```text
Username: admin
Password: admin123
```

Segera ganti password default pada penggunaan nyata.

### Login Google

Tombol login Google hanya muncul jika Google Client ID sudah dikonfigurasi.
Admin dapat mengaturnya dari **Pengaturan > Login Google Workspace**.

Login Google hanya menerima akun terverifikasi dari domain:

```text
@kalamkudussentani.sch.id
```

## 3. Admin

### 3.1 Pengaturan sekolah

Pada menu **Pengaturan**, admin dapat mengubah:

- Nama sekolah.
- Alamat sekolah.
- Tahun pelajaran aktif.
- Logo sekolah.
- Jenis ujian, misalnya Sumatif Harian, STS, dan SAS.

Tahun pelajaran aktif digunakan sebagai konteks pembuatan soal dan paket ujian.

Pada bagian **Petunjuk Ujian per Kelas**, pilih kelas dari dropdown untuk
melihat atau mengubah petunjuk kelas tersebut. Tulis satu petunjuk pada setiap
baris, kemudian klik **Simpan Petunjuk**. Siswa akan melihat petunjuk sesuai
kelasnya saat membuka halaman daftar ujian.

### 3.2 Mengelola kelas

1. Buka menu **Kelas**.
2. Tambahkan nama atau tingkat kelas.
3. Gunakan data kelas saat membuat siswa dan paket ujian.

### 3.3 Mengelola guru dan mata pelajaran

1. Buat data mata pelajaran pada menu **Mata Pelajaran**.
2. Buat akun guru pada menu **Guru**.
3. Tetapkan mata pelajaran yang diampu guru tersebut.

Guru hanya dapat melihat dan mengubah soal untuk mata pelajaran yang diberikan
kepadanya.

### 3.4 Mengelola siswa

Siswa dapat dibuat satu per satu atau diimpor sekaligus dari Excel/CSV.

Data yang perlu disiapkan:

- Nama siswa.
- Username atau email.
- Password awal untuk login lokal.
- NIS.
- Kelas.
- Jenis kelamin.

Gunakan tombol **Template** untuk mengunduh format file import. Periksa data
duplikat, NIS, kelas, dan format email sebelum import.

### 3.5 Konfigurasi Google Client ID

1. Buka **Pengaturan**.
2. Cari bagian **Login Google Workspace**.
3. Masukkan Web OAuth Client ID dari Google Cloud.
4. Klik **Simpan Client ID**.
5. Pastikan status berubah menjadi **Google aktif**.

Client ID bukan secret. API key Gemini dan password database tetap harus
dirahasiakan.

### 3.6 Konfigurasi Gemini AI

1. Buka **Pengaturan > Integrasi AI Gemini**.
2. Masukkan API key Gemini.
3. Pilih atau masukkan model teks.
4. Klik **Simpan Pengaturan AI**.

API key dienkripsi sebelum disimpan dan tidak ditampilkan kembali. Jika key
dihapus dari database, sistem dapat menggunakan fallback `GEMINI_API_KEY` pada
backend `.env`.

## 4. Guru

### 4.1 Membuat soal manual

1. Buka menu **Bank Soal**.
2. Pilih mata pelajaran, jenis ujian, tahun pelajaran, dan tipe soal.
3. Pilih **Pilihan Ganda** atau **Essay**.
4. Isi pertanyaan dan bobot.
5. Untuk Pilihan Ganda, isi opsi A sampai D dan kunci jawaban.
6. Untuk Essay, isi pertanyaan dan pedoman atau jawaban acuan jika tersedia.
7. Simpan soal.

Soal dapat diedit, dihapus, dan diberi gambar. Gambar akan ditampilkan pada
bank soal dan halaman ujian siswa.

### 4.2 Generate soal dengan Gemini

1. Buka **Bank Soal > Generate Soal**.
2. Pilih mata pelajaran.
3. Masukkan CP (Capaian Pembelajaran).
4. Masukkan TP (Tujuan Pembelajaran).
5. Pilih tingkat kesulitan.
6. Tentukan jumlah Pilihan Ganda dan Essay.
7. Aktifkan pembuatan gambar jika diperlukan.
8. Tinjau hasilnya.
9. Simpan soal yang sesuai ke bank soal.

Selalu tinjau soal hasil AI sebelum digunakan. Periksa fakta, tingkat
kesulitan, kunci jawaban, bahasa, dan kesesuaian dengan CP/TP.

### 4.3 Menggunakan PDF sebagai referensi

Pada generator soal, guru dapat mengunggah PDF untuk:

- Membuat soal baru berdasarkan isi PDF.
- Mengenali dan mengimpor soal yang sudah ada di PDF.

Pastikan PDF berisi teks yang dapat dibaca. PDF hasil scan mungkin memerlukan
OCR terlebih dahulu. Ukuran PDF dibatasi oleh aplikasi.

### 4.4 Export bank soal ke PDF

1. Gunakan filter mata pelajaran, jenis ujian, atau tahun pelajaran bila perlu.
2. Klik **Export PDF**.
3. File berisi Pilihan Ganda terlebih dahulu, kemudian Essay.

Export mengambil seluruh soal yang sesuai filter, bukan hanya halaman pagination
yang sedang terlihat.

### 4.5 Membuat paket ujian

1. Buka menu **Paket Ujian**.
2. Masukkan nama ujian.
3. Pilih mata pelajaran, jenis ujian, kelas, dan tahun pelajaran.
4. Atur durasi.
5. Tentukan jumlah soal Pilihan Ganda dan Essay.
6. Aktifkan atau nonaktifkan pengacakan jika tersedia.
7. Simpan dan publikasikan sesuai kebutuhan.

Pada sisi siswa, soal Pilihan Ganda muncul lebih dahulu lalu Essay.

### 4.6 Melihat peserta dan hasil

Guru dapat membuka daftar peserta untuk melihat siswa yang mengikuti paket
ujian. Hasil menampilkan nilai Pilihan Ganda, nilai Essay, nilai akhir, dan
status penilaian.

Jika penilaian Essay gagal karena Gemini tidak tersedia, hasil akan berstatus
`menunggu_penilaian`. Periksa koneksi, quota, dan konfigurasi Gemini lalu
jalankan penilaian ulang sesuai menu yang tersedia.

## 5. Siswa

### 5.1 Melengkapi profil Google

Pada login Google pertama kali, siswa diarahkan ke **Lengkapi Profil**. Isi:

- NIS.
- Kelas.
- Jenis kelamin.

Profil harus lengkap sebelum siswa dapat melihat daftar ujian.

### 5.2 Mengerjakan ujian

1. Buka dashboard siswa.
2. Pilih ujian yang tersedia.
3. Jawab Pilihan Ganda terlebih dahulu.
4. Lanjutkan ke bagian Essay.
5. Periksa jawaban.
6. Klik kirim/submit.

Ujian dapat dilanjutkan jika halaman di-refresh selama sesi belum dikirim.
Setiap siswa tidak dapat memulai ulang paket yang sudah diselesaikan.

### 5.3 Melihat hasil

Setelah submit dan proses penilaian selesai, siswa dapat melihat nilai:

- Nilai Pilihan Ganda.
- Nilai Essay.
- Nilai akhir.
- Feedback AI jika tersedia.

## 6. Google Workspace

Pada Google Cloud Console:

1. Buat atau pilih project.
2. Konfigurasi OAuth consent screen.
3. Tambahkan domain resmi sekolah jika diperlukan.
4. Buat OAuth Client ID tipe **Web application**.
5. Tambahkan Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
   - URL frontend produksi.
6. Salin Client ID ke menu pengaturan admin.

Google Client ID tidak sama dengan API key Gemini. Client ID boleh tampil di
browser, sedangkan API key Gemini harus berada di backend.

## 7. Gemini AI

Gemini digunakan untuk:

- Membuat soal berdasarkan CP, TP, mapel, dan jumlah soal.
- Membantu membuat gambar soal jika model dan quota mendukung.
- Menilai jawaban Essay.

Jika muncul error quota `429`, periksa quota project Google AI dan model yang
digunakan. Sistem tetap menyimpan hasil ujian dan menandainya sebagai menunggu
penilaian jika penilaian Essay tidak dapat dilakukan.

Jangan menaruh API key pada file frontend, source code, README, screenshot,
issue, atau repository publik.

## 8. Import dan Export

### Import siswa

1. Buka menu **Siswa**.
2. Unduh template Excel/CSV.
3. Isi data siswa sesuai nama kolom.
4. Simpan sebagai `.xlsx` atau `.csv`.
5. Klik **Import** dan pilih file.
6. Tinjau ringkasan berhasil/gagal per baris.

Import menggunakan transaksi sehingga data tidak valid tidak boleh membuat
sebagian data tersimpan tanpa informasi yang jelas.

### Export hasil ujian

Pada menu peserta atau hasil ujian, klik tombol export Excel. Jika browser
meminta izin download, izinkan download dari situs aplikasi.

### Export bank soal

Pada menu bank soal gunakan **Export PDF**. Filter yang aktif digunakan untuk
menentukan soal yang diekspor.

## 9. Pemecahan Masalah

### Backend tidak terhubung ke database

1. Jalankan `podman ps`.
2. Pastikan container `web-ujian` berjalan.
3. Periksa `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, dan `DB_PASS`.
4. Jalankan `npm run db:sync` dari folder backend.

### Login Google tidak muncul

1. Pastikan Client ID sudah disimpan di menu pengaturan admin.
2. Buka `http://localhost:5000/api/auth/google-config`.
3. Pastikan respons menunjukkan `enabled: true`.
4. Periksa Authorized JavaScript origins di Google Cloud.
5. Pastikan akun menggunakan domain Workspace sekolah.

### Export Excel atau PDF gagal

1. Pastikan backend berjalan.
2. Pastikan token login belum kadaluarsa.
3. Login kembali lalu ulangi export.
4. Periksa log terminal backend.

### Gambar tidak muncul

1. Pastikan backend dapat diakses pada port 5000.
2. Pastikan folder upload tidak dihapus.
3. Periksa apakah URL `/uploads/...` dapat dibuka.

### Deployment Vercel menampilkan `FUNCTION_INVOCATION_FAILED`

Repository ini berisi frontend dan backend, jadi buat dua project dari
repository yang sama:

- **Frontend** dengan Root Directory `frontend`, preset Vite, dan output `dist`.
- **Backend** dengan Root Directory `backend`, menggunakan Node.js/Express.

Pada project frontend, isi:

```text
VITE_API_URL=https://URL-BACKEND-VERCEL/api
```

Pada project backend, isi semua variabel database pada `backend/.env.example`.
Pastikan backend dapat mengakses database MySQL secara publik. Tes endpoint:

```text
https://URL-BACKEND-VERCEL/api/health
```

Jika database provider memerlukan koneksi TLS, isi `DB_SSL=true` dan sesuaikan
`DB_SSL_REJECT_UNAUTHORIZED`. Filesystem Vercel bersifat sementara, sehingga
upload gambar dan logo sebaiknya dipindahkan ke object storage persisten untuk
production.

### Soal Essay belum dinilai

Periksa konfigurasi Gemini, quota API, dan log backend. Nilai Pilihan Ganda
tetap dapat dihitung walaupun penilaian Essay tertunda.

## 10. Checklist Sebelum Digunakan

- [ ] Password admin default sudah diganti.
- [ ] Database memakai password yang kuat.
- [ ] `JWT_SECRET` sudah diganti dengan nilai acak.
- [ ] API key Gemini sudah aktif dan memiliki quota.
- [ ] Google OAuth Client ID sudah dikonfigurasi jika login Google digunakan.
- [ ] Authorized JavaScript origins sudah benar.
- [ ] Data kelas, guru, mapel, dan tahun pelajaran sudah diisi.
- [ ] Soal sudah ditinjau guru sebelum dipakai.
- [ ] Paket ujian sudah diuji dengan akun siswa.
- [ ] Backup database sudah dibuat.
- [ ] File `.env` tidak masuk repository GitHub.
