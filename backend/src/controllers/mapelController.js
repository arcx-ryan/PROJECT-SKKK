const { MataPelajaran, Guru } = require('../models');

exports.getAll = async (req, res) => {
  const options = { order: [['nama_mapel', 'ASC']] };
  if (req.user.role === 'guru') {
    options.include = [{
      model: Guru,
      where: { id: req.user.guru_id },
      attributes: [],
      through: { attributes: [] },
    }];
  }
  const data = await MataPelajaran.findAll(options);
  res.json(data);
};

exports.create = async (req, res) => {
  try {
    const { kode_mapel, nama_mapel } = req.body;
    const mapel = await MataPelajaran.create({ kode_mapel, nama_mapel });
    res.status(201).json(mapel);
  } catch (err) {
    res.status(400).json({ message: 'Gagal menambahkan mata pelajaran.', error: err.message });
  }
};

exports.update = async (req, res) => {
  const mapel = await MataPelajaran.findByPk(req.params.id);
  if (!mapel) return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan.' });
  await mapel.update(req.body);
  res.json(mapel);
};

exports.remove = async (req, res) => {
  const mapel = await MataPelajaran.findByPk(req.params.id);
  if (!mapel) return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan.' });
  await mapel.destroy();
  res.json({ message: 'Mata pelajaran berhasil dihapus.' });
};
