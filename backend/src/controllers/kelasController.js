const { Kelas } = require('../models');

exports.getAll = async (req, res) => {
  const data = await Kelas.findAll({ order: [['nama_kelas', 'ASC']] });
  res.json(data);
};

exports.create = async (req, res) => {
  try {
    const { nama_kelas, tingkat, petunjuk_ujian } = req.body;
    const kelas = await Kelas.create({ nama_kelas, tingkat, petunjuk_ujian });
    res.status(201).json(kelas);
  } catch (err) {
    res.status(400).json({ message: 'Gagal menambahkan kelas.', error: err.message });
  }
};

exports.update = async (req, res) => {
  const kelas = await Kelas.findByPk(req.params.id);
  if (!kelas) return res.status(404).json({ message: 'Kelas tidak ditemukan.' });
  const updates = {};
  ['nama_kelas', 'tingkat', 'petunjuk_ujian'].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  await kelas.update(updates);
  res.json(kelas);
};

exports.remove = async (req, res) => {
  const kelas = await Kelas.findByPk(req.params.id);
  if (!kelas) return res.status(404).json({ message: 'Kelas tidak ditemukan.' });
  await kelas.destroy();
  res.json({ message: 'Kelas berhasil dihapus.' });
};
