const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { Soal, Guru, MataPelajaran, JenisUjian, sequelize } = require('../models');
const { getGeminiConfig } = require('../utils/geminiConfig');
const { uploadDir, ensureUploadDir } = require('../utils/uploadDir');

// Helper: pastikan guru yang login memang mengampu mapel_id yang dituju.
async function guruBolehAksesMapel(guruId, mapelId) {
  const guru = await Guru.findByPk(guruId, { include: [MataPelajaran] });
  if (!guru) return false;
  return guru.MataPelajarans.some((m) => m.id === Number(mapelId));
}

function parseOpsi(opsi) {
  if (!opsi) return null;
  if (typeof opsi === 'object') return opsi;
  try {
    return JSON.parse(opsi);
  } catch (err) {
    return null;
  }
}

function removeUploadedFile(filePath) {
  if (!filePath || !filePath.startsWith('/uploads/')) return;
  const absolutePath = path.join(uploadDir, filePath.slice('/uploads/'.length));
  if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
}

// Guru melihat daftar soal miliknya (bisa difilter mapel & jenis ujian)
exports.getAll = async (req, res) => {
  const where = {};
  const requestedPage = Number.parseInt(req.query.page, 10);
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 15)
    : 15;
  if (req.user.role === 'guru') {
    where.guru_id = req.user.guru_id;
  }
  if (req.query.mapel_id) where.mapel_id = req.query.mapel_id;
  if (req.query.jenis_ujian_id) where.jenis_ujian_id = req.query.jenis_ujian_id;
  if (req.query.tahun_pelajaran) where.tahun_pelajaran = req.query.tahun_pelajaran;
  if (req.query.tipe_soal) {
    if (!['pilihan_ganda', 'essay'].includes(req.query.tipe_soal)) {
      return res.status(400).json({ message: 'Filter tipe soal tidak valid.' });
    }
    where.tipe_soal = req.query.tipe_soal;
  }

  const { count, rows } = await Soal.findAndCountAll({
    where,
    include: [
      { model: MataPelajaran, attributes: ['id', 'nama_mapel'] },
      { model: JenisUjian, attributes: ['id', 'nama_jenis'] },
    ],
    order: [['id', 'DESC']],
    limit,
    offset: (page - 1) * limit,
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

function addPdfText(doc, text, options = {}) {
  const value = String(text || '');
  doc.font(options.font || 'Helvetica')
    .fontSize(options.size || 10)
    .fillColor(options.color || '#12345B')
    .text(value, {
      width: options.width || 500,
      align: options.align || 'left',
      lineGap: options.lineGap || 2,
      continued: false,
    });
}

function ensurePdfSpace(doc, height = 80) {
  if (doc.y + height > doc.page.height - 50) doc.addPage();
}

function imageAbsolutePath(imagePath) {
  if (!imagePath || !imagePath.startsWith('/uploads/')) return null;
  return path.join(uploadDir, imagePath.slice('/uploads/'.length));
}

exports.exportPdf = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'guru') where.guru_id = req.user.guru_id;
    if (req.query.mapel_id) where.mapel_id = req.query.mapel_id;
    if (req.query.jenis_ujian_id) where.jenis_ujian_id = req.query.jenis_ujian_id;
    if (req.query.tahun_pelajaran) where.tahun_pelajaran = req.query.tahun_pelajaran;

    const soalList = await Soal.findAll({
      where,
      include: [MataPelajaran],
      order: [['id', 'ASC']],
    });
    if (!soalList.length) {
      return res.status(404).json({ message: 'Belum ada soal yang dapat diekspor.' });
    }

    const pilihanGanda = soalList.filter((soal) => soal.tipe_soal === 'pilihan_ganda');
    const essay = soalList.filter((soal) => soal.tipe_soal === 'essay');
    const mapelNama = soalList[0].MataPelajaran?.nama_mapel || 'Semua Mata Pelajaran';
    const tahun = req.query.tahun_pelajaran || [...new Set(soalList.map((soal) => soal.tahun_pelajaran))].join(', ');
    const filename = `Bank_Soal_${mapelNama.replace(/[^a-z0-9]+/gi, '_')}.pdf`;
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    addPdfText(doc, 'BANK SOAL', { font: 'Helvetica-Bold', size: 10, color: '#1E5AA8' });
    addPdfText(doc, mapelNama, { font: 'Helvetica-Bold', size: 20, color: '#12345B' });
    addPdfText(doc, `Tahun Pelajaran: ${tahun}`, { size: 10, color: '#536B84' });
    addPdfText(doc, `Jumlah soal: ${soalList.length} (${pilihanGanda.length} pilihan ganda, ${essay.length} essay)`, {
      size: 10,
      color: '#536B84',
    });
    doc.moveDown(1.2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#D8E3EF').stroke();
    doc.moveDown(1);

    const renderQuestion = (soal, number) => {
      ensurePdfSpace(doc, 130);
      addPdfText(doc, `${number}. ${soal.pertanyaan}`, { font: 'Helvetica-Bold', size: 11, lineGap: 3 });
      if (soal.gambar) {
        const absoluteImage = imageAbsolutePath(soal.gambar);
        if (absoluteImage && fs.existsSync(absoluteImage) && /\.(png|jpe?g)$/i.test(absoluteImage)) {
          ensurePdfSpace(doc, 145);
          try {
            doc.image(absoluteImage, { fit: [220, 125], align: 'left' });
            doc.moveDown(0.5);
          } catch (err) {
            console.warn(`Gambar soal ${soal.id} tidak dapat dimasukkan ke PDF:`, err.message);
          }
        }
      }
      if (soal.tipe_soal === 'pilihan_ganda') {
        const opsi = soal.opsi && typeof soal.opsi === 'object' ? soal.opsi : {};
        ['A', 'B', 'C', 'D'].forEach((key) => {
          addPdfText(doc, `${key}. ${opsi[key] || '-'}`, { size: 10, width: 480, lineGap: 1 });
        });
        addPdfText(doc, `Kunci jawaban: ${soal.jawaban_benar || '-'}`, { size: 9, color: '#14866D' });
      } else {
        addPdfText(doc, 'Jawaban: ________________________________________________________________', {
          size: 10,
          color: '#536B84',
        });
        addPdfText(doc, '________________________________________________________________________', {
          size: 10,
          color: '#536B84',
        });
      }
      addPdfText(doc, `Bobot: ${soal.bobot_nilai || 0}  |  CP: ${soal.cp || '-'}  |  TP: ${soal.tp || '-'}`, {
        size: 8,
        color: '#536B84',
        lineGap: 1,
      });
      doc.moveDown(1);
    };

    if (pilihanGanda.length) {
      addPdfText(doc, 'A. PILIHAN GANDA', { font: 'Helvetica-Bold', size: 14, color: '#1E5AA8' });
      doc.moveDown(0.5);
      pilihanGanda.forEach((soal, index) => renderQuestion(soal, index + 1));
    }
    if (essay.length) {
      ensurePdfSpace(doc, 90);
      addPdfText(doc, 'B. SOAL ESSAY', { font: 'Helvetica-Bold', size: 14, color: '#1E5AA8' });
      doc.moveDown(0.5);
      essay.forEach((soal, index) => renderQuestion(soal, pilihanGanda.length + index + 1));
    }

    const range = doc.bufferedPageRange();
    for (let page = range.start; page < range.start + range.count; page += 1) {
      doc.switchToPage(page);
      doc.font('Helvetica')
        .fontSize(8)
        .fillColor('#536B84')
        .text(`Halaman ${page + 1} dari ${range.count}`, 50, doc.page.height - 35, {
          width: 495,
          align: 'right',
        });
    }
    doc.end();
  } catch (err) {
    console.error('Export Bank Soal PDF Error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Gagal mengekspor bank soal ke PDF.', error: err.message });
  }
};

