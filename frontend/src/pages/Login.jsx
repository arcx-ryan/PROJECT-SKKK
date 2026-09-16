import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const goToDashboard = (user) => {
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'guru') navigate('/guru');
    else if (user.profile_complete === false) navigate('/siswa/lengkapi-profil');
    else navigate('/siswa');
  };

  useEffect(() => {
    api.get('/auth/google-config').then((res) => {
      if (res.data.client_id) setGoogleClientId(res.data.client_id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return undefined;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        hosted_domain: 'kalamkudussentani.sch.id',
        callback: async (response) => {
          setError('');
          setLoading(true);
          try {
            const user = await loginWithGoogle(response.credential);
            goToDashboard(user);
          } catch (err) {
            setError(err.response?.data?.message || 'Login Google gagal.');
          } finally {
            setLoading(false);
          }
        },
      });
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'signin_with',
        width: 360,
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return undefined;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
    return () => {
      script.onload = null;
    };
  }, [googleClientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      goToDashboard(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal, periksa kembali username dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="card !p-8 md:!p-10">
          <Link to="/" className="font-mono text-xs text-slate hover:text-royal transition-colors">&larr; Kembali ke halaman depan</Link>
          <div className="mt-7 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-royal text-white flex items-center justify-center text-xl shadow-lg shadow-royal/20 mb-5">✦</div>
            <p className="text-xs uppercase tracking-widest text-royal font-semibold mb-2">Sistem Ujian Online</p>
            <h1 className="font-serif text-3xl font-semibold text-ink">Sumatif Sekolah Online</h1>
            <p className="text-slate text-sm mt-2">Gunakan akun sekolah Anda untuk melanjutkan.</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label">Username</label>
            <input className="field-input" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <p className="text-rust text-sm font-sans">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        {googleClientId ? (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-slate">
              <span className="h-px flex-1 bg-line" />
              <span>atau</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <div ref={googleButtonRef} className="flex justify-center min-h-10" />
            <p className="mt-2 text-center text-xs text-slate">
              Gunakan akun sekolah @kalamkudussentani.sch.id
            </p>
          </>
        ) : (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-800">
            Login Google Workspace belum dikonfigurasi. Admin perlu mengisi Client ID pada menu Pengaturan atau backend <span className="font-mono">.env</span>.
          </div>
        )}
        </div>
        <div className="image-emboss hidden md:block h-[38rem] rounded-3xl overflow-hidden relative bg-sky">
          <img
            src="/school-classroom.png"
            alt="Siswa mengerjakan ujian online di kelas"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-7 pt-24">
            <p className="text-xs uppercase tracking-widest text-white/80 font-semibold mb-2">Belajar dan berprestasi</p>
            <p className="font-serif text-2xl text-white">Siap mengerjakan ujian?</p>
          </div>
        </div>
      </div>
    </div>
  );
}
