# SpaceQ Production Ready

Paket ini adalah refactor production dari prototype single-file HTML SpaceQ menjadi aplikasi Vite + React + Supabase. Tujuannya bukan lagi simulasi: data user, postingan, media, jurnal, komentar, like, checklist sholat, progress Quran, Murajaah, Kajian, notifikasi, dan profil disimpan di backend.

> File HTML awal tetap disimpan di `legacy/original-prototype.html` sebagai arsip audit. Implementasi baru ada di `src/`.

## Stack

- Vite + React untuk frontend mobile-first.
- Supabase Auth untuk register, login, logout, forgot password, session persistence.
- Supabase Postgres + Row Level Security untuk database aman per user.
- Supabase Storage untuk avatar, foto/video SocialQ, media kamera, file KajianQ.
- Supabase Realtime untuk feed, komentar, dan chat KajianQ.
- AlAdhan API untuk jadwal sholat dan kiblat.
- AlQuran.cloud untuk daftar surah, ayat, terjemahan Indonesia, dan audio murottal.
- Web Speech API untuk MurajaahQ.
- VitePWA + service worker untuk PWA.
- Firebase Cloud Messaging opsional untuk push notification lintas perangkat.

## Struktur Folder

```txt
spaceq-production-ready/
├─ src/
│  ├─ App.jsx
│  ├─ main.jsx
│  ├─ styles.css
│  ├─ components/
│  ├─ features/
│  │  ├─ auth/
│  │  ├─ home/
│  │  ├─ social/
│  │  ├─ sholat/
│  │  ├─ jurnal/
│  │  ├─ quran/
│  │  ├─ murajaah/
│  │  ├─ kajian/
│  │  ├─ camera/
│  │  ├─ profile/
│  │  └─ admin/
│  └─ lib/
│     ├─ supabase.js
│     ├─ api/
│     └─ hooks/
├─ supabase/
│  ├─ migrations/0001_spaceq_schema.sql
│  └─ functions/send-push/
├─ public/
│  ├─ sw-fcm.js
│  └─ icons/
├─ docs/
└─ legacy/original-prototype.html
```

## Cara Menjalankan dari Nol

### 1. Install Node.js

Pakai Node.js versi LTS.

### 2. Install dependency

```bash
npm install
```

### 3. Buat project Supabase

1. Buka Supabase.
2. Buat project baru.
3. Ambil Project URL dan anon public key dari Project Settings → API.

### 4. Isi environment

Copy `.env.example` menjadi `.env.local`.

```bash
cp .env.example .env.local
```

Isi minimal:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 5. Jalankan migration database

Buka Supabase SQL Editor, paste isi:

```txt
supabase/migrations/0001_spaceq_schema.sql
```

Lalu klik Run.

Script ini membuat:
- tabel database
- enum
- trigger profil otomatis setelah register
- RLS policies
- storage buckets
- storage policies

### 6. Jalankan aplikasi

```bash
npm run dev
```

Buka URL dari terminal. Register akun baru.

### 7. Build production

```bash
npm run build
npm run preview
```

## Deploy

### Vercel atau Netlify

1. Push folder ini ke GitHub.
2. Import repo ke Vercel/Netlify.
3. Tambahkan environment variables yang sama seperti `.env.local`.
4. Build command: `npm run build`
5. Output folder: `dist`

### Supabase

Database dan storage sudah dibuat lewat migration. Untuk push notification opsional:

```bash
supabase functions deploy send-push
supabase secrets set FCM_SERVER_KEY=YOUR_FCM_SERVER_KEY
```

## Fitur Production yang Sudah Diimplementasikan

### Auth
- Register
- Login
- Logout
- Forgot password
- Edit profil
- Upload avatar
- Session persistence

### SocialQ
- Upload foto/video ke Supabase Storage
- Caption
- Feed realtime
- Like/unlike
- Save/bookmark
- Komentar realtime
- Follow/unfollow
- Edit caption milik sendiri
- Hapus postingan milik sendiri
- Report postingan
- Admin/moderator moderation
- Autoplay video saat 100% berada di viewport
- Pause otomatis saat keluar viewport
- Mute/unmute nyata
- Preview beranda tetap berbentuk bulat

### SholatQ
- Jadwal sholat berdasarkan kota
- Jadwal sholat berdasarkan geolocation
- Fallback kota manual
- Countdown sholat berikutnya
- Arah kiblat
- Checklist sholat harian
- Statistik harian
- Reminder lokal via Notification API

### JurnalQ
- Buat jurnal
- Edit jurnal
- Hapus jurnal
- Mood
- Tag
- Filter/pencarian
- Statistik mood/streak
- Export JSON
- Data privat per user via RLS

### TadarusQ / Qur'an
- Daftar surah
- Daftar ayat
- Teks Arab
- Terjemahan Indonesia
- Audio murottal per ayat
- Bookmark ayat
- Progress terakhir baca
- Pencarian terjemahan

### MurajaahQ
- Pilih surah/ayat
- Rekam suara via SpeechRecognition
- Transkripsi
- Skor kedekatan bacaan
- Feedback
- Riwayat latihan tersimpan

Catatan penting: validasi MurajaahQ berbasis transkripsi, bukan pengganti koreksi tajwid/makhraj ustadz. Ini batas realistis teknologi browser.

### KajianQ
- Buat room
- Jadwal kajian
- Join room
- Peserta
- Host
- Chat room realtime
- Link meeting eksternal

### Kamera / Media
- Akses kamera browser
- Ambil foto
- Rekam video
- Preview hasil
- Upload ke Supabase Storage
- Riwayat media

### PWA
- Manifest
- Icon
- Service worker
- Offline cache untuk asset/API penting
- Installable

### Notifikasi
- Local browser notification
- Tabel notifications
- Push subscription table
- Firebase Cloud Messaging opsional
- Supabase Edge Function `send-push` opsional

## Cara Membuat Admin

Setelah register, jalankan SQL ini di Supabase SQL Editor. Ganti email:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'email-kamu@example.com'
);
```

## Catatan API Key

Tidak ada API key yang di-hardcode. Semua konfigurasi ada di `.env.example`.

API gratis/tanpa key:
- AlAdhan
- AlQuran.cloud

API butuh konfigurasi:
- Supabase
- Firebase Cloud Messaging opsional

## Troubleshooting

### Register berhasil tapi profile tidak muncul
Pastikan trigger `on_auth_user_created` sudah dibuat dari migration. Cek tabel `profiles`.

### Upload media gagal
Cek bucket `social-media`, `camera-media`, dan policy storage. Pastikan file path dimulai dengan user ID. Fungsi `uploadFile()` sudah otomatis membuat path seperti itu.

### Notifikasi tidak muncul
Browser harus memberi permission. Untuk push lintas perangkat, isi env Firebase dan deploy Edge Function.

### MurajaahQ tidak merekam
Web Speech API belum tersedia di semua browser. Coba Chrome/Edge. Fitur ini tidak selalu berjalan offline.

### PWA belum installable
Jalankan build production dulu:

```bash
npm run build
npm run preview
```

## File Dokumentasi Tambahan

- `docs/FEATURE_INVENTORY.md`
- `docs/API_DECISIONS.md`
- `docs/MANUAL_TESTING.md`
