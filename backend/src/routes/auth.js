const router = require('express').Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/google-config', authController.googleConfig);
router.post('/google', authController.loginWithGoogle);
router.post('/google/complete-profile', verifyToken, authController.completeStudentProfile);
router.post('/ganti-password', verifyToken, authController.gantiPassword);
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);

module.exports = router;
