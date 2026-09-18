const { Ujian, Soal, HasilUjian, JawabanSiswa, MataPelajaran, JenisUjian, Kelas, Pengaturan, User, sequelize } = require('../models');
const { shuffleArray } = require('../utils/shuffle');
const { getGeminiConfig } = require('../utils/geminiConfig');

function parseGeminiJson(text) {
  const cleaned = String(text || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

async function nilaiEssayDenganGemini(essayAnswers, soalMap) {
  const geminiConfig = await getGeminiConfig();
  if (!geminiConfig.apiKey) throw new Error('API key Gemini belum dikonfigurasi oleh administrator.');
  const items = essayAnswers.map((jawaban) => {
    const soal = soalMap[jawaban.soal_id];
    return {
      jawaban_id: jawaban.id,
      soal_id: soal.id,
      pertanyaan: soal.pertanyaan,
      jawaban_siswa: jawaban.jawaban_dipilih || '',
      bobot_maksimal: Number(soal.bobot_nilai) || 0,
      cp: soal.cp || '',
      tp: soal.tp || '',
    };
  });
  const prompt = [
    'Anda adalah penilai essay ujian sekolah SMP berbahasa Indonesia.',
    'Nilai setiap jawaban secara objektif berdasarkan ketepatan konsep, kelengkapan, relevansi dengan pertanyaan, dan CP/TP.',
    'Nilai harus berada antara 0 dan bobot_maksimal. Jawaban kosong mendapat nilai 0.',
    'Berikan umpan balik singkat yang sopan untuk guru. Jangan mengarang informasi yang tidak ada.',
    'Kembalikan HANYA JSON valid tanpa markdown dalam bentuk:',
    '{"penilaian":[{"jawaban_id":1,"nilai":4.5,"umpan_balik":"..."}]}',
    'Data jawaban yang harus dinilai:',
    JSON.stringify(items),
  ].join('\n');
  const model = geminiConfig.model;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiConfig.apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message || 'Permintaan penilaian essay ke Gemini gagal.');
  const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('');
  const result = parseGeminiJson(text);
  if (!Array.isArray(result.penilaian) || result.penilaian.length !== items.length) {
    throw new Error('Respons penilaian Gemini tidak lengkap.');
  }

  const allowedIds = new Set(items.map((item) => item.jawaban_id));
  const seenIds = new Set();
  return result.penilaian.map((item) => {
    const id = Number(item.jawaban_id);
    if (!allowedIds.has(id) || seenIds.has(id)) throw new Error('Respons penilaian Gemini memiliki jawaban yang tidak valid.');
    seenIds.add(id);
    const source = items.find((candidate) => candidate.jawaban_id === id);
    const value = Number(item.nilai);
    if (!Number.isFinite(value) || value < 0 || value > source.bobot_maksimal) {
      throw new Error(`Nilai essay untuk jawaban ${id} berada di luar batas.`);
    }
    return {
      jawaban_id: id,
      nilai_essay: Math.round(value * 100) / 100,
      feedback_ai: String(item.umpan_balik || '').trim().slice(0, 2000),
    };
  });
}

function hitungNilai(answers, soalMap) {
  let totalPg = 0;
  let benarPg = 0;
  let totalEssay = 0;
  let nilaiEssay = 0;
  let total = 0;
  let diperoleh = 0;
  answers.forEach((answer) => {
    const soal = soalMap[answer.soal_id];
    if (!soal) return;
    const bobot = Number(soal.bobot_nilai) || 0;
    total += bobot;
    if (soal.tipe_soal === 'essay') {
      totalEssay += bobot;
      nilaiEssay += Number(answer.nilai_essay) || 0;
      diperoleh += Number(answer.nilai_essay) || 0;
    } else {
      totalPg += bobot;
      if (answer.is_benar) {
        benarPg += 1;
        diperoleh += bobot;
      }
    }
  });
  return {
    nilai: total > 0 ? Math.round((diperoleh / total) * 100 * 100) / 100 : 0,
    nilai_pilihan_ganda: totalPg > 0 ? Math.round((diperoleh - nilaiEssay) / totalPg * 100 * 100) / 100 : 0,
    nilai_essay: totalEssay > 0 ? Math.round(nilaiEssay / totalEssay * 100 * 100) / 100 : 0,
    jumlah_benar: benarPg,
  };
}

// ---------- GURU / ADMIN: kelola paket ujian ----------

exports.create = async (req, res) => {
  try {
    const dibuat_oleh = req.user.role === 'guru' ? req.user.guru_id : req.body.dibuat_oleh;
    const setting = await Pengaturan.findByPk(1);
    const tahunAktif = setting?.tahun_pelajaran_aktif;
    if (!tahunAktif) {
      return res.status(400).json({ message: 'Tahun pelajaran aktif belum diatur oleh admin.' });
    }

    const jumlahPg = req.body.jumlah_soal_pilihan_ganda === '' || req.body.jumlah_soal_pilihan_ganda == null
      ? null : Number(req.body.jumlah_soal_pilihan_ganda);
    const jumlahEssay = req.body.jumlah_soal_essay === '' || req.body.jumlah_soal_essay == null
      ? null : Number(req.body.jumlah_soal_essay);
    if ((jumlahPg !== null && (!Number.isInteger(jumlahPg) || jumlahPg < 0))
      || (jumlahEssay !== null && (!Number.isInteger(jumlahEssay) || jumlahEssay < 0))) {
      return res.status(400).json({ message: 'Jumlah soal harus berupa bilangan bulat nol atau lebih.' });
    }
    if (jumlahPg === 0 && jumlahEssay === 0) {
      return res.status(400).json({ message: 'Jumlah soal pilihan ganda dan essay tidak boleh sama-sama nol.' });
    }

    const ujian = await Ujian.create({
      ...req.body,
      tahun_pelajaran: tahunAktif,
      jumlah_soal_pilihan_ganda: jumlahPg,
      jumlah_soal_essay: jumlahEssay,
      jumlah_soal_tampil: null,
      dibuat_oleh,
    });
    res.status(201).json(ujian);
  } catch (err) {
    res.status(400).json({ message: 'Gagal membuat paket ujian.', error: err.message });
  }
};

exports.getAll = async (req, res) => {
  const where = {};
  if (req.user.role === 'guru') where.dibuat_oleh = req.user.guru_id;
  const data = await Ujian.findAll({
    where,
    include: [MataPelajaran, JenisUjian, Kelas],
    order: [['id', 'DESC']],
  });
  res.json(data);
};

exports.update = async (req, res) => {
  const where = { id: req.params.id };
  if (req.user.role === 'guru') where.dibuat_oleh = req.user.guru_id;
  const ujian = await Ujian.findOne({ where });
  if (!ujian) return res.status(404).json({ message: 'Ujian tidak ditemukan.' });
  const jumlahPg = req.body.jumlah_soal_pilihan_ganda === '' || req.body.jumlah_soal_pilihan_ganda == null
    ? null : Number(req.body.jumlah_soal_pilihan_ganda);
  const jumlahEssay = req.body.jumlah_soal_essay === '' || req.body.jumlah_soal_essay == null
    ? null : Number(req.body.jumlah_soal_essay);
  if ((jumlahPg !== null && (!Number.isInteger(jumlahPg) || jumlahPg < 0))
    || (jumlahEssay !== null && (!Number.isInteger(jumlahEssay) || jumlahEssay < 0))) {
    return res.status(400).json({ message: 'Jumlah soal harus berupa bilangan bulat nol atau lebih.' });
  }
  if (jumlahPg === 0 && jumlahEssay === 0) {
    return res.status(400).json({ message: 'Jumlah soal pilihan ganda dan essay tidak boleh sama-sama nol.' });
  }

  const fields = [
    'judul', 'mapel_id', 'jenis_ujian_id', 'kelas_id', 'durasi_menit',
    'acak_soal', 'acak_opsi_jawaban',
  ];
  const updates = {};
  fields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  updates.jumlah_soal_pilihan_ganda = jumlahPg;
  updates.jumlah_soal_essay = jumlahEssay;
  await ujian.update(updates);
  res.json(ujian);
};

exports.remove = async (req, res) => {
  const ujian = await Ujian.findByPk(req.params.id);
  if (!ujian) return res.status(404).json({ message: 'Ujian tidak ditemukan.' });
  await ujian.destroy();
  res.json({ message: 'Ujian berhasil dihapus.' });
};

// ---------- SISWA: lihat daftar ujian yang tersedia untuk kelasnya ----------
// Menyertakan status pengerjaan (belum/sedang/selesai) agar frontend tahu
// tombol apa yang harus ditampilkan (Mulai Ujian / Lanjutkan / Lihat Hasil).
exports.getUjianUntukSiswa = async (req, res) => {
  const siswa_id = req.user.siswa_id;
  const kelas_id = req.user.kelas_id;

  const daftarUjian = await Ujian.findAll({
    where: { kelas_id, status: 'aktif' },
    include: [MataPelajaran, JenisUjian],
    order: [['id', 'DESC']],
  });

  const hasilList = await HasilUjian.findAll({ where: { siswa_id } });
  const hasilMap = {};
  hasilList.forEach((h) => { hasilMap[h.ujian_id] = h; });

  const response = daftarUjian.map((u) => {
    const hasil = hasilMap[u.id];
    return {
      ...u.toJSON(),
      petunjuk_ujian: u.Kela?.petunjuk_ujian || u.Kelas?.petunjuk_ujian || null,
      status_pengerjaan: hasil ? hasil.status : 'belum_mengerjakan',
      hasil_ujian_id: hasil ? hasil.id : null,
      nilai: hasil ? hasil.nilai : null,
    };
  });

  res.json(response);
};

// ---------- SISWA: mulai ujian ----------
// Inti pembatasan "1 kali ujian per mata pelajaran": kombinasi (siswa_id, ujian_id)
// dicek dan dijaga UNIQUE di database (lihat model HasilUjian). Jika sudah ada
// baris dengan status "selesai", request ditolak di sini sebelum data soal dikirim.
exports.mulaiUjian = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const siswa_id = req.user.siswa_id;
    const ujian_id = req.params.id;

    const ujian = await Ujian.findByPk(ujian_id);
    if (!ujian || ujian.status !== 'aktif') {
      await t.rollback();
      return res.status(400).json({ message: 'Ujian tidak tersedia.' });
    }

    let hasil = await HasilUjian.findOne({ where: { siswa_id, ujian_id }, transaction: t });

    if (hasil && ['menunggu_penilaian', 'selesai'].includes(hasil.status)) {
      await t.rollback();
      return res.status(403).json({
        message: hasil.status === 'menunggu_penilaian'
          ? 'Jawaban ujian Anda sedang menunggu penilaian guru.'
          : 'Anda sudah pernah mengerjakan ujian ini. Setiap siswa hanya diperbolehkan 1 kali ujian per mata pelajaran.',
        hasil_ujian_id: hasil.id,
      });
    }

    if (hasil && hasil.status === 'sedang_mengerjakan') {
      // Siswa reload halaman: lanjutkan dengan urutan soal yang sama (tidak diacak ulang).
      const soalList = await Soal.findAll({ where: { id: hasil.urutan_soal } });
      const soalMap = {};
      soalList.forEach((s) => { soalMap[s.id] = s; });
      const ordered = hasil.urutan_soal.map((id) => soalMap[id]);
      await t.commit();
      return res.json({
        hasil_ujian_id: hasil.id,
        durasi_menit: ujian.durasi_menit,
        soal: sanitizeSoal(ordered, ujian.acak_opsi_jawaban),
      });
    }

    // Belum pernah mengerjakan -> ambil soal dari bank sesuai mapel/jenis/tahun ujian ini.
    let bankSoal = await Soal.findAll({
      where: {
        mapel_id: ujian.mapel_id,
        jenis_ujian_id: ujian.jenis_ujian_id,
        tahun_pelajaran: ujian.tahun_pelajaran,
      },
    });

    if (bankSoal.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Bank soal untuk ujian ini masih kosong.' });
    }

    // Acak di dalam tiap tipe, tetapi selalu kirim pilihan ganda lebih dahulu.
    let pilihanGanda = bankSoal.filter((soal) => soal.tipe_soal !== 'essay');
    let essay = bankSoal.filter((soal) => soal.tipe_soal === 'essay');
    if (ujian.acak_soal) {
      pilihanGanda = shuffleArray(pilihanGanda);
      essay = shuffleArray(essay);
    }

    const jumlahPg = ujian.jumlah_soal_pilihan_ganda;
    const jumlahEssay = ujian.jumlah_soal_essay;
    if (jumlahPg != null && pilihanGanda.length < jumlahPg) {
      await t.rollback();
      return res.status(400).json({
        message: `Bank soal pilihan ganda hanya memiliki ${pilihanGanda.length} soal, sedangkan paket meminta ${jumlahPg}.`,
      });
    }
    if (jumlahEssay != null && essay.length < jumlahEssay) {
      await t.rollback();
      return res.status(400).json({
        message: `Bank soal essay hanya memiliki ${essay.length} soal, sedangkan paket meminta ${jumlahEssay}.`,
      });
    }
    if (jumlahPg == null && jumlahEssay == null && ujian.jumlah_soal_tampil) {
      bankSoal = [...pilihanGanda, ...essay].slice(0, ujian.jumlah_soal_tampil);
    } else {
      pilihanGanda = jumlahPg == null ? pilihanGanda : pilihanGanda.slice(0, jumlahPg);
      essay = jumlahEssay == null ? essay : essay.slice(0, jumlahEssay);
      bankSoal = [...pilihanGanda, ...essay];
    }

    if (bankSoal.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Jumlah soal yang diminta tidak tersedia di bank soal.' });
    }

    const urutanSoalIds = bankSoal.map((s) => s.id);

    hasil = await HasilUjian.create({
      siswa_id, ujian_id,
      urutan_soal: urutanSoalIds,
      status: 'sedang_mengerjakan',
    }, { transaction: t });

    await t.commit();
    res.json({
      hasil_ujian_id: hasil.id,
      durasi_menit: ujian.durasi_menit,
      soal: sanitizeSoal(bankSoal, ujian.acak_opsi_jawaban),
    });
  } catch (err) {
    await t.rollback();
    // Jika constraint unique tetap ke-trigger (race condition dua request bersamaan), tangani rapi.
    if (err.name === 'SequelizeUniqueConstraintError') {
      const existing = await HasilUjian.findOne({ where: { siswa_id: req.user.siswa_id, ujian_id: req.params.id } });
      if (existing && existing.status === 'sedang_mengerjakan') {
        const resumedSoal = await Soal.findAll({ where: { id: existing.urutan_soal } });
        const soalMap = {};
        resumedSoal.forEach((s) => { soalMap[s.id] = s; });
        const ordered = existing.urutan_soal.map((soalId) => soalMap[soalId]).filter(Boolean);
        const ujian = await Ujian.findByPk(req.params.id);
        return res.json({
          hasil_ujian_id: existing.id,
          durasi_menit: ujian.durasi_menit,
          soal: sanitizeSoal(ordered, ujian.acak_opsi_jawaban),
        });
      }
      if (existing && existing.status === 'selesai') {
        return res.status(403).json({
          message: 'Anda sudah pernah mengerjakan ujian ini.',
          hasil_ujian_id: existing.id,
        });
      }
      return res.status(409).json({ message: 'Sesi ujian sedang diproses. Silakan coba lagi.' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server.', error: err.message });
  }
};

// Buang field jawaban_benar sebelum dikirim ke siswa, dan acak urutan opsi jawaban.
function sanitizeSoal(soalList, acakOpsi = true) {
  return soalList.map((s) => {
    const data = s.toJSON ? s.toJSON() : s;
    let opsi = data.opsi;
    if (acakOpsi && opsi && typeof opsi === 'object') {
      const entries = shuffleArray(Object.entries(opsi));
      opsi = Object.fromEntries(entries);
    }
    delete data.jawaban_benar;
    return { ...data, opsi };
  });
}

// ---------- SISWA: submit jawaban ----------
exports.submitUjian = async (req, res) => {
  try {
    const siswa_id = req.user.siswa_id;
    const { hasil_ujian_id, jawaban } = req.body; // jawaban: [{soal_id, jawaban_dipilih}]

    if (!Number.isInteger(Number(hasil_ujian_id)) || !Array.isArray(jawaban) || jawaban.length === 0) {
      return res.status(400).json({ message: 'Data jawaban ujian tidak valid.' });
    }

    const hasil = await HasilUjian.findOne({ where: { id: hasil_ujian_id, siswa_id } });
    if (!hasil) return res.status(404).json({ message: 'Sesi ujian tidak ditemukan.' });
    if (hasil.status !== 'sedang_mengerjakan') {
      return res.status(403).json({
        message: hasil.status === 'menunggu_penilaian'
          ? 'Jawaban ujian Anda sedang menunggu penilaian guru.'
          : 'Ujian ini sudah pernah diselesaikan sebelumnya.',
      });
    }

    const soalIds = jawaban.map((j) => j.soal_id);
    const soalList = await Soal.findAll({ where: { id: soalIds } });
    const soalMap = {};
    soalList.forEach((s) => { soalMap[s.id] = s; });

    let hasEssay = false;

    const jawabanRows = jawaban.map((j) => {
      const soal = soalMap[j.soal_id];
      let is_benar = null;
      if (soal && soal.tipe_soal === 'pilihan_ganda') {
        is_benar = soal.jawaban_benar === j.jawaban_dipilih;
      } else if (soal && soal.tipe_soal === 'essay') {
        hasEssay = true;
      }
      return {
        hasil_ujian_id: hasil.id,
        soal_id: j.soal_id,
        jawaban_dipilih: j.jawaban_dipilih,
        is_benar,
      };
    });

    // Submit ulang harus aman: percobaan sebelumnya bisa sudah menyimpan jawaban
    // sebelum gagal pada tahap penilaian atau pembaruan hasil ujian.
    const savedAnswers = await sequelize.transaction(async (transaction) => {
      await JawabanSiswa.destroy({ where: { hasil_ujian_id: hasil.id }, transaction });
      return JawabanSiswa.bulkCreate(jawabanRows, { transaction });
    });
    const allAnswers = savedAnswers.map((answer) => ({
      id: answer.id,
      soal_id: answer.soal_id,
      jawaban_dipilih: answer.jawaban_dipilih,
      is_benar: answer.is_benar,
      nilai_essay: answer.nilai_essay,
    }));

    let finalStatus = 'selesai';
    let gradingMessage = 'Ujian berhasil dikumpulkan dan dinilai otomatis.';
    if (hasEssay) {
      try {
        const essayAnswers = savedAnswers.filter((answer) => soalMap[answer.soal_id]?.tipe_soal === 'essay');
        const scores = await nilaiEssayDenganGemini(essayAnswers, soalMap);
        for (const score of scores) {
          await JawabanSiswa.update(
            { nilai_essay: score.nilai_essay, feedback_ai: score.feedback_ai },
            { where: { id: score.jawaban_id, hasil_ujian_id: hasil.id } },
          );
          const answer = allAnswers.find((item) => item.id === score.jawaban_id);
          if (answer) answer.nilai_essay = score.nilai_essay;
        }
      } catch (gradingError) {
        console.error('Automatic Essay Grading Error:', gradingError);
        finalStatus = 'menunggu_penilaian';
        gradingMessage = 'Ujian tersimpan, tetapi penilaian essay otomatis gagal. Guru dapat menilai secara manual.';
      }
    }

    const scores = hitungNilai(allAnswers, soalMap);
    const jumlahSalah = allAnswers.filter((answer) => soalMap[answer.soal_id]?.tipe_soal !== 'essay' && !answer.is_benar).length;
    await hasil.update({
      status: finalStatus,
      waktu_selesai: new Date(),
      nilai: finalStatus === 'selesai' ? scores.nilai : null,
      nilai_pilihan_ganda: scores.nilai_pilihan_ganda,
      nilai_essay: finalStatus === 'selesai' ? scores.nilai_essay : null,
      jumlah_benar: scores.jumlah_benar,
      jumlah_salah: jumlahSalah,
    });

    res.json({
      message: gradingMessage,
      nilai: finalStatus === 'selesai' ? scores.nilai : null,
      nilai_pilihan_ganda: scores.nilai_pilihan_ganda,
      nilai_essay: finalStatus === 'selesai' ? scores.nilai_essay : null,
      jumlah_benar: scores.jumlah_benar,
      jumlah_salah: jumlahSalah,
      status: finalStatus,
    });
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server.', error: err.message });
  }
};

// ---------- SISWA: lihat hasil ujian ----------
exports.getHasil = async (req, res) => {
  const siswa_id = req.user.siswa_id;
  const hasil = await HasilUjian.findOne({
    where: { id: req.params.id, siswa_id },
    include: [{ model: Ujian, include: [MataPelajaran, JenisUjian] }],
  });
  if (!hasil) return res.status(404).json({ message: 'Hasil ujian tidak ditemukan.' });
  res.json(hasil);
};

// ---------- GURU: Lihat peserta ujian ----------
exports.getPesertaUjian = async (req, res) => {
  try {
    const { Siswa } = require('../models');
    const peserta = await HasilUjian.findAll({
      where: { ujian_id: req.params.id },
      include: [
        {
          model: Siswa,
          attributes: ['id', 'nis', 'kelas_id'],
          include: [
            { model: User, attributes: ['id', 'nama', 'username'] },
            Kelas,
          ],
        }
      ],
      order: [['waktu_selesai', 'DESC']]
    });
    res.json(peserta);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil peserta', error: err.message });
  }
};

// ---------- GURU: Lihat detail jawaban untuk dinilai ----------
exports.getDetailJawaban = async (req, res) => {
  try {
    const { Siswa } = require('../models');
    const hasil = await HasilUjian.findByPk(req.params.id, {
      include: [
        {
          model: Siswa,
          attributes: ['id', 'nis', 'kelas_id'],
          include: [{ model: User, attributes: ['id', 'nama', 'username'] }],
        },
        { model: Ujian, include: [MataPelajaran, JenisUjian] }
      ]
    });
    if (!hasil) return res.status(404).json({ message: 'Hasil ujian tidak ditemukan.' });
    
    const jawaban = await JawabanSiswa.findAll({
      where: { hasil_ujian_id: hasil.id },
    });
    
    // Ambil detail soal
    const soalList = await Soal.findAll({ where: { id: jawaban.map((j) => j.soal_id) } });
    const soalMap = {};
    soalList.forEach((s) => { soalMap[s.id] = s; });
    
    const detail = jawaban.map((j) => {
      const s = soalMap[j.soal_id] || {};
      return {
        id: j.id,
        soal_id: j.soal_id,
        jawaban_dipilih: j.jawaban_dipilih,
        is_benar: j.is_benar,
        nilai_essay: j.nilai_essay,
        feedback_ai: j.feedback_ai,
        pertanyaan: s.pertanyaan,
        tipe_soal: s.tipe_soal,
        opsi: s.opsi,
        jawaban_benar: s.jawaban_benar,
        bobot_nilai: s.bobot_nilai,
      };
    });
    
    res.json({ hasil, jawaban: detail });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil detail', error: err.message });
  }
};

// ---------- GURU: Generate ulang nilai essay dengan Gemini ----------
exports.generateNilai = async (req, res) => {
  try {
    const hasil = await HasilUjian.findByPk(req.params.id, {
      include: [{ model: Ujian, attributes: ['id', 'dibuat_oleh'] }],
    });

    if (!hasil) return res.status(404).json({ message: 'Hasil ujian tidak ditemukan.' });
    if (req.user.role === 'guru' && hasil.Ujian?.dibuat_oleh !== req.user.guru_id) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk menilai hasil ujian ini.' });
    }
    if (hasil.status === 'selesai') {
      return res.json({ message: 'Nilai ujian sudah tersedia.', status: hasil.status, nilai: hasil.nilai });
    }
    if (hasil.status !== 'menunggu_penilaian') {
      return res.status(409).json({ message: 'Hasil ujian belum siap untuk dinilai ulang.' });
    }

    const semuaJawaban = await JawabanSiswa.findAll({ where: { hasil_ujian_id: hasil.id } });
    const soalList = await Soal.findAll({ where: { id: semuaJawaban.map((jawaban) => jawaban.soal_id) } });
    const soalMap = {};
    soalList.forEach((soal) => { soalMap[soal.id] = soal; });
    const essayAnswers = semuaJawaban.filter((jawaban) => soalMap[jawaban.soal_id]?.tipe_soal === 'essay');

    if (essayAnswers.length === 0) {
      return res.status(400).json({ message: 'Tidak ada jawaban essay untuk dinilai.' });
    }

    // Jika Gemini sedang sibuk, error dikembalikan dan status tetap menunggu_penilaian.
    const scores = await nilaiEssayDenganGemini(essayAnswers, soalMap);
    const scoresByAnswerId = new Map(scores.map((score) => [score.jawaban_id, score]));
    semuaJawaban.forEach((jawaban) => {
      const score = scoresByAnswerId.get(jawaban.id);
      if (score) jawaban.nilai_essay = score.nilai_essay;
    });
    const hasilNilai = hitungNilai(semuaJawaban, soalMap);
    const jumlahSalah = semuaJawaban.filter(
      (jawaban) => soalMap[jawaban.soal_id]?.tipe_soal !== 'essay' && !jawaban.is_benar,
    ).length;

    await sequelize.transaction(async (transaction) => {
      for (const score of scores) {
        await JawabanSiswa.update(
          { nilai_essay: score.nilai_essay, feedback_ai: score.feedback_ai },
          { where: { id: score.jawaban_id, hasil_ujian_id: hasil.id }, transaction },
        );
      }
      await hasil.update({
        status: 'selesai',
        nilai: hasilNilai.nilai,
        nilai_pilihan_ganda: hasilNilai.nilai_pilihan_ganda,
        nilai_essay: hasilNilai.nilai_essay,
        jumlah_benar: hasilNilai.jumlah_benar,
        jumlah_salah: jumlahSalah,
      }, { transaction });
    });

    return res.json({
      message: 'Nilai essay berhasil dibuat otomatis.',
      status: 'selesai',
      nilai: hasilNilai.nilai,
    });
  } catch (err) {
    console.error('Manual Essay Grading Retry Error:', err);
    return res.status(503).json({
      message: `Penilaian otomatis belum berhasil: ${err.message}`,
      status: 'menunggu_penilaian',
    });
  }
};

// ---------- GURU: Nilai Essay ----------
exports.nilaiEssay = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { penilaian } = req.body; // array of { jawaban_id, nilai_essay }
    const hasil = await HasilUjian.findByPk(req.params.id, { transaction: t });
    
    if (!hasil) {
      await t.rollback();
      return res.status(404).json({ message: 'Hasil ujian tidak ditemukan.' });
    }

    for (let item of penilaian) {
      await JawabanSiswa.update(
        { nilai_essay: item.nilai_essay },
        { where: { id: item.jawaban_id, hasil_ujian_id: hasil.id }, transaction: t }
      );
    }

    // Kalkulasi ulang total nilai
    const semuaJawaban = await JawabanSiswa.findAll({
      where: { hasil_ujian_id: hasil.id },
      transaction: t
    });
    
    const soalList = await Soal.findAll({
      where: { id: semuaJawaban.map(j => j.soal_id) },
      transaction: t
    });
    const soalMap = {};
    soalList.forEach(s => soalMap[s.id] = s);
    
    const scores = hitungNilai(semuaJawaban, soalMap);
    
    await hasil.update({
      nilai: scores.nilai,
      nilai_pilihan_ganda: scores.nilai_pilihan_ganda,
      nilai_essay: scores.nilai_essay,
      jumlah_benar: scores.jumlah_benar,
      jumlah_salah: semuaJawaban.filter((j) => soalMap[j.soal_id]?.tipe_soal !== 'essay' && !j.is_benar).length,
      status: 'selesai',
    }, { transaction: t });
    
    await t.commit();
    res.json({ message: 'Penilaian essay berhasil disimpan', nilai: scores.nilai });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Gagal menyimpan nilai', error: err.message });
  }
};

