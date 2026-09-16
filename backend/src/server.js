require('dotenv').config();
const app = require('./app');
const { ensureUploadDir } = require('./utils/uploadDir');

ensureUploadDir();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Bank Soal berjalan di http://localhost:${PORT}`);
});
