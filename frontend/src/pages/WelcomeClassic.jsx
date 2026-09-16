import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function WelcomeClassic() {
  const [setting, setSetting] = useState({ nama_sekolah: '', alamat_sekolah: '', tahun_pelajaran_aktif: '' });

  useEffect(() => {
    api.get('/pengaturan').then((res) => setSetting(res.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-paper flex flex-col overflow-hidden">
      <header className="relative z-10 border-b border-white/10 bg-ink">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {setting.logo_path && (
              <img src={setting.logo_path} alt="Logo Sekolah" className="h-10 w-10 object-contain rounded-full bg-white p-1" />
            )}
            <span className="font-serif text-lg font-semibold text-white">{setting.nama_sekolah || 'Bank Soal'}</span>
          </div>
          <Link to="/login" className="!bg-white !text-ink hover:!bg-sky btn-primary">Masuk</Link>
        </div>
      </header>
      <main className="relative flex-1 max-w-6xl w-full mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-14 items-center">
        <div className="relative z-10">
          <p className="inline-flex items-center rounded-full bg-sky px-3 py-1 font-mono text-[11px] tracking-widest text-royal mb-5">
            TAHUN PELAJARAN {setting.tahun_pelajaran_aktif || '-'}
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-semibold leading-[1.08] text-ink mb-6">
            Ujian daring yang<br /><span className="text-royal">tertata dan adil.</span>
          </h1>
          <p className="text-slate font-sans leading-relaxed max-w-lg mb-8 text-base">
            Soal disusun oleh guru sesuai mata pelajaran masing-masing, ditampilkan
            secara acak untuk setiap siswa, dan setiap mata pelajaran hanya dapat
            dikerjakan satu kali.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <Link to="/login" className="btn-primary">Masuk ke Sistem <span className="ml-2">→</span></Link>
            <span className="text-xs text-slate font-sans">Platform ujian sekolah digital</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-5 rounded-[2rem] bg-royal/10 rotate-3" />
          <div className="relative card !border-white/80 !p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-xl bg-sky flex items-center justify-center text-royal font-bold overflow-hidden">
                {setting.logo_path ? <img src={setting.logo_path} alt="Logo Sekolah" className="h-full w-full object-contain p-1" /> : <span aria-hidden="true">✦</span>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-royal font-semibold">Informasi Sistem</p>
                <h2 className="font-serif text-xl text-ink">{setting.nama_sekolah || 'Nama Sekolah'}</h2>
              </div>
            </div>
            <dl className="font-sans text-sm text-slate space-y-3">
              <div className="flex justify-between gap-4 border-b border-line pb-3"><dt>Alamat</dt><dd className="text-ink text-right">{setting.alamat_sekolah || '-'}</dd></div>
              <div className="flex justify-between gap-4 border-b border-line pb-3"><dt>Tahun Pelajaran</dt><dd className="text-ink">{setting.tahun_pelajaran_aktif || '-'}</dd></div>
              <div className="flex justify-between gap-4"><dt>Jenis Ujian</dt><dd className="text-ink text-right">{(setting.jenis_ujian || []).map((j) => j.nama_jenis).join(', ') || '-'}</dd></div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}
