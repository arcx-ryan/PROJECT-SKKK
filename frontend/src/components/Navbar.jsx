import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [nama_sekolah, setNamaSekolah] = useState('Bank Soal');
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    api.get('/pengaturan').then((res) => {
      setNamaSekolah(res.data.nama_sekolah || 'Bank Soal');
      setLogo(res.data.logo_path);
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const area = location.pathname.startsWith('/admin') ? 'Panel Administrator'
    : location.pathname.startsWith('/guru') ? 'Panel Guru'
      : 'Portal Ujian';
  const initials = user?.nama?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-white/90 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          {logo && <img src={logo} alt="Logo" className="h-11 w-11 object-contain drop-shadow-sm" />}
          <div>
            <span className="block font-serif text-base sm:text-lg font-semibold text-ink leading-tight tracking-tight">{nama_sekolah}</span>
            <span className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-royal/70 font-semibold mt-1">{area}</span>
          </div>
        </Link>
        {user && (
          <div className="flex items-center gap-2 sm:gap-3 font-sans text-sm">
            <div className="hidden sm:flex items-center gap-2.5 pr-4 border-r border-line">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky to-[#d4e8ff] text-royal flex items-center justify-center font-bold text-xs shadow-inner">{initials}</div>
              <div className="leading-tight">
                <p className="text-ink font-semibold">{user.nama}</p>
                <p className="text-[11px] text-slate capitalize mt-0.5">{user.role}</p>
              </div>
            </div>
            {(user.role === 'admin' || user.role === 'guru') && (
              <Link to="/profil" className="btn-outline !px-3.5 !py-2.5">
                Profil
              </Link>
            )}
            <button onClick={handleLogout} className="btn-outline !px-3.5 !py-2.5">
              <span className="hidden sm:inline mr-1">Keluar</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
