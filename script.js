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
    const categoryContainer = document.getElementById('categoryContainer'); // Container untuk kategori
    const resultsCategoryTitle = document.getElementById('resultsCategoryTitle'); // Judul kategori hasil
    const resultsCategoryHr = document.getElementById('resultsCategoryHr'); // HR untuk judul kategori

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
        youtubePlayerAPI = new YT.Player('youtubePlayer', {
            // Ini adalah parameter untuk iframe, biarkan kosong karena src akan diatur manual
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    };

    function onPlayerReady(event) {
        console.log('YouTube Player API siap.');
    }

    function onPlayerStateChange(event) {
        // YT.PlayerState.ENDED adalah 0
        if (event.data === YT.PlayerState.ENDED) {
            console.log('Video selesai. Mencoba memutar video selanjutnya...');
            playNextVideoInPlaylist();
        }
    }

    // --- Fungsi untuk memutar video di modal ---
    const playVideoInModal = (videoId, title, playlist = [], startIndex = -1) => {
        videoModalLabel.textContent = title;
        currentVideoPlaylist = playlist; // Simpan playlist untuk autoplay
        currentVideoIndex = startIndex; // Simpan indeks video yang sedang diputar

        if (youtubePlayerAPI && youtubePlayerAPI.loadVideoById) {
            // Gunakan API untuk memuat video agar event onStateChange bekerja
            // Parameter `autoplay=1` ditambahkan otomatis oleh API saat loadVideoById
            youtubePlayerAPI.loadVideoById(videoId);
        } else {
            // Fallback jika API belum siap (jarang terjadi jika dimuat dengan benar)
            youtubeIframe.src = `http://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`;
        }
        videoModal.show();
    };

    // --- Fungsi untuk memutar video selanjutnya dalam playlist ---
    const playNextVideoInPlaylist = () => {
        if (currentVideoPlaylist.length > 0 && currentVideoIndex < currentVideoPlaylist.length - 1) {
            currentVideoIndex++; // Maju ke video berikutnya
            const nextVideo = currentVideoPlaylist[currentVideoIndex];
            console.log(`Memutar video selanjutnya: ${nextVideo.snippet.title}`);
            playVideoInModal(nextVideo.id.videoId, nextVideo.snippet.title, currentVideoPlaylist, currentVideoIndex);
        } else {
            console.log('Playlist habis atau tidak ada video selanjutnya.');
            // Opsional: Anda bisa menambahkan logika di sini untuk:
            // 1. Memuat video random dari kategori default
            // 2. Mencari video rekomendasi berdasarkan video terakhir yang diputar
            // 3. Menampilkan pesan bahwa tidak ada video selanjutnya dan menutup modal
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
        resultsContainer.innerHTML = ''; // Bersihkan hasil sebelumnya
        resultsCategoryTitle.classList.add('d-none'); // Sembunyikan judul kategori
        resultsCategoryHr.classList.add('d-none'); // Sembunyikan hr kategori

        const maxResults = 12;
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&type=video&key=${YOUTUBE_API_KEY}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error ${response.status}: ${errorData.error.message}`);
            }
            const data = await response.json();
            displayResults(data.items, `Hasil Pencarian: "${query}"`);
        } catch (error) {
            console.error('Error fetching YouTube data:', error);
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

        resultsContainer.innerHTML = ''; // Pastikan container bersih sebelum menambah hasil baru
        resultsCategoryTitle.textContent = title;
        resultsCategoryTitle.classList.remove('d-none');
        resultsCategoryHr.classList.remove('d-none');

        videos.forEach((video, index) => { 
            // Pastikan struktur ID video konsisten, dari search API id.videoId, dari videos API id
            const videoId = video.id.videoId || video.id; 
            const title = video.snippet.title;
            const channelTitle = video.snippet.channelTitle;
            const thumbnailUrl = video.snippet.thumbnails.high.url;

            const videoElement = `
                <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                    <div class="card video-card h-100 shadow-sm border-0 rounded-3" 
                         data-video-id="${videoId}" 
                         data-video-title="${encodeURIComponent(title)}"
                         data-video-index="${index}"  
                         style="cursor: pointer;">
                        <img src="${thumbnailUrl}" class="card-img-top rounded-top-3" alt="Thumbnail ${title}">
                        <div class="card-body d-flex flex-column">
                            <h6 class="card-title text-dark mb-2 text-truncate" title="${title}">${title}</h6>
                            <p class="card-text text-muted small mt-auto mb-2">
                                <i class="bi bi-person-circle me-1"></i> ${channelTitle}
                            </p>
                            <div class="d-grid gap-2">
                                <button class="btn btn-danger btn-sm play-button" type="button" data-video-id="${videoId}" data-index="${index}">
                                    <i class="bi bi-play-circle me-1"></i> Putar Video
                                </button>
                                <button class="btn btn-outline-primary btn-sm download-btn" type="button" data-video-id="${videoId}" data-video-title="${encodeURIComponent(title)}">
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
                
                // --- Logika Unduh (Membutuhkan Backend Server) ---
                // Anda HARUS memiliki backend server untuk mengunduh video YouTube.
                // Frontend hanya akan mengirim permintaan ke backend.
                alert(`Mengunduh "${videoTitle}"... Fitur unduh sedang diproses di server!`);
                
                // Contoh: Mengirim data ke bot Telegram untuk diproses di backend
                // tg.sendData(JSON.stringify({ type: 'download', videoId: videoId, title: videoTitle }));
                
                // Atau, jika backend Anda menyediakan URL download langsung:
                // window.open(`/download?videoId=${videoId}`, '_blank');
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
            
            // Mengambil data video yang ditampilkan saat ini untuk playlist
            // Ini mungkin tidak ideal jika ada banyak video, pertimbangkan untuk menyimpan 'items' dari API
            // langsung di variabel global setelah displayResults
            const currentVideosData = Array.from(resultsContainer.children).map(col => {
                const cardEl = col.querySelector('.video-card');
                return {
                    id: { videoId: cardEl.dataset.videoId },
                    snippet: { title: decodeURIComponent(cardEl.dataset.videoTitle), 
                               thumbnails: { high: { url: cardEl.querySelector('img').src } }
                             }
                };
            });

            playVideoInModal(videoId, videoTitle, currentVideosData, videoIndex);
        }
    });

    // Event listener untuk menghentikan video saat modal ditutup
    videoModalEl.addEventListener('hidden.bs.modal', () => {
        if (youtubePlayerAPI && youtubePlayerAPI.stopVideo) {
            youtubePlayerAPI.stopVideo(); // Hentikan video menggunakan API
        }
        youtubeIframe.src = ''; // Bersihkan src iframe (fallback)
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
        resultsCategoryTitle.classList.add('d-none'); // Sembunyikan judul kategori awal
        resultsCategoryHr.classList.add('d-none'); // Sembunyikan hr kategori awal


        let apiUrl;
        if (categoryId) {
            // Mencari video populer berdasarkan kategori
            apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=ID&videoCategoryId=${categoryId}&maxResults=12&key=${YOUTUBE_API_KEY}`;
        } else {
            // Mencari video paling populer secara umum sebagai default awal
            apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=ID&maxResults=12&key=${YOUTUBE_API_KEY}`;
        }

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error ${response.status}: ${errorData.error.message}`);
            }
            const data = await response.json();
            
            // Format ulang data agar konsisten dengan displayResults
            const formattedVideos = data.items.map(item => ({
                id: { videoId: item.id }, // Mengatur agar konsisten dengan `id.videoId`
                snippet: {
                    title: item.snippet.title,
                    channelTitle: item.snippet.channelTitle,
                    thumbnails: { high: { url: item.snippet.thumbnails.high.url } }
                }
            }));
            displayResults(formattedVideos, categoryName);

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
                // Gulir ke atas untuk melihat hasil
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    };

    // --- Panggil fungsi untuk menampilkan kategori dan video default saat DOM siap ---
    displayCategories();
    displayDefaultCategoryVideos(); // Tampilkan video populer secara umum sebagai default awal
    
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
    tag.src = "https://www.youtube.com/iframe_api"; // URL resmi YouTube IFrame API
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});
