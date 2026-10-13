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

// 3. Pemuatan Data Paralel via Promise.all
/**
 * Memuat data awal mata kuliah dan daftar tugas secara paralel
 * Menangani 3 state tampilan: loading/skeleton, error dengan retry, dan sukses
 */
async function loadInitialData() {
  state.isLoading = true;
  state.error = null;
  render();

  try {
    // Request paralel menggunakan Promise.all untuk mencegah waterfall request
    const [tugasData, matkulData] = await Promise.all([
      api('/api/tugas'),
      api('/api/matkul'),
    ]);

    state.tugas = Array.isArray(tugasData) ? tugasData : [];
    state.matkul = Array.isArray(matkulData) ? matkulData : [];

    populateMatkulDropdown(state.matkul);
  } catch (err) {
    console.error('[App] Gagal memuat data awal:', err);
    state.error =
      err instanceof TypeError
        ? 'Koneksi gagal atau jaringan offline. Silakan periksa koneksi Anda.'
        : err.message || 'Terjadi kesalahan saat memuat data.';
  } finally {
    state.isLoading = false;
    render();
  }
}

/**
 * Mengisi dropdown select mata kuliah secara dinamis
 * @param {Array<{ id: string, nama: string }>} matkulList
 */
function populateMatkulDropdown(matkulList) {
  const selectEl = document.getElementById('select-matkul');
  if (!selectEl) return;

  selectEl.innerHTML = '';

  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '-- Pilih Mata Kuliah --';
  selectEl.appendChild(defaultOpt);

  matkulList.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.nama; // Aman dari XSS
    selectEl.appendChild(opt);
  });
}

// 4. Form Submission, Validasi & Feedback Server 400
/**
 * Mengatur event listener submit form tugas baru
 * Meliputi validasi sisi klien, penonaktifan tombol, dan penanganan status 400
 */
function setupFormSubmission() {
  const form = document.getElementById('form-tugas');
  const inputJudul = document.getElementById('input-judul');
  const selectMatkul = document.getElementById('select-matkul');
  const inputDeadline = document.getElementById('input-deadline');
  const submitBtn = document.getElementById('btn-submit');
  const btnText = submitBtn?.querySelector('.btn-text');
  const btnSpinner = submitBtn?.querySelector('.btn-spinner');
  const formError = document.getElementById('form-error');
  const formErrorText = document.getElementById('form-error-text');

  if (!form || !submitBtn) return;

  function showError(msg) {
    if (formError && formErrorText) {
      formErrorText.textContent = msg;
      formError.classList.remove('hidden');
    }
  }

  function hideError() {
    if (formError) {
      formError.classList.add('hidden');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const judul = inputJudul?.value.trim() || '';
    const matkulId = selectMatkul?.value.trim() || '';
    const deadline = inputDeadline?.value.trim() || '';

    // Validasi Sisi Klien
    if (!judul || judul.length < 3) {
      showError('Judul tugas wajib diisi dan minimal 3 karakter.');
      inputJudul?.focus();
      return;
    }

    if (!matkulId) {
      showError('Silakan pilih mata kuliah yang sesuai.');
      selectMatkul?.focus();
      return;
    }

    if (!deadline) {
      showError('Silakan tentukan tenggat waktu (deadline) tugas.');
      inputDeadline?.focus();
      return;
    }

    // Set status tombol: disabled dan teks Menyimpan...
    submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Menyimpan...';
    if (btnSpinner) btnSpinner.classList.remove('hidden');

    try {
      const newTask = await api('/api/tugas', {
        method: 'POST',
        body: JSON.stringify({ judul, matkulId, deadline }),
      });

      // Sukses: perbarui state lokal dan render UI
      state.tugas.unshift(newTask);
      render();

      // Reset field form
      form.reset();
      hideError();
    } catch (err) {
      console.error('[Form] Gagal menambahkan tugas:', err);
      // Tangani respon status 400 dari backend atau error jaringan
      const errorMsg =
        err instanceof TypeError
          ? 'Koneksi gagal atau jaringan offline. Tidak dapat menambahkan tugas.'
          : err.message || 'Gagal menyimpan tugas baru.';
      showError(errorMsg);
    } finally {
      // Pulihkan status tombol submit
      submitBtn.disabled = false;
      if (btnText) btnText.textContent = 'Tambah Tugas';
      if (btnSpinner) btnSpinner.classList.add('hidden');
    }
  });
}

// 5. Centralized UI Rendering & State Management
/**
 * Merender seluruh komponen antarmuka berdasarkan state terkini
 */
