import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';

export default function UjianPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [soalList, setSoalList] = useState([]);
  const [hasilUjianId, setHasilUjianId] = useState(null);
  const [jawaban, setJawaban] = useState({}); // { soal_id: 'A' }
  const [current, setCurrent] = useState(0);
  const [sisaDetik, setSisaDetik] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [navigationMessage, setNavigationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);
  const mulaiUntukUjianRef = useRef(null);

  useEffect(() => {
    // React StrictMode dapat menjalankan effect dua kali saat development.
    // Satu sesi ujian cukup dimulai sekali; request berikutnya akan dianggap
    // sebagai percobaan kedua oleh constraint unik di database.
    if (mulaiUntukUjianRef.current === id) return;
    mulaiUntukUjianRef.current = id;

    // Memanggil endpoint "mulai" ujian. Backend menolak (403) jika siswa
    // sudah pernah menyelesaikan ujian ini sebelumnya (aturan 1x per mapel).
    api.post(`/ujian/${id}/mulai`)
      .then((res) => {
        setSoalList(res.data.soal);
        setHasilUjianId(res.data.hasil_ujian_id);
        setSisaDetik(res.data.durasi_menit * 60);
        setLoading(false);
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          if (err.response.data.hasil_ujian_id) {
            navigate(`/siswa/hasil/${err.response.data.hasil_ujian_id}`);
            return;
          }
          setError(err.response.data.message);
        } else {
          setError(err.response?.data?.message || 'Gagal memuat ujian.');
        }
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (loading || error || sisaDetik <= 0) return;
    timerRef.current = setInterval(() => {
      setSisaDetik((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error]);

  const formatWaktu = (detik) => {
    const m = Math.floor(detik / 60).toString().padStart(2, '0');
    const s = (detik % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const pilihJawaban = (soalId, opsiKey) => {
    setJawaban((j) => ({ ...j, [soalId]: opsiKey }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const pilihanGanda = soalList.filter((s) => s.tipe_soal !== 'essay');
    if (pilihanGanda.some((s) => !jawaban[s.id])) {
      setNavigationMessage('Selesaikan semua soal pilihan ganda terlebih dahulu sebelum mengerjakan essay.');
      return;
    }
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const payload = {
        hasil_ujian_id: hasilUjianId,
        jawaban: soalList.map((s) => ({ soal_id: s.id, jawaban_dipilih: jawaban[s.id] || null })),
      };
      await api.post('/ujian/submit', payload);
      navigate(`/siswa/hasil/${hasilUjianId}`);
    } catch (err) {
      // Pertahankan jawaban di halaman agar siswa dapat mencoba lagi tanpa
      // mengisi ulang seluruh ujian ketika server gagal sementara.
      setNavigationMessage(err.response?.data?.message || 'Gagal mengumpulkan ujian. Silakan coba lagi.');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-paper flex items-center justify-center font-sans text-slate">Memuat soal...</div>;

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="card max-w-md text-center">
          <p className="text-rust font-sans mb-4">{error}</p>
          <button onClick={() => navigate('/siswa')} className="btn-outline">Kembali ke Daftar Ujian</button>
        </div>
      </div>
    );
  }

  const soal = soalList[current];
  const terjawab = Object.keys(jawaban).length;
  const firstEssayIndex = soalList.findIndex((s) => s.tipe_soal === 'essay');
  const semuaPilihanGandaTerjawab = soalList
    .filter((s) => s.tipe_soal !== 'essay')
    .every((s) => jawaban[s.id]);
  const bolehMembukaSoal = (index) => index < 0 || index < firstEssayIndex || semuaPilihanGandaTerjawab;
  const keSoalBerikutnya = () => {
    if (current + 1 === firstEssayIndex && !semuaPilihanGandaTerjawab) {
      setNavigationMessage('Selesaikan semua soal pilihan ganda terlebih dahulu sebelum masuk ke soal essay.');
      return;
    }
    setNavigationMessage('');
    setCurrent((c) => c + 1);
  };

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="font-sans text-sm text-slate">Soal {current + 1} dari {soalList.length} · Terjawab {terjawab}</p>
          <span className="font-mono text-lg text-rust border border-rust/40 px-3 py-1 rounded-sm">
            {formatWaktu(sisaDetik)}
          </span>
        </div>

        <div className="card mb-6">
          {soal.gambar && <img src={soal.gambar} alt="Ilustrasi soal" className="mb-4 max-h-56 object-contain" />}
          <p className="text-xs font-mono text-brass uppercase tracking-wider mb-2">
            {soal.tipe_soal === 'essay' ? 'Bagian 2 · Essay' : 'Bagian 1 · Pilihan Ganda'}
          </p>
          <p className="font-serif text-lg text-ink mb-6">{soal.pertanyaan}</p>

          {soal.tipe_soal === 'essay' ? (
            <textarea
              className="w-full border border-line p-3 font-sans text-sm min-h-[150px] focus:border-ink focus:ring-1 focus:ring-ink outline-none"
              placeholder="Ketik jawaban Anda di sini..."
              value={jawaban[soal.id] || ''}
              onChange={(e) => pilihJawaban(soal.id, e.target.value)}
            />
          ) : (
            <div className="space-y-3">
              {Object.entries(soal.opsi || {}).map(([key, teks]) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 border rounded-sm px-4 py-3 cursor-pointer font-sans text-sm ${
                    jawaban[soal.id] === key ? 'border-ink bg-ink/5' : 'border-line hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name={`soal-${soal.id}`}
                    checked={jawaban[soal.id] === key}
                    onChange={() => pilihJawaban(soal.id, key)}
                    className="mt-1"
                  />
                  <span className="text-ink">{teks}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {navigationMessage && <p className="text-rust text-sm font-sans mb-4 text-center">{navigationMessage}</p>}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="btn-outline disabled:opacity-30"
          >
            Sebelumnya
          </button>

          <div className="flex gap-1 flex-wrap max-w-md justify-center">
            {soalList.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  if (bolehMembukaSoal(idx)) {
                    setNavigationMessage('');
                    setCurrent(idx);
                  }
                }}
                disabled={!bolehMembukaSoal(idx)}
                title={!bolehMembukaSoal(idx) ? 'Selesaikan pilihan ganda terlebih dahulu' : undefined}
                className={`h-8 w-8 text-xs font-mono rounded-sm border ${
                  idx === current ? 'border-ink bg-ink text-paper' : jawaban[s.id] ? 'border-moss text-moss' : 'border-line text-slate'
                } disabled:opacity-30`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {current < soalList.length - 1 ? (
            <button onClick={keSoalBerikutnya} className="btn-outline">Berikutnya</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
              {submitting ? 'Mengirim...' : 'Kumpulkan Ujian'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
