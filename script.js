document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram.WebApp;
    tg.ready();

    // --- KONFIGURASI PENTING ---
    // Peringatan: Menempatkan API Key di frontend kurang aman untuk aplikasi produksi.
    // Pertimbangkan untuk menggunakan backend server untuk memanggil YouTube API.
    const YOUTUBE_API_KEY = 'AIzaSyAkgcQAn-vxpxp2UoPZ2zQLKwfVNLWRtl0'; 
    // -------------------------

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

    // Elemen untuk Video Terkait
    const relatedVideosContainer = document.getElementById('relatedVideosContainer');
    const relatedVideosLoading = document.getElementById('relatedVideosLoading');
    const relatedArtistName = document.getElementById('relatedArtistName');

    let youtubePlayerAPI; 
    let currentVideoPlaylist = []; // INI PENTING: Akan menyimpan data items lengkap dari API
    let currentVideoIndex = -1; 

    // --- YouTube IFrame Player API Functions ---

    // Fungsi ini akan dipanggil otomatis oleh YouTube API ketika JavaScript API siap
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
        // YT.PlayerState.ENDED adalah 0
        if (event.data === YT.PlayerState.ENDED) {
            console.log('Video selesai. Mencoba memutar video selanjutnya...');
            playNextVideoInPlaylist();
        }
        // Untuk debugging, Anda bisa log status lain juga
        console.log('Player state changed to:', event.data);
    }

    function onPlayerError(event) {
        console.error('YouTube Player Error:', event.data);
        let errorMessage = 'Terjadi kesalahan saat memutar video.';
        if (event.data === 100 || event.data === 101 || event.data === 150) {
            errorMessage = 'Video tidak dapat diputar atau dibatasi oleh pemilik.';
        } else if (event.data === 2) {
            errorMessage = 'ID video tidak valid atau parameter salah.';
        } else if (event.data === 5) {
            errorMessage = 'Terjadi kesalahan pada pemutar HTML5.';
        }
        alert(errorMessage + ' Silakan coba video lain.');
        videoModal.hide(); // Sembunyikan modal jika ada error fatal
    }

    // --- Fungsi untuk memutar video di modal ---
    // Tambahkan channelTitle sebagai parameter
    const playVideoInModal = (videoId, title, playlist = [], startIndex = -1, channelTitle = '') => { 
        console.log('playVideoInModal dipanggil. Video ID:', videoId, 'Channel Title:', channelTitle);
        videoModalLabel.textContent = title;
        currentVideoPlaylist = playlist; // Pastikan playlist di-update
        currentVideoIndex = startIndex; // Pastikan indeks di-update

        if (youtubePlayerAPI && typeof youtubePlayerAPI.loadVideoById === 'function') {
            youtubePlayerAPI.loadVideoById(videoId);
        } else {
            // Fallback jika API belum siap atau gagal
            youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`;
            console.warn('YouTube Player API belum siap atau gagal. Memuat video langsung ke iframe.');
        }
        videoModal.show();

        // --- Panggil fungsi untuk mengambil video terkait ---
        if (channelTitle) {
            fetchAndDisplayRelatedVideos(channelTitle, videoId); // Pass videoId juga untuk opsi fallback
        } else {
            // Bersihkan atau sembunyikan area related videos jika tidak ada channelTitle
            relatedVideosContainer.innerHTML = '<div class="col-12 text-center text-muted small">Nama artis tidak tersedia untuk video terkait.</div>';
            relatedArtistName.textContent = 'Artis Ini';
            relatedVideosLoading.classList.add('d-none');
        }
    };

    // --- Fungsi untuk memutar video selanjutnya dalam playlist ---
    const playNextVideoInPlaylist = () => {
        console.log('playNextVideoInPlaylist called. Current playlist length:', currentVideoPlaylist.length, 'Current index:', currentVideoIndex);
        if (currentVideoPlaylist.length > 0 && currentVideoIndex < currentVideoPlaylist.length - 1) {
            currentVideoIndex++; // Maju ke video berikutnya
            const nextVideo = currentVideoPlaylist[currentVideoIndex];
            // ID video dijamin ada di nextVideo.id.videoId karena sudah di-map sebelumnya
            const nextVideoId = nextVideo.id.videoId; 
            const nextVideoTitle = nextVideo.snippet.title;
            const nextChannelTitle = nextVideo.snippet.channelTitle;

            console.log(`Memutar video selanjutnya: ${nextVideoTitle} (ID: ${nextVideoId}) dari ${nextChannelTitle}`);
            playVideoInModal(nextVideoId, nextVideoTitle, currentVideoPlaylist, currentVideoIndex, nextChannelTitle);
        } else {
            console.log('Playlist habis atau tidak ada video selanjutnya. Menutup modal.');
            videoModal.hide(); // Tutup modal jika tidak ada video selanjutnya
        }
    };

    // --- Fungsi Baru: Mengambil dan Menampilkan Video Terkait ---
    const fetchAndDisplayRelatedVideos = async (channelTitle, currentVideoId) => {
        console.log('fetchAndDisplayRelatedVideos dipanggil untuk channel:', channelTitle, 'atau terkait dengan ID:', currentVideoId);
        relatedVideosContainer.innerHTML = ''; // Bersihkan hasil sebelumnya
        relatedVideosLoading.classList.remove('d-none'); // Tampilkan spinner
        relatedArtistName.textContent = channelTitle || 'Artis Ini'; // Set nama artis

        const maxResults = 4; // Tampilkan 4 video terkait
        let apiUrl;

        // Strategi utama: Cari video lain dari channel/artis yang sama
        if (channelTitle) {
            apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelTitle)}&maxResults=${maxResults}&type=video&key=${YOUTUBE_API_KEY}`;
        } else if (currentVideoId) {
            // Fallback Strategi: Cari video terkait langsung dengan video ID (jika channelTitle tidak ada)
            apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${currentVideoId}&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
        } else {
            relatedVideosContainer.innerHTML = '<div class="col-12 text-center text-muted small">Tidak cukup informasi untuk mencari video terkait.</div>';
            relatedVideosLoading.classList.add('d-none');
            return;
        }

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error ${response.status}: ${errorData.error.message}`);
            }
            const data = await response.json();
            console.log('Respons API Video Terkait:', data); // Untuk debugging

            relatedVideosLoading.classList.add('d-none'); // Sembunyikan spinner

            if (data.items.length === 0) {
                relatedVideosContainer.innerHTML = '<div class="col-12 text-center text-muted small">Tidak ditemukan video lain dari artis ini.</div>';
                return;
            }

            // Filter video yang sama dengan yang sedang diputar (jika ada)
            const filteredItems = data.items.filter(item => {
                const id = item.id.videoId || item.id;
                return id !== currentVideoId;
            });

            if (filteredItems.length === 0) {
                relatedVideosContainer.innerHTML = '<div class="col-12 text-center text-muted small">Tidak ditemukan video terkait yang unik.</div>';
                return;
            }

            filteredItems.slice(0, maxResults).forEach(video => { // Pastikan hanya menampilkan maxResults
                const videoId = video.id.videoId || video.id;
                const title = video.snippet.title;
                const thumbnailUrl = video.snippet.thumbnails.medium.url; 
                const channel = video.snippet.channelTitle;

                const relatedVideoElement = `
                    <div class="col-lg-3 col-md-6 col-sm-12 mb-3">
                        <div class="card h-100 shadow-sm border-0 rounded-3 related-video-card" 
                             data-video-id="${videoId}" 
                             data-video-title="${encodeURIComponent(title)}"
                             data-channel-title="${encodeURIComponent(channel)}"
                             style="cursor: pointer;">
                            <img src="${thumbnailUrl}" class="card-img-top rounded-top-3" alt="Thumbnail ${title}">
                            <div class="card-body p-2 d-flex flex-column">
                                <h6 class="card-title text-dark mb-1 text-truncate" title="${title}">${title}</h6>
                                <p class="card-text text-muted small mt-auto mb-0">${channel}</p>
                            </div>
                        </div>
                    </div>
                `;
                relatedVideosContainer.innerHTML += relatedVideoElement;
            });

            // --- Event Listener untuk Video Terkait yang Baru Dimuat ---
            // Delegasi event listener ke container agar lebih efisien
            relatedVideosContainer.querySelectorAll('.related-video-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const clickedVideoId = card.dataset.videoId;
                    const clickedVideoTitle = decodeURIComponent(card.dataset.videoTitle);
                    const clickedChannelTitle = decodeURIComponent(card.dataset.channelTitle);
                    
                    // Putar video terkait di modal yang sama, reset playlist untuk ini
                    playVideoInModal(clickedVideoId, clickedVideoTitle, [], -1, clickedChannelTitle); 
                });
            });

        } catch (error) {
            console.error('Error fetching related videos:', error);
            relatedVideosContainer.innerHTML = '<div class="col-12 text-center text-danger small">Gagal memuat video terkait. Silakan coba lagi.</div>';
            relatedVideosLoading.classList.add('d-none');
        }
    };


    // Fungsi untuk melakukan pencarian
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
            
            // Map items agar id.videoId selalu ada, terlepas dari sumber API (search atau videos)
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

    // Fungsi untuk menampilkan hasil
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
                         data-channel-title="${encodeURIComponent(channelTitle)}" style="cursor: pointer;">
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
        
        // --- Tambahkan Event Listener untuk Tombol Unduh ---
        document.querySelectorAll('.download-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Mencegah event click pada card ikut terpanggil
                const videoId = button.dataset.videoId;
                const videoTitle = decodeURIComponent(button.dataset.videoTitle);
                
                alert(`Mengunduh "${videoTitle}"... Fitur unduh sedang diproses di server!`);
                // Placeholder untuk fungsionalitas unduh (membutuhkan backend)
            });
        });
    };
    
    // Event listener untuk memutar video saat kartu diklik
    resultsContainer.addEventListener('click', (event) => {
        const card = event.target.closest('.video-card');
        if (card) {
            const videoId = card.dataset.videoId;
            const videoTitle = decodeURIComponent(card.dataset.videoTitle);
            const videoIndex = parseInt(card.dataset.videoIndex); 
            
            let channelTitle = '';
            // Ambil channelTitle dari playlist yang sudah di-map dan dijamin konsisten
            if (currentVideoPlaylist[videoIndex] && currentVideoPlaylist[videoIndex].snippet) {
                channelTitle = currentVideoPlaylist[videoIndex].snippet.channelTitle;
            } else {
                // FALLBACK: Coba ambil dari data-channel-title di card jika playlist gagal
                channelTitle = decodeURIComponent(card.dataset.channelTitle || '');
            }

            playVideoInModal(videoId, videoTitle, currentVideoPlaylist, videoIndex, channelTitle); // Pass channelTitle
        }
    });

    // Event listener untuk menghentikan video saat modal ditutup
    videoModalEl.addEventListener('hidden.bs.modal', () => {
        if (youtubePlayerAPI && typeof youtubePlayerAPI.stopVideo === 'function') {
            youtubePlayerAPI.stopVideo(); // Hentikan video menggunakan API
            console.log('Video dihentikan.');
        }
        youtubeIframe.src = ''; // Bersihkan src iframe (fallback, tidak terlalu perlu jika API bekerja)
        // Bersihkan juga area video terkait saat modal ditutup
        relatedVideosContainer.innerHTML = '';
        relatedVideosLoading.classList.add('d-none');
        relatedArtistName.textContent = 'Artis Ini';
    });
    
    // Tambahkan event listener untuk tombol dan input pencarian
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    
    // --- Implementasi Tampilan Default Kategori Random dan Kategori yang Bisa Diklik ---
    const DEFAULT_CATEGORIES = [
        { id: '10', name: 'Musik' },     // Music
        { id: '17', name: 'Olahraga' },   // Sports
        { id: '20', name: 'Gaming' },     // Gaming
        { id: '24', name: 'Hiburan' },   // Entertainment
        { id: '26', name: 'Gaya & Tutorial' }       // Howto & Style
    ];

    const displayDefaultCategoryVideos = async (categoryId = null, categoryName = 'Video Populer') => {
        loadingSpinner.classList.remove('d-none');
        resultsContainer.innerHTML = ''; 
        resultsCategoryTitle.classList.add('d-none');
        resultsCategoryHr.classList.add('d-none');

        let apiUrl;
        // Gunakan endpoint 'videos' untuk chart=mostPopular (lebih baik untuk kategori)
        // Dan endpoint 'search' untuk query pencarian.
        if (categoryId) {
            apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=ID&videoCategoryId=${categoryId}&maxResults=12&key=${YOUTUBE_API_KEY}`;
        } else {
            // Tampilkan video paling populer secara umum sebagai default awal
            apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCod
