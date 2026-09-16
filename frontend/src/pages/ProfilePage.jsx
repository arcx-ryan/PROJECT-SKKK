import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: '', email: '', password_lama: '', password_baru: '', password_konfirmasi: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/profile')
      .then((res) => setForm((current) => ({ ...current, nama: res.data.nama || '', email: res.data.email || '' })))
      .catch((err) => setStatus({ type: 'error', message: err.response?.data?.message || 'Profil gagal dimuat.' }));
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });
    if (form.password_baru && form.password_baru !== form.password_konfirmasi) {
      setStatus({ type: 'error', message: 'Konfirmasi password baru tidak cocok.' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', {
        nama: form.nama,
        email: form.email,
        password_lama: form.password_lama,
        password_baru: form.password_baru,
      });
      updateUser(res.data.user, res.data.token);
      setForm((current) => ({ ...current, password_lama: '', password_baru: '', password_konfirmasi: '' }));
      setStatus({ type: 'success', message: res.data.message });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Profil gagal diperbarui.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <button type="button" onClick={() => navigate(-1)} className="text-sm text-royal font-semibold mb-5 hover:underline">
          ← Kembali
        </button>
        <section className="card">
          <p className="text-xs uppercase tracking-[0.18em] text-royal/70 font-semibold">Akun {user?.role}</p>
          <h1 className="font-serif text-3xl font-semibold text-ink mt-1">Profil Pengguna</h1>
          <p className="text-slate text-sm mt-2">Perbarui identitas akun atau ganti password login.</p>
          {status.message && (
            <div className={`mt-5 rounded-lg px-4 py-3 text-sm ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {status.message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="field-label" htmlFor="nama">Nama</label>
              <input id="nama" name="nama" value={form.nama} onChange={handleChange} className="field-input" required />
            </div>
            <div>
              <label className="field-label" htmlFor="username">Username</label>
              <input id="username" value={user?.username || ''} className="field-input bg-slate-50" disabled />
            </div>
            <div>
              <label className="field-label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="field-input" />
            </div>
            <div className="border-t border-line pt-5">
              <h2 className="font-semibold text-ink">Ganti Password</h2>
              <p className="text-xs text-slate mt-1">Kosongkan bagian ini jika password tidak ingin diubah.</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="password_lama">Password Lama</label>
                  <input id="password_lama" name="password_lama" type="password" value={form.password_lama} onChange={handleChange} className="field-input" autoComplete="current-password" />
                </div>
                <div>
                  <label className="field-label" htmlFor="password_baru">Password Baru</label>
                  <input id="password_baru" name="password_baru" type="password" value={form.password_baru} onChange={handleChange} className="field-input" minLength={6} autoComplete="new-password" />
                </div>
                <div>
                  <label className="field-label" htmlFor="password_konfirmasi">Konfirmasi Password Baru</label>
                  <input id="password_konfirmasi" name="password_konfirmasi" type="password" value={form.password_konfirmasi} onChange={handleChange} className="field-input" minLength={6} autoComplete="new-password" />
                </div>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
