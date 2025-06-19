// YouTube API Key (Untuk tujuan demo. Dalam produksi, pertimbangkan untuk menyimpannya dengan lebih aman)
// Pastikan API key ini sudah diaktifkan untuk YouTube Data API v3 di Google Cloud Console Anda.
const YOUTUBE_API_KEY = 'AIzaSyCFMAiplOEzTreGfkKpQT4f6blI-bfcoYk';
const BASE_URL = 'https://www.googleapis.com/youtube/v3/';

let nextPageToken = ''; // Untuk pagination hasil pencarian
let currentSearchQuery = ''; // Melacak kueri pencarian saat ini

// Mendapatkan referensi ke elemen-elemen DOM
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchResultsDiv = document.getElementById('searchResults');
const relatedVideosSection = document.getElementById('relatedVideosSection');
const relatedVideosDiv = document.getElementById('relatedVideos');
const categoryButtonsDiv = document.getElementById('categoryButtons');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadingMessage = document.getElementById('loadingMessage');
const noResultsMessage = document.getElementById('noResultsMessage');

/**
 * Menampilkan pesan notifikasi di layar.
 * @param {string} message - Pesan yang akan ditampilkan.
 * @param {string} type - Tipe pesan ('info' atau 'error').
 */
function showMessage(message, type = 'info') {
    const messageBox = document.createElement('div');
    messageBox.className = `fixed top-4 right-4 p-4 rounded-lg shadow-xl text-white ${type === 'error' ? 'bg-red-600' : 'bg-green-600'} z-50`;
    messageBox.textContent = message;
    document.body.appendChild(messageBox);
    setTimeout(() => {
        messageBox.remove();
    }, 3000); // Pesan akan hilang setelah 3 detik
}

/**
 * Mengambil data video dari YouTube Data API.
 * @param {string} query - Kueri pencarian (untuk pencarian umum).
 * @param {string} videoId - ID video (untuk mendapatkan video terkait).
 * @param {string} pageToken - Token halaman untuk pagination.
 * @returns {Promise<Object|null>} Data respons API atau null jika terjadi kesalahan.
 */