// Guru menambahkan soal ujian sesuai mata pelajaran yang diampu.
exports.create = async (req, res) => {
  try {
    const guru_id = req.user.guru_id;
    const { mapel_id, jenis_ujian_id, tahun_pelajaran, pertanyaan, opsi, jawaban_benar, bobot_nilai, cp, tp } = req.body;
    const tipe = req.body.tipe_soal || 'pilihan_ganda';
    const parsedOpsi = parseOpsi(opsi);

    if (!['pilihan_ganda', 'essay'].includes(tipe)) {
      return res.status(400).json({ message: 'Tipe soal harus pilihan ganda atau essay.' });
    }
    if (!pertanyaan || !String(pertanyaan).trim()) {
      return res.status(400).json({ message: 'Pertanyaan wajib diisi.' });
    }
    if (tipe === 'pilihan_ganda') {
      const pilihan = ['A', 'B', 'C', 'D'];
      if (!parsedOpsi || pilihan.some((key) => !parsedOpsi[key] || !String(parsedOpsi[key]).trim())) {
        return res.status(400).json({ message: 'Semua opsi A-D wajib diisi untuk soal pilihan ganda.' });
      }
      if (!pilihan.includes(jawaban_benar)) {
        return res.status(400).json({ message: 'Jawaban benar harus berupa A, B, C, atau D.' });
      }
    }

    // RBAC tambahan pada level data: guru tidak bisa input soal di luar mapel yang diampunya.
    const boleh = await guruBolehAksesMapel(guru_id, mapel_id);
    if (!boleh) {
      return res.status(403).json({ message: 'Anda tidak mengampu mata pelajaran ini, tidak bisa menambahkan soal.' });
    }

    const soal = await Soal.create({
      guru_id, mapel_id, jenis_ujian_id, tahun_pelajaran,
      tipe_soal: tipe, pertanyaan,
      cp: cp || null,
      tp: tp || null,
      gambar: req.file ? `/uploads/${req.file.filename}` : null,
      opsi: tipe === 'essay' ? null : parsedOpsi,
      jawaban_benar: tipe === 'essay' ? null : jawaban_benar,
      bobot_nilai,
    });
    res.status(201).json(soal);
  } catch (err) {
    res.status(400).json({ message: 'Gagal menambahkan soal.', error: err.message });
  }
};

