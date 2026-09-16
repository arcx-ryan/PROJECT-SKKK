import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const emptyForm = {
  judul: '', mapel_id: '', jenis_ujian_id: '', kelas_id: '', tahun_pelajaran: '',
  durasi_menit: 60, jumlah_soal_pilihan_ganda: '', jumlah_soal_essay: '',
  acak_soal: true, acak_opsi_jawaban: true, status: 'aktif',
};

export default function UjianGuruPage() {
  const [list, setList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [jenisUjianList, setJenisUjianList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [tahunPelajaranAktif, setTahunPelajaranAktif] = useState('');

  const load = () => api.get('/ujian').then((res) => setList(res.data));

  useEffect(() => {
    load();
    api.get('/mapel').then((res) => setMapelList(res.data));
    api.get('/kelas').then((res) => setKelasList(res.data));
    api.get('/pengaturan').then((res) => {
      setJenisUjianList(res.data.jenis_ujian || []);
      setTahunPelajaranAktif(res.data.tahun_pelajaran_aktif || '');
      setForm((current) => ({ ...current, tahun_pelajaran: res.data.tahun_pelajaran_aktif || '' }));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      tahun_pelajaran: tahunPelajaranAktif,
      jumlah_soal_pilihan_ganda: form.jumlah_soal_pilihan_ganda || null,
      jumlah_soal_essay: form.jumlah_soal_essay || null,
    };
    try {
      if (editingId) await api.put(`/ujian/${editingId}`, payload);
      else await api.post('/ujian', payload);
      setEditingId(null);
      setForm({ ...emptyForm, tahun_pelajaran: tahunPelajaranAktif });
      load();
    } catch (err) {
      setError(err.response?.data?.message || (editingId ? 'Gagal memperbarui paket ujian.' : 'Gagal membuat paket ujian.'));
    }
  };

  const handleEdit = (ujian) => {
    setEditingId(ujian.id);
    setForm({
      judul: ujian.judul || '',
      mapel_id: String(ujian.mapel_id || ''),
      jenis_ujian_id: String(ujian.jenis_ujian_id || ''),
      kelas_id: String(ujian.kelas_id || ''),
      tahun_pelajaran: tahunPelajaranAktif || ujian.tahun_pelajaran || '',
      durasi_menit: ujian.durasi_menit || 60,
      jumlah_soal_pilihan_ganda: ujian.jumlah_soal_pilihan_ganda ?? '',
      jumlah_soal_essay: ujian.jumlah_soal_essay ?? '',
      acak_soal: Boolean(ujian.acak_soal),
      acak_opsi_jawaban: Boolean(ujian.acak_opsi_jawaban),
      status: ujian.status || 'aktif',
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...emptyForm, tahun_pelajaran: tahunPelajaranAktif });
    setError('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus paket ujian ini?')) return;
    try {
      await api.delete(`/ujian/${id}`);
      if (editingId === id) cancelEdit();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus paket ujian.');
    }
  };

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink mb-6">{editingId ? 'Edit Paket Ujian' : 'Paket Ujian'}</h1>

      <form onSubmit={handleSubmit} className="card mb-8 space-y-4">
        <div>
          <label className="field-label">Judul Ujian</label>
          <input className="field-input" placeholder="Ulangan Harian Bab 1" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} required />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="field-label">Mata Pelajaran</label>
            <select className="field-input" value={form.mapel_id} onChange={(e) => setForm({ ...form, mapel_id: e.target.value })} required>
              <option value="">Pilih mapel</option>
              {mapelList.map((m) => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Jenis Ujian</label>
            <select className="field-input" value={form.jenis_ujian_id} onChange={(e) => setForm({ ...form, jenis_ujian_id: e.target.value })} required>
              <option value="">Pilih jenis</option>
              {jenisUjianList.map((j) => <option key={j.id} value={j.id}>{j.nama_jenis}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Kelas</label>
            <select className="field-input" value={form.kelas_id} onChange={(e) => setForm({ ...form, kelas_id: e.target.value })} required>
              <option value="">Pilih kelas</option>
              {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <label className="field-label">Tahun Pelajaran</label>
            <input className="field-input bg-paper" value={form.tahun_pelajaran} readOnly required />
            <p className="text-xs text-slate mt-1">Mengikuti Tahun Pelajaran Aktif pada Pengaturan Admin.</p>
          </div>
          <div>
            <label className="field-label">Durasi (menit)</label>
            <input type="number" className="field-input" value={form.durasi_menit} onChange={(e) => setForm({ ...form, durasi_menit: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Jumlah Pilihan Ganda</label>
            <input type="number" min="0" className="field-input" placeholder="Kosongkan = semua" value={form.jumlah_soal_pilihan_ganda} onChange={(e) => setForm({ ...form, jumlah_soal_pilihan_ganda: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Jumlah Essay</label>
            <input type="number" min="0" className="field-input" placeholder="Kosongkan = semua" value={form.jumlah_soal_essay} onChange={(e) => setForm({ ...form, jumlah_soal_essay: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-6 font-sans text-sm text-slate">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.acak_soal} onChange={(e) => setForm({ ...form, acak_soal: e.target.checked })} />
            Acak urutan soal
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.acak_opsi_jawaban} onChange={(e) => setForm({ ...form, acak_opsi_jawaban: e.target.checked })} />
            Acak urutan opsi jawaban
          </label>
        </div>
        {error && <p className="text-rust text-sm">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary">{editingId ? 'Simpan Perubahan' : 'Buat Paket Ujian'}</button>
          {editingId && <button type="button" onClick={cancelEdit} className="btn-outline">Batal Edit</button>}
        </div>
      </form>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full font-sans text-sm">
          <thead className="bg-ink text-paper">
            <tr>
              <th className="text-left px-4 py-2">Judul</th>
              <th className="text-left px-4 py-2">Mapel</th>
              <th className="text-left px-4 py-2">Kelas</th>
              <th className="text-left px-4 py-2">Jumlah Soal</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="px-4 py-2 w-20">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-2 text-ink">{u.judul}</td>
                <td className="px-4 py-2 text-slate">{u.MataPelajaran?.nama_mapel}</td>
                <td className="px-4 py-2 text-slate">{u.Kela?.nama_kelas || u.Kelas?.nama_kelas || '-'}</td>
                <td className="px-4 py-2 text-slate">
                  PG: {u.jumlah_soal_pilihan_ganda ?? 'Semua'} · Essay: {u.jumlah_soal_essay ?? 'Semua'}
                </td>
                <td className="px-4 py-2 text-slate">{u.status}</td>
                <td className="px-4 py-2 space-x-3">
                  <button onClick={() => handleEdit(u)} className="text-royal hover:underline">Edit</button>
                  <Link to={`/guru/ujian/${u.id}/peserta`} className="text-moss hover:underline">Peserta</Link>
                  <button onClick={() => window.open(`http://localhost:5000/api/ujian/${u.id}/export`, '_blank')} className="text-moss hover:underline">Excel</button>
                  <button onClick={() => handleDelete(u.id)} className="text-rust hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate">Belum ada paket ujian.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
