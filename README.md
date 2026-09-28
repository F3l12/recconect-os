# RECONNECT OS — Starter Kit

Struktur:
- `index.html` = seluruh layar/struktur aplikasi
- `styles.css` = tampilan fake-phone / fake OS
- `app.js` = logika app, clue, puzzle, timer
- `manifest.webmanifest` = metadata PWA
- `sw.js` = cache offline
- `assets/` = icon/aset

## Jalankan lokal
Paling simpel: buka `index.html` di Chrome.
Catatan: service worker/PWA install membutuhkan HTTP/HTTPS, jadi install/offline penuh baru bekerja setelah di-host (misalnya GitHub Pages) atau dijalankan lewat local server.

## Hosting GitHub Pages
1. Buat repository baru, misalnya `reconnect-os`.
2. Upload semua file/folder ini ke root repository.
3. Settings → Pages.
4. Source: Deploy from a branch.
5. Branch: `main`, folder `/ (root)`.
6. Save.
7. Situs akan tersedia di `https://USERNAME.github.io/reconnect-os/`.

## Edit paling gampang
- Isi chat: cari fungsi `renderMessages()` di `app.js`.
- Isi Notes: `renderNotes()`.
- Gallery: `renderGallery()`.
- Bible puzzle: `renderBible()`.
- Password final: cari `v==="KEMBALI"`.
- Timer: cari `seconds:720`.

Jangan pakai aset/branding dari An Elmwood Trail. Starter ini hanya memakai konsep fake-phone mystery interface secara umum dan desain/aset original.
