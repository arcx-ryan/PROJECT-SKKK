const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Guru = sequelize.define('Guru', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false }, // relasi ke users (akun login)
  nip: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'guru',
});

module.exports = Guru;
