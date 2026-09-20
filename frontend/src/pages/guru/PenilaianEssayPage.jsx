import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function PenilaianEssayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [penilaian, setPenilaian] = useState({}); // { jawaban_id: nilai_essay }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/ujian/hasil/detail/${id}`)
      .then((res) => {
        setData(res.data);
        const initPenilaian = {};
        res.data.jawaban.forEach(j => {
          if (j.tipe_soal === 'essay') {
            initPenilaian[j.id] = j.nilai_essay || 0;
          }
        });
        setPenilaian(initPenilaian);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        penilaian: Object.entries(penilaian).map(([jawaban_id, nilai_essay]) => ({
          jawaban_id: parseInt(jawaban_id),
          nilai_essay: parseFloat(nilai_essay)
        }))
      };
      await api.post(`/ujian/hasil/nilai-essay/${id}`, payload);
      navigate(-1); // kembali ke halaman sebelumnya
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan penilaian');
      setSaving(false);
    }
  };

  if (loading) return <div>Memuat detail jawaban...</div>;
  if (!data) return <div>Data tidak ditemukan</div>;

  const essayAnswers = data.jawaban.filter(j => j.tipe_soal === 'essay');

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-ink">Penilaian Essay</h1>
        <p className="text-slate font-sans text-sm">
          Siswa: {data.hasil.Siswa?.User?.nama || '-'} ({data.hasil.Siswa?.nis || '-'})
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {essayAnswers.length === 0 ? (
          <div className="card text-slate text-center py-8">Tidak ada soal essay pada ujian ini.</div>
        ) : (
          essayAnswers.map((j, idx) => (
            <div key={j.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <p className="font-serif text-lg text-ink flex-1 pr-4">
                  <span className="font-bold mr-2">{idx + 1}.</span>
                  {j.pertanyaan}
                </p>
                <div className="flex-shrink-0 text-right">
                  <label className="text-xs text-slate block mb-1">Nilai (Maks: {j.bobot_nilai})</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max={j.bobot_nilai}
                    required
                    className="field-input w-24 text-right"
                    value={penilaian[j.id]}
                    onChange={(e) => setPenilaian({...penilaian, [j.id]: e.target.value})}
                  />
                </div>
              </div>
              <div className="bg-ink/5 p-4 rounded-sm border border-line">
                <p className="text-xs text-slate mb-2 font-bold uppercase tracking-wider">Jawaban Siswa:</p>
                <p className="font-sans text-sm text-ink whitespace-pre-wrap">
                  {j.jawaban_dipilih || '-'}
                </p>
                {j.feedback_ai && (
                  <p className="mt-3 border-t border-line pt-3 text-xs text-slate">
                    <span className="font-semibold text-royal">Umpan Balik Guru:</span> {j.feedback_ai}
                  </p>
                )}
              </div>
            </div>
          ))
        )}

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline">Kembali</button>
          {essayAnswers.length > 0 && (
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan Penilaian'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
