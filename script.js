document.addEventListener('DOMContentLoaded', function () {
    // Inisialisasi
    const tg = window.Telegram.WebApp;
    tg.ready();
    const YOUTUBE_API_KEY = 'AIzaSyAkgcQAn-vxpxp2UoPZ2zQLKwfVNLWRtl0';

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
                    <div class="card video-card h-100 shadow-sm" 
                         data-video-id="${videoId}" 
                         data-video-title="${encodeURIComponent(snippet.title)}" 
                         style="cursor: pointer;">
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

    const fetchFromYouTube = async (endpoint, params) => {
        const defaultParams = { key: YOUTUBE_API_KEY };
        const allParams = { ...defaultParams, ...params };
        const query = new URLSearchParams(allParams).toString();
        const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${query}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('YouTube API Error:', errorData);
            throw new Error(errorData.error.message || 'Terjadi kesalahan pada server YouTube.');
        }
        return await response.json();
    };

    const searchVideos = async (query) => {
        if (!query) return;
        loadingSpinner.classList.remove('d-none');
        resultsContainer.innerHTML = '';
        try {
            const data = await fetchFromYouTube('search', {
                part: 'snippet', q: query, maxResults: 12, type: 'video'
            });
            if (data) displayResults(data.items);
        } catch (error) {
            resultsContainer.innerHTML = `<div class="alert alert-danger" role="alert"><strong>Gagal mencari video:</strong> ${error.message}</div>`;
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    };

    const fetchVideosByCategory = async (categoryId = null) => {
        loadingSpinner.classList.remove('d-none');
        resultsContainer.innerHTML = '';
        try {
            let params = { part: 'snippet', chart: 'mostPopular', maxResults: 12, regionCode: 'ID' };
            if (categoryId) {
                params.videoCategoryId = categoryId;
            }
            const data = await fetchFromYouTube('videos', params);
            if (data) displayResults(data.items);
        } catch (error) {
            resultsContainer.innerHTML = `<div class="alert alert-danger" role="alert"><strong>Gagal memuat kategori:</strong> ${error.message}</div>`;
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    };

    // --- PERBAIKAN FINAL: LOGIKA BARU UNTUK VIDEO TERKAIT ---
    const fetchRelatedVideos = async (videoId) => {
        relatedVideosContainer.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div></div>';
        try {
            // Langkah 1: Dapatkan judul dari video yang sedang diputar
            const videoDetailsData = await fetchFromYouTube('videos', {
                part: 'snippet',
                id: videoId
            });

            if (!videoDetailsData.items || videoDetailsData.items.length === 0) {
                throw new Error("Detail video tidak ditemukan.");
            }
            const originalVideoTitle = videoDetailsData.items[0].snippet.title;

            // Langkah 2: Lakukan pencarian baru menggunakan judul tersebut sebagai query
            const searchData = await fetchFromYouTube('search', {
                part: 'snippet',
                q: originalVideoTitle, // Menggunakan judul sebagai kata kunci pencarian
                maxResults: 6, // Ambil 6 untuk cadangan jika video asli muncul
                type: 'video'
            });
            
            // Langkah 3: Filter hasilnya untuk menghapus video asli & tampilkan
            if (searchData && searchData.items) {
                const relatedItems = searchData.items
                    .filter(item => item.id.videoId !== videoId) // Hapus video yang sedang diputar dari hasil
                    .slice(0, 5); // Ambil 5 teratas

                if (relatedItems.length > 0) {
                    relatedVideosContainer.innerHTML = ''; // Kosongkan spinner
                    relatedItems.forEach(video => {
                        const snippet = video.snippet;
                        const relatedElement = `
                            <div class="related-video-item" 
                                 data-video-id="${video.id.videoId}" 
                                 data-video-title="${encodeURIComponent(snippet.title)}">
                                <img src="${snippet.thumbnails.default.url}" alt="Thumbnail">
                                <div class="related-video-item-info">
                                    <h6 class="text-dark">${snippet.title}</h6>
                                    <p>${snippet.channelTitle}</p>
                                </div>
                            </div>`;
                        relatedVideosContainer.innerHTML += relatedElement;
                    });
                } else {
                     relatedVideosContainer.innerHTML = '<p class="text-muted text-center small">Tidak ada video terkait.</p>';
                }
            } else {
                 relatedVideosContainer.innerHTML = '<p class="text-muted text-center small">Tidak ada video terkait.</p>';
            }

        } catch (error) {
            relatedVideosContainer.innerHTML = `<p class="text-danger text-center small">Gagal memuat video terkait: ${error.message}</p>`;
        }
    };
    
    const playVideo = (videoId, encodedTitle) => {
        const title = decodeURIComponent(encodedTitle);
        videoModalLabel.textContent = title;
        youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        fetchRelatedVideos(videoId);
        if (!videoModalEl.classList.contains('show')) {
            videoModal.show();
        }
    };

    // --- EVENT LISTENERS (Tidak ada perubahan di sini) ---
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
        if (card) {
            playVideo(card.dataset.videoId, card.dataset.videoTitle);
        }
    });

    relatedVideosContainer.addEventListener('click', e => {
        const item = e.target.closest('.related-video-item');
        if (item) {
            playVideo(item.dataset.videoId, item.dataset.videoTitle);
        }
    });

    videoModalEl.addEventListener('hidden.bs.modal', () => {
        youtubePlayer.src = '';
        relatedVideosContainer.innerHTML = '';
    });

    // --- PEMUATAN AWAL ---
    fetchVideosByCategory();
});
