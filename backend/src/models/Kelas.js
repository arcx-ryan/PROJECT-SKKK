const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kelas = sequelize.define('Kelas', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nama_kelas: { type: DataTypes.STRING, allowNull: false }, // contoh: X IPA 1
  tingkat: { type: DataTypes.STRING, allowNull: true },     // contoh: X, XI, XII
  petunjuk_ujian: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'kelas',
});

module.exports = Kelas;
