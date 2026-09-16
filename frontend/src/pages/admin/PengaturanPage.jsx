import { useEffect, useState } from 'react';
import api from '../../services/api';

const defaultPetunjukUjian = `Pastikan identitas Anda pada sudut kanan atas sudah sesuai dengan benar.
Jumlah soal sebanyak 60 butir Pilihan Ganda dan 6 Uraian.
Total poin Pilihan Ganda adalah 60 poin, dan Uraian adalah 30 poin.
Periksa dan bacalah dengan baik setiap butir soal sebelum Anda menjawabnya.
Pilih jawaban yang benar dengan mengklik salah satu pada jawaban yang tersedia.
Laporkan kepada Guru Mapel apabila terdapat soal yang kurang jelas atau tidak lengkap.
Periksa kembali pekerjaan Anda sebelum dikirim.
Setiap bentuk kecurangan adalah pelanggaran.
Berdoalah sebelum mengerjakan soal.`;

export default function PengaturanPage() {
  const [form, setForm] = useState({ nama_sekolah: '', alamat_sekolah: '', tahun_pelajaran_aktif: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [jenisUjian, setJenisUjian] = useState([]);
  const [jenisBaru, setJenisBaru] = useState('');
  const [message, setMessage] = useState('');
  const [aiForm, setAiForm] = useState({ gemini_api_key: '', gemini_model: 'gemini-3.6-flash' });
  const [aiStatus, setAiStatus] = useState({ configured: false, source: 'none', image_model: 'gemini-2.5-flash-image' });
  const [aiMessage, setAiMessage] = useState('');
  const [aiError, setAiError] = useState('');
  const [savingAi, setSavingAi] = useState(false);
  const [googleForm, setGoogleForm] = useState({ google_client_id: '' });
  const [googleStatus, setGoogleStatus] = useState({ configured: false, source: 'none', hosted_domain: 'kalamkudussentani.sch.id' });
  const [googleMessage, setGoogleMessage] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [savingGoogle, setSavingGoogle] = useState(false);
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [petunjukMessage, setPetunjukMessage] = useState('');
  const [petunjukError, setPetunjukError] = useState('');
  const [savingPetunjukId, setSavingPetunjukId] = useState(null);

  const load = () => api.get('/pengaturan').then((res) => {
    setForm({
      nama_sekolah: res.data.nama_sekolah || '',
      alamat_sekolah: res.data.alamat_sekolah || '',
      tahun_pelajaran_aktif: res.data.tahun_pelajaran_aktif || '',
    });
    setJenisUjian(res.data.jenis_ujian || []);
  });
  const loadAi = () => api.get('/pengaturan/ai').then((res) => {
    setAiStatus(res.data);
    setAiForm((current) => ({ ...current, gemini_model: res.data.model || 'gemini-3.6-flash' }));
  });
  const loadGoogle = () => api.get('/pengaturan/google').then((res) => {
    setGoogleStatus(res.data);
    setGoogleForm({ google_client_id: res.data.client_id || '' });
  });
  const loadKelas = () => api.get('/kelas').then((res) => {
    setKelasList(res.data);
    setSelectedKelasId((current) => current || (res.data[0] ? String(res.data[0].id) : ''));
  });
  useEffect(() => { load(); loadAi(); loadGoogle(); loadKelas(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (logoFile) data.append('logo', logoFile);
    await api.put('/pengaturan', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    setMessage('Pengaturan berhasil disimpan.');
    load();
  };

  const tambahJenis = async () => {
    if (!jenisBaru.trim()) return;
    await api.post('/pengaturan/jenis-ujian', { nama_jenis: jenisBaru });
    setJenisBaru('');
    load();
  };

  const hapusJenis = async (id) => {
    await api.delete(`/pengaturan/jenis-ujian/${id}`);
    load();
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    setAiMessage('');
    setAiError('');
    setSavingAi(true);
    try {
      const response = await api.put('/pengaturan/ai', {
        gemini_api_key: aiForm.gemini_api_key,
        gemini_model: aiForm.gemini_model,
      });
      setAiMessage(response.data.message);
      setAiForm((current) => ({ ...current, gemini_api_key: '' }));
      loadAi();
    } catch (err) {
      setAiError(err.response?.data?.message || 'Gagal menyimpan pengaturan AI.');
    } finally {
      setSavingAi(false);
    }
  };

  const handleClearAiKey = async () => {
    if (!confirm('Hapus API key Gemini dari database? Sistem akan kembali menggunakan key dari backend .env jika tersedia.')) return;
    setAiMessage('');
    setAiError('');
    setSavingAi(true);
    try {
      const response = await api.put('/pengaturan/ai', {
        gemini_model: aiForm.gemini_model,
        hapus_gemini_api_key: true,
      });
      setAiMessage(response.data.message);
      loadAi();
    } catch (err) {
      setAiError(err.response?.data?.message || 'Gagal menghapus API key Gemini.');
    } finally {
      setSavingAi(false);
    }
  };

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    setGoogleMessage('');
    setGoogleError('');
    setSavingGoogle(true);
    try {
      const response = await api.put('/pengaturan/google', googleForm);
      setGoogleMessage(response.data.message);
      loadGoogle();
    } catch (err) {
      setGoogleError(err.response?.data?.message || 'Gagal menyimpan Google OAuth Client ID.');
    } finally {
      setSavingGoogle(false);
    }
  };

  const handleClearGoogle = async () => {
    if (!confirm('Hapus Client ID Google dari database? Sistem akan kembali menggunakan Client ID dari backend .env jika tersedia.')) return;
    setGoogleMessage('');
    setGoogleError('');
    setSavingGoogle(true);
    try {
      const response = await api.put('/pengaturan/google', { hapus_google_client_id: true });
      setGoogleMessage(response.data.message);
      loadGoogle();
    } catch (err) {
      setGoogleError(err.response?.data?.message || 'Gagal menghapus Google OAuth Client ID.');
    } finally {
      setSavingGoogle(false);
    }
  };

  const handlePetunjukChange = (id, value) => {
    setKelasList((current) => current.map((kelas) => (
      kelas.id === id ? { ...kelas, petunjuk_ujian: value } : kelas
    )));
  };

  const selectedKelas = kelasList.find((kelas) => String(kelas.id) === selectedKelasId);

  const handleSavePetunjuk = async (kelas) => {
    setPetunjukMessage('');
    setPetunjukError('');
    setSavingPetunjukId(kelas.id);
    try {
      await api.put(`/kelas/${kelas.id}`, { petunjuk_ujian: kelas.petunjuk_ujian || '' });
      setPetunjukMessage(`Petunjuk ujian untuk kelas ${kelas.nama_kelas} berhasil disimpan.`);
      loadKelas();
    } catch (err) {
      setPetunjukError(err.response?.data?.message || 'Gagal menyimpan petunjuk ujian.');
    } finally {
      setSavingPetunjukId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-ink mb-6">Pengaturan Umum</h1>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="field-label">Nama Sekolah</label>
            <input className="field-input" value={form.nama_sekolah} onChange={(e) => setForm({ ...form, nama_sekolah: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Alamat Sekolah</label>
            <input className="field-input" value={form.alamat_sekolah} onChange={(e) => setForm({ ...form, alamat_sekolah: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Tahun Pelajaran Aktif</label>
            <input className="field-input" placeholder="2026/2027" value={form.tahun_pelajaran_aktif} onChange={(e) => setForm({ ...form, tahun_pelajaran_aktif: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Logo Sekolah</label>
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} className="font-sans text-sm" />
          </div>
          <button type="submit" className="btn-primary">Simpan Pengaturan</button>
          {message && <p className="text-moss text-sm">{message}</p>}
        </form>
      </div>

      <div>
        <div className="mb-4">
          <h2 className="font-serif text-xl text-ink">Petunjuk Ujian per Kelas</h2>
          <p className="text-slate font-sans text-sm mt-1">
            Pilih kelas untuk melihat atau mengubah petunjuk ujiannya. Tulis satu petunjuk pada setiap baris.
          </p>
        </div>
        <div className="card space-y-4">
          <div>
            <label className="field-label">Pilih Kelas</label>
            <select
              className="field-input"
              value={selectedKelasId}
              onChange={(e) => {
                setSelectedKelasId(e.target.value);
                setPetunjukMessage('');
                setPetunjukError('');
              }}
              disabled={!kelasList.length}
            >
              {!kelasList.length && <option value="">Belum ada data kelas</option>}
              {kelasList.map((kelas) => (
                <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>
              ))}
            </select>
          </div>
          {selectedKelas && (
            <>
              <div>
                <label className="field-label">Petunjuk Ujian - {selectedKelas.nama_kelas}</label>
                <textarea
                  className="field-input min-h-56 font-sans text-sm leading-relaxed"
                  value={selectedKelas.petunjuk_ujian || defaultPetunjukUjian}
                  onChange={(e) => handlePetunjukChange(selectedKelas.id, e.target.value)}
                  rows={10}
                />
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleSavePetunjuk(selectedKelas)}
                disabled={savingPetunjukId === selectedKelas.id}
              >
                {savingPetunjukId === selectedKelas.id ? 'Menyimpan...' : 'Simpan Petunjuk'}
              </button>
            </>
          )}
          {!kelasList.length && <p className="text-slate text-sm">Tambahkan data kelas terlebih dahulu.</p>}
        </div>
        {petunjukError && <p className="text-rust text-sm mt-3">{petunjukError}</p>}
        {petunjukMessage && <p className="text-moss text-sm mt-3">{petunjukMessage}</p>}
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif text-xl text-ink">Login Google Workspace</h2>
            <p className="text-slate font-sans text-sm mt-1">
              Masukkan Client ID untuk mengaktifkan tombol Sign in with Google bagi akun @{googleStatus.hosted_domain}.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${googleStatus.configured ? 'bg-moss/10 text-moss' : 'bg-rust/10 text-rust'}`}>
            {googleStatus.configured ? 'Google aktif' : 'Belum dikonfigurasi'}
          </span>
        </div>
        <form onSubmit={handleGoogleSubmit} className="card space-y-4 border-royal/20 bg-gradient-to-br from-white to-sky/40">
          <div>
            <label className="field-label">Google OAuth Web Client ID</label>
            <input
              className="field-input font-mono text-sm"
              value={googleForm.google_client_id}
              onChange={(e) => setGoogleForm({ google_client_id: e.target.value })}
              placeholder="1234567890-abc123.apps.googleusercontent.com"
              pattern="[0-9]+-[a-zA-Z0-9-]+\.apps\.googleusercontent\.com"
              title="Gunakan Web Client ID dari Google Cloud yang berakhiran .apps.googleusercontent.com"
            />
            <p className="text-xs text-slate mt-1.5">
              Client ID bukan password dan boleh dikirim ke browser. Gunakan tipe aplikasi <span className="font-semibold">Web application</span> dari Google Cloud Console.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-white/70 p-3 text-xs text-slate">
            <span className="font-semibold text-ink">Status:</span> {googleStatus.source === 'database' ? 'menggunakan Client ID dari database' : googleStatus.source === 'env' ? 'menggunakan Client ID dari backend .env' : 'belum ada Client ID'}
            <span className="mx-2 text-line">•</span>
            <span className="font-semibold text-ink">Domain:</span> @{googleStatus.hosted_domain}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={savingGoogle || !googleForm.google_client_id.trim()}>
              {savingGoogle ? 'Menyimpan...' : 'Simpan Client ID'}
            </button>
            {googleStatus.source === 'database' && (
              <button type="button" className="btn-outline !text-rust hover:!border-rust hover:!bg-rust/5" onClick={handleClearGoogle} disabled={savingGoogle}>
                Hapus Client ID Database
              </button>
            )}
          </div>
          {googleError && <p className="text-rust text-sm">{googleError}</p>}
          {googleMessage && <p className="text-moss text-sm">{googleMessage}</p>}
        </form>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif text-xl text-ink">Integrasi AI Gemini</h2>
            <p className="text-slate font-sans text-sm mt-1">Kelola API key tanpa membuka nilainya di browser atau respons API.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${aiStatus.configured ? 'bg-moss/10 text-moss' : 'bg-rust/10 text-rust'}`}>
            {aiStatus.configured ? 'API key tersimpan' : 'Belum dikonfigurasi'}
          </span>
        </div>
        <form onSubmit={handleAiSubmit} className="card space-y-4 border-royal/20 bg-gradient-to-br from-white to-sky/40">
          <div>
            <label className="field-label">API Key Gemini Baru</label>
            <input
              type="password"
              className="field-input"
              value={aiForm.gemini_api_key}
              onChange={(e) => setAiForm({ ...aiForm, gemini_api_key: e.target.value })}
              placeholder={aiStatus.configured ? 'Kosongkan jika tidak ingin mengganti key' : 'Masukkan API key Gemini'}
              autoComplete="new-password"
            />
            <p className="text-xs text-slate mt-1.5">Key dienkripsi sebelum disimpan. Nilai key yang tersimpan tidak pernah ditampilkan kembali.</p>
          </div>
          <div>
            <label className="field-label">Model Gemini untuk Soal dan Penilaian Essay</label>
            <input
              className="field-input"
              value={aiForm.gemini_model}
              onChange={(e) => setAiForm({ ...aiForm, gemini_model: e.target.value })}
              placeholder="gemini-3.6-flash"
              required
            />
            <p className="text-xs text-slate mt-1.5">Model gambar tetap menggunakan konfigurasi backend karena dapat memiliki kebutuhan quota berbeda.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary" disabled={savingAi}>
              {savingAi ? 'Menyimpan...' : 'Simpan Pengaturan AI'}
            </button>
            {aiStatus.source === 'database' && (
              <button type="button" className="btn-outline !text-rust hover:!border-rust hover:!bg-rust/5" onClick={handleClearAiKey} disabled={savingAi}>
                Hapus Key Database
              </button>
            )}
          </div>
          <div className="rounded-xl border border-line bg-white/70 p-3 text-xs text-slate">
            <span className="font-semibold text-ink">Status:</span> {aiStatus.source === 'database' ? 'menggunakan API key dari database' : aiStatus.source === 'env' ? 'menggunakan API key dari backend .env' : 'belum ada API key'}
            <span className="mx-2 text-line">•</span>
            <span className="font-semibold text-ink">Model gambar:</span> {aiStatus.image_model}
          </div>
          {aiError && <p className="text-rust text-sm whitespace-pre-line">{aiError}</p>}
          {aiMessage && <p className="text-moss text-sm">{aiMessage}</p>}
        </form>
      </div>

      <div>
        <h2 className="font-serif text-xl text-ink mb-4">Jenis Ujian</h2>
        <p className="text-slate font-sans text-sm mb-3">Contoh: Sumatif Harian, Sumatif Tengah Semester (STS), Sumatif Akhir Semester (SAS).</p>
        <div className="card">
          <div className="flex gap-2 mb-4">
            <input className="field-input" placeholder="Nama jenis ujian baru" value={jenisBaru} onChange={(e) => setJenisBaru(e.target.value)} />
            <button onClick={tambahJenis} className="btn-primary whitespace-nowrap">Tambah</button>
          </div>
          <ul className="divide-y divide-line">
            {jenisUjian.map((j) => (
              <li key={j.id} className="py-2 flex justify-between font-sans text-sm">
                <span className="text-ink">{j.nama_jenis}</span>
                <button onClick={() => hapusJenis(j.id)} className="text-rust hover:underline">Hapus</button>
              </li>
            ))}
            {jenisUjian.length === 0 && <li className="py-2 text-slate text-sm">Belum ada jenis ujian.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
