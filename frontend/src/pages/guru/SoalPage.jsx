import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../services/api';

const emptyForm = {
  mapel_id: '', jenis_ujian_id: '', tahun_pelajaran: '', tipe_soal: 'pilihan_ganda',
  pertanyaan: '', opsi: { A: '', B: '', C: '', D: '' }, jawaban_benar: 'A', bobot_nilai: 1,
  gambar: null,
};

const savedContext = {
  mapel_id: localStorage.getItem('guru-bank-soal-mapel') || '',
  jenis_ujian_id: localStorage.getItem('guru-bank-soal-jenis') || '',
  tahun_pelajaran: localStorage.getItem('guru-bank-soal-tahun') || '',
  tipe_soal: localStorage.getItem('guru-bank-soal-tipe') || 'pilihan_ganda',
};

const jsonImportTemplate = {
  mapel_id: 1,
  jenis_ujian_id: 1,
  tahun_pelajaran: '2026/2027',
  soal: [
    {
      tipe_soal: 'pilihan_ganda',
      pertanyaan: 'Perhatikan grafik berikut. Apa kesimpulan yang tepat?',
      gambar: null,
      opsi: {
        A: 'Pilihan jawaban A',
        B: 'Pilihan jawaban B',
        C: 'Pilihan jawaban C',
        D: 'Pilihan jawaban D',
      },
      jawaban_benar: 'B',
      bobot_nilai: 1,
      cp: 'Capaian pembelajaran soal',
      tp: 'Tujuan pembelajaran soal',
    },
    {
      tipe_soal: 'essay',
      pertanyaan: 'Jelaskan informasi yang terdapat pada grafik tersebut.',
      gambar: null,
      opsi: null,
      jawaban_benar: null,
      bobot_nilai: 5,
      cp: 'Capaian pembelajaran soal',
      tp: 'Tujuan pembelajaran soal',
    },
  ],
};

