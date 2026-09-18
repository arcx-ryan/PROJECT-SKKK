import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

export default function PesertaUjianPage() {
  const { id } = useParams();
  const [peserta, setPeserta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => {
    api.get(`/ujian/hasil/${id}/peserta`)
      .then((res) => {
        setPeserta(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleGenerateNilai = async (hasilId) => {
    setGeneratingId(hasilId);
    try {
      const response = await api.post(`/ujian/hasil/generate-nilai/${hasilId}`);
      setPeserta((current) => current.map((pesertaItem) => (
        pesertaItem.id === hasilId
          ? { ...pesertaItem, status: response.data.status, nilai: response.data.nilai }
          : pesertaItem
      )));
    } catch (err) {
      alert(err.response?.data?.message || 'Penilaian otomatis belum berhasil. Silakan coba lagi.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/ujian/${id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Hasil_Ujian_${id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err.response?.data instanceof Blob
        ? await err.response.data.text()
        : null;
      let detail = '';
      try {
        detail = message ? JSON.parse(message).message : '';
      } catch {
        detail = '';
      }
      alert(detail || 'Gagal mengunduh hasil ujian.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div>Memuat data peserta...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-serif text-2xl text-ink">Daftar Peserta Ujian</h1>
        <button onClick={handleExport} disabled={exporting} className="btn-outline disabled:cursor-not-allowed disabled:opacity-50">
          {exporting ? 'Menyiapkan...' : 'Export Excel'}
        </button>
      </div>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full font-sans text-sm">
          <thead className="bg-ink text-paper">
            <tr>
              <th className="text-left px-4 py-2">No</th>
              <th className="text-left px-4 py-2">Nama</th>
              <th className="text-left px-4 py-2">Kelas</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Nilai Akhir</th>
              <th className="text-left px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {peserta.map((p, idx) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-4 py-2">{idx + 1}</td>
                <td className="px-4 py-2 text-ink">{p.Siswa?.User?.nama || '-'}</td>
                <td className="px-4 py-2 text-slate">{p.Siswa?.Kela?.nama_kelas || '-'}</td>
                <td className="px-4 py-2 text-slate">
                  {p.status === 'menunggu_penilaian' ? <span className="text-rust">Menunggu Penilaian</span> : p.status}
                </td>
                <td className="px-4 py-2 text-slate">{p.nilai !== null ? p.nilai : '-'}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link to={`/guru/penilaian/${p.id}`} className="text-moss hover:underline">
                      Lihat Jawaban
                    </Link>
                    {p.status === 'menunggu_penilaian' && (
                      <button
                        type="button"
                        onClick={() => handleGenerateNilai(p.id)}
                        disabled={generatingId === p.id}
                        className="btn-primary text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {generatingId === p.id ? 'Membuat Nilai...' : 'Generate Nilai'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {peserta.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate">Belum ada peserta.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
