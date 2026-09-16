const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const c = require('../controllers/soalController');
const { verifyToken, authorizeRole } = require('../middleware/auth');
const { ensureUploadDir } = require('../utils/uploadDir');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ensureUploadDir()),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `soal-${Date.now()}-${Math.round(Math.random() * 1e6)}${extension}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('File gambar harus berformat gambar yang valid.'));
  },
});
const uploadSoalImage = (req, res, next) => upload.single('gambar')(req, res, (err) => {
  if (!err) return next();
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Ukuran gambar maksimal 5 MB.' });
  }
  return res.status(400).json({ message: err.message || 'Gagal mengunggah gambar soal.' });
});
const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
    cb(isPdf ? null : new Error('File sumber harus berformat PDF.'), isPdf);
  },
});
const uploadSoalPdf = (req, res, next) => uploadPdf.single('pdf')(req, res, (err) => {
  if (!err) return next();
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Ukuran PDF maksimal 20 MB.' });
  }
  return res.status(400).json({ message: err.message || 'Gagal mengunggah PDF sumber.' });
});

router.use(verifyToken, authorizeRole('guru', 'admin'));
router.get('/export-pdf', c.exportPdf);
router.get('/', c.getAll);
router.post('/generate', authorizeRole('guru'), uploadSoalPdf, c.generate);
router.post('/', authorizeRole('guru'), uploadSoalImage, c.create); // hanya guru yang menambahkan soal
router.put('/:id', authorizeRole('guru'), uploadSoalImage, c.update);
router.delete('/:id', authorizeRole('guru'), c.remove);

module.exports = router;
