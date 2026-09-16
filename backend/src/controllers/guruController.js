const bcrypt = require('bcryptjs');
const { Guru, User, MataPelajaran, sequelize } = require('../models');

exports.getAll = async (req, res) => {
  const data = await Guru.findAll({
    include: [
      { model: User, attributes: ['id', 'nama', 'username', 'is_active'] },
      { model: MataPelajaran, through: { attributes: [] } },
    ],
    order: [['id', 'DESC']],
  });
  res.json(data);
};

// Admin menambahkan guru: buat akun login (role: guru) + assign mata pelajaran yang diampu.
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { nama, username, password, nip, mapel_ids } = req.body; // mapel_ids: array of id

    const user = await User.create({
      nama, username,
      password: await bcrypt.hash(password, 10),
      role: 'guru',
    }, { transaction: t });

    const guru = await Guru.create({ user_id: user.id, nip }, { transaction: t });

    if (Array.isArray(mapel_ids) && mapel_ids.length > 0) {
      const mapelList = await MataPelajaran.findAll({ where: { id: mapel_ids } });
      await guru.setMataPelajarans(mapelList, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ guru, user: { id: user.id, nama, username } });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ message: 'Gagal menambahkan guru.', error: err.message });
  }
};

exports.update = async (req, res) => {
  const guru = await Guru.findByPk(req.params.id);
  if (!guru) return res.status(404).json({ message: 'Guru tidak ditemukan.' });

  const { nama, nip, is_active, mapel_ids } = req.body;
  await guru.update({ nip });

  const user = await User.findByPk(guru.user_id);
  if (user) await user.update({ nama, is_active });

  if (Array.isArray(mapel_ids)) {
    const mapelList = await MataPelajaran.findAll({ where: { id: mapel_ids } });
    await guru.setMataPelajarans(mapelList);
  }

  res.json({ message: 'Data guru diperbarui.' });
};

exports.remove = async (req, res) => {
  const guru = await Guru.findByPk(req.params.id);
  if (!guru) return res.status(404).json({ message: 'Guru tidak ditemukan.' });
  await User.destroy({ where: { id: guru.user_id } });
  await guru.destroy();
  res.json({ message: 'Guru berhasil dihapus.' });
};