export default function SoalPage() {
  const [list, setList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [jenisUjianList, setJenisUjianList] = useState([]);
  const [form, setForm] = useState({ ...emptyForm, ...savedContext });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [generator, setGenerator] = useState({
    mapel_id: savedContext.mapel_id,
    jenis_ujian_id: savedContext.jenis_ujian_id,
    tahun_pelajaran: savedContext.tahun_pelajaran,
    cp: '',
    tp: '',
    jumlah_pilihan_ganda: 5,
    jumlah_essay: 2,
    tingkat_kesulitan: 'sedang',
    sumber_mode: 'referensi',
    generate_images: false,
    pdf: null,
  });
  const [generating, setGenerating] = useState(false);
  const [importJsonFile, setImportJsonFile] = useState(null);
  const [importJsonPreview, setImportJsonPreview] = useState(null);
  const [importingJson, setImportingJson] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [tipeFilter, setTipeFilter] = useState('semua');
  const questionRef = useRef(null);

  const load = async (
    requestedPage = pagination.page,
    mapelId = form.mapel_id,
    requestedTipe = tipeFilter,
  ) => {
    const res = await api.get('/soal', {
      params: {
        page: requestedPage,
        limit: 15,
        mapel_id: mapelId || undefined,
        tipe_soal: requestedTipe === 'semua' ? undefined : requestedTipe,
      },
    });
    const result = Array.isArray(res.data)
      ? {
        data: res.data,
        pagination: {
          page: 1,
          limit: 15,
          total: res.data.length,
          totalPages: Math.max(1, Math.ceil(res.data.length / 15)),
        },
      }
      : res.data;
    const targetPage = result.pagination.totalPages > 0
      ? Math.min(requestedPage, result.pagination.totalPages)
      : 1;
    if (targetPage !== requestedPage) return load(targetPage, mapelId, requestedTipe);
    setList(result.data);
    setPagination(result.pagination);
  };

  useEffect(() => {
    load();
    api.get('/mapel').then((res) => setMapelList(res.data));
    api.get('/pengaturan').then((res) => setJenisUjianList(res.data.jenis_ujian || []));
  }, []);

  const selectedMapel = useMemo(
    () => mapelList.find((mapel) => String(mapel.id) === String(form.mapel_id)),
    [mapelList, form.mapel_id],
  );
  const visibleList = useMemo(
    () => list,
    [list],
  );

  const rememberContext = (field, value) => {
    const storageKeys = {
      mapel_id: 'guru-bank-soal-mapel',
      jenis_ujian_id: 'guru-bank-soal-jenis',
      tahun_pelajaran: 'guru-bank-soal-tahun',
      tipe_soal: 'guru-bank-soal-tipe',
    };
    if (storageKeys[field]) localStorage.setItem(storageKeys[field], value);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const pilihMapel = (mapelId) => {
    rememberContext('mapel_id', String(mapelId));
    setError('');
    setSuccess('');
    load(1, String(mapelId), tipeFilter);
    questionRef.current?.focus();
  };

  const handleOpsiChange = (key, value) => {
    setForm((f) => ({ ...f, opsi: { ...f.opsi, [key]: value } }));
  };

  const handleTipeSoalChange = (tipe_soal) => {
    rememberContext('tipe_soal', tipe_soal);
    setForm((f) => ({
      ...f,
      tipe_soal,
      ...(tipe_soal === 'essay'
        ? { opsi: { A: '', B: '', C: '', D: '' }, jawaban_benar: '' }
        : { jawaban_benar: 'A' }),
    }));
  };

  const handleTipeFilterChange = (value) => {
    setTipeFilter(value);
    load(1, form.mapel_id, value);
  };

  const handleGeneratorContext = (field, value) => {
    setGenerator((current) => ({ ...current, [field]: value }));
    if (['mapel_id', 'jenis_ujian_id', 'tahun_pelajaran'].includes(field)) rememberContext(field, value);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGenerating(true);
    try {
      const payload = new FormData();
      payload.append('mapel_id', generator.mapel_id);
      payload.append('jenis_ujian_id', generator.jenis_ujian_id);
      payload.append('tahun_pelajaran', generator.tahun_pelajaran);
      payload.append('cp', generator.cp);
      payload.append('tp', generator.tp);
      payload.append('jumlah_pilihan_ganda', Number(generator.jumlah_pilihan_ganda));
      payload.append('jumlah_essay', Number(generator.jumlah_essay));
      payload.append('tingkat_kesulitan', generator.tingkat_kesulitan);
      payload.append('sumber_mode', generator.sumber_mode);
      payload.append('generate_images', String(generator.generate_images));
      if (generator.pdf) payload.append('pdf', generator.pdf);
      const result = await api.post('/soal/generate', payload);
      setForm((current) => ({
        ...current,
        mapel_id: generator.mapel_id,
        jenis_ujian_id: generator.jenis_ujian_id,
        tahun_pelajaran: generator.tahun_pelajaran,
      }));
      setSuccess(result.data.message);
      load(1, generator.mapel_id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat soal dengan Gemini.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreviewJson = async () => {
    if (!importJsonFile) {
      setError('Pilih file JSON terlebih dahulu.');
      return;
    }
    setError('');
    setSuccess('');
    setImportingJson(true);
    try {
      const payload = new FormData();
      payload.append('json', importJsonFile);
      payload.append('mapel_id', generator.mapel_id);
      payload.append('jenis_ujian_id', generator.jenis_ujian_id);
      payload.append('tahun_pelajaran', generator.tahun_pelajaran);
      const result = await api.post('/soal/import-json', payload);
      setImportJsonPreview(result.data.data);
    } catch (err) {
      setImportJsonPreview(null);
      setError(err.response?.data?.message || 'Gagal membaca file JSON.');
    } finally {
      setImportingJson(false);
    }
  };

  const handleImportJson = async () => {
    if (!importJsonFile || !importJsonPreview) return;
    setError('');
    setSuccess('');
    setImportingJson(true);
    try {
      const payload = new FormData();
      payload.append('json', importJsonFile);
      payload.append('mode', 'import');
      payload.append('mapel_id', generator.mapel_id);
      payload.append('jenis_ujian_id', generator.jenis_ujian_id);
      payload.append('tahun_pelajaran', generator.tahun_pelajaran);
      const result = await api.post('/soal/import-json', payload);
      setSuccess(result.data.message);
      setImportJsonFile(null);
      setImportJsonPreview(null);
      load(1, generator.mapel_id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengimport soal dari JSON.');
    } finally {
      setImportingJson(false);
    }
  };

  const handleDownloadJsonTemplate = () => {
    const blob = new Blob([JSON.stringify(jsonImportTemplate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-import-bank-soal.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    setError('');
    setExportingPdf(true);
    try {
      const params = {};
      if (form.mapel_id) params.mapel_id = form.mapel_id;
      if (form.jenis_ujian_id) params.jenis_ujian_id = form.jenis_ujian_id;
      if (form.tahun_pelajaran) params.tahun_pelajaran = form.tahun_pelajaran;
      const response = await api.get('/soal/export-pdf', { params, responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Bank_Soal.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      let message = 'Gagal mengekspor bank soal ke PDF.';
      if (err.response?.data instanceof Blob) {
        try {
          const data = JSON.parse(await err.response.data.text());
          message = data.message || message;
        } catch {
          // Gunakan pesan umum jika respons error bukan JSON.
        }
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
    } finally {
      setExportingPdf(false);
    }
  };

  const resetEditor = () => {
    setEditingId(null);
    setImageFile(null);
    setImagePreview('');
    setRemoveImage(false);
    setForm({
      ...emptyForm,
      mapel_id: form.mapel_id,
      jenis_ujian_id: form.jenis_ujian_id,
      tahun_pelajaran: form.tahun_pelajaran,
      tipe_soal: form.tipe_soal,
      jawaban_benar: form.tipe_soal === 'essay' ? '' : 'A',
    });
  };

  const handleImageChange = (file) => {
    setImageFile(file || null);
    setRemoveImage(false);
    setImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const handleEdit = (soal) => {
    const mapelId = soal.mapel_id ?? soal.MataPelajaran?.id ?? '';
    const jenisUjianId = soal.jenis_ujian_id ?? soal.JenisUjian?.id ?? '';
    const mapelValue = String(mapelId);
    const jenisUjianValue = String(jenisUjianId);
    if (mapelValue) localStorage.setItem('guru-bank-soal-mapel', mapelValue);
    if (jenisUjianValue) localStorage.setItem('guru-bank-soal-jenis', jenisUjianValue);
    if (soal.tahun_pelajaran) localStorage.setItem('guru-bank-soal-tahun', soal.tahun_pelajaran);
    if (soal.tipe_soal) localStorage.setItem('guru-bank-soal-tipe', soal.tipe_soal);
    setEditingId(soal.id);
    setImageFile(null);
    setImagePreview('');
    setRemoveImage(false);
    setForm({
      ...emptyForm,
      mapel_id: mapelValue,
      jenis_ujian_id: jenisUjianValue,
      tahun_pelajaran: soal.tahun_pelajaran,
      tipe_soal: soal.tipe_soal,
      pertanyaan: soal.pertanyaan,
      opsi: soal.opsi || { A: '', B: '', C: '', D: '' },
      jawaban_benar: soal.jawaban_benar || '',
      bobot_nilai: soal.bobot_nilai,
      gambar: soal.gambar || null,
    });
    setSuccess('');
    setError('');
    questionRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const payload = new FormData();
      payload.append('mapel_id', form.mapel_id);
      payload.append('jenis_ujian_id', form.jenis_ujian_id);
      payload.append('tahun_pelajaran', form.tahun_pelajaran);
      payload.append('tipe_soal', form.tipe_soal);
      payload.append('pertanyaan', form.pertanyaan);
      payload.append('opsi', JSON.stringify(form.tipe_soal === 'essay' ? null : form.opsi));
      payload.append('jawaban_benar', form.tipe_soal === 'essay' ? '' : form.jawaban_benar);
      payload.append('bobot_nilai', form.bobot_nilai);
      if (imageFile) payload.append('gambar', imageFile);
      if (removeImage) payload.append('hapus_gambar', 'true');

      if (editingId) {
        await api.put(`/soal/${editingId}`, payload);
        setSuccess('Soal berhasil diperbarui.');
      } else {
        await api.post('/soal', payload);
        setSuccess('Soal berhasil ditambahkan.');
      }
      resetEditor();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan soal.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus soal ini?')) return;
    await api.delete(`/soal/${id}`);
    load();
  };

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink mb-2">Bank Soal Saya</h1>
      <p className="text-slate font-sans text-sm mb-6">
        Pilih mata pelajaran sekali, lalu masukkan soal-soal secara berurutan.
      </p>

      <section className="card mb-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="font-serif text-lg text-ink">Mata Pelajaran</h2>
            <p className="text-slate font-sans text-xs mt-1">Klik mata pelajaran untuk mengaktifkan konteks input.</p>
          </div>
          {selectedMapel && <span className="text-xs font-mono text-moss">Aktif: {selectedMapel.nama_mapel}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {mapelList.map((mapel) => {
            const aktif = String(form.mapel_id) === String(mapel.id);
            return (
              <button
                type="button"
                key={mapel.id}
                onClick={() => pilihMapel(mapel.id)}
                className={`px-3 py-2 rounded-sm border text-sm font-sans transition-colors ${
                  aktif ? 'bg-ink text-paper border-ink' : 'bg-white text-ink border-line hover:border-ink'
                }`}
              >
                {mapel.nama_mapel}
              </button>
            );
          })}
          {mapelList.length === 0 && <p className="text-slate text-sm">Belum ada mata pelajaran yang tersedia.</p>}
        </div>
      </section>

      <form onSubmit={handleGenerate} className="card mb-8 space-y-4 border-royal/20 bg-gradient-to-br from-white to-sky/40">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
          <div>
            <h2 className="font-serif text-lg text-ink">Generate Soal dengan Gemini</h2>
            <p className="text-slate font-sans text-xs mt-1">
              Gunakan CP/TP, atau lampirkan PDF sebagai sumber soal. Hasilnya langsung masuk ke bank soal.
            </p>
          </div>
          <span className="rounded-full bg-royal/10 px-3 py-1 text-xs font-semibold text-royal">AI Generator</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={`cursor-pointer rounded-xl border p-4 transition-colors ${generator.sumber_mode === 'referensi' ? 'border-royal bg-sky/60' : 'border-line bg-white hover:border-royal/40'}`}>
            <input type="radio" className="sr-only" checked={generator.sumber_mode === 'referensi'} onChange={() => setGenerator({ ...generator, sumber_mode: 'referensi' })} />
            <span className="block text-sm font-semibold text-ink">Buat soal baru</span>
            <span className="block text-xs text-slate mt-1">Gemini menggunakan PDF sebagai referensi materi.</span>
          </label>
          <label className={`cursor-pointer rounded-xl border p-4 transition-colors ${generator.sumber_mode === 'import' ? 'border-royal bg-sky/60' : 'border-line bg-white hover:border-royal/40'}`}>
            <input type="radio" className="sr-only" checked={generator.sumber_mode === 'import'} onChange={() => setGenerator({ ...generator, sumber_mode: 'import' })} />
            <span className="block text-sm font-semibold text-ink">Import soal dari PDF</span>
            <span className="block text-xs text-slate mt-1">Gemini membaca dan menyalin soal yang dikenali.</span>
          </label>
        </div>
        <div className="rounded-xl border border-dashed border-royal/30 bg-white/70 p-4">
          <label className="field-label">PDF sumber <span className="normal-case tracking-normal font-normal">(opsional untuk soal baru, wajib untuk import, maksimal 20 MB)</span></label>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="block w-full text-sm text-slate file:mr-3 file:rounded-lg file:border-0 file:bg-sky file:px-3 file:py-2 file:font-semibold file:text-royal hover:file:bg-royal/10"
            onChange={(e) => setGenerator({ ...generator, pdf: e.target.files?.[0] || null })}
            required={generator.sumber_mode === 'import'}
          />
          {generator.pdf && <p className="text-xs text-moss mt-2">File dipilih: {generator.pdf.name}</p>}
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="field-label">Mata Pelajaran</label>
            <select className="field-input" value={String(generator.mapel_id || '')} onChange={(e) => handleGeneratorContext('mapel_id', e.target.value)} required>
              <option value="">Pilih mapel</option>
              {mapelList.map((m) => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Jenis Ujian</label>
            <select className="field-input" value={String(generator.jenis_ujian_id || '')} onChange={(e) => handleGeneratorContext('jenis_ujian_id', e.target.value)} required>
              <option value="">Pilih jenis</option>
              {jenisUjianList.map((j) => <option key={j.id} value={j.id}>{j.nama_jenis}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Tahun Pelajaran</label>
            <input className="field-input" value={generator.tahun_pelajaran} onChange={(e) => handleGeneratorContext('tahun_pelajaran', e.target.value)} placeholder="2026/2027" required />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">CP · Capaian Pembelajaran</label>
            <textarea className="field-input" rows={4} value={generator.cp} onChange={(e) => setGenerator({ ...generator, cp: e.target.value })} placeholder={generator.sumber_mode === 'import' ? 'Opsional saat import; dapat disimpulkan dari PDF.' : 'Contoh: Siswa memahami konsep...'} required={generator.sumber_mode === 'referensi'} />
          </div>
          <div>
            <label className="field-label">TP · Tujuan Pembelajaran</label>
            <textarea className="field-input" rows={4} value={generator.tp} onChange={(e) => setGenerator({ ...generator, tp: e.target.value })} placeholder={generator.sumber_mode === 'import' ? 'Opsional saat import; dapat disimpulkan dari PDF.' : 'Contoh: Siswa mampu menjelaskan...'} required={generator.sumber_mode === 'referensi'} />
          </div>
        </div>
        <div className={`grid sm:grid-cols-3 gap-4 ${generator.sumber_mode === 'import' ? 'opacity-60' : ''}`}>
          <div>
            <label className="field-label">Jumlah Pilihan Ganda</label>
            <input type="number" min="0" max="50" className="field-input" value={generator.jumlah_pilihan_ganda} onChange={(e) => setGenerator({ ...generator, jumlah_pilihan_ganda: e.target.value })} required={generator.sumber_mode === 'referensi'} disabled={generator.sumber_mode === 'import'} />
          </div>
          <div>
            <label className="field-label">Jumlah Essay</label>
            <input type="number" min="0" max="50" className="field-input" value={generator.jumlah_essay} onChange={(e) => setGenerator({ ...generator, jumlah_essay: e.target.value })} required={generator.sumber_mode === 'referensi'} disabled={generator.sumber_mode === 'import'} />
          </div>
          <div>
            <label className="field-label">Tingkat Kesulitan</label>
            <select className="field-input" value={generator.tingkat_kesulitan} onChange={(e) => setGenerator({ ...generator, tingkat_kesulitan: e.target.value })}>
              <option value="mudah">Mudah</option>
              <option value="sedang">Sedang</option>
              <option value="sulit">Sulit</option>
            </select>
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-line bg-white/70 p-4 cursor-pointer">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-royal" checked={generator.generate_images} onChange={(e) => setGenerator({ ...generator, generate_images: e.target.checked })} />
          <span>
            <span className="block text-sm font-semibold text-ink">Buat ilustrasi otomatis bila diperlukan</span>
            <span className="block text-xs text-slate mt-1">AI akan membuat gambar untuk soal yang membutuhkan diagram, peta, grafik, atau objek visual. Proses dapat membutuhkan waktu lebih lama.</span>
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary" disabled={generating}>
            {generating ? 'Gemini sedang menyusun...' : 'Generate & Simpan Soal'}
          </button>
          <span className="text-xs text-slate">{generator.sumber_mode === 'import' ? 'PDF akan dibaca sampai maksimal 100 soal.' : 'Maksimal 50 soal dalam satu proses.'}</span>
        </div>
      </form>

      <section className="card mb-8 space-y-4 border-moss/30 bg-moss/5">
        <div className="border-b border-line pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg text-ink">Import Soal dari JSON</h2>
              <p className="text-slate font-sans text-xs mt-1">
                Gunakan JSON dengan array <code>soal</code>. Gambar harus berupa data URI Base64, lalu soal dapat dipratinjau sebelum disimpan.
              </p>
            </div>
            <button type="button" className="btn-outline text-xs" onClick={handleDownloadJsonTemplate}>
              Unduh Template JSON
            </button>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="field-label">Mata Pelajaran</label>
            <select className="field-input" value={String(generator.mapel_id || '')} onChange={(e) => handleGeneratorContext('mapel_id', e.target.value)} required>
              <option value="">Pilih mapel</option>
              {mapelList.map((m) => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Jenis Ujian</label>
            <select className="field-input" value={String(generator.jenis_ujian_id || '')} onChange={(e) => handleGeneratorContext('jenis_ujian_id', e.target.value)} required>
              <option value="">Pilih jenis</option>
              {jenisUjianList.map((j) => <option key={j.id} value={j.id}>{j.nama_jenis}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Tahun Pelajaran</label>
            <input className="field-input" value={generator.tahun_pelajaran} onChange={(e) => handleGeneratorContext('tahun_pelajaran', e.target.value)} placeholder="2026/2027" required />
          </div>
        </div>
        <input
          type="file"
          accept="application/json,.json"
          className="block w-full text-sm text-slate file:mr-3 file:rounded-lg file:border-0 file:bg-moss/15 file:px-3 file:py-2 file:font-semibold file:text-moss hover:file:bg-moss/25"
          onChange={(e) => {
            setImportJsonFile(e.target.files?.[0] || null);
            setImportJsonPreview(null);
          }}
        />
        {importJsonFile && <p className="text-xs text-moss">File dipilih: {importJsonFile.name}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-outline" onClick={handlePreviewJson} disabled={importingJson || !importJsonFile || !generator.mapel_id || !generator.jenis_ujian_id || !generator.tahun_pelajaran}>
            {importingJson ? 'Memeriksa JSON...' : 'Preview JSON'}
          </button>
          {importJsonPreview && (
            <button type="button" className="btn-primary" onClick={handleImportJson} disabled={importingJson}>
              {importingJson ? 'Mengimport...' : 'Simpan ke Bank Soal'}
            </button>
          )}
        </div>
        {importJsonPreview && (
          <div className="rounded-xl border border-moss/30 bg-white p-4 text-sm">
            <p className="font-semibold text-ink">JSON valid dan siap disimpan</p>
            <p className="text-slate mt-1">
              {importJsonPreview.jumlah} soal: {importJsonPreview.pilihan_ganda} pilihan ganda, {importJsonPreview.essay} essay, {importJsonPreview.dengan_gambar} dengan gambar.
            </p>
            {importJsonPreview.peringatan?.map((warning) => (
              <p key={warning} className="mt-2 text-xs text-amber-700">{warning}</p>
            ))}
            <ul className="mt-3 space-y-1 text-xs text-slate">
              {importJsonPreview.preview.map((item, index) => (
                <li key={`${item.pertanyaan}-${index}`}>
                  {index + 1}. {item.pertanyaan} ({item.tipe_soal}{item.ada_gambar ? ', dengan gambar' : ''})
                </li>
              ))}
              {importJsonPreview.jumlah > importJsonPreview.preview.length && <li>... dan soal lainnya.</li>}
            </ul>
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="card mb-8 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="font-serif text-lg text-ink">
            {editingId ? 'Edit Soal' : 'Tambah Soal'} {selectedMapel ? `- ${selectedMapel.nama_mapel}` : ''}
          </h2>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate font-sans">Pengaturan terakhir akan digunakan untuk soal berikutnya</span>
            {editingId && (
              <button type="button" onClick={resetEditor} className="text-xs text-slate hover:text-royal underline">
                Batal edit
              </button>
            )}
          </div>
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <label className="field-label">Mata Pelajaran</label>
            <select className="field-input" value={String(form.mapel_id || '')} onChange={(e) => pilihMapel(e.target.value)} required>
              <option value="">Pilih mapel</option>
              {mapelList.map((m) => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Jenis Ujian</label>
            <select className="field-input" value={String(form.jenis_ujian_id || '')} onChange={(e) => rememberContext('jenis_ujian_id', e.target.value)} required>
              <option value="">Pilih jenis</option>
              {jenisUjianList.map((j) => <option key={j.id} value={j.id}>{j.nama_jenis}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Tahun Pelajaran</label>
            <input className="field-input" placeholder="2026/2027" value={form.tahun_pelajaran} onChange={(e) => rememberContext('tahun_pelajaran', e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Tipe Soal</label>
            <select className="field-input" value={form.tipe_soal} onChange={(e) => handleTipeSoalChange(e.target.value)}>
              <option value="pilihan_ganda">Pilihan Ganda</option>
              <option value="essay">Essay</option>
            </select>
          </div>
        </div>

        <div>
          <label className="field-label">Pertanyaan</label>
          <textarea ref={questionRef} className="field-input" rows={3} value={form.pertanyaan} onChange={(e) => setForm({ ...form, pertanyaan: e.target.value })} required />
        </div>

        <div>
          <label className="field-label">Gambar Soal <span className="normal-case tracking-normal font-normal">(opsional, JPG/PNG/WebP maksimal 5 MB)</span></label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="block w-full text-sm text-slate file:mr-3 file:rounded-lg file:border-0 file:bg-sky file:px-3 file:py-2 file:font-semibold file:text-royal hover:file:bg-royal/10"
            onChange={(e) => handleImageChange(e.target.files?.[0])}
          />
          {(imagePreview || form.gambar) && !removeImage && (
            <div className="mt-3 flex items-start gap-3">
              <img src={imagePreview || form.gambar} alt="Preview gambar soal" className="max-h-36 max-w-xs rounded-lg border border-line object-contain" />
              {editingId && form.gambar && !imageFile && (
                <label className="flex items-center gap-2 text-xs text-rust">
                  <input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} />
                  Hapus gambar lama
                </label>
              )}
            </div>
          )}
          {removeImage && <p className="mt-2 text-xs text-rust">Gambar akan dihapus saat disimpan.</p>}
        </div>

        {form.tipe_soal === 'pilihan_ganda' ? (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map((key) => (
                <div key={key}>
                  <label className="field-label">Opsi {key}</label>
                  <input className="field-input" value={form.opsi[key]} onChange={(e) => handleOpsiChange(key, e.target.value)} required />
                </div>
              ))}
            </div>

            <div>
              <label className="field-label">Jawaban Benar</label>
              <select className="field-input" value={form.jawaban_benar} onChange={(e) => setForm({ ...form, jawaban_benar: e.target.value })}>
                {['A', 'B', 'C', 'D'].map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div className="border border-line bg-paper/60 p-3 text-sm text-slate font-sans">
            Soal essay akan dijawab dengan tulisan bebas dan dinilai manual oleh guru setelah siswa mengumpulkan ujian.
          </div>
        )}

        <div>
          <label className="field-label">Bobot Nilai</label>
          <input type="number" min="0" step="0.1" className="field-input" value={form.bobot_nilai} onChange={(e) => setForm({ ...form, bobot_nilai: e.target.value })} required />
        </div>

        {error && <p className="text-rust text-sm">{error}</p>}
        {success && <p className="text-moss text-sm">{success}</p>}
        <button type="submit" className="btn-primary">{editingId ? 'Simpan Perubahan' : 'Simpan Soal'}</button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif text-xl text-ink">
            {selectedMapel ? `Daftar Soal ${selectedMapel.nama_mapel}` : 'Daftar Soal Saya'}
          </h2>
          <p className="text-slate text-xs mt-1">Total {pagination.total} soal sesuai filter.</p>
        </div>
        <select
          className="field-input !w-auto !py-2 text-sm"
          value={tipeFilter}
          onChange={(e) => handleTipeFilterChange(e.target.value)}
        >
          <option value="semua">Semua tipe soal</option>
          <option value="pilihan_ganda">Pilihan ganda</option>
          <option value="essay">Essay</option>
        </select>
        <button type="button" onClick={handleExportPdf} disabled={exportingPdf || visibleList.length === 0} className="btn-outline disabled:cursor-not-allowed disabled:opacity-50">
          {exportingPdf ? 'Menyiapkan PDF...' : 'Export PDF'}
        </button>
      </div>
      <div className="space-y-3">
        {visibleList.map((s) => (
          <div key={s.id} className="card flex justify-between items-start">
            <div>
              {s.gambar && <img src={s.gambar} alt="Ilustrasi soal" className="mb-3 max-h-32 max-w-xs rounded-lg border border-line object-contain" />}
              <p className="text-ink font-sans">{s.pertanyaan}</p>
              <p className="text-slate text-xs font-mono mt-1">
                {s.tipe_soal === 'essay' ? 'Essay · Dinilai manual' : `Pilihan ganda · Jawaban benar: ${s.jawaban_benar}`}
                {' · '}Bobot: {s.bobot_nilai} · TP {s.tahun_pelajaran}
              </p>
            </div>
            <div className="flex items-center gap-3 ml-4 whitespace-nowrap">
              <button onClick={() => handleEdit(s)} className="text-royal text-sm hover:underline">Edit</button>
              <button onClick={() => handleDelete(s.id)} className="text-rust text-sm hover:underline">Hapus</button>
            </div>
          </div>
        ))}
        {visibleList.length === 0 && (
          <p className="text-slate font-sans text-sm">
            {selectedMapel ? `Belum ada soal untuk ${selectedMapel.nama_mapel}.` : 'Belum ada soal yang ditambahkan.'}
          </p>
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate">
        <span>
          Menampilkan {visibleList.length ? ((pagination.page - 1) * pagination.limit) + 1 : 0}
          -{Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} soal
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-outline !px-3 !py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={pagination.page <= 1}
            onClick={() => load(pagination.page - 1)}
          >
            Sebelumnya
          </button>
          <span className="min-w-24 text-center">Halaman {pagination.page} / {pagination.totalPages}</span>
          <button
            type="button"
            className="btn-outline !px-3 !py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => load(pagination.page + 1)}
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
