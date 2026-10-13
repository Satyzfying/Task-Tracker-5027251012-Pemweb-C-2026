# Log Penggunaan AI — Task Tracker Kuliah v2

Dokumentasi penggunaan LLM (Gemini) selama pengerjaan Code Challenge / Tugas 1. AI digunakan secara terarah sebagai mitra *pair programming* dan *code review* modular, bukan generator satu pintu.

---

### Sesi 1: Perancangan Arsitektur Helper Fetch & Error Handling
- **Prompt:**  
  "Bagaimana cara membuat helper wrapper `api(endpoint, options)` menggunakan Fetch API vanilla JS yang mengecek `res.ok`, mengekstrak pesan error custom dari JSON backend (misal status 400), menangani status 204 No Content, dan melempar `Error` deskriptif?"
- **Tujuan:** Menghindari kebiasaan `fetch` yang menelan status HTTP non-200 dan memastikan seluruh request terpusat di satu fungsi helper.
- **Output yang dipakai:** Struktur dasar fungsi helper `api()`.

---

### Sesi 2: Pemuatan Data Paralel & Penanganan State UI
- **Prompt:**  
  "Saya memiliki dua endpoint independen: `GET /api/tugas` dan `GET /api/matkul`. Bagaimana pola terbaik memuat keduanya secara paralel dengan `Promise.all`, sekaligus menangani 3 state UI (loading/skeleton, error dengan tombol retry, dan daftar kosong)?"
- **Tujuan:** Mempercepat inisialisasi aplikasi tanpa chaining `await` sekuensial yang memicu *waterfall request*, serta menjaga UX saat loading.
- **Output yang dipakai:** Pola `Promise.all` dan struktur conditional rendering untuk elemen status.

---

### Sesi 3: Form Submission, Validasi, dan UX Feedback
- **Prompt:**  
  "Bagaimana cara menangani form submission async ke `POST /api/tugas` yang memvalidasi input klien (judul min 3 karakter, deadline terisi), menonaktifkan tombol submit saat proses kirim berlangsung, dan menangani rollback jika backend melempar status 400?"
- **Tujuan:** Mencegah spam submission (double request) dan memastikan pesan validasi server tampil di elemen UI, bukan cuma `console.log`.
- **Output yang dipakai:** Alur *state flag* tombol submit dan blok `try/catch/finally`.

---

### Sesi 4: Event Delegation untuk Mutasi State (PATCH & DELETE)
- **Prompt:**  
  "Pada list item dinamis di elemen `<ul>`, bagaimana menerapkan event delegation dengan `e.target.closest()` untuk membedakan event klik pada checkbox status (`PATCH /api/tugas/:id`) dan tombol hapus (`DELETE /api/tugas/:id`), lalu memperbarui array state lokal?"
- **Tujuan:** Efisiensi memori event listener tanpa memasang listener berulang tiap kali item dirender ulang.
- **Output yang dipakai:** Pemanfaatan `closest('[data-action]')` dan `dataset.id`.

---

### Sesi 5: Pengujian Ketahanan Koneksi (Offline & Mode Lambat)
- **Prompt:**  
  "Mengapa pengujian menggunakan mock jaringan offline atau lambat sering memicu unhandled promise rejection merah di DevTools, dan bagaimana memastikan semua async handler menangkap error jaringan dengan rapi?"
- **Tujuan:** Menjamin konsol browser bersih dari *uncaught runtime errors* saat diuji pada mode offline.
- **Output yang dipakai:** Penambahan `try/catch` komprehensif pada listener inisialisasi dan event delegasi.
