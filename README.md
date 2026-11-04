# Populite - Sistem Pendataan & Manajemen Warga RT/RW Mandiri

Aplikasi manajemen dan pendataan warga mandiri berbasis mobile (Android & iOS) dan Web yang dirancang khusus untuk kepengurusan di tingkat **Rukun Tetangga (RT)** maupun **Rukun Warga (RW)**.

Aplikasi ini bertujuan untuk mendigitalkan administrasi lingkungan warga: mulai dari pendataan demografi hunian, pembukuan kas & keuangan RT secara transparan, pencatatan agenda kegiatan warga, hingga pembuatan laporan PDF siap cetak.

Aplikasi ini bersifat **open-source** dan dapat digunakan, dimodifikasi, serta di-hosting secara mandiri oleh pengurus RT/RW di seluruh Indonesia.

---

## 🌐 Demo & Akses Langsung
Anda dapat mencoba langsung aplikasi ini secara online melalui:
**https://populite-v2.expo.app**

> **Catatan:** Daftarkan akun baru menggunakan email dan password. Secara default, akun baru akan mendapatkan akses sebagai *Viewer (Warga)*.

---

## ✨ Fitur Utama

### 1. 👥 Pendataan Hunian & Demografi Warga
* **Klasifikasi Hunian:** Pencatatan status rumah (*Ditempati*, *Sewa/Kontrak*, atau *Kosong*).
* **Rincian Demografi:** Jumlah jiwa per rumah yang dirinci berdasarkan kategori (Kepala Keluarga, Dewasa Laki-laki/Perempuan, Anak-anak Laki-laki/Perempuan).
* **Status Domisili KTP:** Membedakan warga yang sudah ber-KTP setempat vs warga ber-KTP luar wilayah.
* **Proteksi Data Sensitif (*Data Masking*):** Menjaga privasi warga dengan menyamarkan data sensitif bagi pengguna dengan role *Viewer*.

### 2. 💰 Buku Kas & Keuangan RT Transparan
* **Pencatatan Pemasukan:** Iuran bulanan warga (sampah & kas), donasi umum, dan sumber dana lainnya.
* **Pencatatan Pengeluaran:** Biaya operasional, santunan sosial (warga sakit/duka cita), perbaikan fasilitas umum, dan anggaran kegiatan.
* **Laporan Keuangan Otomatis:** Perhitungan otomatis total pemasukan, pengeluaran, dan saldo kas bersih bulanan.

### 3. 📅 Agenda & Kegiatan Lingkungan
* Penjadwalan rapat warga, kerja bakti, ronda malam, perayaan hari besar, hingga posyandu.
* Riwayat kegiatan lingkungan yang terdokumentasi rapi.

### 4. 📄 Cetak & Ekspor Laporan (PDF)
* **Laporan Kependudukan:** Ekspor data sensus warga (rekapitulasi sebaran per jalan, statistik hunian) dalam format PDF siap cetak atau dibagikan ke grup WhatsApp warga.
* **Laporan Kas Bulanan:** Format PDF resmi laporan kas RT per periode bulan.

### 5. 🔒 Hak Akses Bertingkat (Role-Based Access Control)
* **Admin (Ketua RT / Pengurus Inti):** Akses penuh sistem, manajemen hak akses pengguna lain, audit data anomali (*Record Auditor*), dan riwayat log aktivitas.
* **Staff (Sekretaris / Bendahara):** Input dan pembaruan data kependudukan, pencatatan kas masuk/keluar, dan pembuatan agenda kegiatan.
* **Viewer (Warga):** Akses baca transparan terhadap agenda kegiatan, laporan kas RT, dan direktori kependudukan terproteksi.

### 6. 🛠️ Record Auditor (Pemeriksa Data Anomali)
* Alat bantu otomatis untuk mendeteksi data yang tidak sinkron (misal: rumah berstatus *Kosong* namun memiliki jumlah jiwa > 0, atau ketidaksesuaian total jenis kelamin) dengan opsi perbaikan otomatis (*auto-fix*).

---

