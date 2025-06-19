// Variabel global untuk YouTube Player
let player;

// Muat YouTube Iframe API secara asynchronous. Ini wajib untuk autoplay.
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Fungsi ini akan dipanggil oleh API YouTube setelah selesai dimuat
function onYouTubeIframeAPIReady() {
    console.log("YouTube API Siap.");
}

document.addEventListener('DOMContentLoaded', function () {
    // Inisialisasi Telegram
    const tg = window.Telegram.WebApp;
    tg.ready();

    // =================================================================
    // LANGKAH 1: GANTI DENGAN KUNCI API ANDA
    // Pastikan kunci ini tidak memiliki pembatasan (restrictions: None)
    // di Google Cloud Console untuk menghindari masalah.
    // =================================================================
    const YOUTUBE_API_KEY = 'AIzaSyAkgcQAn-vxpxp2UoPZ2zQLKwfVNLWRtl0';

    // Elemen DOM
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resultsContainer = document.getElementById('results');
    const loadingSpinner = document.getElementById('loading');
    const categoryButtons = document.getElementById('categoryButtons');
    const videoModalEl = document.getElementById('videoModal');
    const videoModal = new bootstrap.Modal(videoModalEl);
    const videoModalLabel = document.getElementById('videoModalLabel');
    const relatedVideosContainer = document.getElementById('relatedVideosContainer');

    // Fungsi untuk menampilkan pesan error
    const showError = (message) => {
        resultsContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger"><strong>Terjadi Kesalahan:</strong> ${message}</div></div>`;
        loadingSpinner.style.display = 'none';
    };

    if (YOUTUBE_API_KEY === 'AIzaSyAkgcQAn-vxpxp2UoPZ2zQLKwfVNLWRtl0') {
        showError("Kunci API YouTube belum diatur di file script.js.");
        return;
    }
    
    // --- FUNGSI-FUNGSI PLAYER & AUTOPLAY ---

    // Fungsi ini dipanggil saat status player berubah
    function onPlayerStateChange(event) {
        // Jika video telah selesai (status ENDED)
        if (event.data === YT.PlayerState.ENDED) {
            const nextVideoElement = relatedVideosContainer.querySelector('.related-video-item');
            if (nextVideoElement) {
                // Ambil data video selanjutnya dan panggil playVideo
                playVideo(nextVideoElement.dataset.videoId, nextVideoElement.dataset.videoTitle);
            }
        }
    }

    // Fungsi utama untuk memutar video
    function playVideo(videoId, encodedTitle) {
        const title = decodeURIComponent(encodedTitle);
        videoModalLabel.textContent = title;

        // Jika player sudah ada, muat video baru. Jika belum, buat player.
        if (player) {
            player.loadVideoById(videoId);
        } else {
            player = new YT.Player('youtubePlayer', {
                height: '100%', width: '100%', videoId: videoId,
                playerVars: { 'playsinline': 1, 'autoplay': 1, 'controls': 1, 'rel': 0 },
                events: { 'onStateChange': onPlayerStateChange }
            });
        }
        
        fetchRelatedVideos(videoId);
        
        if (!videoModalEl.classList.contains('show')) {
            videoModal.show();
        }
    }

    // Hentikan video saat modal ditutup
    videoModalEl.addEventListener('hidden.bs.modal', () => {
        if (player) player.stopVideo();
        relatedVideosContainer.innerHTML = '';
    });
    
    // --- FUNGSI-FUNGSI PENGAMBILAN DATA (FETCH) ---

    const displayResults = (videos) => {
        resultsContainer.innerHTML = '';
        if (!videos || videos.length === 0) { resultsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Video tidak ditemukan.</p></div>'; return; }
        videos.forEach(video => {
            const videoId = video.id.videoId || video.id;
            const snippet = video.snippet;
            resultsContainer.innerHTML += `<div class="col-lg-3 col-md-4 col-sm-6 mb-4"><div class="card video-card h-100 shadow-sm" data-video-id="${videoId}" data-video-title="${encodeURIComponent(snippet.title)}" style="cursor: pointer;"><img src="${snippet.thumbnails.high.url}" class="card-img-top" alt="Thumbnail"><div class="card-body d-flex flex-column"><h5 class="card-title text-dark">${snippet.title}</h5><p class="card-text mt-auto"><i class="bi bi-person-video"></i> ${snippet.channelTitle}</p></div></div></div>`;
        });
    };

    const fetchFromYouTube = async (endpoint, params) => {
        const allParams = { key: YOUTUBE_API_KEY, ...params };
        const query = new URLSearchParams(allParams).toString();
        const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${query}`;
        const response = await fetch(url);
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error.message || `Error (${response.status})`); }
        return await response.json();
    };

    const fetchVideos = async (type, value) => {
        loadingSpinner.style.display = 'block';
        resultsContainer.innerHTML = '';
        try {
            let data;
            if (type === 'search') {
                if (!value) return;
                data = await fetchFromYouTube('search', { part: 'snippet', q: value, maxResults: 12, type: 'video' });
            } else if (type === 'category') {
                let params = { part: 'snippet', chart: 'mostPopular', maxResults: 12, regionCode: 'ID' };
                if (value) params.videoCategoryId = value; // value adalah categoryId
                data = await fetchFromYouTube('videos', params);
            }
            displayResults(data.items);
        } catch (error) {
            showError(`Gagal memuat video. Pesan dari YouTube: "${error.message}"`);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    };
    
    const fetchRelatedVideos = async (videoId) => {
        relatedVideosContainer.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div></div>';
        try {
            const videoDetailsData = await fetchFromYouTube('videos', { part: 'snippet', id: videoId });
            if (!videoDetailsData.items.length) throw new Error("Detail video tidak ditemukan.");
            const originalVideoTitle = videoDetailsData.items[0].snippet.title;
            const searchData = await fetchFromYouTube('search', { part: 'snippet', q: originalVideoTitle, maxResults: 6, type: 'video' });
            const relatedItems = searchData.items.filter(item => item.id.videoId !== videoId).slice(0, 5);
            if (relatedItems.length) {
                relatedVideosContainer.innerHTML = '';
                relatedItems.forEach(video => {
                    relatedVideosContainer.innerHTML += `<div class="related-video-item" data-video-id="${video.id.videoId}" data-video-title="${encodeURIComponent(video.snippet.title)}"><img src="${video.snippet.thumbnails.default.url}" alt="Thumbnail"><div class="related-video-item-info"><h6 class="text-dark">${video.snippet.title}</h6><p>${video.snippet.channelTitle}</p></div></div>`;
                });
            } else { relatedVideosContainer.innerHTML = '<p class="text-muted text-center small">Tidak ada video terkait.</p>'; }
        } catch (error) { relatedVideosContainer.innerHTML = `<p class="text-danger text-center small">Gagal memuat: ${error.message}</p>`; }
    };

    // --- EVENT LISTENERS ---

    searchButton.addEventListener('click', () => fetchVideos('search', searchInput.value));
    searchInput.addEventListener('keypress', e => e.key === 'Enter' && fetchVideos('search', searchInput.value));
    
    categoryButtons.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        categoryButtons.querySelector('.active').classList.remove('active');
        button.classList.add('active');
        if (button.dataset.type === 'trending') {
            fetchVideos('category', null); // null untuk trending/most popular
        } else {
            fetchVideos('category', button.dataset.categoryId);
        }
    });

    resultsContainer.addEventListener('click', e => {
        const card = e.target.closest('.video-card');
        if (card) playVideo(card.dataset.videoId, card.dataset.videoTitle);
    });

    relatedVideosContainer.addEventListener('click', e => {
        const item = e.target.closest('.related-video-item');
        if (item) playVideo(item.dataset.videoId, item.dataset.videoTitle);
    });
    
    // --- PEMUATAN AWAL (VIDEO DEFAULT) ---
    fetchVideos('category', null);
});
