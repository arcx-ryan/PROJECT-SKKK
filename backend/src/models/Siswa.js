const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Siswa = sequelize.define('Siswa', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false }, // relasi ke users (akun login)
  nis: { type: DataTypes.STRING, allowNull: true, unique: true },
  kelas_id: { type: DataTypes.INTEGER, allowNull: true },
  jenis_kelamin: { type: DataTypes.ENUM('L', 'P'), allowNull: true },
}, {
  tableName: 'siswa',
});

module.exports = Siswa;
