import { Routes, Route } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import DashboardSidebar from '../../components/DashboardSidebar';
import SoalPage from './SoalPage';
import UjianGuruPage from './UjianGuruPage';
import PesertaUjianPage from './PesertaUjianPage';
import PenilaianEssayPage from './PenilaianEssayPage';

const menu = [
  { to: '/guru/soal', label: 'Bank Soal Saya', icon: 'soal' },
  { to: '/guru/ujian', label: 'Paket Ujian', icon: 'ujian' },
];

export default function GuruDashboard() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col md:flex-row gap-6 md:gap-8">
        <DashboardSidebar menu={menu} role="guru" />
        <main className="min-w-0 flex-1">
          <Routes>
            <Route index element={<p className="text-slate font-sans">Pilih menu di sebelah kiri.</p>} />
            <Route path="soal" element={<SoalPage />} />
            <Route path="ujian" element={<UjianGuruPage />} />
            <Route path="ujian/:id/peserta" element={<PesertaUjianPage />} />
            <Route path="penilaian/:id" element={<PenilaianEssayPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