function render() {
  const loadingEl = document.getElementById('state-loading');
  const errorEl = document.getElementById('state-error');
  const errorMessageEl = document.getElementById('error-message');
  const emptyEl = document.getElementById('state-empty');
  const taskListEl = document.getElementById('task-list');
  const taskCounterEl = document.getElementById('task-counter');

  // Update counter tugas aktif
  const activeCount = state.tugas.filter((t) => !t.selesai).length;
  if (taskCounterEl) {
    taskCounterEl.textContent = `${activeCount} tugas aktif`;
  }

  // State 1: Sedang Loading (Tampilkan Skeleton)
  if (state.isLoading) {
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (taskListEl) taskListEl.classList.add('hidden');
    return;
  }

  if (loadingEl) loadingEl.classList.add('hidden');

  // State 2: Terjadi Error (Tampilkan Banner Error dengan tombol Retry)
  if (state.error) {
    if (errorEl) errorEl.classList.remove('hidden');
    if (errorMessageEl) errorMessageEl.textContent = state.error;
    if (emptyEl) emptyEl.classList.add('hidden');
    if (taskListEl) taskListEl.classList.add('hidden');
    return;
  }

  if (errorEl) errorEl.classList.add('hidden');

  // Filter tugas berdasarkan status dan pencarian
  const filteredTugas = state.tugas.filter((t) => {
    // Filter status (semua | aktif | selesai)
    if (state.filter === 'aktif' && t.selesai) return false;
    if (state.filter === 'selesai' && !t.selesai) return false;

    // Filter query pencarian
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      const matchJudul = (t.judul || '').toLowerCase().includes(query);
      const matkulObj = state.matkul.find((m) => m.id === t.matkulId);
      const matchMatkul = (matkulObj?.nama || '').toLowerCase().includes(query);
      return matchJudul || matchMatkul;
    }

    return true;
  });

  // State 3: Daftar Kosong
  if (filteredTugas.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    if (taskListEl) taskListEl.classList.add('hidden');
    return;
  }

  // State 4: Sukses Render Daftar Tugas
  if (emptyEl) emptyEl.classList.add('hidden');
  if (taskListEl) {
    taskListEl.classList.remove('hidden');
    renderTaskList(taskListEl, filteredTugas);
  }
}

/**
 * Merender elemen <li> daftar tugas secara aman tanpa kerentanan XSS
 * @param {HTMLElement} container
 * @param {Array<any>} tasks
 */
function renderTaskList(container, tasks) {
  container.innerHTML = '';

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = `task-item ${task.selesai ? 'is-completed' : ''}`;
    li.dataset.id = task.id;

    // Checkbox status tugas
    const checkboxLabel = document.createElement('label');
    checkboxLabel.className = 'task-checkbox-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = Boolean(task.selesai);
    checkbox.dataset.action = 'toggle';
    checkbox.setAttribute('aria-label', `Tandai tugas ${task.judul} sebagai selesai`);

    checkboxLabel.appendChild(checkbox);

    // Konten utama tugas
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'task-body';

    const titleEl = document.createElement('h3');
    titleEl.className = 'task-title';
    titleEl.textContent = task.judul; // textContent aman dari XSS

    const metaDiv = document.createElement('div');
    metaDiv.className = 'task-meta';

    const matkulObj = state.matkul.find((m) => m.id === task.matkulId);
    const matkulTag = document.createElement('span');
    matkulTag.className = 'tag-matkul';
    matkulTag.textContent = matkulObj ? matkulObj.nama : 'Mata Kuliah';

    const deadlineSpan = document.createElement('span');
    deadlineSpan.className = 'task-deadline';
    deadlineSpan.textContent = `📅 ${task.deadline || '-'}`;

    metaDiv.appendChild(matkulTag);
    metaDiv.appendChild(deadlineSpan);
    bodyDiv.appendChild(titleEl);
    bodyDiv.appendChild(metaDiv);

    // Tombol Hapus Tugas
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-delete';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.title = 'Hapus tugas';
    deleteBtn.setAttribute('aria-label', `Hapus tugas ${task.judul}`);
    deleteBtn.textContent = '🗑️';

    li.appendChild(checkboxLabel);
    li.appendChild(bodyDiv);
    li.appendChild(deleteBtn);

    container.appendChild(li);
  });
}

// Inisialisasi awal saat dokumen selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  // Setup handler form
  setupFormSubmission();

  // Tombol retry saat error
  const retryBtn = document.getElementById('btn-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      loadInitialData();
    });
  }

  // Muat data awal secara paralel
  loadInitialData();
});
