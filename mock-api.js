/**
 * Mock API Interceptor untuk Task Tracker Kuliah v2
 * Mengintersepsi native window.fetch untuk simulasi REST API backend
 * Mendukung mode jaringan: Normal, Lambat (1.5s delay), dan Offline
 */
(function () {
  // Database Mock di memori
  let mockMatkul = [
    { id: 'mk-1', nama: 'Pemrograman Web (C)' },
    { id: 'mk-2', nama: 'Struktur Data & Algoritma' },
    { id: 'mk-3', nama: 'Sistem Basis Data' },
    { id: 'mk-4', nama: 'Jaringan Komputer' },
  ];

  let mockTugas = [
    {
      id: 'tugas-1',
      judul: 'Implementasi REST API Client Vanilla JS',
      matkulId: 'mk-1',
      deadline: '2026-10-20',
      selesai: false,
    },
    {
      id: 'tugas-2',
      judul: 'Tugas Mandiri Binary Search Tree',
      matkulId: 'mk-2',
      deadline: '2026-10-22',
      selesai: true,
    },
    {
      id: 'tugas-3',
      judul: 'Normalisasi ERD Database Rumah Sakit',
      matkulId: 'mk-3',
      deadline: '2026-10-25',
      selesai: false,
    },
  ];

  let networkMode = 'normal'; // 'normal' | 'lambat' | 'offline'

  // Simpan fetch asli
  const nativeFetch = window.fetch.bind(window);

  // Helper delay
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Interceptor Fetch
  window.fetch = async function (resource, options = {}) {
    const url = typeof resource === 'string' ? resource : resource.url;

    // Jika bukan endpoint mock, delegasikan ke nativeFetch
    if (!url.startsWith('/api/')) {
      return nativeFetch(resource, options);
    }

    // Simulasi Mode Jaringan
    if (networkMode === 'offline') {
      // Simulasikan NetworkError layaknya browser offline
      await wait(100);
      throw new TypeError('Failed to fetch (Mode Jaringan Offline aktif)');
    }

    if (networkMode === 'lambat') {
      await wait(1500);
    } else {
      await wait(100); // Simulasi latensi ringan
    }

    const method = (options.method || 'GET').toUpperCase();
    const headers = { 'Content-Type': 'application/json' };

    // Router endpoint mock
    // 1. GET /api/matkul
    if (url === '/api/matkul' && method === 'GET') {
      return new Response(JSON.stringify(mockMatkul), {
        status: 200,
        headers,
      });
    }

    // 2. GET /api/tugas
    if (url === '/api/tugas' && method === 'GET') {
      return new Response(JSON.stringify(mockTugas), {
        status: 200,
        headers,
      });
    }

    // 3. POST /api/tugas
    if (url === '/api/tugas' && method === 'POST') {
      let body;
      try {
        body = JSON.parse(options.body || '{}');
      } catch {
        return new Response(
          JSON.stringify({ message: 'Format JSON body tidak valid.' }),
          { status: 400, headers }
        );
      }

      // Validasi Server
      const judul = (body.judul || '').trim();
      const matkulId = (body.matkulId || '').trim();
      const deadline = (body.deadline || '').trim();

      if (!judul || judul.length < 3) {
        return new Response(
          JSON.stringify({
            message: 'Validasi server gagal: Judul tugas minimal 3 karakter.',
          }),
          { status: 400, headers }
        );
      }

      if (!matkulId) {
        return new Response(
          JSON.stringify({
            message: 'Validasi server gagal: Mata kuliah wajib dipilih.',
          }),
          { status: 400, headers }
        );
      }

      if (!deadline) {
        return new Response(
          JSON.stringify({
            message: 'Validasi server gagal: Tanggal deadline wajib diisi.',
          }),
          { status: 400, headers }
        );
      }

      const newTask = {
        id: 'tugas-' + Date.now(),
        judul,
        matkulId,
        deadline,
        selesai: false,
      };

      mockTugas.push(newTask);

      return new Response(JSON.stringify(newTask), {
        status: 201,
        headers,
      });
    }

    // 4. PATCH /api/tugas/:id
    const patchMatch = url.match(/^\/api\/tugas\/([^/]+)$/);
    if (patchMatch && method === 'PATCH') {
      const id = patchMatch[1];
      const taskIndex = mockTugas.findIndex((t) => t.id === id);

      if (taskIndex === -1) {
        return new Response(
          JSON.stringify({ message: 'Tugas dengan ID tersebut tidak ditemukan.' }),
          { status: 404, headers }
        );
      }

      let body;
      try {
        body = JSON.parse(options.body || '{}');
      } catch {
        return new Response(
          JSON.stringify({ message: 'Body permintaan tidak valid.' }),
          { status: 400, headers }
        );
      }

      if (typeof body.selesai === 'boolean') {
        mockTugas[taskIndex].selesai = body.selesai;
      }

      return new Response(JSON.stringify(mockTugas[taskIndex]), {
        status: 200,
        headers,
      });
    }

    // 5. DELETE /api/tugas/:id
    const deleteMatch = url.match(/^\/api\/tugas\/([^/]+)$/);
    if (deleteMatch && method === 'DELETE') {
      const id = deleteMatch[1];
      const taskIndex = mockTugas.findIndex((t) => t.id === id);

      if (taskIndex === -1) {
        return new Response(
          JSON.stringify({ message: 'Tugas dengan ID tersebut tidak ditemukan.' }),
          { status: 404, headers }
        );
      }

      mockTugas.splice(taskIndex, 1);

      // Return 204 No Content
      return new Response(null, {
        status: 204,
      });
    }

    // Endpoint tidak ditemukan
    return new Response(
      JSON.stringify({ message: `Endpoint ${method} ${url} tidak ditemukan.` }),
      { status: 404, headers }
    );
  };

  // Global control object untuk pengujian dan kontrol UI
  window.__API = {
    setMode: function (mode) {
      if (['normal', 'lambat', 'offline'].includes(mode)) {
        networkMode = mode;
        const selector = document.getElementById('network-mode');
        if (selector && selector.value !== mode) {
          selector.value = mode;
        }
        console.info(`[Mock API] Mode jaringan disetel ke: ${mode}`);
      } else {
        console.warn(`[Mock API] Mode '${mode}' tidak valid.`);
      }
    },
    getMode: function () {
      return networkMode;
    },
    resetData: function () {
      mockTugas = [
        {
          id: 'tugas-1',
          judul: 'Implementasi REST API Client Vanilla JS',
          matkulId: 'mk-1',
          deadline: '2026-10-20',
          selesai: false,
        },
        {
          id: 'tugas-2',
          judul: 'Tugas Mandiri Binary Search Tree',
          matkulId: 'mk-2',
          deadline: '2026-10-22',
          selesai: true,
        },
        {
          id: 'tugas-3',
          judul: 'Normalisasi ERD Database Rumah Sakit',
          matkulId: 'mk-3',
          deadline: '2026-10-25',
          selesai: false,
        },
      ];
    },
  };

  // Sinkronisasi dengan dropdown UI saat DOM siap
  document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('network-mode');
    if (selector) {
      selector.value = networkMode;
      selector.addEventListener('change', (e) => {
        window.__API.setMode(e.target.value);
      });
    }
  });
})();
