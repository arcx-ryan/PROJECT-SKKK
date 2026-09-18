const router = require('express').Router();
const c = require('../controllers/ujianController');
const { verifyToken, authorizeRole } = require('../middleware/auth');

router.use(verifyToken);

// Guru & admin: kelola paket ujian
router.get('/', authorizeRole('guru', 'admin'), c.getAll);
router.post('/', authorizeRole('guru', 'admin'), c.create);
router.put('/:id', authorizeRole('guru', 'admin'), c.update);
router.delete('/:id', authorizeRole('guru', 'admin'), c.remove);

// Siswa: lihat daftar ujian sesuai kelasnya, mulai ujian, submit jawaban, lihat hasil
router.get('/siswa/tersedia', authorizeRole('siswa'), c.getUjianUntukSiswa);
router.post('/:id/mulai', authorizeRole('siswa'), c.mulaiUjian);
router.post('/submit', authorizeRole('siswa'), c.submitUjian);
router.get('/hasil/:id', authorizeRole('siswa'), c.getHasil);

// Guru: Penilaian essay dan peserta
router.get('/hasil/:id/peserta', authorizeRole('guru', 'admin'), c.getPesertaUjian);
router.get('/hasil/detail/:id', authorizeRole('guru', 'admin'), c.getDetailJawaban);
router.post('/hasil/generate-nilai/:id', authorizeRole('guru', 'admin'), c.generateNilai);
router.post('/hasil/nilai-essay/:id', authorizeRole('guru', 'admin'), c.nilaiEssay);

// Guru & Admin: Export Excel
router.get('/:id/export', authorizeRole('guru', 'admin'), c.exportExcel);

module.exports = router;
