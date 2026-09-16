const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Bank soal. Setiap soal dibuat oleh guru untuk mapel & jenis ujian tertentu.
// Opsi jawaban disimpan sebagai JSON agar fleksibel (A-D/E), jawaban_benar simpan key opsi.
const Soal = sequelize.define('Soal', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  guru_id: { type: DataTypes.INTEGER, allowNull: false },
  mapel_id: { type: DataTypes.INTEGER, allowNull: false },
  jenis_ujian_id: { type: DataTypes.INTEGER, allowNull: false },
  tahun_pelajaran: { type: DataTypes.STRING, allowNull: false }, // contoh: 2026/2027
  tipe_soal: {
    type: DataTypes.ENUM('pilihan_ganda', 'essay'),
    defaultValue: 'pilihan_ganda',
  },
  cp: { type: DataTypes.TEXT, allowNull: true },
  tp: { type: DataTypes.TEXT, allowNull: true },
  pertanyaan: { type: DataTypes.TEXT, allowNull: false },
  gambar: { type: DataTypes.STRING, allowNull: true }, // path gambar soal (opsional)
  opsi: {
    // contoh: {"A":"Jakarta","B":"Bandung","C":"Surabaya","D":"Medan"}
    type: DataTypes.JSON,
    allowNull: true,
  },
  jawaban_benar: { type: DataTypes.STRING, allowNull: true }, // key opsi, misal "A". Null jika essay.
  bobot_nilai: { type: DataTypes.FLOAT, defaultValue: 1 },
}, {
  tableName: 'soal',
});

module.exports = Soal;
