const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const { Readable } = require('stream');
const { Op } = require('sequelize');
const { Siswa, User, Kelas, sequelize } = require('../models');
const workspaceDomain = (process.env.GOOGLE_WORKSPACE_DOMAIN || 'kalamkudussentani.sch.id').toLowerCase();

function cellText(value) {
  if (value == null) return '';
  if (typeof value === 'object' && value.text) return String(value.text).trim();
  return String(value).trim();
}

function normalizeHeader(value) {
  return cellText(value).toLowerCase().replace(/[\s-]+/g, '_');
}

async function readStudentImport(file) {
  const workbook = new ExcelJS.Workbook();
  if (file.originalname.toLowerCase().endsWith('.csv')) {
    await workbook.csv.read(Readable.from(file.buffer), {
      parserOptions: { headers: false, skipLines: 0, trim: true },
    });
  } else {
    await workbook.xlsx.load(file.buffer);
  }
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('File tidak memiliki sheet yang dapat dibaca.');

  const headerRow = worksheet.getRow(1);
  const headers = {};
  headerRow.eachCell((cell, columnNumber) => {
    const header = normalizeHeader(cell.value);
    if (header) headers[header] = columnNumber;
  });
  const aliases = {
    nama: ['nama', 'nama_lengkap'],
    nis: ['nis'],
    kelas: ['kelas', 'kelas_id'],
    username: ['username', 'username_login'],
    password: ['password', 'password_login'],
    email: ['email', 'email_google', 'email_google_workspace'],
    jenis_kelamin: ['jenis_kelamin', 'jenis_kelamin_l_p', 'gender'],
  };
  const columns = {};
  Object.entries(aliases).forEach(([key, names]) => {
    columns[key] = names.find((name) => headers[name]);
  });
  const requiredHeaders = ['nama', 'nis', 'kelas', 'username', 'password'];
  const missingHeaders = requiredHeaders.filter((key) => !columns[key]);
  if (missingHeaders.length) {
    throw new Error(`Kolom wajib tidak ditemukan: ${missingHeaders.join(', ')}.`);
  }

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const data = {};
    Object.entries(columns).forEach(([key, column]) => {
      data[key] = column ? cellText(row.getCell(headers[column] || column).value) : '';
    });
    if (Object.values(data).some(Boolean)) rows.push({ rowNumber, data });
  });
  if (!rows.length) throw new Error('File tidak memiliki data siswa.');
  if (rows.length > 1000) throw new Error('Maksimal 1.000 siswa dalam satu kali import.');
  return rows;
}

exports.downloadTemplate = async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Siswa');
  worksheet.columns = [
    { header: 'nama', key: 'nama', width: 28 },
    { header: 'nis', key: 'nis', width: 18 },
    { header: 'kelas', key: 'kelas', width: 18 },
    { header: 'username', key: 'username', width: 20 },
    { header: 'password', key: 'password', width: 20 },
    { header: 'email', key: 'email', width: 36 },
    { header: 'jenis_kelamin', key: 'jenis_kelamin', width: 16 },
  ];
  worksheet.addRow({
    nama: 'Contoh Nama Siswa',
    nis: '2026.01.001',
    kelas: 'VII KARMEL',
    username: 'contoh.siswa',
    password: 'password123',
    email: 'contoh@kalamkudussentani.sch.id',
    jenis_kelamin: 'L',
  });
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF12345B' } };
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=Template_Import_Siswa.xlsx');
  await workbook.xlsx.write(res);
  res.end();
};

exports.getAll = async (req, res) => {
  const requestedPage = Number.parseInt(req.query.page, 10);
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 100)
    : 10;

  const { count, rows } = await Siswa.findAndCountAll({
    include: [{ model: User, attributes: ['id', 'nama', 'username', 'email', 'is_active'] }, Kelas],
    order: [['id', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });
  res.json({
    data: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
    },
  });
};

