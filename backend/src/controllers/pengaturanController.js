const { Pengaturan, JenisUjian } = require('../models');
const { encrypt, getGeminiConfig } = require('../utils/geminiConfig');

exports.get = async (req, res) => {
  const setting = await Pengaturan.findByPk(1);
  const jenisUjian = await JenisUjian.findAll();
  res.json({ ...setting.toJSON(), jenis_ujian: jenisUjian });
};

exports.update = async (req, res) => {
  const { nama_sekolah, alamat_sekolah, tahun_pelajaran_aktif } = req.body;
  const setting = await Pengaturan.findByPk(1);

  // req.file diisi oleh middleware multer jika ada file logo diunggah (lihat routes/pengaturan.js)
  const logo_path = req.file ? `/uploads/${req.file.filename}` : setting.logo_path;

  await setting.update({ nama_sekolah, alamat_sekolah, tahun_pelajaran_aktif, logo_path });
  res.json(setting);
};

exports.getAi = async (req, res) => {
  const config = await getGeminiConfig();
  res.json({
    configured: Boolean(config.apiKey),
    source: config.source,
    model: config.model,
    image_model: config.imageModel,
  });
};

exports.updateAi = async (req, res) => {
  const { gemini_api_key, gemini_model, hapus_gemini_api_key } = req.body;
  const setting = await Pengaturan.findByPk(1);
  const model = String(gemini_model || process.env.GEMINI_MODEL || 'gemini-3.6-flash').trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) {
    return res.status(400).json({ message: 'Nama model Gemini tidak valid.' });
  }

  const updateData = { gemini_model: model };
  if (String(gemini_api_key || '').trim()) {
    updateData.gemini_api_key_encrypted = encrypt(String(gemini_api_key).trim());
  } else if (hapus_gemini_api_key === 'true' || hapus_gemini_api_key === true) {
    updateData.gemini_api_key_encrypted = null;
  }
  await setting.update(updateData);
  const config = await getGeminiConfig();
  res.json({
    message: 'Pengaturan AI berhasil disimpan.',
    configured: Boolean(config.apiKey),
    source: config.source,
    model: config.model,
    image_model: config.imageModel,
  });
};

exports.getGoogle = async (req, res) => {
  const setting = await Pengaturan.findByPk(1, { attributes: ['google_client_id'] });
  res.json({
    configured: Boolean(setting?.google_client_id || process.env.GOOGLE_CLIENT_ID),
    source: setting?.google_client_id ? 'database' : (process.env.GOOGLE_CLIENT_ID ? 'env' : 'none'),
    client_id: setting?.google_client_id || '',
    hosted_domain: (process.env.GOOGLE_WORKSPACE_DOMAIN || 'kalamkudussentani.sch.id').toLowerCase(),
  });
};

exports.updateGoogle = async (req, res) => {
  const { google_client_id, hapus_google_client_id } = req.body;
  const setting = await Pengaturan.findByPk(1);
  const clientId = String(google_client_id || '').trim();
  if (clientId && !/^[0-9]+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i.test(clientId)) {
    return res.status(400).json({ message: 'Format Google OAuth Client ID tidak valid.' });
  }
  const updateData = {};
  if (clientId) updateData.google_client_id = clientId;
  if (hapus_google_client_id === true || hapus_google_client_id === 'true') updateData.google_client_id = null;
  await setting.update(updateData);
  const configured = Boolean(updateData.google_client_id || process.env.GOOGLE_CLIENT_ID);
  res.json({
    message: updateData.google_client_id === null ? 'Client ID database dihapus.' : 'Google OAuth Client ID berhasil disimpan.',
    configured,
    source: updateData.google_client_id ? 'database' : (process.env.GOOGLE_CLIENT_ID ? 'env' : 'none'),
    client_id: updateData.google_client_id || '',
    hosted_domain: (process.env.GOOGLE_WORKSPACE_DOMAIN || 'kalamkudussentani.sch.id').toLowerCase(),
  });
};

// Kelola master jenis ujian: Sumatif Harian, STS, SAS, dst.
exports.tambahJenisUjian = async (req, res) => {
  const { nama_jenis } = req.body;
  const jenis = await JenisUjian.create({ nama_jenis });
  res.status(201).json(jenis);
};

exports.hapusJenisUjian = async (req, res) => {
  await JenisUjian.destroy({ where: { id: req.params.id } });
  res.json({ message: 'Jenis ujian berhasil dihapus.' });
};
