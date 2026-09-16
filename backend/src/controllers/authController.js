const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Siswa, Guru, Kelas, Pengaturan, sequelize } = require('../models');
const workspaceDomain = (process.env.GOOGLE_WORKSPACE_DOMAIN || 'kalamkudussentani.sch.id').toLowerCase();

async function getGoogleClientId() {
  const setting = await Pengaturan.findByPk(1, { attributes: ['google_client_id'] });
  return setting?.google_client_id || process.env.GOOGLE_CLIENT_ID || '';
}

exports.googleConfig = async (req, res) => {
  const clientId = await getGoogleClientId();
  res.json({
    enabled: Boolean(clientId),
    client_id: clientId || null,
    hosted_domain: workspaceDomain,
  });
};

async function createAppToken(user) {
  let payload = { id: user.id, username: user.username, nama: user.nama, role: user.role };

  if (user.role === 'siswa') {
    const siswa = await Siswa.findOne({ where: { user_id: user.id } });
    payload.siswa_id = siswa ? siswa.id : null;
    payload.kelas_id = siswa ? siswa.kelas_id : null;
    payload.profile_complete = Boolean(siswa?.nis && siswa?.kelas_id);
  } else if (user.role === 'guru') {
    const guru = await Guru.findOne({ where: { user_id: user.id } });
    payload.guru_id = guru ? guru.id : null;
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
  return { token, user: payload };
}

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    res.json(await createAppToken(user));
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan server.', error: err.message });
  }
};

exports.loginWithGoogle = async (req, res) => {
  try {
    const clientId = await getGoogleClientId();
    if (!clientId) {
      return res.status(503).json({ message: 'Login Google belum dikonfigurasi oleh administrator.' });
    }
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Token Google tidak ditemukan.' });

    const ticket = await new OAuth2Client(clientId).verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const profile = ticket.getPayload();
    const email = String(profile?.email || '').toLowerCase();
    const hostedDomain = String(profile?.hd || '').toLowerCase();
    if (!profile?.email_verified || !email.endsWith(`@${workspaceDomain}`) || hostedDomain !== workspaceDomain) {
      return res.status(403).json({ message: `Gunakan akun Google Workspace @${workspaceDomain}.` });
    }

    let user = await User.findOne({ where: { email } });
    if (user && user.role !== 'siswa') {
      return res.status(403).json({ message: 'Email Google ini sudah digunakan oleh akun non-siswa.' });
    }
    if (!user) {
      const transaction = await sequelize.transaction();
      try {
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '.').slice(0, 40) || 'siswa';
        let username = baseUsername;
        let suffix = 1;
        while (await User.findOne({ where: { username }, transaction })) {
          suffix += 1;
          username = `${baseUsername}.${suffix}`;
        }
        user = await User.create({
          nama: profile.name || email.split('@')[0],
          username,
          email,
          google_id: profile.sub,
          password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
          role: 'siswa',
        }, { transaction });
        await Siswa.create({ user_id: user.id, nis: null, kelas_id: null, jenis_kelamin: null }, { transaction });
        await transaction.commit();
      } catch (createError) {
        await transaction.rollback();
        throw createError;
      }
    }
    if (!(await Siswa.findOne({ where: { user_id: user.id } }))) {
      await Siswa.create({ user_id: user.id, nis: null, kelas_id: null, jenis_kelamin: null });
    }
    if (!user.is_active) return res.status(403).json({ message: 'Akun siswa tidak aktif.' });

    if (user.google_id && user.google_id !== profile.sub) {
      return res.status(403).json({ message: 'Email Google tidak cocok dengan akun yang terhubung.' });
    }
    if (!user.google_id) await user.update({ google_id: profile.sub });

    res.json(await createAppToken(user));
  } catch (err) {
    console.error('Google Login Error:', err);
    res.status(401).json({ message: 'Token Google tidak valid atau sudah kedaluwarsa.' });
  }
};

exports.completeStudentProfile = async (req, res) => {
  try {
    if (req.user.role !== 'siswa') return res.status(403).json({ message: 'Hanya akun siswa yang dapat melengkapi profil.' });
    const { nis, kelas_id, jenis_kelamin } = req.body;
    if (!String(nis || '').trim() || !kelas_id || !['L', 'P'].includes(jenis_kelamin)) {
      return res.status(400).json({ message: 'NIS, kelas, dan jenis kelamin wajib diisi.' });
    }
    const siswa = await Siswa.findOne({ where: { user_id: req.user.id } });
    if (!siswa) return res.status(404).json({ message: 'Profil siswa tidak ditemukan.' });
    const kelas = await Kelas.findByPk(kelas_id);
    if (!kelas) return res.status(400).json({ message: 'Kelas tidak ditemukan.' });
    const nisDipakai = await Siswa.findOne({ where: { nis: String(nis).trim(), id: { [Op.ne]: siswa.id } } });
    if (nisDipakai) return res.status(400).json({ message: 'NIS sudah digunakan siswa lain.' });
    await siswa.update({ nis: String(nis).trim(), kelas_id, jenis_kelamin });
    const user = await User.findByPk(req.user.id);
    res.json(await createAppToken(user));
  } catch (err) {
    res.status(400).json({ message: 'Gagal menyimpan profil siswa.', error: err.message });
  }
};

// Ganti password akun sendiri (semua role)
exports.gantiPassword = async (req, res) => {
  try {
    const { password_lama, password_baru } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Akun tidak ditemukan.' });
    if (!String(password_lama || '').trim() || String(password_baru || '').length < 6) {
      return res.status(400).json({ message: 'Password lama wajib diisi dan password baru minimal 6 karakter.' });
    }
    const match = await bcrypt.compare(password_lama, user.password);
    if (!match) return res.status(400).json({ message: 'Password lama salah.' });

    user.password = await bcrypt.hash(password_baru, 10);
    await user.save();
    res.json({ message: 'Password berhasil diubah.' });
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server.', error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'nama', 'username', 'email', 'role'],
  });
  if (!user) return res.status(404).json({ message: 'Akun tidak ditemukan.' });
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Akun tidak ditemukan.' });

    const nama = String(req.body.nama || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase() || null;
    if (!nama) return res.status(400).json({ message: 'Nama wajib diisi.' });

    if (email) {
      const emailDipakai = await User.findOne({
        where: { email, id: { [Op.ne]: user.id } },
      });
      if (emailDipakai) return res.status(400).json({ message: 'Email sudah digunakan akun lain.' });
    }

    const { password_lama, password_baru } = req.body;
    const inginGantiPassword = password_lama || password_baru;
    if (inginGantiPassword) {
      if (!String(password_lama || '').trim() || String(password_baru || '').length < 6) {
        return res.status(400).json({ message: 'Password lama wajib diisi dan password baru minimal 6 karakter.' });
      }
      if (!(await bcrypt.compare(password_lama, user.password))) {
        return res.status(400).json({ message: 'Password lama salah.' });
      }
      user.password = await bcrypt.hash(password_baru, 10);
    }

    user.nama = nama;
    user.email = email;
    await user.save();
    res.json({ message: 'Profil berhasil diperbarui.', ...(await createAppToken(user)) });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan server.', error: err.message });
  }
};