exports.importData = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Pilih file Excel (.xlsx) atau CSV (.csv).' });

  let rows;
  try {
    rows = await readStudentImport(req.file);
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Format file import tidak valid.' });
  }

  const errors = [];
  const usernames = new Set();
  const emails = new Set();
  const nisSet = new Set();
  const kelasList = await Kelas.findAll({ attributes: ['id', 'nama_kelas'] });
  const kelasByName = new Map(kelasList.map((kelas) => [kelas.nama_kelas.trim().toLowerCase(), kelas.id]));
  const kelasById = new Map(kelasList.map((kelas) => [String(kelas.id), kelas.id]));

  const normalizedRows = rows.map(({ rowNumber, data }) => {
    const kelasKey = data.kelas.toLowerCase();
    const kelasId = kelasById.get(data.kelas) || kelasByName.get(kelasKey);
    const email = data.email ? data.email.toLowerCase() : null;
    const jenisKelamin = (data.jenis_kelamin || 'L').toUpperCase();
    const rowErrors = [];
    if (!data.nama) rowErrors.push('nama kosong');
    if (!data.nis) rowErrors.push('nis kosong');
    if (!data.username) rowErrors.push('username kosong');
    if (!data.password || data.password.length < 6) rowErrors.push('password minimal 6 karakter');
    if (!kelasId) rowErrors.push(`kelas "${data.kelas}" tidak ditemukan`);
    if (email && !email.endsWith(`@${workspaceDomain}`)) rowErrors.push(`email harus berdomain @${workspaceDomain}`);
    if (jenisKelamin && !['L', 'P'].includes(jenisKelamin)) rowErrors.push('jenis_kelamin harus L atau P');
    if (usernames.has(data.username.toLowerCase())) rowErrors.push('username duplikat dalam file');
    if (nisSet.has(data.nis)) rowErrors.push('nis duplikat dalam file');
    if (email && emails.has(email)) rowErrors.push('email duplikat dalam file');
    usernames.add(data.username.toLowerCase());
    nisSet.add(data.nis);
    if (email) emails.add(email);
    if (rowErrors.length) errors.push(`Baris ${rowNumber}: ${rowErrors.join(', ')}.`);
    return {
      rowNumber,
      nama: data.nama,
      nis: data.nis,
      kelas_id: kelasId,
      username: data.username,
      password: data.password,
      email,
      jenis_kelamin: jenisKelamin,
    };
  });

  if (!errors.length) {
    const existingUsers = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.in]: [...usernames] } },
          ...(emails.size ? [{ email: { [Op.in]: [...emails] } }] : []),
        ],
      },
      attributes: ['username', 'email'],
    });
    const existingNis = await Siswa.findAll({
      where: { nis: { [Op.in]: [...nisSet] } },
      attributes: ['nis'],
    });
    const existingUsernames = new Set(existingUsers.map((user) => user.username.toLowerCase()));
    const existingEmails = new Set(existingUsers.filter((user) => user.email).map((user) => user.email.toLowerCase()));
    const existingNisSet = new Set(existingNis.map((siswa) => siswa.nis));
    normalizedRows.forEach((row) => {
      if (existingUsernames.has(row.username.toLowerCase())) errors.push(`Baris ${row.rowNumber}: username sudah digunakan.`);
      if (row.email && existingEmails.has(row.email)) errors.push(`Baris ${row.rowNumber}: email sudah digunakan.`);
      if (existingNisSet.has(row.nis)) errors.push(`Baris ${row.rowNumber}: NIS sudah digunakan.`);
    });
  }
  if (errors.length) {
    return res.status(400).json({
      message: `Import dibatalkan. Ditemukan ${errors.length} masalah pada file.`,
      errors: errors.slice(0, 50),
    });
  }

  const transaction = await sequelize.transaction();
  try {
    for (const row of normalizedRows) {
      const user = await User.create({
        nama: row.nama,
        username: row.username,
        email: row.email,
        password: await bcrypt.hash(row.password, 10),
        role: 'siswa',
      }, { transaction });
      await Siswa.create({
        user_id: user.id,
        nis: row.nis,
        kelas_id: row.kelas_id,
        jenis_kelamin: row.jenis_kelamin,
      }, { transaction });
    }
    await transaction.commit();
    res.status(201).json({ message: `${normalizedRows.length} data siswa berhasil diimport.`, count: normalizedRows.length });
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ message: 'Import dibatalkan karena gagal menyimpan data.', error: err.message });
  }
};

