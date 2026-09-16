const router = require('express').Router();
const multer = require('multer');
const c = require('../controllers/pengaturanController');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const { ensureUploadDir } = require('../utils/uploadDir');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ensureUploadDir()),
  filename: (req, file, cb) => cb(null, `logo-${Date.now()}${require('path').extname(file.originalname)}`),
});
const upload = multer({ storage });

// Pengaturan publik diperlukan halaman depan untuk menampilkan identitas sekolah.
router.get('/', c.get);

// Hanya admin yang boleh mengubah pengaturan
router.put('/', verifyToken, authorizeRole('admin'), upload.single('logo'), c.update);
router.get('/ai', verifyToken, authorizeRole('admin'), c.getAi);
router.put('/ai', verifyToken, authorizeRole('admin'), c.updateAi);
router.get('/google', verifyToken, authorizeRole('admin'), c.getGoogle);
router.put('/google', verifyToken, authorizeRole('admin'), c.updateGoogle);
router.post('/jenis-ujian', verifyToken, authorizeRole('admin'), c.tambahJenisUjian);
router.delete('/jenis-ujian/:id', verifyToken, authorizeRole('admin'), c.hapusJenisUjian);

module.exports = router;