function parseGeminiJson(text) {
  const cleaned = String(text || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

function validateGeneratedQuestions(result, jumlahPg, jumlahEssay, strictCounts = true) {
  if (!result || !Array.isArray(result.soal)) throw new Error('Respons Gemini tidak memiliki format soal yang valid.');
  if (!result.soal.length || result.soal.length > 100) {
    throw new Error('Gemini tidak menghasilkan jumlah soal yang valid (maksimal 100 soal).');
  }
  if (strictCounts && result.soal.length !== jumlahPg + jumlahEssay) {
    throw new Error('Jumlah soal dari Gemini tidak sesuai dengan permintaan.');
  }
  const pilihan = ['A', 'B', 'C', 'D'];
  const seen = new Set();
  result.soal.forEach((item, index) => {
    if (!item || !['pilihan_ganda', 'essay'].includes(item.tipe_soal)) {
      throw new Error(`Tipe soal hasil Gemini tidak valid pada nomor ${index + 1}.`);
    }
    if (!item.pertanyaan || !String(item.pertanyaan).trim()) {
      throw new Error(`Pertanyaan hasil Gemini kosong pada nomor ${index + 1}.`);
    }
    const key = `${item.tipe_soal}:${String(item.pertanyaan).trim().toLowerCase()}`;
    if (seen.has(key)) throw new Error(`Gemini menghasilkan pertanyaan duplikat pada nomor ${index + 1}.`);
    seen.add(key);
    if (item.tipe_soal === 'pilihan_ganda') {
      if (!item.opsi || pilihan.some((keyOpsi) => !item.opsi[keyOpsi] || !String(item.opsi[keyOpsi]).trim())) {
        throw new Error(`Opsi A-D tidak lengkap pada nomor ${index + 1}.`);
      }
      if (!pilihan.includes(item.jawaban_benar)) {
        throw new Error(`Jawaban benar tidak valid pada nomor ${index + 1}.`);
      }
    }
  });
  const actualPg = result.soal.filter((item) => item.tipe_soal === 'pilihan_ganda').length;
  const actualEssay = result.soal.filter((item) => item.tipe_soal === 'essay').length;
  if (strictCounts && (actualPg !== jumlahPg || actualEssay !== jumlahEssay)) {
    throw new Error('Komposisi pilihan ganda dan essay dari Gemini tidak sesuai.');
  }
}

async function generateQuestionImage(prompt) {
  const config = await getGeminiConfig();
  if (!config.apiKey) throw new Error('API key Gemini belum dikonfigurasi oleh administrator.');
  const model = config.imageModel;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.apiKey,
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{
          text: `Create an educational illustration for a school exam. ${prompt}. No text, no labels, no logos, clean composition, suitable for SMP students.`,
        }],
      }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });
  const body = await response.json();
  if (response.status === 429) {
    throw new Error('Kuota model gambar Gemini sedang habis atau belum tersedia pada akun ini. Nonaktifkan opsi ilustrasi otomatis atau aktifkan billing Gemini.');
  }
  if (!response.ok) throw new Error(body.error?.message || 'Model gambar gagal membuat ilustrasi.');
  const imagePart = body.candidates?.[0]?.content?.parts?.find((part) => part.inlineData || part.inline_data);
  const imageData = imagePart?.inlineData || imagePart?.inline_data;
  const image = imageData?.data;
  const mimeType = imageData?.mimeType || imageData?.mime_type || 'image/png';
  if (!image) throw new Error('Model gambar tidak mengembalikan file ilustrasi.');

  const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const filename = `soal-ai-${Date.now()}-${crypto.randomBytes(5).toString('hex')}.${extension}`;
  const uploadPath = ensureUploadDir();
  fs.writeFileSync(path.join(uploadPath, filename), Buffer.from(image, 'base64'));
  return `/uploads/${filename}`;
}