// ---------- EXCEL EXPORT ----------
exports.exportExcel = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { Siswa } = require('../models');
    
    const ujian = await Ujian.findByPk(req.params.id, {
      include: [MataPelajaran, JenisUjian, Kelas]
    });
    
    if (!ujian) return res.status(404).json({ message: 'Ujian tidak ditemukan' });
    
    const peserta = await HasilUjian.findAll({
      where: { ujian_id: ujian.id },
      include: [
        {
          model: Siswa,
          attributes: ['id', 'nis', 'kelas_id'],
          include: [
            { model: User, attributes: ['id', 'nama', 'username'] },
            Kelas,
          ],
        }
      ],
      order: [['waktu_selesai', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Hasil Ujian');

    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Siswa', key: 'nama', width: 25 },
      { header: 'NISN', key: 'nisn', width: 15 },
      { header: 'Kelas', key: 'kelas', width: 15 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Benar', key: 'benar', width: 10 },
      { header: 'Salah', key: 'salah', width: 10 },
      { header: 'Nilai Total', key: 'nilai', width: 15 },
      { header: 'Waktu Selesai', key: 'waktu', width: 20 },
    ];

    peserta.forEach((p, index) => {
      worksheet.addRow({
        no: index + 1,
        nama: p.Siswa?.User?.nama || '-',
        nisn: p.Siswa?.nis || '-',
        kelas: p.Siswa?.Kela ? p.Siswa.Kela.nama_kelas : (ujian.Kela ? ujian.Kela.nama_kelas : '-'),
        status: p.status,
        benar: p.jumlah_benar || 0,
        salah: p.jumlah_salah || 0,
        nilai: p.nilai !== null ? p.nilai : '-',
        waktu: p.waktu_selesai ? new Date(p.waktu_selesai).toLocaleString('id-ID') : '-',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Hasil_Ujian_${ujian.id}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Gagal export excel', error: err.message });
  }
};
