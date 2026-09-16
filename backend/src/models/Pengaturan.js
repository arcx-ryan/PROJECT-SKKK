const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Disimpan sebagai single-row settings table (id selalu = 1).
const Pengaturan = sequelize.define('Pengaturan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
  nama_sekolah: { type: DataTypes.STRING, allowNull: true },
  alamat_sekolah: { type: DataTypes.STRING, allowNull: true },
  logo_path: { type: DataTypes.STRING, allowNull: true }, // path file logo hasil upload
  tahun_pelajaran_aktif: { type: DataTypes.STRING, allowNull: true }, // contoh: 2026/2027
  gemini_api_key_encrypted: { type: DataTypes.TEXT, allowNull: true },
  gemini_model: { type: DataTypes.STRING, allowNull: true },
  google_client_id: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'pengaturan',
});

module.exports = Pengaturan;
