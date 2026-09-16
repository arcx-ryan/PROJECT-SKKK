import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CompleteProfilePage() {
  const { user, completeStudentProfile } = useAuth();
  const navigate = useNavigate();
  const [kelasList, setKelasList] = useState([]);
  const [form, setForm] = useState({ nis: '', kelas_id: '', jenis_kelamin: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/kelas').then((res) => setKelasList(res.data)).catch(() => setError('Daftar kelas tidak dapat dimuat.'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await completeStudentProfile(form);
      navigate('/siswa', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="max-w-xl mx-auto px-6 py-12">
        <section className="card">
          <div className="mb-7">
            <p className="text-xs uppercase tracking-[0.18em] text-royal font-semibold">Pendaftaran siswa</p>
            <h1 className="font-serif text-3xl text-ink mt-2">Lengkapi profilmu</h1>
            <p className="text-slate text-sm mt-2 leading-6">
              Akun Google <span className="font-semibold text-ink">{user?.nama}</span> berhasil dibuat.
              Isi data berikut satu kali sebelum mengikuti ujian.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="field-label">NIS</label>
              <input className="field-input" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} placeholder="Masukkan NIS" required />
            </div>
            <div>
              <label className="field-label">Kelas</label>
              <select className="field-input" value={form.kelas_id} onChange={(e) => setForm({ ...form, kelas_id: e.target.value })} required>
                <option value="">Pilih kelas</option>
                {kelasList.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Jenis Kelamin</label>
              <select className="field-input" value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })} required>
                <option value="">Pilih jenis kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            {error && <p className="text-rust text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan dan Masuk ke Ujian'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
