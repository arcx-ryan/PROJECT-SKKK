import { Routes, Route } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import DashboardSidebar from '../../components/DashboardSidebar';
import KelasPage from './KelasPage';
import SiswaPage from './SiswaPage';
import GuruPage from './GuruPage';
import MapelPage from './MapelPage';
import PengaturanPage from './PengaturanPage';

const menu = [
  { to: '/admin/kelas', label: 'Data Kelas', icon: 'kelas' },
  { to: '/admin/siswa', label: 'Data Siswa', icon: 'siswa' },
  { to: '/admin/guru', label: 'Data Guru', icon: 'guru' },
  { to: '/admin/mapel', label: 'Mata Pelajaran', icon: 'mapel' },
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: 'settings' },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col md:flex-row gap-6 md:gap-8">
        <DashboardSidebar menu={menu} role="admin" />
        <main className="min-w-0 flex-1">
          <Routes>
            <Route index element={<p className="text-slate font-sans">Pilih menu di sebelah kiri untuk mengelola data.</p>} />
            <Route path="kelas" element={<KelasPage />} />
            <Route path="siswa" element={<SiswaPage />} />
            <Route path="guru" element={<GuruPage />} />
            <Route path="mapel" element={<MapelPage />} />
            <Route path="pengaturan" element={<PengaturanPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
