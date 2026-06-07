# API dan layanan yang dipilih

## Supabase
Dipakai untuk Auth, Postgres database, Row Level Security, Realtime, Storage, dan Edge Functions. Alasannya: satu layanan sudah menutup mayoritas kebutuhan production SpaceQ sehingga pengguna awam cukup membuat satu project dan mengisi `.env.local`.

## AlAdhan
Dipakai untuk jadwal sholat dan arah kiblat. Alasannya: tidak membutuhkan API key, mendukung jadwal berdasarkan koordinat, kota, metode hisab, dan endpoint kiblat.

## AlQuran.cloud
Dipakai sebagai API Quran default karena tidak membutuhkan API key dan menyediakan surah, ayat Utsmani, terjemahan Indonesia, serta CDN audio ayat. App juga memiliki fallback minimal agar UI tetap terbuka saat API tidak tersedia.

## Web Speech API
Dipakai untuk MurajaahQ karena paling mudah digunakan di browser tanpa server tambahan. Keterbatasan: SpeechRecognition belum baseline di semua browser dan pada Chrome dapat memakai engine server-side, sehingga validasi tajwid tidak bisa dianggap sempurna. App menilai kedekatan transkripsi sebagai validasi awal.

## Firebase Cloud Messaging
Disiapkan sebagai opsi push notification lintas perangkat. App tetap bisa berjalan tanpa FCM dengan local browser notification. Jika ingin push sungguhan, isi env Firebase dan deploy Edge Function `send-push`.

## Browser APIs
- Geolocation API untuk lokasi jadwal sholat.
- Notification API untuk reminder lokal.
- MediaDevices getUserMedia dan MediaRecorder untuk kamera/foto/video.
- PWA Service Worker via VitePWA untuk installable/offline cache.
