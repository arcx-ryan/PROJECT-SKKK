const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JawabanSiswa = sequelize.define('JawabanSiswa', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  hasil_ujian_id: { type: DataTypes.INTEGER, allowNull: false },
  soal_id: { type: DataTypes.INTEGER, allowNull: false },
  // Pilihan ganda menyimpan key opsi, sedangkan essay dapat berupa jawaban panjang.
  jawaban_dipilih: { type: DataTypes.TEXT, allowNull: true },
  is_benar: { type: DataTypes.BOOLEAN, allowNull: true },
  nilai_essay: { type: DataTypes.FLOAT, allowNull: true },
  feedback_ai: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'jawaban_siswa',
});

module.exports = JawabanSiswa;
