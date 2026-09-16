import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const defaultPetunjukUjian = `Pastikan identitas Anda pada sudut kanan atas sudah sesuai dengan benar.
Jumlah soal sebanyak 60 butir Pilihan Ganda dan 6 Uraian.
Total poin Pilihan Ganda adalah 60 poin, dan Uraian adalah 30 poin.
Periksa dan bacalah dengan baik setiap butir soal sebelum Anda menjawabnya.
Pilih jawaban yang benar dengan mengklik salah satu pada jawaban yang tersedia.
Laporkan kepada Guru Mapel apabila terdapat soal yang kurang jelas atau tidak lengkap.
Periksa kembali pekerjaan Anda sebelum dikirim.
Setiap bentuk kecurangan adalah pelanggaran.
Berdoalah sebelum mengerjakan soal.`;

export default function SiswaDashboard() {
  const [list, setList] = useState([]);
  const [petunjukUjian, setPetunjukUjian] = useState(defaultPetunjukUjian);
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = async () => {
    const [ujianResponse, kelasResponse] = await Promise.all([
      api.get('/ujian/siswa/tersedia'),
      api.get('/kelas'),
    ]);
    setList(ujianResponse.data);
    const kelasSiswa = kelasResponse.data.find((kelas) => kelas.id === user?.kelas_id);
    setPetunjukUjian(kelasSiswa?.petunjuk_ujian || defaultPetunjukUjian);
  };
  useEffect(() => {
    if (user?.profile_complete === false) {
      navigate('/siswa/lengkapi-profil', { replace: true });
      return;
    }
    load();
  }, [user?.profile_complete]);

  const renderAksi = (u) => {
    if (u.status_pengerjaan === 'selesai') {
      return (
        <button onClick={() => navigate(`/siswa/hasil/${u.hasil_ujian_id}`)} className="btn-outline !px-3 !py-1.5">
          Lihat Hasil
        </button>
      );
    }
    if (u.status_pengerjaan === 'sedang_mengerjakan') {
      return (
        <button onClick={() => navigate(`/siswa/ujian/${u.id}`)} className="btn-primary !px-3 !py-1.5">
          Lanjutkan Ujian
        </button>
      );
    }
    return (
      <button onClick={() => navigate(`/siswa/ujian/${u.id}`)} className="btn-primary !px-3 !py-1.5">
        Mulai Ujian
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="font-serif text-2xl text-ink mb-2">Ujian Anda</h1>
        <section className="card mb-8">
          <h2 className="font-serif text-lg text-ink mb-3">PETUNJUK UJIAN</h2>
          <ol className="list-decimal list-inside space-y-1.5 text-slate font-sans text-sm leading-relaxed">
            {petunjukUjian.split(/\r?\n/).map((baris, index) => (
              <li key={`${index}-${baris}`}>{baris}</li>
            ))}
          </ol>
        </section>

        <div className="space-y-4">
          {list.map((u) => (
            <div key={u.id} className="card flex items-center justify-between">
              <div>
                <p className="font-serif text-lg text-ink">{u.judul}</p>
                <p className="font-mono text-xs text-brass mt-1">
                  {u.MataPelajaran?.nama_mapel} · {u.JenisUjian?.nama_jenis} · {u.durasi_menit} menit
                </p>
                {u.status_pengerjaan === 'selesai' && (
                  <p className="text-moss text-sm font-sans mt-1">Nilai Anda: {u.nilai}</p>
                )}
              </div>
              {renderAksi(u)}
            </div>
          ))}
          {list.length === 0 && (
            <p className="text-slate font-sans text-sm">Belum ada ujian yang tersedia untuk kelas Anda saat ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}
