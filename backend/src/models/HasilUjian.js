const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// PENTING: kombinasi (siswa_id, ujian_id) dibuat UNIQUE di level database.
// Ini adalah mekanisme utama yang menjamin "siswa hanya dapat 1x ujian per mata pelajaran":
// - saat siswa klik "Mulai Ujian", backend cek dulu apakah baris ini sudah ada.
// - jika sudah ada -> tolak (403) dan arahkan ke halaman hasil, bukan ke soal.
// - jika belum ada -> baru dibuat baris baru berstatus "sedang_mengerjakan".
const HasilUjian = sequelize.define('HasilUjian', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  siswa_id: { type: DataTypes.INTEGER, allowNull: false },
  ujian_id: { type: DataTypes.INTEGER, allowNull: false },
  urutan_soal: {
    // menyimpan array id soal sesuai urutan acak yang didapat siswa ini,
    // supaya urutan konsisten walau siswa reload halaman sebelum submit.
    type: DataTypes.JSON,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('sedang_mengerjakan', 'menunggu_penilaian', 'selesai'),
    defaultValue: 'sedang_mengerjakan',
  },
  waktu_mulai: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  waktu_selesai: { type: DataTypes.DATE, allowNull: true },
  nilai: { type: DataTypes.FLOAT, allowNull: true },
  nilai_pilihan_ganda: { type: DataTypes.FLOAT, allowNull: true },
  nilai_essay: { type: DataTypes.FLOAT, allowNull: true },
  jumlah_benar: { type: DataTypes.INTEGER, allowNull: true },
  jumlah_salah: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'hasil_ujian',
  indexes: [
    {
      unique: true,
      fields: ['siswa_id', 'ujian_id'],
      name: 'uniq_siswa_ujian',
    },
  ],
});

module.exports = HasilUjian;
