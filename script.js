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
            // PERBAIKAN: Menambahkan data-title untuk kemudahan akses
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

    // Fungsi dasar untuk fetch ke API YouTube
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

    // Fungsi untuk mencari video berdasarkan kata kunci
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

    // Fungsi untuk mengambil video populer berdasarkan kategori
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

    // --- PERBAIKAN UTAMA ADA DI FUNGSI INI ---
    // Fungsi untuk mengambil dan menampilkan video terkait dengan penanganan kesalahan yang lebih baik
    const fetchRelatedVideos = async (videoId) => {
        relatedVideosContainer.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div></div>';
        try {
            const data = await fetchFromYouTube('search', {
                part: 'snippet', relatedToVideoId: videoId, maxResults: 5, type: 'video'
            });

            // Jika API berhasil tapi tidak ada item, beri pesan
            if (data && data.items && data.items.length > 0) {
                relatedVideosContainer.innerHTML = ''; // Kosongkan spinner
                data.items.forEach(video => {
                    const snippet = video.snippet;
                    // PERBAIKAN: Menambahkan data-title juga di sini
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
        } catch (error) {
            // Jika API gagal, tampilkan pesan kesalahan DI DALAM MODAL
            relatedVideosContainer.innerHTML = `<p class="text-danger text-center small">Gagal memuat video terkait: ${error.message}</p>`;
        }
    };
    
    // --- FUNGSI UNTUK MENGELOLA PEMUTAR VIDEO (Disederhanakan) ---
    const playVideo = (videoId, encodedTitle) => {
        const title = decodeURIComponent(encodedTitle);
        videoModalLabel.textContent = title;
        youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        
        // Panggil fungsi untuk memuat video terkait
        fetchRelatedVideos(videoId);
        
        // Hanya panggil .show() jika modal belum terbuka
        if (!videoModalEl.classList.contains('show')) {
            videoModal.show();
        }
    };

    // --- EVENT LISTENERS ---

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

    // PERBAIKAN: Event listener dibuat lebih sederhana
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
    fetchVideosByCategory(); // Muat video trending saat pertama kali dibuka
});
