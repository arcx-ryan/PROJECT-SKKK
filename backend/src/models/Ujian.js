const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Satu "paket ujian" = kombinasi Mapel + Jenis Ujian + Kelas + Tahun Pelajaran.
// Soal yang tampil ke siswa diambil dari bank Soal sesuai kombinasi ini,
// lalu diacak urutannya (dan boleh diacak subset jumlahnya) saat siswa membuka ujian.
const Ujian = sequelize.define('Ujian', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  judul: { type: DataTypes.STRING, allowNull: false },
  mapel_id: { type: DataTypes.INTEGER, allowNull: false },
  jenis_ujian_id: { type: DataTypes.INTEGER, allowNull: false },
  kelas_id: { type: DataTypes.INTEGER, allowNull: false },
  tahun_pelajaran: { type: DataTypes.STRING, allowNull: false },
  durasi_menit: { type: DataTypes.INTEGER, defaultValue: 60 },
  jumlah_soal_tampil: { type: DataTypes.INTEGER, allowNull: true }, // null = semua soal bank ditampilkan
  jumlah_soal_pilihan_ganda: { type: DataTypes.INTEGER, allowNull: true }, // null = semua soal pilihan ganda
  jumlah_soal_essay: { type: DataTypes.INTEGER, allowNull: true }, // null = semua soal essay
  acak_soal: { type: DataTypes.BOOLEAN, defaultValue: true },
  acak_opsi_jawaban: { type: DataTypes.BOOLEAN, defaultValue: true },
  waktu_mulai: { type: DataTypes.DATE, allowNull: true }, // jadwal buka ujian
  waktu_selesai: { type: DataTypes.DATE, allowNull: true }, // jadwal tutup ujian
  status: {
    type: DataTypes.ENUM('draft', 'aktif', 'selesai'),
    defaultValue: 'draft',
  },
  dibuat_oleh: { type: DataTypes.INTEGER, allowNull: false }, // guru_id
}, {
  tableName: 'ujian',
});

module.exports = Ujian;