## 🛠️ Tech Stack
* **Framework:** React Native / Expo (SDK 54)
* **Routing:** Expo Router v6 (File-based routing)
* **Styling:** NativeWind v4 (TailwindCSS) & React Native Paper
* **Database & Auth:** Google Firebase v10 (Cloud Firestore & Firebase Authentication)
* **Language:** TypeScript

---

## ⚙️ Kustomisasi untuk Lingkungan RT Anda

Sebelum menjalankan aplikasi untuk RT Anda sendiri, ada beberapa bagian teks dan konstanta yang **perlu disesuaikan** dengan identitas lingkungan RT Anda:

### 1. Alamat & Nama RT di Halaman Ringkasan (Dashboard Summary)
Buka file [`app/dashboard/summary.tsx`](app/dashboard/summary.tsx) (sekitar baris 436–444):
```tsx
<Text className="text-white font-bold text-lg">
  RT 003 / RW 007                  {/* <-- Ganti dengan Nomor RT/RW Anda */}
</Text>
<Text className="text-white text-sm">
  Puri Harmoni Pasir Mukti         {/* <-- Ganti dengan Nama Perumahan / Kampung Anda */}
</Text>
<Text className="text-white text-sm">
  Desa Gunung Sari, Kec. Citeureup {/* <-- Ganti dengan Desa/Kelurahan & Kecamatan Anda */}
</Text>
```

### 2. Daftar Nama Jalan / Gang
Buka file [`constants/data.ts`](constants/data.ts):
```typescript
// Sesuaikan dengan nama-nama jalan, gang, atau blok di RT Anda
export const STREET_OPTIONS = ["Pinus 1", "Pinus 2", "Edelweis", "Mawar"];

// Ganti "Gunung Sari" dengan nama Desa/Kelurahan Anda untuk cek KTP setempat
export const DOMICILE_OPTIONS = ["Gunung Sari", "Lainnya"];
```

### 3. Kop Surat Laporan PDF Kas Keuangan
Buka file [`utils/financePdf.ts`](utils/financePdf.ts) (sekitar baris 167–168):
```html
<h1 class="maintitle">Laporan Kas RT 003</h1>          <!-- Sesuaikan RT Anda -->
<h2 class="subtitle">Puri Harmoni Pasir Mukti</h2>     <!-- Sesuaikan Wilayah Anda -->
```

### 4. Kategori Iuran & Pengeluaran Kas RT (Opsional)
Buka file [`constants/finance.ts`](constants/finance.ts):
Anda dapat menambah atau mengubah pos iuran (`FINANCE_INCOME_SOURCES`) dan pos belanja (`FINANCE_SPENDING_TYPES`) sesuai AD/ART atau kesepakatan RT Anda.

### 5. Identitas Aplikasi & Package Name (Opsional)
Buka file [`app.json`](app.json):
* Ubah `name`, `slug`, dan `android.package` (`com.picupiee.populite`) jika ingin mempublikasikan aplikasi dengan nama dan identitas RT Anda sendiri.
* Jika ingin menggunakan EAS Build sendiri, hapus field `extra.eas.projectId` dan jalankan `npx eas init`.

---

## 🚀 Panduan Instalasi & Menjalankan Sendiri

Ikuti langkah-langkah di bawah ini untuk menjalankan project ini dari nol:

