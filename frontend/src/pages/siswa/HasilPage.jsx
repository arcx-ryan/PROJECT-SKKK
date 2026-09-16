import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';

export default function HasilPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hasil, setHasil] = useState(null);

  useEffect(() => {
    api.get(`/ujian/hasil/${id}`).then((res) => setHasil(res.data));
  }, [id]);

  if (!hasil) return <div className="min-h-screen bg-paper flex items-center justify-center font-sans text-slate">Memuat hasil...</div>;

  const nilai = Number(hasil.nilai || 0);
  const nilaiPG = hasil.nilai_pilihan_ganda ?? 0;
  const nilaiEssay = hasil.nilai_essay ?? 0;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />
      <main className="relative overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-royal/10 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-royal font-semibold font-mono">
                <span className="h-2 w-2 rounded-full bg-moss shadow-[0_0_0_4px_rgba(20,134,109,0.12)]" />
                Hasil ujian
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-ink mt-3">{hasil.Ujian?.judul}</h1>
              <p className="text-slate font-sans text-sm mt-2">
                {hasil.Ujian?.MataPelajaran?.nama_mapel} <span className="text-line mx-2">•</span> {hasil.Ujian?.JenisUjian?.nama_jenis}
              </p>
            </div>
            <div className="rounded-full border border-line bg-white/80 px-4 py-2 text-xs font-semibold text-slate shadow-sm">
              {hasil.status === 'menunggu_penilaian' ? 'Sedang diproses' : 'Ujian selesai'}
            </div>
          </div>

          {hasil.status === 'menunggu_penilaian' ? (
            <section className="relative overflow-hidden rounded-3xl border border-royal/15 bg-white p-6 sm:p-10 shadow-[0_20px_60px_rgba(18,52,91,0.09)]">
              <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-sky" />
              <div className="relative flex flex-col sm:flex-row items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl">⏳</div>
                <div>
                  <p className="font-serif text-2xl text-ink">Menunggu penilaian essay</p>
                  <p className="max-w-2xl text-slate font-sans text-sm leading-6 mt-2">
                    Jawabanmu sudah tersimpan dengan aman. Nilai akhir akan muncul setelah penilaian otomatis oleh AI atau pemeriksaan guru selesai.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="grid lg:grid-cols-[1.05fr_1.4fr] gap-5">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-royal to-[#2b75c8] p-6 sm:p-9 text-white shadow-[0_22px_55px_rgba(18,52,91,0.2)]">
                <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border-[24px] border-white/10" />
                <div className="absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-white/5" />
                <div className="relative">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/65 font-mono">Nilai akhir</p>
                  <div className="flex items-center gap-5 mt-7">
                    <div
                      className="grid h-32 w-32 shrink-0 place-items-center rounded-full"
                      style={{ background: `conic-gradient(#8ed8ff ${Math.max(0, Math.min(nilai, 100))}%, rgba(255,255,255,0.15) 0)` }}
                    >
                      <div className="grid h-24 w-24 place-items-center rounded-full bg-ink/90">
                        <span className="font-serif text-4xl">{nilai}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">Kerja bagus!</p>
                      <p className="text-sm text-white/70 mt-1">Hasil ujianmu sudah selesai.</p>
                    </div>
                  </div>
                  <div className="mt-8 border-t border-white/15 pt-5 text-sm text-white/70">
                    Hasil ini tercatat di sistem dan tidak dapat dikerjakan ulang.
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-line/80 bg-white p-5 sm:p-7 shadow-[0_16px_45px_rgba(18,52,91,0.07)]">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate font-semibold">Ringkasan jawaban</p>
                    <p className="font-serif text-xl text-ink mt-1">Detail penilaian</p>
                  </div>
                  <span className="rounded-xl bg-sky px-3 py-2 text-xs font-semibold text-royal">100 poin</span>
                </div>
                <div className="grid grid-cols-2 gap-3 font-sans text-sm">
                  <div className="rounded-2xl border border-moss/15 bg-moss/5 p-4">
                    <p className="text-2xl font-semibold text-moss">{hasil.jumlah_benar}</p>
                    <p className="text-slate mt-1">Jawaban benar</p>
                  </div>
                  <div className="rounded-2xl border border-rust/15 bg-rust/5 p-4">
                    <p className="text-2xl font-semibold text-rust">{hasil.jumlah_salah}</p>
                    <p className="text-slate mt-1">Jawaban salah</p>
                  </div>
                  <div className="rounded-2xl border border-royal/15 bg-sky/50 p-4">
                    <p className="text-2xl font-semibold text-royal">{nilaiPG}</p>
                    <p className="text-slate mt-1">Nilai pilihan ganda</p>
                  </div>
                  <div className="rounded-2xl border border-brass/20 bg-brass/5 p-4">
                    <p className="text-2xl font-semibold text-[#ad7c1c]">{nilaiEssay}</p>
                    <p className="text-slate mt-1">Nilai essay</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-8">
            <p className="text-slate font-sans text-xs text-center sm:text-left">
              Simpan hasil ini sebagai referensi belajarmu.
            </p>
            <button onClick={() => navigate('/siswa')} className="btn-primary !px-5">
              Kembali ke Daftar Ujian <span className="ml-2">→</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
