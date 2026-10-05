# Dorizz Store — Target Order

Papan angka order berhasil untuk periode 29 September – 28 Oktober 2026 (WIB),
dengan target 2.940 order.

- **Realtime.** Angka diperbarui saat transaksi berstatus `success` selesai
  tersimpan di Dorizz Store. Tidak ada polling berjangka.
- **Hitung dari awal.** Setiap kali halaman dibuka atau dimuat ulang, angka
  berjalan cepat dari 0 sampai jumlah sebenarnya, lalu digit yang berubah
  berputar singkat setiap ada order baru.
- **Login password saja.** Password diverifikasi di `dorizzstore.com`, bukan di
  GitHub Pages. Halaman ini hanya menerima token baca berumur 8 jam.

## Berkas

| Berkas | Isi |
| --- | --- |
| `index.html` | Struktur halaman: gerbang password dan papan angka |
| `style.css` | Gaya minimal, satu kolom, aman untuk layar 360px |
| `app.js` | Login, aliran realtime, dan penggambaran angka |
| `count.js` | Logika animasi hitung (teruji) |
| `stream.js` | Pembaca aliran Server-Sent Events (teruji) |

## Uji

```bash
npm test
```

## Sumber data

`https://dorizzstore.com/api/order-target/login` dan `/stream`. Keduanya hanya
mengizinkan origin `https://ridoazimi.github.io`.