exports.generate = async (req, res) => {
  const generatedImagePaths = [];
  try {
    const geminiConfig = await getGeminiConfig();
    if (!geminiConfig.apiKey) {
      return res.status(503).json({ message: 'Generator Gemini belum dikonfigurasi. Minta administrator mengisi API key pada Pengaturan Admin.' });
    }

    const {
      mapel_id, jenis_ujian_id, tahun_pelajaran, cp, tp,
      jumlah_pilihan_ganda, jumlah_essay, tingkat_kesulitan = 'sedang',
      sumber_mode = 'referensi', generate_images = 'false',
    } = req.body;
    const mode = sumber_mode === 'import' ? 'import' : 'referensi';
    const wantsImages = generate_images === true || generate_images === 'true';
    const jumlahPg = Number(jumlah_pilihan_ganda);
    const jumlahEssay = Number(jumlah_essay);
    if (mode === 'referensi' && (!Number.isInteger(jumlahPg) || jumlahPg < 0 || !Number.isInteger(jumlahEssay) || jumlahEssay < 0 || jumlahPg + jumlahEssay < 1)) {
      return res.status(400).json({ message: 'Jumlah pilihan ganda dan essay harus berupa bilangan bulat, dengan total minimal 1.' });
    }
    if (mode === 'referensi' && jumlahPg + jumlahEssay > 50) {
      return res.status(400).json({ message: 'Maksimal 50 soal dalam sekali generate.' });
    }
    if (!mapel_id || !jenis_ujian_id || !tahun_pelajaran || (mode === 'referensi' && (!String(cp || '').trim() || !String(tp || '').trim()))) {
      return res.status(400).json({ message: mode === 'referensi' ? 'Mapel, jenis ujian, tahun pelajaran, CP, dan TP wajib diisi.' : 'Mapel, jenis ujian, tahun pelajaran, dan PDF wajib diisi.' });
    }
    if (mode === 'import' && !req.file) return res.status(400).json({ message: 'Pilih PDF yang akan diimport.' });
    if (!['mudah', 'sedang', 'sulit'].includes(tingkat_kesulitan)) {
      return res.status(400).json({ message: 'Tingkat kesulitan tidak valid.' });
    }
    if (!(await guruBolehAksesMapel(req.user.guru_id, mapel_id))) {
      return res.status(403).json({ message: 'Anda tidak mengampu mata pelajaran ini.' });
    }
    const mapel = await MataPelajaran.findByPk(mapel_id);
    if (!mapel) return res.status(404).json({ message: 'Mata pelajaran tidak ditemukan.' });

    const prompt = [
      'Anda adalah penyusun soal ujian sekolah SMP berbahasa Indonesia.',
      mode === 'import'
        ? 'Baca PDF terlampir dan import semua soal yang dapat dikenali. Pertahankan makna dan pilihan jawaban sedekat mungkin dengan sumber.'
        : 'Buat soal baru berdasarkan data berikut. Gunakan PDF terlampir hanya sebagai referensi materi, jangan menyalin seluruh kalimatnya.',
      `Mata pelajaran: ${mapel.nama_mapel}`,
      `CP (Capaian Pembelajaran): ${String(cp || '').trim() || 'Tidak ditentukan; simpulkan dari materi PDF.'}`,
      `TP (Tujuan Pembelajaran): ${String(tp || '').trim() || 'Tidak ditentukan; simpulkan dari materi PDF.'}`,
      `Tingkat kesulitan: ${tingkat_kesulitan}`,
      mode === 'referensi' ? `Jumlah pilihan ganda: ${jumlahPg}` : 'Import seluruh soal yang tersedia di PDF.',
      mode === 'referensi' ? `Jumlah essay: ${jumlahEssay}` : 'Tentukan tipe soal berdasarkan bentuk soal pada PDF.',
      '',
      'Kembalikan HANYA JSON valid tanpa markdown dengan bentuk:',
      '{"soal":[{"tipe_soal":"pilihan_ganda","pertanyaan":"...","opsi":{"A":"...","B":"...","C":"...","D":"..."},"jawaban_benar":"A","bobot_nilai":1,"gambar_diperlukan":true,"deskripsi_gambar":"..."},{"tipe_soal":"essay","pertanyaan":"...","opsi":null,"jawaban_benar":null,"bobot_nilai":5,"gambar_diperlukan":false,"deskripsi_gambar":""}]}',
      'Urutkan semua pilihan_ganda terlebih dahulu, lalu semua essay.',
      'Setiap pertanyaan harus berbeda, jelas, sesuai CP dan TP, serta tidak menyebut bahwa soal dibuat oleh AI.',
      'Set gambar_diperlukan menjadi true hanya jika diagram, peta, grafik, objek visual, atau ilustrasi benar-benar membantu siswa menjawab soal.',
    ].join('\n');
    const model = geminiConfig.model;
    const parts = [{ text: prompt }];
    if (req.file) {
      parts.push({ inlineData: { mimeType: 'application/pdf', data: req.file.buffer.toString('base64') } });
    }
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiConfig.apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error?.message || 'Permintaan ke Gemini gagal.');
    }
    const generatedText = body.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('');
    const generated = parseGeminiJson(generatedText);
    validateGeneratedQuestions(generated, jumlahPg, jumlahEssay, mode === 'referensi');

    const sortedItems = [...generated.soal]
      .sort((a, b) => (a.tipe_soal === b.tipe_soal ? 0 : a.tipe_soal === 'pilihan_ganda' ? -1 : 1));
    const rows = sortedItems
      .map((item) => ({
        guru_id: req.user.guru_id,
        mapel_id,
        jenis_ujian_id,
        tahun_pelajaran,
        tipe_soal: item.tipe_soal,
        cp: String(cp || '').trim() || null,
        tp: String(tp || '').trim() || null,
        pertanyaan: String(item.pertanyaan).trim(),
        opsi: item.tipe_soal === 'essay' ? null : item.opsi,
        jawaban_benar: item.tipe_soal === 'essay' ? null : item.jawaban_benar,
        bobot_nilai: Number(item.bobot_nilai) > 0 ? Number(item.bobot_nilai) : (item.tipe_soal === 'essay' ? 5 : 1),
      }));
    if (wantsImages) {
      for (let index = 0; index < sortedItems.length; index += 1) {
        const item = sortedItems[index];
        if (item.gambar_diperlukan && item.deskripsi_gambar) {
          rows[index].gambar = await generateQuestionImage(String(item.deskripsi_gambar));
          generatedImagePaths.push(rows[index].gambar);
        }
      }
    }
    const created = await sequelize.transaction(async (transaction) => Soal.bulkCreate(rows, { transaction }));
    res.status(201).json({ message: `${created.length} soal berhasil dibuat dan disimpan${generatedImagePaths.length ? `, termasuk ${generatedImagePaths.length} ilustrasi` : ''}.`, data: created });
  } catch (err) {
    generatedImagePaths.forEach(removeUploadedFile);
    console.error('Generate Soal Error:', err);
    res.status(502).json({ message: err.message || 'Gagal membuat soal dengan Gemini.' });
  }
};

