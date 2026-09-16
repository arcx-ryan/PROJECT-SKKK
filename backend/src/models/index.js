const sequelize = require('../config/database');

const User = require('./User');
const Kelas = require('./Kelas');
const Siswa = require('./Siswa');
const Guru = require('./Guru');
const { MataPelajaran, GuruMapel } = require('./MataPelajaran');
const JenisUjian = require('./JenisUjian');
const Soal = require('./Soal');
const Ujian = require('./Ujian');
const HasilUjian = require('./HasilUjian');
const JawabanSiswa = require('./JawabanSiswa');
const Pengaturan = require('./Pengaturan');

// ---- Relasi User <-> Siswa/Guru ----
User.hasOne(Siswa, { foreignKey: 'user_id' });
Siswa.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(Guru, { foreignKey: 'user_id' });
Guru.belongsTo(User, { foreignKey: 'user_id' });

// ---- Relasi Kelas <-> Siswa ----
Kelas.hasMany(Siswa, { foreignKey: 'kelas_id' });
Siswa.belongsTo(Kelas, { foreignKey: 'kelas_id' });

// ---- Relasi Guru <-> Mapel (many-to-many) ----
Guru.belongsToMany(MataPelajaran, { through: GuruMapel, foreignKey: 'guru_id' });
MataPelajaran.belongsToMany(Guru, { through: GuruMapel, foreignKey: 'mapel_id' });

// ---- Relasi Soal ----
Guru.hasMany(Soal, { foreignKey: 'guru_id' });
Soal.belongsTo(Guru, { foreignKey: 'guru_id' });

MataPelajaran.hasMany(Soal, { foreignKey: 'mapel_id' });
Soal.belongsTo(MataPelajaran, { foreignKey: 'mapel_id' });

JenisUjian.hasMany(Soal, { foreignKey: 'jenis_ujian_id' });
Soal.belongsTo(JenisUjian, { foreignKey: 'jenis_ujian_id' });

// ---- Relasi Ujian (paket ujian) ----
MataPelajaran.hasMany(Ujian, { foreignKey: 'mapel_id' });
Ujian.belongsTo(MataPelajaran, { foreignKey: 'mapel_id' });

JenisUjian.hasMany(Ujian, { foreignKey: 'jenis_ujian_id' });
Ujian.belongsTo(JenisUjian, { foreignKey: 'jenis_ujian_id' });

Kelas.hasMany(Ujian, { foreignKey: 'kelas_id' });
Ujian.belongsTo(Kelas, { foreignKey: 'kelas_id' });

Guru.hasMany(Ujian, { foreignKey: 'dibuat_oleh' });
Ujian.belongsTo(Guru, { foreignKey: 'dibuat_oleh' });

// ---- Relasi Hasil Ujian (enforce 1x ujian lewat unique index di model) ----
Siswa.hasMany(HasilUjian, { foreignKey: 'siswa_id' });
HasilUjian.belongsTo(Siswa, { foreignKey: 'siswa_id' });

Ujian.hasMany(HasilUjian, { foreignKey: 'ujian_id' });
HasilUjian.belongsTo(Ujian, { foreignKey: 'ujian_id' });

HasilUjian.hasMany(JawabanSiswa, { foreignKey: 'hasil_ujian_id' });
JawabanSiswa.belongsTo(HasilUjian, { foreignKey: 'hasil_ujian_id' });

Soal.hasMany(JawabanSiswa, { foreignKey: 'soal_id' });
JawabanSiswa.belongsTo(Soal, { foreignKey: 'soal_id' });

module.exports = {
  sequelize,
  User,
  Kelas,
  Siswa,
  Guru,
  MataPelajaran,
  GuruMapel,
  JenisUjian,
  Soal,
  Ujian,
  HasilUjian,
  JawabanSiswa,
  Pengaturan,
};
