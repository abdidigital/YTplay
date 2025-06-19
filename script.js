let player; // Variabel YouTube Player tetap dibutuhkan

// Muat YouTube Iframe API secara asynchronous
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Fungsi ini akan dipanggil oleh API YouTube setelah selesai dimuat
function onYouTubeIframeAPIReady() {
    console.log("YouTube API Siap.");
}

document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram.WebApp;
    tg.ready();
    const YOUTUBE_API_KEY = 'AIzaSyBXEhmJ_a91vXpSiSnkRpi6_WbVTL2Vz0A'; // API Key Anda sudah di sini.

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
    
    // ======================================================
    // BLOK IF YANG BERMASALAH TELAH DIHAPUS DARI SINI
    // ======================================================

    // Fungsi onPlayerStateChange tetap ada untuk fitur autoplay video selanjutnya
    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            const nextVideoElement = relatedVideosContainer.querySelector('.related-video-item');
            if (nextVideoElement) {
                playVideo(nextVideoElement.dataset.videoId, nextVideoElement.dataset.videoTitle);
            }
        }
    }

    // Fungsi playVideo disederhanakan, tidak ada lagi logika iklan
    function playVideo(videoId, encodedTitle) {
        const title = decodeURIComponent(encodedTitle);
        videoModalLabel.textContent = title;

        // Logika untuk memuat atau membuat player baru
        if (player) {
            player.loadVideoById(videoId);
        } else {
            player = new YT.Player('youtubePlayer', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'playsinline': 1,
                    'autoplay': 1,
                    'controls': 1,
                    'rel': 0
                },
                events: {
                    'onStateChange': onPlayerStateChange
                }
            });
        }
        
        // Tetap memuat video terkait
        fetchRelatedVideos(videoId);
        
        // Tampilkan modal jika belum tampil
        if (!videoModalEl.classList.contains('show')) {
            videoModal.show();
        }
    }

    // Event listener saat modal ditutup (timer iklan dihapus)
    videoModalEl.addEventListener('hidden.bs.modal', () => {
        if (player) {
            player.stopVideo();
        }
        relatedVideosContainer.innerHTML = '';
    });
    
    // --- Sisa fungsi (Fetch API, Event Listeners, dll) tetap sama ---
    
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
    const searchVideos = async (query) => {
        if (!query) return;
        loadingSpinner.classList.remove('d-none');
        resultsContainer.innerHTML = '';
        try {
            const data = await fetchFromYouTube('search', { part: 'snippet', q: query, maxResults: 12, type: 'video' });
            displayResults(data.items);
        } catch (error) {
            resultsContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger"><strong>Gagal mencari:</strong> ${error.message}</div></div>`;
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    };
    const fetchVideosByCategory = async (categoryId = null) => {
        loadingSpinner.classList.remove('d-none');
        resultsContainer.innerHTML = '';
        try {
            let params = { part: 'snippet', chart: 'mostPopular', maxResults: 12, regionCode: 'ID' };
            if (categoryId) params.videoCategoryId = categoryId;
            const data = await fetchFromYouTube('videos', params);
            displayResults(data.items);
        } catch (error) {
            resultsContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger"><strong>Gagal memuat kategori:</strong> ${error.message}</div></div>`;
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    };
    const fetchRelatedVideos = async (videoId) => {
        relatedVideosContainer.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div></div>';
        try {
            const videoDetailsData = await fetchFromYouTube('videos', { part: 'snippet', id: videoId });
            if (!videoDetailsData.items || videoDetailsData.items.length === 0) throw new Error("Detail video tidak ditemukan.");
            const originalVideoTitle = videoDetailsData.items[0].snippet.title;
            const searchData = await fetchFromYouTube('search', { part: 'snippet', q: originalVideoTitle, maxResults: 6, type: 'video' });
            if (searchData && searchData.items) {
                const relatedItems = searchData.items.filter(item => item.id.videoId !== videoId).slice(0, 5);
                if (relatedItems.length > 0) {
                    relatedVideosContainer.innerHTML = '';
                    relatedItems.forEach(video => {
                        relatedVideosContainer.innerHTML += `<div class="related-video-item" data-video-id="${video.id.videoId}" data-video-title="${encodeURIComponent(video.snippet.title)}"><img src="${video.snippet.thumbnails.default.url}" alt="Thumbnail"><div class="related-video-item-info"><h6 class="text-dark">${video.snippet.title}</h6><p>${video.snippet.channelTitle}</p></div></div>`;
                    });
                } else { relatedVideosContainer.innerHTML = '<p class="text-muted text-center small">Tidak ada video terkait.</p>'; }
            } else { relatedVideosContainer.innerHTML = '<p class="text-muted text-center small">Tidak ada video terkait.</p>'; }
        } catch (error) { relatedVideosContainer.innerHTML = `<p class="text-danger text-center small">Gagal memuat: ${error.message}</p>`; }
    };
    searchButton.addEventListener('click', () => searchVideos(searchInput.value));
    searchInput.addEventListener('keypress', e => e.key === 'Enter' && searchVideos(searchInput.value));
    categoryButtons.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        categoryButtons.querySelector('.active').classList.remove('active');
        button.classList.add('active');
        const type = button.dataset.type;
        if (type === 'trending') fetchVideosByCategory();
        else if (type === 'category') fetchVideosByCategory(button.dataset.categoryId);
    });
    resultsContainer.addEventListener('click', e => {
        const card = e.target.closest('.video-card');
        if (card) playVideo(card.dataset.videoId, card.dataset.videoTitle);
    });
    relatedVideosContainer.addEventListener('click', e => {
        const item = e.target.closest('.related-video-item');
        if (item) playVideo(item.dataset.videoId, item.dataset.videoTitle);
    });
    
    fetchVideosByCategory();
});
