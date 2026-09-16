require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../models');

(async () => {
  try {
    await db.sequelize.sync({ alter: true });
    console.log('Semua tabel berhasil disinkronkan.');

    // Buat akun admin default jika belum ada, agar bisa langsung login pertama kali.
    const adminExists = await db.User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashed = await bcrypt.hash('admin123', 10);
      await db.User.create({
        nama: 'Administrator',
        username: 'admin',
        password: hashed,
        role: 'admin',
      });
      console.log('Akun admin default dibuat -> username: admin / password: admin123');
    }

    // Pastikan baris pengaturan (id=1) selalu ada.
    const settingExists = await db.Pengaturan.findByPk(1);
    if (!settingExists) {
      await db.Pengaturan.create({
        id: 1,
        nama_sekolah: 'Nama Sekolah',
        alamat_sekolah: '-',
        tahun_pelajaran_aktif: '2026/2027',
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Gagal sinkronisasi database:', err);
    process.exit(1);
  }
})();
