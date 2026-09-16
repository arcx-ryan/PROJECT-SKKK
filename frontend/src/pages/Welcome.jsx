import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Welcome() {
  const [setting, setSetting] = useState({ nama_sekolah: '', alamat_sekolah: '', tahun_pelajaran_aktif: '', logo_path: '' });

  useEffect(() => {
    api.get('/pengaturan').then((res) => setSetting(res.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <header className="border-b border-line bg-ink">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {setting.logo_path && <img src={setting.logo_path} alt="Logo Sekolah" className="h-10 w-10 object-contain rounded-full bg-white p-1" />}
            <span className="font-serif text-lg font-semibold text-white">{setting.nama_sekolah || 'Bank Soal'}</span>
          </div>
          <Link to="/login" className="!bg-white !text-ink hover:!bg-sky btn-primary">Masuk</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        <section className="grid lg:grid-cols-[1.05fr_.95fr] gap-12 items-center">
          <div>
            <p className="inline-flex rounded-full bg-sky px-3 py-1 font-mono text-[11px] tracking-widest text-royal mb-5">
              TAHUN PELAJARAN {setting.tahun_pelajaran_aktif || '-'}
            </p>
            <h1 className="font-serif text-4xl md:text-6xl font-semibold leading-[1.08] mb-6">
              Tumbuh, belajar,<br /><span className="text-royal">dan berprestasi.</span>
            </h1>
            <p className="text-slate leading-relaxed max-w-lg mb-8">
              Selamat datang di platform ujian online {setting.nama_sekolah || 'sekolah kami'}.
              Kerjakan ujian dengan tertib dan tunjukkan kemampuan terbaikmu.
            </p>
            <Link to="/login" className="btn-primary">Masuk ke Sistem <span className="ml-2">→</span></Link>
          </div>

          <div className="image-emboss h-64 md:h-[26rem] rounded-3xl overflow-hidden relative bg-sky">
            <img src="/school-classroom.png" alt="Siswa mengerjakan ujian online di kelas" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-6 pt-16">
              <span className="font-serif text-xl text-white">Lingkungan sekolah</span>
            </div>
          </div>
        </section>

        <section className="mt-16 grid md:grid-cols-3 gap-4">
          <div className="card card-emboss">
            <p className="text-xs uppercase tracking-widest text-royal font-semibold mb-3">Teratur</p>
            <p className="text-slate text-sm leading-relaxed">
              Setiap proses yang dilakukan dengan teratur akan membawa kita lebih dekat pada hasil yang terbaik. Kerjakan setiap soal dengan tenang, baca dengan teliti, dan manfaatkan waktu yang tersedia sebaik mungkin. Ingat, keberhasilan bukan hanya tentang seberapa cepat menyelesaikan ujian, tetapi juga tentang bagaimana kita menjalani setiap proses dengan disiplin dan penuh tanggung jawab.
            </p>
          </div>
          <div className="card card-emboss">
            <p className="text-xs uppercase tracking-widest text-royal font-semibold mb-3">Adil</p>
            <p className="text-slate text-sm leading-relaxed">
              Setiap siswa memiliki kesempatan yang sama untuk menunjukkan kemampuan terbaiknya. Jangan membandingkan dirimu dengan orang lain, karena setiap orang memiliki perjalanan dan kemampuan yang berbeda. Percayalah pada hasil dari usaha sendiri, kerjakan dengan jujur, dan jadikan ujian sebagai kesempatan untuk mengetahui sejauh mana pemahaman dan perjuanganmu selama belajar.
            </p>
          </div>
          <div className="card card-emboss">
            <p className="text-xs uppercase tracking-widest text-royal font-semibold mb-3">Terpercaya</p>
            <p className="text-slate text-sm leading-relaxed">
              Kejujuran adalah nilai yang membuat sebuah pencapaian menjadi benar-benar berarti. Hasil yang diperoleh dari usaha sendiri akan memberikan kebanggaan yang jauh lebih besar daripada sekadar mendapatkan nilai tinggi. Jadilah pribadi yang dapat dipercaya, gunakan teknologi dengan bijak, dan tunjukkan bahwa kamu mampu bertanggung jawab atas setiap pilihan dan jawaban yang kamu berikan.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-white/80">
        <div className="max-w-6xl mx-auto px-6 py-3 text-center text-xs">
          &copy; {new Date().getFullYear()} {setting.nama_sekolah || 'Bank Soal'}
        </div>
      </footer>
    </div>
  );
}
