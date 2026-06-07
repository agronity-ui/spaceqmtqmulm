# Feature Inventory dari HTML Awal SpaceQ

File awal yang diaudit: `legacy/original-prototype.html`.

## Screen / halaman yang ditemukan

- `loginScreen`
- `bismillahScreen`
- `homeScreen`
- `sholatActivationScreen`
- `sholatHomeScreen`
- `sholatReminderSettingsScreen`
- `sholatAlertScreen`
- `journalHomeScreen`
- `journalWriteScreen`
- `journalHistoryScreen`
- `journalInsightScreen`
- `kajianLobbyScreen`
- `chatNotifScreen`
- `chatDetailScreen`
- `kajianLobbyScreen`
- `kajianRoomScreen`
- `socialQScreen`
- `cameraScreen`
- `previewScreen`
- `moderationScreen`
- `tadarusLobbyScreen`
- `tadarusRoomScreen`
- `murajaahMapScreen`
- `murajaahVersusLobbyScreen`
- `murajaahVersusRoomScreen`
- `murajaahSpinScreen`
- `murajaahScreen`
- `mySpaceQScreen`
- `otherUserProfileScreen`
- `followersListScreen`
- `settingsScreen`
- `paymentScreen`
- `vsSummaryScreen`
- `quranListScreen`
- `quranReadScreen`

## Fitur utama yang dipertahankan dan dipindahkan ke struktur production

- Login/onboarding/Bismillah flow, diubah menjadi Supabase Auth.
- Beranda dengan kartu fitur dan preview SocialQ bulat.
- SocialQ feed, postingan foto/video, komentar, like, save, report, admin moderation, autoplay video 100% viewport, mute/unmute.
- SholatQ jadwal sholat, lokasi, reminder, checklist, countdown, kiblat.
- JurnalQ tulis/edit/hapus jurnal, mood, tag, pencarian, statistik, export.
- KajianQ lobby, room, peserta, host, chat realtime, link meeting.
- TadarusQ/Qur'an daftar surah, ayat, terjemahan Indonesia, audio murottal, bookmark, progress.
- MurajaahQ latihan suara, rekam/transkripsi, skor, feedback, riwayat.
- Kamera/Media akses kamera browser, foto, video, preview, upload ke storage.
- Profile/My SpaceQ, settings, notifikasi.
- Subscription/Muhsinin tetap ada sebagai dukungan/donasi opsional, bukan pengunci fitur.
- PWA manifest, service worker, offline caching, icon.

## Bagian prototype/dummy yang diganti

- `sqPrayerTimes` dan `sqState` diganti API AlAdhan + tabel `prayer_settings` / `prayer_checkins`.
- `sqDefaultEntries` diganti tabel `journals` dengan RLS per user.
- `localStorage` cooldown/hearts Murajaah diganti riwayat `murajaah_attempts`, tanpa lock/premium.
- Hardcoded SocialQ names/captions/videos diganti tabel `posts`, storage bucket `social-media`, `comments`, `post_likes`, `post_saves`, `follows`, dan `reports`.
- Membership Muhsinin yang semula menampilkan benefit limit/premium dijadikan dukungan opsional tanpa mengunci fitur.
- Kamera dan upload media diarahkan ke `getUserMedia`, `MediaRecorder`, Supabase Storage, dan tabel `media_assets`.
- Notifikasi dummy/halaman statis diganti `notifications`, browser notification, dan opsi FCM Edge Function.
