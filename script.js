document.addEventListener('DOMContentLoaded', function () {
    // Inisialisasi Telegram Web App
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

    // Inisialisasi Modal Bootstrap
    const videoModalEl = document.getElementById('videoModal');
    const videoModal = new bootstrap.Modal(videoModalEl);
    const youtubeIframe = document.getElementById('youtubePlayer'); 
    const videoModalLabel = document.getElementById('videoModalLabel');

    // --- Variabel Global untuk Autoplay ---
    let youtubePlayerAPI; // Objek player dari YouTube IFrame Player API
    let currentVideoPlaylist = []; // Akan menyimpan daftar video yang sedang diputar (misal: hasil pencarian)
    let currentVideoIndex = -1; // Indeks video yang sedang diputar dalam playlist

    // --- YouTube IFrame Player API Functions ---

    // Fungsi ini akan dipanggil otomatis oleh YouTube API ketika JavaScript API siap
    window.onYouTubeIframeAPIReady = function() {
        console.log('YouTube IFrame Player API is ready.');
        youtubePlayerAPI = new YT.Player('youtubePlayer', {
            // Memastikan `enablejsapi=1` ada di URL src awal iframe Anda jika Anda set manual
            // Tetapi dengan YT.Player ini akan diurus
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError // Tambahkan event onError untuk debugging
            }
        });
    };

    function onPlayerReady(event) {
        console.log('YouTube Player siap dan dapat dikendalikan.');
        // Jika Anda ingin memutar video pertama secara otomatis saat player siap
        // Ini mungkin hanya relevan jika modal sudah terbuka dan player siap setelahnya
        // if (currentVideoPlaylist.length > 0 && currentVideoIndex !== -1) {
        //     event.target.loadVideoById(currentVideoPlaylist[currentVideoIndex].id.videoId || currentVideoPlaylist[currentVideoIndex].id);
        // }
    }

    function onPlayerStateChange(event) {
        // YT.PlayerState.ENDED adalah 0
        if (event.data === YT.PlayerState.ENDED) {
            console.log('Video selesai. Mencoba memutar video selanjutnya...');
            playNextVideoInPlaylist();
        }
        // Untuk debugging, Anda bisa log status lain juga
        // console.log('Player state changed to:', event.data);
    }

    function onPlayerError(event) {
        // YT Player API error codes:
        // 2: Invalid parameter (e.g., video ID not found, wrong format)
        // 5: HTML5 player error
        // 100: Video not found
        // 101: Video not embeddable on this site (due to video owner restrictions)
        // 150: Same as 101
        console.error('YouTube Player Error:', event.data);
        let errorMessage = 'Terjadi kesalahan saat memutar video.';
        if (event.data === 100 || event.data === 101 || event.data === 150) {
            errorMessage = 'Video tidak dapat diputar atau dibatasi.';
        } else if (event.data === 2) {
            errorMessage = 'ID video tidak valid.';
        }
        alert(errorMessage + ' Silakan coba video lain.');
        videoModal.hide(); // Sembunyikan modal jika ada error fatal
    }


    // --- Fungsi untuk memutar video di modal ---
    const playVideoInModal = (videoId, title, playlist = [], startIndex = -1) => {
        videoModalLabel.textContent = title;
        currentVideoPlaylist = playlist; // Simpan playlist untuk autoplay
        currentVideoIndex = startIndex; // Simpan indeks video yang sedang diputar

        if (youtubePlayerAPI && typeof youtubePlayerAPI.loadVideoById === 'function') {
            console.log('Memuat video dengan YouTube Player API:', videoId);
            youtubePlayerAPI.loadVideoById(videoId);
        } else {
            // Fallback jika API belum siap atau gagal, mungkin karena masalah timing.
            // Ini akan mencoba memuat langsung ke iframe.
            // URL embed YouTube yang benar: youtube.com/embed/VIDEO_ID
            youtubeIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`;
            console.warn('YouTube Player API belum siap atau gagal. Memuat video langsung ke iframe.');
        }
        videoModal.show();
    };

    // --- Fungsi untuk memutar video selanjutnya dalam playlist ---
    const playNextVideoInPlaylist = () => {
        if (currentVideoPlaylist.length > 0 && currentVideoIndex < currentVideoPlaylist.length - 1) {
            currentVideoIndex++; // Maju ke video berikutnya
            const nextVideo = currentVideoPlaylist[currentVideoIndex];
            const nextVideoId = nextVideo.id.videoId || nextVideo.id; // Konsistensi ID
            const nextVideoTitle = nextVideo.snippet.title;

            console.log(`Memutar video selanjutnya: ${nextVideoTitle} (ID: ${nextVideoId})`);
            playVideoInModal(nextVideoId, nextVideoTitle, currentVideoPlaylist, currentVideoIndex);
        } else {
            console.log('Playlist habis atau tidak ada video selanjutnya. Menutup modal.');
            // Opsional: Anda bisa menambahkan logika di sini untuk:
            // 1. Memuat video random dari kategori default
            // 2. Mencari video rekomendasi berdasarkan video terakhir yang diputar
            videoModal.hide(); // Tutup modal jika tidak ada video selanjutnya
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
            // Data dari search API sudah memiliki id.videoId, tidak perlu diubah lagi
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
            // Pastikan videoId diambil dengan benar dari kedua jenis API responses
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
            
            // Perlu menyimpan data 'items' yang sebenarnya dari respons API
            // agar playlist untuk autoplay konsisten dan lengkap.
            // Solusi terbaik adalah menyimpan `data.items` dari performSearch/displayDefaultCategoryVideos
            // ke variabel global dan menggunakannya di sini.
            // Untuk sementara, kita ambil dari DOM, tapi ini kurang efisien dan tidak lengkap.
            // ASUMSI: `currentVideoPlaylist` sudah diisi dengan data lengkap dari API saat
            // `displayResults` dipanggil terakhir kali.
            // Jika Anda ingin autoplay berfungsi dengan baik, pastikan `currentVideoPlaylist` 
            // selalu berisi objek video lengkap (dengan id dan snippet) dari API.
            
            // Karena `displayResults` sudah menerima `videos` array,
            // dan `playVideoInModal` menyimpan `playlist`, kita tidak perlu me-parse DOM lagi di sini.
            // Cukup panggil `playVideoInModal` dengan `currentVideoPlaylist` yang sudah ada.
            playVideoInModal(videoId, videoTitle, currentVideoPlaylist, videoIndex);
        }
    });

    // Event listener untuk menghentikan video saat modal ditutup
    videoModalEl.addEventListener('hidden.bs.modal', () => {
        if (youtubePlayerAPI && typeof youtubePlayerAPI.stopVideo === 'function') {
            youtubePlayerAPI.stopVideo(); // Hentikan video menggunakan API
            console.log('Video dihentikan.');
        }
        youtubeIframe.src = ''; // Bersihkan src iframe (fallback, tidak terlalu perlu jika API bekerja)
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
            apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=ID&maxResults=12&key=${YOUTUBE_API_KEY}`;
        }

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error ${response.status}: ${errorData.error.message}`);
            }
            const data = await response.json();
            
            // Penting: Simpan data.items ini ke currentVideoPlaylist sebelum memanggil displayResults
            // agar autoplay bisa menggunakan data lengkap ini.
            currentVideoPlaylist = data.items; // Simpan objek video lengkap

            // Pastikan displayResults menerima format video yang konsisten
            displayResults(data.items, categoryName);

        } catch (error) {
            console.error('Error fetching default videos:', error);
            resultsContainer.innerHTML = `<div class="alert alert-danger" role="alert"><strong>Gagal memuat video:</strong> ${error.message}</div>`;
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    };

    // Tampilkan kategori yang bisa diklik
    const displayCategories = () => {
        categoryContainer.innerHTML = ''; // Bersihkan container kategori
        
        DEFAULT_CATEGORIES.forEach(cat => {
            const button = document.createElement('button');
            button.className = 'btn btn-outline-danger btn-sm category-btn rounded-pill px-3';
            button.innerHTML = `<i class="bi bi-tag-fill me-1"></i> ${cat.name}`;
            button.dataset.categoryId = cat.id;
            button.dataset.categoryName = cat.name;
            categoryContainer.appendChild(button);
        });
        
        // Event listener untuk tombol kategori
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

    // --- Panggil fungsi untuk menampilkan kategori dan video default saat DOM siap ---
    displayCategories();
    displayDefaultCategoryVideos(); 
    
    // Memberikan warna tema dari Telegram ke UI
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor);
    document.documentElement.style.setProperty('--tg-theme-hint-color', tg.hintColor);
    document.documentElement.style.setProperty('--tg-theme-link-color', tg.linkColor);
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.buttonColor);
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.buttonTextColor);


    // --- Muat YouTube IFrame Player API secara asinkron ---
    // Pastikan ini dimuat setelah semua elemen DOM sudah ada
    const tag = document.createElement('script');
    // PASTIKAN URL INI BENAR:
    tag.src = "https://www.youtube.com/iframe_api"; 
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});
