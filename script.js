// --- Inisialisasi Global ---
let player;
let adTimer;
let countdownInterval;

// Muat YouTube Iframe API secara asynchronous
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
    console.log("YouTube API Siap.");
}

document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram.WebApp;
    tg.ready();
    const YOUTUBE_API_KEY = 'AIzaSyBXEhmJ_a91vXpSiSnkRpi6_WbVTL2Vz0A';

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
    const adOverlay = document.getElementById('adOverlay');
    const adCountdown = document.getElementById('adCountdown');
    const skipAdButton = document.getElementById('skipAdButton');

    // --- FUNGSI UTAMA ---

    // Fungsi untuk menampilkan pesan error yang jelas
    const showError = (message) => {
        resultsContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger"><strong>Terjadi Kesalahan:</strong> ${message}</div></div>`;
    };

    // Pengecekan API Key di awal
    if (YOUTUBE_API_KEY === 'AIzaSyBXEhmJ_a91vXpSiSnkRpi6_WbVTL2Vz0A') {
        showError("Kunci API YouTube belum diatur. Silakan edit file script.js dan ganti placeholder 'GANTI_DENGAN_API_KEY_ANDA'.");
        return; // Hentikan eksekusi jika API Key belum diisi
    }

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            const nextVideoElement = relatedVideosContainer.querySelector('.related-video-item');
            if (nextVideoElement) {
                playVideo(nextVideoElement.dataset.videoId, nextVideoElement.dataset.videoTitle);
            }
        }
    }

    function startVideoPlayback(videoId, title) {
        adOverlay.style.display = 'none';
        clearTimeout(adTimer);
        clearInterval(countdownInterval);
        videoModalLabel.textContent = decodeURIComponent(title);
        if (player) {
            player.loadVideoById(videoId);
        } else {
            player = new YT.Player('youtubePlayer', {
                height: '100%', width: '100%', videoId: videoId,
                playerVars: { 'playsinline': 1, 'autoplay': 1, 'controls': 1, 'rel': 0 },
                events: { 'onStateChange': onPlayerStateChange }
            });
        }
    }

    function showPreRollAd(videoId, title) {
        adOverlay.style.display = 'flex';
        let countdown = 5;
        adCountdown.textContent = `Video akan diputar dalam ${countdown} detik`;
        const newSkipButton = skipAdButton.cloneNode(true);
        skipAdButton.parentNode.replaceChild(newSkipButton, skipAdButton);
        newSkipButton.onclick = () => startVideoPlayback(videoId, title);
        countdownInterval = setInterval(() => {
            countdown--;
            adCountdown.textContent = `Video akan diputar dalam ${countdown} detik`;
        }, 1000);
        adTimer = setTimeout(() => startVideoPlayback(videoId, title), 5000);
    }

    function playVideo(videoId, encodedTitle) {
        showPreRollAd(videoId, encodedTitle);
        fetchRelatedVideos(videoId);
        if (!videoModalEl.classList.contains('show')) {
            videoModal.show();
        }
    }

    const displayResults = (videos) => {
        resultsContainer.innerHTML = '';
        if (!videos || videos.length === 0) {
            resultsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Video tidak ditemukan.</p></div>';
            return;
        }
        videos.forEach(video => {
            const videoId = video.id.videoId || video.id;
            const snippet = video.snippet;
            const videoElement = `<div class="col-lg-3 col-md-4 col-sm-6 mb-4"><div class="card video-card h-100 shadow-sm" data-video-id="${videoId}" data-video-title="${encodeURIComponent(snippet.title)}" style="cursor: pointer;"><img src="${snippet.thumbnails.high.url}" class="card-img-top" alt="Thumbnail"><div class="card-body d-flex flex-column"><h5 class="card-title text-dark">${snippet.title}</h5><p class="card-text mt-auto"><i class="bi bi-person-video"></i> ${snippet.channelTitle}</p></div></div></div>`;
            resultsContainer.innerHTML += videoElement;
        });
    };

    const fetchFromYouTube = async (endpoint, params) => {
        const defaultParams = { key: YOUTUBE_API_KEY };
        const allParams = { ...defaultParams, ...params };
        const query = new URLSearchParams(allParams).toString();
        const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${query}`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || `Terjadi kesalahan pada server YouTube (${response.status})`);
        }
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
            showError(`Gagal mencari video. Pesan dari YouTube: "${error.message}"`);
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
            showError(`Gagal memuat video kategori. Pesan dari YouTube: "${error.message}"`);
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
                        const snippet = video.snippet;
                        const relatedElement = `<div class="related-video-item" data-video-id="${video.id.videoId}" data-video-title="${encodeURIComponent(snippet.title)}"><img src="${snippet.thumbnails.default.url}" alt="Thumbnail"><div class="related-video-item-info"><h6 class="text-dark">${snippet.title}</h6><p>${snippet.channelTitle}</p></div></div>`;
                        relatedVideosContainer.innerHTML += relatedElement;
                    });
                } else {
                     relatedVideosContainer.innerHTML = '<p class="text-muted text-center small">Tidak ada video terkait.</p>';
                }
            } else {
                 relatedVideosContainer.innerHTML = '<p class="text-muted text-center small">Tidak ada video terkait.</p>';
            }
        } catch (error) {
            relatedVideosContainer.innerHTML = `<p class="text-danger text-center small">Gagal memuat: ${error.message}</p>`;
        }
    };

    // --- EVENT LISTENERS ---
    videoModalEl.addEventListener('hidden.bs.modal', () => {
        if (player) player.stopVideo();
        relatedVideosContainer.innerHTML = '';
        clearTimeout(adTimer);
        clearInterval(countdownInterval);
    });
    
    searchButton.addEventListener('click', () => searchVideos(searchInput.value));
    searchInput.addEventListener('keypress', e => e.key === 'Enter' && searchVideos(searchInput.value));

    categoryButtons.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        categoryButtons.querySelector('.active').classList.remove('active');
        button.classList.add('active');
        const type = button.dataset.type;
        if (type === 'trending') {
            fetchVideosByCategory();
        } else if (type === 'category') {
            fetchVideosByCategory(button.dataset.categoryId);
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
    
    // --- PEMUATAN AWAL ---
    fetchVideosByCategory();
});
