const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Master jenis ujian, diatur lewat menu Pengaturan oleh admin
// contoh isi: "Sumatif Harian", "Sumatif Tengah Semester (STS)", "Sumatif Akhir Semester (SAS)"
const JenisUjian = sequelize.define('JenisUjian', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nama_jenis: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'jenis_ujian',
});

module.exports = JenisUjian;
