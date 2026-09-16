const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { uploadDir } = require('./utils/uploadDir');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/kelas', require('./routes/kelas'));
app.use('/api/siswa', require('./routes/siswa'));
app.use('/api/guru', require('./routes/guru'));
app.use('/api/mapel', require('./routes/mapel'));
app.use('/api/soal', require('./routes/soal'));
app.use('/api/ujian', require('./routes/ujian'));
app.use('/api/pengaturan', require('./routes/pengaturan'));

// Serve the production frontend from the same origin so legacy SEB clients
// can use the API without relying on Vite's development proxy.
const frontendDistDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
const frontendIndexPath = path.join(frontendDistDir, 'index.html');
if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/api') return next();
    if (!fs.existsSync(frontendIndexPath)) {
      return res.status(503).send('Frontend belum siap. Jalankan build frontend terlebih dahulu.');
    }
    return res.sendFile(frontendIndexPath);
  });
}

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
});

module.exports = app;
