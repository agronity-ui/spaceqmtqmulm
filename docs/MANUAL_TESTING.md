# Checklist Pengujian Manual

## Setup
- `npm install`
- isi `.env.local`
- jalankan SQL migration di Supabase
- `npm run dev`
- register akun baru
- pastikan row `profiles` otomatis dibuat

## Auth
- Register, login, logout
- Forgot password mengirim email reset
- Edit profil dan upload avatar
- Session tetap login setelah refresh

## SocialQ
- Upload foto
- Upload video
- Video autoplay hanya saat 100% berada di viewport
- Video pause saat keluar sedikit dari viewport
- Mute/unmute bekerja
- Like/unlike
- Save/unsave
- Komentar realtime
- Hapus postingan milik sendiri
- Report postingan
- Admin/moderator dapat menyembunyikan/hapus postingan

## SholatQ
- Pakai lokasi browser
- Fallback pilih kota manual
- Jadwal sholat muncul
- Countdown berjalan
- Arah kiblat muncul saat lokasi aktif
- Checklist sholat tersimpan setelah refresh
- Notification permission bisa diminta

## JurnalQ
- Buat jurnal
- Edit jurnal
- Hapus jurnal
- Filter/cari jurnal
- Mood/tag tersimpan
- Statistik/streak berubah
- Export JSON berjalan

## Quran/TadarusQ
- Daftar surah muncul
- Buka surah
- Audio ayat dapat diputar
- Bookmark ayat tersimpan
- Pencarian terjemahan berjalan jika API tersedia

## MurajaahQ
- Pilih surah/ayat
- Rekam suara dengan browser yang mendukung SpeechRecognition
- Skor dan feedback muncul
- Riwayat tersimpan

## KajianQ
- Buat room
- Join room
- Kirim chat realtime
- Link meeting terbuka

## Kamera
- Permission kamera diminta
- Ambil foto
- Rekam video
- Preview muncul
- Upload tersimpan di Storage dan tampil di Media Kamu

## PWA
- Manifest terdeteksi
- App installable
- Offline fallback bekerja setelah build/preview
- Tidak ada console error fatal
