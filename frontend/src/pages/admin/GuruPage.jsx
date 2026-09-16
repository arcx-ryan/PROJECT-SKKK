import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function GuruPage() {
  const [list, setList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [form, setForm] = useState({ nama: '', username: '', password: '', nip: '', mapel_ids: [] });
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    api.get('/guru').then((res) => setList(res.data));
    api.get('/mapel').then((res) => setMapelList(res.data));
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ nama: '', username: '', password: '', nip: '', mapel_ids: [] });
    setEditingId(null);
    setError('');
  };

  const startEdit = (guru) => {
    setEditingId(guru.id);
    setForm({
      nama: guru.User?.nama || '',
      username: guru.User?.username || '',
      password: '',
      nip: guru.nip || '',
      mapel_ids: (guru.MataPelajarans || []).map((m) => m.id),
    });
    setError('');
  };

  const toggleMapel = (id) => {
    setForm((f) => ({
      ...f,
      mapel_ids: f.mapel_ids.includes(id) ? f.mapel_ids.filter((x) => x !== id) : [...f.mapel_ids, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/guru/${editingId}`, {
          nama: form.nama,
          nip: form.nip,
          mapel_ids: form.mapel_ids,
        });
      } else {
        await api.post('/guru', form);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || (editingId ? 'Gagal memperbarui guru.' : 'Gagal menambahkan guru.'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus guru ini beserta akun loginnya?')) return;
    await api.delete(`/guru/${id}`);
    load();
  };

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink mb-6">Data Guru</h1>

      <form onSubmit={handleSubmit} className="card mb-8 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Nama Lengkap</label>
          <input className="field-input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
        </div>
        <div>
          <label className="field-label">NIP</label>
          <input className="field-input" value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Username Login</label>
          <input className="field-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required disabled={Boolean(editingId)} />
        </div>
        {!editingId && <div>
          <label className="field-label">Password Login</label>
          <input type="password" className="field-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>}
        <div className="sm:col-span-2">
          <label className="field-label">Mata Pelajaran yang Diampu</label>
          <div className="flex flex-wrap gap-2">
            {mapelList.map((m) => (
              <label key={m.id} className={`px-3 py-1.5 rounded-sm border text-sm font-sans cursor-pointer ${form.mapel_ids.includes(m.id) ? 'bg-ink text-paper border-ink' : 'border-line text-slate'}`}>
                <input type="checkbox" className="hidden" checked={form.mapel_ids.includes(m.id)} onChange={() => toggleMapel(m.id)} />
                {m.nama_mapel}
              </label>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">{editingId ? 'Simpan Perubahan' : 'Tambah Guru'}</button>
            {editingId && <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-lg border border-line text-slate text-sm font-semibold hover:bg-paper">Batal</button>}
          </div>
        </div>
      </form>
      {error && <p className="text-rust text-sm mb-4">{error}</p>}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full font-sans text-sm">
          <thead className="bg-ink text-paper">
            <tr>
              <th className="text-left px-4 py-2">Nama</th>
              <th className="text-left px-4 py-2">Username</th>
              <th className="text-left px-4 py-2">Mapel Diampu</th>
              <th className="px-4 py-2 w-20">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((g) => (
              <tr key={g.id} className="border-t border-line">
                <td className="px-4 py-2 text-ink">{g.User?.nama}</td>
                <td className="px-4 py-2 text-slate">{g.User?.username}</td>
                <td className="px-4 py-2 text-slate">{(g.MataPelajarans || []).map((m) => m.nama_mapel).join(', ')}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <button onClick={() => startEdit(g)} className="text-royal hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(g.id)} className="text-rust hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate">Belum ada data guru.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
