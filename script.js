document.addEventListener('DOMContentLoaded', function () {
    // Inisialisasi
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
    const youtubePlayer = document.getElementById('youtubePlayer');
    const videoModalLabel = document.getElementById('videoModalLabel');
    const relatedVideosContainer = document.getElementById('relatedVideosContainer');
    
    // --- FUNGSI-FUNGSI API ---

    // Fungsi untuk menampilkan video di halaman utama
    const displayResults = (videos) => {
        resultsContainer.innerHTML = '';
        if (!videos || videos.length === 0) {
            resultsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Video tidak ditemukan.</p></div>';
            return;
        }
        videos.forEach(video => {
            const videoId = video.id.videoId || video.id;
            const snippet = video.snippet;
            const videoElement = `
                <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                    <div class="card video-card h-100 shadow-sm" data-video-id="${videoId}" style="cursor: pointer;">
                        <img src="${snippet.thumbnails.high.url}" class="card-img-top" alt="Thumbnail">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title text-dark">${snippet.title}</h5>
                            <p class="card-text mt-auto"><i class="bi bi-person-video"></i> ${snippet.channelTitle}</p>
                        </div>
                    </div>
                </div>`;
            resultsContainer.innerHTML += videoElement;
        });
    };

    // Fungsi dasar untuk fetch ke API YouTube
    const fetchFromYouTube = async (endpoint, params) => {
        const query = new URLSearchParams(params).toString();
        const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${query}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error ${response.status}: ${errorData.error.message}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching from YouTube:', error);
            resultsContainer.innerHTML = `<div class="alert alert-danger" role="alert"><strong>Gagal mengambil data:</strong> ${error.message}</div>`;
            return null;
        }
    };

    // Fungsi untuk mencari video berdasarkan kata kunci
    const searchVideos = async (query) => {
        if (!query) return;
        loadingSpinner.classList.remove('d-none');
        resultsContainer.innerHTML = '';
        const data = await fetchFromYouTube('search', {
            part: 'snippet', q: query, maxResults: 12, type: 'video', key: YOUTUBE_API_KEY
        });
        if (data) displayResults(data.items);
        loadingSpinner.classList.add('d-none');
    };

    // Fungsi untuk mengambil video populer berdasarkan kategori
    const fetchVideosByCategory = async (categoryId = null) => {
        loadingSpinner.classList.remove('d-none');
        resultsContainer.innerHTML = '';
        let params = { part: 'snippet', chart: 'mostPopular', maxResults: 12, regionCode: 'ID', key: YOUTUBE_API_KEY };
        if (categoryId) {
            params.videoCategoryId = categoryId;
        }
        const data = await fetchFromYouTube('videos', params);
        if (data) displayResults(data.items);
        loadingSpinner.classList.add('d-none');
    };

    // Fungsi untuk mengambil dan menampilkan video terkait
    const fetchRelatedVideos = async (videoId) => {
        relatedVideosContainer.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div></div>';
        const data = await fetchFromYouTube('search', {
            part: 'snippet', relatedToVideoId: videoId, maxResults: 5, type: 'video', key: YOUTUBE_API_KEY
        });
        if (data && data.items) {
            relatedVideosContainer.innerHTML = '';
            data.items.forEach(video => {
                const relVideoId = video.id.videoId;
                const snippet = video.snippet;
                const relatedElement = `
                    <div class="related-video-item" data-video-id="${relVideoId}">
                        <img src="${snippet.thumbnails.default.url}" alt="Thumbnail">
                        <div class="related-video-item-info">
                            <h6 class="text-dark">${snippet.title}</h6>
                            <p>${snippet.channelTitle}</p>
                        </div>
                    </div>`;
                relatedVideosContainer.innerHTML += relatedElement;
            });
        }
    };

    // --- FUNGSI UNTUK MENGELOLA PEMUTAR VIDEO ---
    
    const playVideo = (videoId) => {
        const videoCard = document.querySelector(`.video-card[data-video-id="${videoId}"]`);
        let title = "Memutar Video";
        if (videoCard) {
            title = videoCard.querySelector('.card-title').textContent;
        } else {
             const relatedCard = document.querySelector(`.related-video-item[data-video-id="${videoId}"]`);
             if (relatedCard) title = relatedCard.querySelector('h6').textContent;
        }
        videoModalLabel.textContent = title;
        youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        fetchRelatedVideos(videoId);
        if (!videoModalEl.classList.contains('show')) {
            videoModal.show();
        }
    };
    

    // --- EVENT LISTENERS ---

    // Pencarian via tombol atau Enter
    searchButton.addEventListener('click', () => searchVideos(searchInput.value));
    searchInput.addEventListener('keypress', e => e.key === 'Enter' && searchVideos(searchInput.value));

    // Klik pada kategori
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

    // Klik pada kartu video utama
    resultsContainer.addEventListener('click', e => {
        const card = e.target.closest('.video-card');
        if (card) playVideo(card.dataset.videoId);
    });

    // Klik pada video terkait di dalam modal
    relatedVideosContainer.addEventListener('click', e => {
        const item = e.target.closest('.related-video-item');
        if (item) playVideo(item.dataset.videoId);
    });

    // Saat modal ditutup, hentikan video
    videoModalEl.addEventListener('hidden.bs.modal', () => {
        youtubePlayer.src = '';
        relatedVideosContainer.innerHTML = '';
    });

    // --- PEMUATAN AWAL ---
    fetchVideosByCategory(); // Muat video trending saat pertama kali dibuka
});