// Admin menambahkan siswa: otomatis membuat akun login (role: siswa) + data siswa.
exports.create = async (req, res) => {
  const t = await require('../models').sequelize.transaction();
  try {
    const { nama, username, email, password, nis, kelas_id, jenis_kelamin } = req.body;
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    if (normalizedEmail && !normalizedEmail.endsWith(`@${workspaceDomain}`)) {
      await t.rollback();
      return res.status(400).json({ message: `Email harus menggunakan domain @${workspaceDomain}.` });
    }

    const user = await User.create({
      nama, username,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: 'siswa',
    }, { transaction: t });

    const siswa = await Siswa.create({
      user_id: user.id, nis, kelas_id, jenis_kelamin,
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ siswa, user: { id: user.id, nama, username } });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ message: 'Gagal menambahkan siswa.', error: err.message });
  }
};

exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const siswa = await Siswa.findByPk(req.params.id, { transaction: t });
    if (!siswa) {
      await t.rollback();
      return res.status(404).json({ message: 'Siswa tidak ditemukan.' });
    }

    const { nama, username, email, password, nis, kelas_id, jenis_kelamin, is_active } = req.body;
    if (!nama || !String(nama).trim() || !username || !String(username).trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Nama dan username wajib diisi.' });
    }
    if (password !== undefined && password !== '' && String(password).length < 6) {
      await t.rollback();
      return res.status(400).json({ message: 'Password baru minimal 6 karakter.' });
    }

    const user = await User.findByPk(siswa.user_id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'Akun login siswa tidak ditemukan.' });
    }

    const usernameDipakai = await User.findOne({
      where: { username: String(username).trim(), id: { [Op.ne]: user.id } },
      transaction: t,
    });
    if (usernameDipakai) {
      await t.rollback();
      return res.status(400).json({ message: 'Username sudah digunakan.' });
    }
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    if (normalizedEmail && !normalizedEmail.endsWith(`@${workspaceDomain}`)) {
      await t.rollback();
      return res.status(400).json({ message: `Email harus menggunakan domain @${workspaceDomain}.` });
    }
    if (normalizedEmail) {
      const emailDipakai = await User.findOne({
        where: { email: normalizedEmail, id: { [Op.ne]: user.id } },
        transaction: t,
      });
      if (emailDipakai) {
        await t.rollback();
        return res.status(400).json({ message: 'Email Google sudah digunakan.' });
      }
    }

    await siswa.update({ nis, kelas_id, jenis_kelamin }, { transaction: t });
    const userData = {
      nama: String(nama).trim(),
      username: String(username).trim(),
      email: normalizedEmail,
      is_active,
    };
    if (password) userData.password = await bcrypt.hash(password, 10);
    await user.update(userData, { transaction: t });

    await t.commit();
    res.json({ message: 'Data siswa diperbarui.' });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ message: 'Gagal memperbarui data siswa.', error: err.message });
  }
};

exports.remove = async (req, res) => {
  const siswa = await Siswa.findByPk(req.params.id);
  if (!siswa) return res.status(404).json({ message: 'Siswa tidak ditemukan.' });
  await User.destroy({ where: { id: siswa.user_id } });
  await siswa.destroy();
  res.json({ message: 'Siswa berhasil dihapus.' });
};
