const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MataPelajaran = sequelize.define('MataPelajaran', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  kode_mapel: { type: DataTypes.STRING, allowNull: false, unique: true },
  nama_mapel: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'mata_pelajaran',
});

// Tabel pivot: satu guru bisa mengampu banyak mapel, satu mapel bisa diampu banyak guru
const GuruMapel = sequelize.define('GuruMapel', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  guru_id: { type: DataTypes.INTEGER, allowNull: false },
  mapel_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'guru_mapel',
});

module.exports = { MataPelajaran, GuruMapel };
