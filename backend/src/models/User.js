const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel utama akun login. Role menentukan hak akses (RBAC):
// admin -> kelola master data & pengaturan
// guru  -> kelola soal sesuai mapel yang diampu
// siswa -> mengerjakan ujian
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nama: { type: DataTypes.STRING, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: true, unique: true },
  google_id: { type: DataTypes.STRING, allowNull: true, unique: true },
  password: { type: DataTypes.STRING, allowNull: false }, // di-hash bcrypt
  role: {
    type: DataTypes.ENUM('admin', 'guru', 'siswa'),
    allowNull: false,
  },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'users',
});

module.exports = User;
