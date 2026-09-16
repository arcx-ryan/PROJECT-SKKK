import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';

export default function SiswaPage() {
  const [list, setList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [form, setForm] = useState({ nama: '', email: '', username: '', password: '', nis: '', kelas_id: '', jenis_kelamin: 'L' });
  const [editId, setEditId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef(null);

  const load = async (requestedPage = pagination.page) => {
    const res = await api.get('/siswa', { params: { page: requestedPage, limit: pagination.limit } });
    const result = Array.isArray(res.data)
      ? { data: res.data, pagination: { page: 1, limit: res.data.length || 10, total: res.data.length, totalPages: 1 } }
      : res.data;
    const targetPage = result.pagination.totalPages > 0
      ? Math.min(requestedPage, result.pagination.totalPages)
      : 1;
    if (targetPage !== requestedPage) {
      setPagination(result.pagination);
      return load(targetPage);
    }
    setList(result.data);
    setPagination(result.pagination);
  };

  const loadKelas = () => {
    api.get('/kelas').then((res) => setKelasList(res.data));
  };
  useEffect(() => { load(1); loadKelas(); }, []);

  const resetForm = () => {
    setForm({ nama: '', email: '', username: '', password: '', nis: '', kelas_id: '', jenis_kelamin: 'L' });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editId) await api.put(`/siswa/${editId}`, form);
      else await api.post('/siswa', form);
      resetForm();
      load(editId ? pagination.page : 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data siswa.');
    }
  };

  const handleEdit = (siswa) => {
    setEditId(siswa.id);
    setForm({
      nama: siswa.User?.nama || '',
      email: siswa.User?.email || '',
      username: siswa.User?.username || '',
      password: '',
      nis: siswa.nis || '',
      kelas_id: String(siswa.kelas_id || ''),
      jenis_kelamin: siswa.jenis_kelamin || 'L',
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus siswa ini beserta akun loginnya?')) return;
    try {
      await api.delete(`/siswa/${id}`);
      load(pagination.page);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus siswa.');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/siswa/import-template', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Template_Import_Siswa.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Gagal mengunduh template import.');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) {
      setError('Pilih file Excel atau CSV terlebih dahulu.');
      return;
    }
    setError('');
    setSuccess('');
    setImporting(true);
    try {
      const payload = new FormData();
      payload.append('file', importFile);
      const response = await api.post('/siswa/import', payload);
      setSuccess(response.data.message);
      setImportFile(null);
      if (importInputRef.current) importInputRef.current.value = '';
      load(1);
    } catch (err) {
      const details = err.response?.data?.errors;
      setError([err.response?.data?.message || 'Gagal mengimport data siswa.', ...(details || [])].join('\n'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-ink">{editId ? 'Edit Data Siswa' : 'Data Siswa'}</h1>
          <p className="text-sm text-slate mt-1">Kelola akun siswa dan bantu reset password bila diperlukan.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card mb-8 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Nama Lengkap</label>
          <input className="field-input" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
        </div>
        <div>
          <label className="field-label">NIS</label>
          <input className="field-input" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} required />
        </div>
        <div>
          <label className="field-label">Email Google Workspace</label>
          <input type="email" className="field-input" placeholder="nama@kalamkudussentani.sch.id" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Kelas</label>
          <select className="field-input" value={form.kelas_id} onChange={(e) => setForm({ ...form, kelas_id: e.target.value })} required>
            <option value="">Pilih kelas</option>
            {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Jenis Kelamin</label>
          <select className="field-input" value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
        <div>
          <label className="field-label">Username Login</label>
          <input className="field-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div>
          <label className="field-label">Password Login</label>
          <input type="password" className="field-input" placeholder={editId ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editId} minLength={editId ? 0 : 6} />
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <button type="submit" className="btn-primary">{editId ? 'Simpan Perubahan' : 'Tambah Siswa'}</button>
          {editId && <button type="button" onClick={resetForm} className="btn-outline">Batal Edit</button>}
        </div>
      </form>
      <section className="card mb-8 border-royal/20 bg-gradient-to-br from-white to-sky/40">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg text-ink">Import Banyak Siswa</h2>
            <p className="text-sm text-slate mt-1">
              Upload file Excel (.xlsx) atau CSV. Gunakan template agar nama kolom sesuai.
            </p>
            <p className="text-xs text-slate mt-2">
              Kolom wajib: nama, nis, kelas, username, password. Email dan jenis_kelamin bersifat opsional.
            </p>
          </div>
          <button type="button" onClick={handleDownloadTemplate} className="btn-outline !px-3 !py-2">
            Unduh Template
          </button>
        </div>
        <form onSubmit={handleImport} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="block max-w-full text-sm text-slate file:mr-3 file:rounded-lg file:border-0 file:bg-sky file:px-3 file:py-2 file:font-semibold file:text-royal hover:file:bg-royal/10"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
          />
          <button type="submit" disabled={importing || !importFile} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            {importing ? 'Mengimport...' : 'Import Data Siswa'}
          </button>
        </form>
      </section>
      {error && <p className="text-rust text-sm mb-4 whitespace-pre-line">{error}</p>}
      {success && <p className="text-moss text-sm mb-4 whitespace-pre-line">{success}</p>}

      <div className="card !p-0 overflow-hidden">
        <table className="w-full font-sans text-sm">
          <thead className="bg-ink text-paper">
            <tr>
              <th className="text-left px-4 py-2">NIS</th>
              <th className="text-left px-4 py-2">Nama</th>
              <th className="text-left px-4 py-2">Kelas</th>
              <th className="text-left px-4 py-2">Username</th>
              <th className="px-4 py-2 w-36">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="px-4 py-2 font-mono text-ink">{s.nis}</td>
                <td className="px-4 py-2 text-ink">{s.User?.nama}</td>
                <td className="px-4 py-2 text-slate">{s.Kela?.nama_kelas || s.Kelas?.nama_kelas || '-'}</td>
                <td className="px-4 py-2 text-slate">{s.User?.username}</td>
                <td className="px-4 py-2 space-x-3 whitespace-nowrap">
                  <button onClick={() => handleEdit(s)} className="text-royal hover:underline">Edit</button>
                  <button onClick={() => handleDelete(s.id)} className="text-rust hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate">Belum ada data siswa.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate">
        <span>
          Menampilkan {list.length ? ((pagination.page - 1) * pagination.limit) + 1 : 0}
          -{Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} siswa
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
