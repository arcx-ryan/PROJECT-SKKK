import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function MapelPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ kode_mapel: '', nama_mapel: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/mapel').then((res) => setList(res.data));
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ kode_mapel: '', nama_mapel: '' }); setEditId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) await api.put(`/mapel/${editId}`, form);
      else await api.post('/mapel', form);
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data.');
    }
  };

  const handleEdit = (m) => { setForm({ kode_mapel: m.kode_mapel, nama_mapel: m.nama_mapel }); setEditId(m.id); };
  const handleDelete = async (id) => { if (!confirm('Hapus mata pelajaran ini?')) return; await api.delete(`/mapel/${id}`); load(); };

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink mb-6">Mata Pelajaran</h1>

      <form onSubmit={handleSubmit} className="card mb-8 grid sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="field-label">Kode Mapel</label>
          <input className="field-input" placeholder="MTK-01" value={form.kode_mapel}
            onChange={(e) => setForm({ ...form, kode_mapel: e.target.value })} required />
        </div>
        <div>
          <label className="field-label">Nama Mata Pelajaran</label>
          <input className="field-input" placeholder="Matematika" value={form.nama_mapel}
            onChange={(e) => setForm({ ...form, nama_mapel: e.target.value })} required />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">{editId ? 'Simpan' : 'Tambah'}</button>
          {editId && <button type="button" onClick={resetForm} className="btn-outline">Batal</button>}
        </div>
      </form>
      {error && <p className="text-rust text-sm mb-4">{error}</p>}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full font-sans text-sm">
          <thead className="bg-ink text-paper">
            <tr>
              <th className="text-left px-4 py-2">Kode</th>
              <th className="text-left px-4 py-2">Nama Mata Pelajaran</th>
              <th className="px-4 py-2 w-32">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-t border-line">
                <td className="px-4 py-2 text-ink font-mono">{m.kode_mapel}</td>
                <td className="px-4 py-2 text-ink">{m.nama_mapel}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => handleEdit(m)} className="text-brass hover:underline">Ubah</button>
                  <button onClick={() => handleDelete(m.id)} className="text-rust hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate">Belum ada data mata pelajaran.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
