document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram.WebApp;
    tg.ready();

    const YOUTUBE_API_KEY = 'AIzaSyAkgcQAn-vxpxp2UoPZ2zQLKwfVNLWRtl0'; 

    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('results');
    const loadingSpinner = document.getElementById('loading');
    const categoryContainer = document.getElementById('categoryContainer');
    const resultsCategoryTitle = document.getElementById('resultsCategoryTitle');
    const resultsCategoryHr = document.getElementById('resultsCategoryHr');

    const videoModalEl = document.getElementById('videoModal');
    const videoModal = new bootstrap.Modal(videoModalEl);
    const youtubeIframe = document.getElementById('youtubePlayer'); 
    const videoModalLabel = document.getElementById('videoModalLabel');

    let youtubePlayerAPI; 
    let currentVideoPlaylist = []; 
    let currentVideoIndex = -1; 

    window.onYouTubeIframeAPIReady = function() {
        console.log('YouTube IFrame Player API is ready.');
        youtubePlayerAPI = new YT.Player('youtubePlayer', {
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
    };

    function onPlayerReady(event) {
        console.log('YouTube Player siap dan dapat dikendalikan.');
    }

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            console.log('Video selesai. Mencoba memutar video selanjutnya...');
            playNextVideoInPlaylist();
        }
    }

    function onPlayerError(event) {
        console.error('YouTube Player Error:', event.data);
        let errorMessage = 'Terjadi kesalahan saat memutar video.';
        if (event.data === 100 || event.data === 101 || event.data === 150) {
            errorMessage = 'Video tidak dapat diputar atau dibatasi.';
        } else if (event.data === 2) {
            errorMessage = 'ID video tidak valid.';
        }
        alert(errorMessage + ' Silakan coba video lain.');
        videoModal.hide();
    }

    const playVideoInModal = (videoId, title, playlist = [], startIndex = -1) => {
        videoModalLabel.textContent = title;
        currentVideoPlaylist = playlist; 
        currentVideoIndex = startIndex; 

        if (youtubePlayerAPI && typeof youtubePlayerAPI.loadVideoById === 'function') {
            console.log('Memuat video dengan YouTube Player API:', videoId);
            youtubePlayerAPI.loadVideoById(videoId);
        } else {
            youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`;
            console.warn('YouTube Player API belum siap atau gagal. Memuat video langsung ke iframe.');
        }
        videoModal.show();
    };

    const playNextVideoInPlaylist = () => {
        if (currentVideoPlaylist.length > 0 && currentVideoIndex < currentVideoPlaylist.length - 1) {
            currentVideoIndex++;
            const nextVideo = currentVideoPlaylist[currentVideoIndex];
            // ID video dijamin ada di nextVideo.id.videoId karena sudah di-map sebelumnya
            const nextVideoId = nextVideo.id.videoId; 
            const nextVideoTitle = nextVideo.snippet.title;

            console.log(`Memutar video selanjutnya: ${nextVideoTitle} (ID: ${nextVideoId})`);
            playVideoInModal(nextVideoId, nextVideoTitle, currentVideoPlaylist, currentVideoIndex);
        } else {
            console.log('Playlist habis atau tidak ada video selanjutnya. Menutup modal.');
            videoModal.hide();
        }
    };

    const performSearch = async () => {
        const query = searchInput.value.trim();
        if (!query) {
            resultsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Silakan masukkan kata kunci pencarian.</p></div>';
            return;
        }

        if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
            resultsContainer.innerHTML = '<div class="alert alert-danger" role="alert"><strong>Kesalahan:</strong> API Key YouTube belum diatur. Silakan edit file script.js.</div>';
            return;
        }
        
        loadingSpinner.classList.remove('d-none');
        resultsContainer.innerHTML = '';
        resultsCategoryTitle.classList.add('d-none');
        resultsCategoryHr.classList.add('d-none');

        const maxResults = 12;
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&type=video&key=${YOUTUBE_API_KEY}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error ${response.status}: ${errorData.error.message}`);
            }
            const data = await response.json();
            
            // --- PERBAIKAN: Map items agar id.videoId selalu ada ---
            currentVideoPlaylist = data.items.map(item => ({
                id: { videoId: item.id.videoId || item.id }, // Pastikan id.videoId selalu ada
                snippet: item.snippet,
            }));
            console.log('Playlist setelah pencarian:', currentVideoPlaylist);

            displayResults(data.items, `Hasil Pencarian: "${query}"`);
        } catch (error) {
            console.error('Error fetching Youtube data:', error);
            resultsContainer.innerHTML = `<div class="alert alert-danger" role="alert"><strong>Gagal mengambil data:</strong> ${error.message}</div>`;
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    };

    const displayResults = (videos, title = 'Video') => {
        if (videos.length === 0) {
            resultsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Video tidak ditemukan.</p></div>';
            return;
        }

        resultsContainer.innerHTML = '';
        resultsCategoryTitle.textContent = title;
        resultsCategoryTitle.classList.remove('d-none');
        resultsCategoryHr.classList.remove('d-none');

        videos.forEach((video, index) => { 
            const videoId = video.id.videoId || video.id; 
            const videoTitle = video.snippet.title;
            const channelTitle = video.snippet.channelTitle;
            const thumbnailUrl = video.snippet.thumbnails.high.url;

            const videoElement = `
                <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                    <div class="card video-card h-100 shadow-sm border-0 rounded-3" 
                         data-video-id="${videoId}" 
                         data-video-title="${encodeURIComponent(videoTitle)}"
                         data-video-index="${index}"  
                         style="cursor: pointer;">
                        <img src="${thumbnailUrl}" class="card-img-top rounded-top-3" alt="Thumbnail ${videoTitle}">
                        <div class="card-body d-flex flex-column">
                            <h6 class="card-title text-dark mb-2 text-truncate" title="${videoTitle}">${videoTitle}</h6>
                            <p class="card-text text-muted small mt-auto mb-2">
                                <i class="bi bi-person-circle me-1"></i> ${channelTitle}
                            </p>
                            <div class="d-grid gap-2">
                                <button class="btn btn-danger btn-sm play-button" type="button" data-video-id="${videoId}" data-index="${index}">
                                    <i class="bi bi-play-circle me-1"></i> Putar Video
                                </button>
                                <button class="btn btn-outline-primary btn-sm download-btn" type="button" data-video-id="${videoId}" data-video-title="${encodeURIComponent(videoTitle)}">
                                    <i class="bi bi-cloud-arrow-down me-1"></i> Unduh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            resultsContainer.innerHTML += videoElement;
        });
        
        document.querySelectorAll('.download-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const videoId = button.dataset.videoId;
                const videoTitle = decodeURIComponent(button.dataset.videoTitle);
                alert(`Mengunduh "${videoTitle}"... Fitur unduh sedang diproses di server!`);
            });
        });
    };
    
    resultsContainer.addEventListener('click', (event) => {
        const card = event.target.closest('.video-card');
        if (card) {
            const videoId = card.dataset.videoId;
            const videoTitle = decodeURIComponent(card.dataset.videoTitle);
            const videoIndex = parseInt(card.dataset.videoIndex); 
            
            // Menggunakan currentVideoPlaylist yang sudah di-map dan dijamin konsisten
            playVideoInModal(videoId, videoTitle, currentVideoPlaylist, videoIndex);
        }
    });

    videoModalEl.addEventListener('hidden.bs.modal', () => {
        if (youtubePlayerAPI && typeof youtubePlayerAPI.stopVideo === 'function') {
            youtubePlayerAPI.stopVideo();
            console.log('Video dihentikan.');
        }
        youtubeIframe.src = ''; 
    });
    
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    
    const DEFAULT_CATEGORIES = [
        { id: '10', name: 'Musik' },
        { id: '17', name: 'Olahraga' },
        { id: '20', name: 'Gaming' },
        { id: '24', name: 'Hiburan' },
        { id: '26', name: 'Gaya & Tutorial' }
    ];

    const displayDefaultCategoryVideos = async (categoryId = null, categoryName = 'Video Populer') => {
        loadingSpinner.classList.remove('d-none');
        resultsContainer.innerHTML = ''; 
        resultsCategoryTitle.classList.add('d-none');
        resultsCategoryHr.classList.add('d-none');

        let apiUrl;
        if (categoryId) {
            apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=ID&videoCategoryId=${categoryId}&maxResults=12&key=${YOUTUBE_API_KEY}`;
        } else {
            apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=ID&maxResults=12&key=${YOUTUBE_API_KEY}`;
        }

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error ${response.status}: ${errorData.error.message}`);
            }
            const data = await response.json();
            
            // --- PERBAIKAN: Map items agar id.videoId selalu ada ---
            currentVideoPlaylist = data.items.map(item => ({
                id: { videoId: item.id.videoId || item.id }, // Pastikan id.videoId selalu ada
                snippet: item.snippet,
            }));
            console.log('Playlist setelah memuat kategori:', currentVideoPlaylist);

            displayResults(data.items, categoryName);
        } catch (error) {
            console.error('Error fetching default videos:', error);
            resultsContainer.innerHTML = `<div class="alert alert-danger" role="alert"><strong>Gagal memuat video:</strong> ${error.message}</div>`;
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    };

    const displayCategories = () => {
        categoryContainer.innerHTML = '';
        
        DEFAULT_CATEGORIES.forEach(cat => {
            const button = document.createElement('button');
            button.className = 'btn btn-outline-danger btn-sm category-btn rounded-pill px-3';
            button.innerHTML = `<i class="bi bi-tag-fill me-1"></i> ${cat.name}`;
            button.dataset.categoryId = cat.id;
            button.dataset.categoryName = cat.name;
            categoryContainer.appendChild(button);
        });
        
        categoryContainer.addEventListener('click', (event) => {
            const btn = event.target.closest('.category-btn');
            if (btn) {
                const categoryId = btn.dataset.categoryId;
                const categoryName = btn.dataset.categoryName;
                displayDefaultCategoryVideos(categoryId, categoryName);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    };

    displayCategories();
    displayDefaultCategoryVideos(); 
    
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor);
    document.documentElement.style.setProperty('--tg-theme-hint-color', tg.hintColor);
    document.documentElement.style.setProperty('--tg-theme-link-color', tg.linkColor);
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.buttonColor);
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.buttonTextColor);


    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api"; 
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});
