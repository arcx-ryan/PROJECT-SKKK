const router = require('express').Router();
const multer = require('multer');
const c = require('../controllers/siswaController');
const { verifyToken, authorizeRole } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(xlsx|csv)$/i.test(file.originalname);
    cb(allowed ? null : new Error('File harus berformat .xlsx atau .csv.'), allowed);
  },
});
const uploadImport = (req, res, next) => upload.single('file')(req, res, (err) => {
  if (!err) return next();
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Ukuran file maksimal 10 MB.' });
  }
  return res.status(400).json({ message: err.message || 'Gagal mengunggah file.' });
});

router.use(verifyToken, authorizeRole('admin'));
router.get('/import-template', c.downloadTemplate);
router.post('/import', uploadImport, c.importData);
router.get('/', c.getAll);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
