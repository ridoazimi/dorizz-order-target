# Catatan desain

Tujuan: satu angka yang terbaca sekali lihat, tanpa elemen yang tidak dipakai.

- **Satu angka utama.** Total order berhasil adalah satu-satunya angka besar.
  Grafik harian, daftar per tanggal, dan kartu metrik tambahan dihapus atas
  permintaan; semuanya memecah perhatian dari angka utama.
- **Animasi hitung.** Muat awal berjalan 1.100 ms dari 0; kenaikan satu order
  hanya 420 ms. Easing melambat di akhir supaya angka akhir terasa mendarat,
  bukan terpotong.
- **Hanya digit yang berubah yang berputar.** Angka 759 ke 760 hanya memutar
  dua digit terakhir. Memutar semua digit membuat angka sulit dibaca.
- **Warna.** Satu aksen `#ee4d2d` untuk kemajuan. Sisanya abu netral.
- **Gerak berkurang.** `prefers-reduced-motion` mematikan putaran digit.
- **Angka selalu benar.** `countValue()` mengembalikan nilai akhir yang tepat
  begitu durasi terlampaui, sehingga animasi tidak pernah menampilkan angka
  yang salah bila frame terlambat.
