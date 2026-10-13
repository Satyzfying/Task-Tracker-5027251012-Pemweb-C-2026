/**
 * Task Tracker Kuliah v2 - REST API Client Vanilla JS
 * Arsitektur Frontend: Helper Fetch Terpusat & State Management
 */

// 1. Inisialisasi State Aplikasi
const state = {
  tugas: [],
  matkul: [],
  filter: 'semua', // 'semua' | 'aktif' | 'selesai'
  searchQuery: '',
  isLoading: true,
  error: null,
};

// 2. Helper Wrapper Fetch API Terpusat
/**
 * Helper wrapper untuk Fetch API
 * - Menangani pemeriksaan `res.ok`
 * - Mengekstrak pesan error custom dari JSON backend (misal status 400)
 * - Menangani status 204 No Content secara aman tanpa gagal pada res.json()
 * - Melempar Error deskriptif jika gagal
 *
 * @param {string} endpoint - Path atau URL endpoint API
 * @param {RequestInit} [options={}] - Opsi request fetch
 * @returns {Promise<any>}
 */
async function api(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(endpoint, config);

  // Status 204 No Content tidak memiliki response body
  if (res.status === 204) {
    return null;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Jika respons bukan JSON valid, data tetap null
  }

  if (!res.ok) {
    const errorMessage =
      (data && (data.message || data.error)) ||
      `Permintaan gagal dengan status ${res.status} (${res.statusText || 'Error'})`;
    throw new Error(errorMessage);
  }

  return data;
}

// Inisialisasi awal saat dokumen selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  console.info('[App] Task Tracker Kuliah v2 diinisialisasi.');
});
