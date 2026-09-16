import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function KelasPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ nama_kelas: '', tingkat: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/kelas').then((res) => setList(res.data));
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ nama_kelas: '', tingkat: '' }); setEditId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) await api.put(`/kelas/${editId}`, form);
      else await api.post('/kelas', form);
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data.');
    }
  };

  const handleEdit = (k) => { setForm({ nama_kelas: k.nama_kelas, tingkat: k.tingkat || '' }); setEditId(k.id); };

  const handleDelete = async (id) => {
    if (!confirm('Hapus kelas ini?')) return;
    await api.delete(`/kelas/${id}`);
    load();
  };

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink mb-6">Data Kelas</h1>

      <form onSubmit={handleSubmit} className="card mb-8 grid sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="field-label">Nama Kelas</label>
          <input className="field-input" placeholder="X IPA 1" value={form.nama_kelas}
            onChange={(e) => setForm({ ...form, nama_kelas: e.target.value })} required />
        </div>
        <div>
          <label className="field-label">Tingkat</label>
          <input className="field-input" placeholder="X" value={form.tingkat}
            onChange={(e) => setForm({ ...form, tingkat: e.target.value })} />
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
              <th className="text-left px-4 py-2">Nama Kelas</th>
              <th className="text-left px-4 py-2">Tingkat</th>
              <th className="px-4 py-2 w-32">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((k) => (
              <tr key={k.id} className="border-t border-line">
                <td className="px-4 py-2 text-ink">{k.nama_kelas}</td>
                <td className="px-4 py-2 text-slate">{k.tingkat}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => handleEdit(k)} className="text-brass hover:underline">Ubah</button>
                  <button onClick={() => handleDelete(k.id)} className="text-rust hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate">Belum ada data kelas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