exports.update = async (req, res) => {
  try {
    const soal = await Soal.findByPk(req.params.id);
    if (!soal) return res.status(404).json({ message: 'Soal tidak ditemukan.' });

    // Guru hanya boleh mengubah soal miliknya sendiri.
    if (req.user.role === 'guru' && soal.guru_id !== req.user.guru_id) {
      return res.status(403).json({ message: 'Anda tidak berhak mengubah soal ini.' });
    }

    const tipe = req.body.tipe_soal || soal.tipe_soal;
    const parsedOpsi = parseOpsi(req.body.opsi);
    if (!['pilihan_ganda', 'essay'].includes(tipe)) {
      return res.status(400).json({ message: 'Tipe soal harus pilihan ganda atau essay.' });
    }
    if (!req.body.pertanyaan || !String(req.body.pertanyaan).trim()) {
      return res.status(400).json({ message: 'Pertanyaan wajib diisi.' });
    }
    if (tipe === 'pilihan_ganda') {
      const pilihan = ['A', 'B', 'C', 'D'];
      if (!parsedOpsi || pilihan.some((key) => !parsedOpsi[key] || !String(parsedOpsi[key]).trim())) {
        return res.status(400).json({ message: 'Semua opsi A-D wajib diisi untuk soal pilihan ganda.' });
      }
      if (!pilihan.includes(req.body.jawaban_benar)) {
        return res.status(400).json({ message: 'Jawaban benar harus berupa A, B, C, atau D.' });
      }
    }
    if (req.body.mapel_id && !(await guruBolehAksesMapel(req.user.guru_id, req.body.mapel_id))) {
      return res.status(403).json({ message: 'Anda tidak mengampu mata pelajaran ini.' });
    }

    const gambarLama = soal.gambar;
    const nextData = {
      mapel_id: req.body.mapel_id,
      jenis_ujian_id: req.body.jenis_ujian_id,
      tahun_pelajaran: req.body.tahun_pelajaran,
      tipe_soal: tipe,
      cp: req.body.cp !== undefined ? (req.body.cp || null) : soal.cp,
      tp: req.body.tp !== undefined ? (req.body.tp || null) : soal.tp,
      pertanyaan: req.body.pertanyaan,
      opsi: tipe === 'essay' ? null : parsedOpsi,
      jawaban_benar: tipe === 'essay' ? null : req.body.jawaban_benar,
      bobot_nilai: req.body.bobot_nilai,
    };
    if (req.file) {
      nextData.gambar = `/uploads/${req.file.filename}`;
    } else if (req.body.hapus_gambar === 'true') {
      nextData.gambar = null;
    } else {
      nextData.gambar = soal.gambar;
    }

    await soal.update(nextData);
    if (req.file || req.body.hapus_gambar === 'true') removeUploadedFile(gambarLama);
    res.json(soal);
  } catch (err) {
    res.status(400).json({ message: 'Gagal mengubah soal.', error: err.message });
  }
};

exports.remove = async (req, res) => {
  const soal = await Soal.findByPk(req.params.id);
  if (!soal) return res.status(404).json({ message: 'Soal tidak ditemukan.' });

  if (req.user.role === 'guru' && soal.guru_id !== req.user.guru_id) {
    return res.status(403).json({ message: 'Anda tidak berhak menghapus soal ini.' });
  }

  const gambarLama = soal.gambar;
  await soal.destroy();
  removeUploadedFile(gambarLama);
  res.json({ message: 'Soal berhasil dihapus.' });
};
