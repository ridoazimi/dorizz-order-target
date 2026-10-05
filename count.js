/** Easing keluar-lambat: cepat di awal, melambat saat mendekati angka akhir. */
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Nilai yang ditampilkan saat animasi hitung berjalan.
 * elapsed >= duration selalu menghasilkan nilai akhir yang tepat.
 */
export function countValue(from, to, elapsed, duration) {
  if (duration <= 0 || elapsed >= duration) return to;
  if (elapsed <= 0) return from;
  return Math.round(from + (to - from) * easeOut(elapsed / duration));
}

/** Durasi hitung: lompatan kecil harus singkat, muat-awal boleh lebih panjang. */
export function countDuration(from, to) {
  const delta = Math.abs(to - from);
  if (delta === 0) return 0;
  if (from === 0) return 1100;
  return delta <= 3 ? 420 : Math.min(900, 420 + delta * 25);
}

/** Digit yang perlu berputar: hanya posisi yang benar-benar berubah. */
export function changedDigits(previous, next) {
  const a = String(previous), b = String(next);
  const width = Math.max(a.length, b.length);
  const pad = (s) => s.padStart(width, " ");
  const [pa, pb] = [pad(a), pad(b)];
  return [...pb].map((ch, i) => ({ char: ch, spin: pa[i] !== ch }));
}