### Prasyarat
* [Node.js](https://nodejs.org/) versi LTS (v20+ disarankan).
* Ponsel Android/iOS dengan aplikasi **Expo Go**, atau Emulator Android / iOS Simulator.
* Akun [Google Firebase Console](https://console.firebase.google.com/).

---

### Langkah 1: Clone Repositori & Pasang Dependensi
```bash
git clone https://github.com/picupiee/populite-v2.git
cd populite-v2
npm install
```

---

### Langkah 2: Setup Project di Firebase
1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat project baru (misal: `populite-rt05`).
2. **Aktifkan Authentication:**
   * Buka menu **Build > Authentication** > klik **Get Started**.
   * Pada tab **Sign-in method**, aktifkan provider **Email/Password**.
3. **Aktifkan Cloud Firestore Database:**
   * Buka menu **Build > Firestore Database** > klik **Create Database**.
   * Pilih lokasi server terdekat (misal: `asia-southeast2` Jakarta).
   * Pilih opsi **Start in production mode**.
4. **Pasang Security Rules:**
   * Buka tab **Rules** pada Firestore Database di Firebase Console.
   * Salin seluruh isi file [`firestore.rules`](firestore.rules) dari repositori ini, lalu tempelkan ke editor Rules di Firebase Console.
   * Klik tombol **Publish**.
5. **Dapatkan Kredensial Web App:**
   * Masuk ke **Project Settings** (ikon gerigi) > tab **General**.
   * Di bagian *Your apps*, klik ikon Web (`</>`) untuk mendaftarkan aplikasi web.
   * Salin konfigurasi objek `firebaseConfig` yang muncul.

---

### Langkah 3: Konfigurasi Environment Variables
Salin template file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Buka file `.env.local` dan isi dengan nilai kredensial Firebase yang Anda dapatkan pada Langkah 2:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyA...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=populite-rt05.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=populite-rt05
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=populite-rt05.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

### Langkah 4: Jalankan Aplikasi
Jalankan development server Expo:
```bash
npx expo start -c
```
* **Buka di Web:** Tekan tombol `w` di terminal.
* **Buka di HP Android:** Buka aplikasi **Expo Go**, lalu scan QR code yang tampil di terminal.

---

### Langkah 5: Mengangkat Akun Admin Pertama
Secara sistem, semua akun yang baru didaftarkan melalui halaman registrasi aplikasi akan memiliki hak akses sebagai `viewer`. Agar Anda bisa mulai memasukkan data dan mengelola sistem:

1. Buka aplikasi yang sedang berjalan, lalu klik **Daftar (Sign Up)** menggunakan email dan password Anda.
2. Buka [Firebase Console](https://console.firebase.google.com/) > **Firestore Database**.
3. Buka koleksi `users`, lalu cari dokumen yang sesuai dengan akun Anda.
4. Ubah nilai field `role` dari `"viewer"` menjadi `"admin"`.
5. Buka kembali aplikasi dan lakukan *Log out* lalu *Log in* ulang.
6. **Selesai!** Akun Anda sekarang berstatus Admin.

> **💡 Tips untuk Pengurus Lain:** Setelah Anda menjadi Admin, Anda tidak perlu lagi mengubah database secara manual untuk pengurus lain. Cukup minta pengurus mendaftar, lalu buka menu **Pengaturan (Settings) > Manajemen Pengguna** di dalam aplikasi untuk menaikkan role mereka menjadi **Staff** atau **Admin**.

---

## 📱 Panduan Build Aplikasi

### Build APK Android (via Expo Application Services / EAS)
1. Install EAS CLI secara global jika belum ada:
   ```bash
   npm install -g eas-cli
   ```
2. Login ke akun Expo Anda:
   ```bash
   eas login
   ```
3. Hubungkan project dengan akun Expo Anda:
   ```bash
   eas init
   ```
4. Build APK Android siap install:
   ```bash
   eas build -p android --profile preview
   ```

### Deploy Versi Web
Ekspor bundle web statis:
```bash
npm run deploy:web
```
File build web akan tersimpan di direktori `dist/` dan siap di-hosting ke hosting statis seperti Vercel, Netlify, Firebase Hosting, atau GitHub Pages.

---

## 🤝 Kontribusi & Saran
Aplikasi ini bersifat open-source dan terus dikembangkan untuk membantu efisiensi birokrasi warga di tingkat akar rumput.

Jika Anda memiliki pertanyaan, saran fitur, atau menemukan kendala teknis:
* Silakan buat **Issue** atau kirimkan **Pull Request**.
* Kontak Pengembang: **picupiee.id@gmail.com**

---

## 📄 Lisensi
Didistribusikan di bawah lisensi open-source untuk kemaslahatan masyarakat dan kepengurusan RT/RW.
