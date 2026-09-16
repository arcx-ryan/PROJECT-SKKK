// Fisher-Yates shuffle - dipakai untuk mengacak urutan soal & opsi jawaban
// agar setiap siswa mendapat urutan berbeda (mengurangi risiko mencontek).
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = { shuffleArray };