async function fetchVideos(query, videoId = null, pageToken = '') {
    // Sembunyikan pesan 'tidak ada hasil' dan tampilkan 'memuat'
    noResultsMessage.classList.add('hidden');
    loadingMessage.classList.remove('hidden');
    searchResultsDiv.classList.remove('grid'); // Sembunyikan tata letak grid sementara memuat
    // Ganti konten hasil pencarian dengan pesan loading baru setiap kali fungsi ini dipanggil
    searchResultsDiv.innerHTML = '<div class="text-center text-gray-500 p-8" id="loadingMessage">Memuat video...</div>';

    let url = '';
    if (videoId) {
        // Validasi untuk permintaan video terkait
        if (!videoId || typeof videoId !== 'string') {
            console.error('Error Internal: ID Video tidak valid untuk permintaan video terkait.');
            loadingMessage.classList.add('hidden');
            showMessage('Error Internal: ID Video tidak valid.', 'error');
            return null;
        }
        url = `${BASE_URL}search?part=snippet&type=video&relatedToVideoId=${videoId}&maxResults=10&key=${YOUTUBE_API_KEY}`;
    } else {
        // Validasi untuk permintaan pencarian umum
        if (!query || typeof query !== 'string' || query.trim() === '') {
            console.error('Error Internal: Kueri pencarian kosong atau tidak valid.');
            loadingMessage.classList.add('hidden');
            showMessage('Error Internal: Kueri pencarian kosong atau tidak valid.', 'error');
            return null;
        }
        url = `${BASE_URL}search?part=snippet&type=video&q=${encodeURIComponent(query.trim())}&maxResults=10&key=${YOUTUBE_API_KEY}`;
    }

    if (pageToken) {
        url += `&pageToken=${pageToken}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Jika respons tidak OK, coba baca error message dari body respons
            const errorData = await response.json();
            const errorMessage = errorData.error && errorData.error.message ? errorData.error.message : `Error tidak diketahui: ${response.status}`;
            throw new Error(`YouTube API Error (${response.status}): ${errorMessage}`);
        }
        const data = await response.json();

        // Sembunyikan pesan loading setelah data diterima
        loadingMessage.classList.add('hidden');
        searchResultsDiv.classList.add('grid'); // Aktifkan kembali tata letak grid

        if (data.items.length === 0 && !pageToken) {
            noResultsMessage.classList.remove('hidden');
        } else {
            noResultsMessage.classList.add('hidden');
        }

        return data;
    } catch (error) {
        console.error('Error fetching videos:', error);
        loadingMessage.classList.add('hidden');
        noResultsMessage.classList.remove('hidden');
        noResultsMessage.textContent = `Gagal memuat video: ${error.message}. Silakan coba lagi nanti.`;
        showMessage(`Error: ${error.message}`, 'error');
        return null;
    }
}

/**
 * Merender kartu video ke dalam kontainer yang ditentukan.
 * @param {Array<Object>} videos - Array objek video dari API YouTube.
 * @param {HTMLElement} container - Elemen DOM tempat kartu video akan ditambahkan.
 * @param {boolean} clear - Jika true, akan menghapus konten kontainer sebelumnya.
 */
function renderVideos(videos, container, clear = true) {
    if (clear) {
        container.innerHTML = ''; // Hapus hasil sebelumnya
    }

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
        // console.warn('Tidak ada video untuk dirender atau argumen tidak valid.');
        return; // Tidak melakukan apa-apa jika tidak ada video
    }

    videos.forEach(video => {
        // Memastikan item video dan snippet ada
        if (!video || !video.snippet || !video.id || !video.id.videoId) {
            console.warn('Melewatkan item video tidak valid:', video);
            return;
        }

        const videoId = video.id.videoId;
        const title = video.snippet.title;
        const channelTitle = video.snippet.channelTitle;
        // Gunakan placeholder jika thumbnail tidak tersedia
        const thumbnailUrl = video.snippet.thumbnails.high ? video.snippet.thumbnails.high.url : 'https://placehold.co/480x360/cccccc/333333?text=No+Image';

        const videoCard = document.createElement('div');
        videoCard.className = 'video-card bg-white rounded-lg shadow-md overflow-hidden flex flex-col cursor-pointer';
        videoCard.innerHTML = `
            <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">
                <img src="${thumbnailUrl}" alt="${title}" class="w-full h-48 object-cover">
            </a>
            <div class="p-4 flex-grow flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                        <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer" class="hover:text-red-600">${title}</a>
                    </h3>
                    <p class="text-sm text-gray-600">${channelTitle}</p>
                </div>
            </div>
        `;
        container.appendChild(videoCard);
    });
}

/**
 * Melakukan pencarian video YouTube dan memperbarui UI.
 * @param {string} query - Kueri pencarian.
 * @param {string} pageToken - Token halaman untuk pagination.
 */
async function performSearch(query, pageToken = '') {
    // Validasi kueri sebelum memanggil fetchVideos
    if (!query || query.trim() === '') {
        showMessage('Kueri pencarian tidak boleh kosong.', 'info');
        // Sembunyikan pesan loading dan tampilkan "Tidak ada hasil" jika kueri kosong
        loadingMessage.classList.add('hidden');
        noResultsMessage.classList.remove('hidden');
        noResultsMessage.textContent = 'Tidak ada hasil ditemukan.';
        searchResultsDiv.innerHTML = ''; // Kosongkan hasil sebelumnya
        relatedVideosSection.classList.add('hidden'); // Sembunyikan bagian video terkait
        return;
    }

    const data = await fetchVideos(query, null, pageToken);
    if (data && data.items) {
        if (pageToken) {
            renderVideos(data.items, searchResultsDiv, false); // Tambahkan hasil
        } else {
            renderVideos(data.items, searchResultsDiv, true); // Hapus dan render hasil baru
        }
        nextPageToken = data.nextPageToken || '';
        if (nextPageToken) {
            loadMoreBtn.classList.remove('hidden');
        } else {
            loadMoreBtn.classList.add('hidden');
        }

        // Secara otomatis mengambil video terkait untuk hasil pencarian pertama
        if (data.items.length > 0 && !pageToken) {
            fetchRelatedVideos(data.items[0].id.videoId);
        } else if (data.items.length === 0 && !pageToken) {
            // Jika tidak ada hasil untuk pencarian awal, sembunyikan bagian terkait
            relatedVideosSection.classList.add('hidden');
        }
    } else {
        // Jika data tidak ada atau tidak ada item, pastikan pesan "Tidak ada hasil" terlihat
        loadingMessage.classList.add('hidden');
        noResultsMessage.classList.remove('hidden');
        noResultsMessage.textContent = 'Tidak ada hasil ditemukan.';
        searchResultsDiv.innerHTML = ''; // Kosongkan hasil sebelumnya
        relatedVideosSection.classList.add('hidden'); // Sembunyikan bagian video terkait
    }
}

/**
 * Mengambil dan merender video terkait.
 * @param {string} videoId - ID video untuk menemukan video terkait.
 */
async function fetchRelatedVideos(videoId) {
    // Validasi videoId sebelum memanggil fetchVideos
    if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
        console.warn('ID Video tidak valid untuk mencari video terkait.');
        relatedVideosSection.classList.add('hidden');
        return;
    }

    const data = await fetchVideos(null, videoId);
    if (data && data.items) {
        if (data.items.length > 0) {
            relatedVideosSection.classList.remove('hidden');
            renderVideos(data.items, relatedVideosDiv, true);
        } else {
            relatedVideosSection.classList.add('hidden'); // Sembunyikan jika tidak ada video terkait
        }
    } else {
        relatedVideosSection.classList.add('hidden'); // Sembunyikan jika panggilan API gagal
    }
}

// Daftar kueri acak untuk inisialisasi
const randomQueries = ["anime", "musik", "berita", "tutorial", "game", "komedi", "olahraga", "dokumenter"];

/**
 * Mendapatkan kueri acak dari daftar yang telah ditentukan.
 * @returns {string} Kueri acak.
 */
function getRandomQuery() {
    const randomIndex = Math.floor(Math.random() * randomQueries.length);
    return randomQueries[randomIndex];
}

// --- Penanganan Event Listener ---

// Event listener untuk pengiriman form pencarian
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Mencegah refresh halaman
    const query = searchInput.value.trim();
    // Validasi di sini sebelum memanggil performSearch
    if (query) {
        currentSearchQuery = query;
        nextPageToken = ''; // Reset pagination
        loadMoreBtn.classList.add('hidden'); // Sembunyikan tombol 'Muat Lebih Banyak'
        await performSearch(query);
    } else {
        showMessage('Harap masukkan kata kunci pencarian.', 'info');
        // Handle UI state jika input kosong
        loadingMessage.classList.add('hidden');
        noResultsMessage.classList.remove('hidden');
        noResultsMessage.textContent = 'Silakan masukkan kueri pencarian.';
        searchResultsDiv.innerHTML = '';
        relatedVideosSection.classList.add('hidden');
    }
});

// Event listener untuk klik tombol kategori
categoryButtonsDiv.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-category')) {
        const query = e.target.dataset.query;
        searchInput.value = query; // Set input pencarian ke kueri kategori
        currentSearchQuery = query;
        nextPageToken = ''; // Reset pagination
        loadMoreBtn.classList.add('hidden'); // Sembunyikan tombol 'Muat Lebih Banyak'
        await performSearch(query);
    }
});

// Event listener untuk tombol 'Muat Lebih Banyak'
loadMoreBtn.addEventListener('click', () => {
    if (nextPageToken && currentSearchQuery) {
        performSearch(currentSearchQuery, nextPageToken);
    } else {
        showMessage('Tidak ada lebih banyak video untuk dimuat.', 'info');
    }
});

// Inisialisasi webapp saat dokumen dimuat
document.addEventListener('DOMContentLoaded', () => {
    const initialQuery = getRandomQuery(); // Dapatkan kueri acak
    searchInput.value = initialQuery; // Atur input pencarian
    currentSearchQuery = initialQuery; // Simpan kueri awal
    performSearch(initialQuery); // Lakukan pencarian awal
});
                                       
