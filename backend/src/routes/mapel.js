const router = require('express').Router();
const c = require('../controllers/mapelController');
const { verifyToken, authorizeRole } = require('../middleware/auth');

router.use(verifyToken);
router.get('/', c.getAll); // semua role boleh lihat daftar mapel
router.post('/', authorizeRole('admin'), c.create);
router.put('/:id', authorizeRole('admin'), c.update);
router.delete('/:id', authorizeRole('admin'), c.remove);

module.exports = router;
