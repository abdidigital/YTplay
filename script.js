document.addEventListener('DOMContentLoaded', function () {
    // Inisialisasi Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready();

    // --- KONFIGURASI PENTING ---
    const YOUTUBE_API_KEY = 'GANTI_DENGAN_API_KEY_ANDA';
    // -------------------------

    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('results');
    const loadingSpinner = document.getElementById('loading');
    
    // Inisialisasi Modal Bootstrap
    const videoModalEl = document.getElementById('videoModal');
    const videoModal = new bootstrap.Modal(videoModalEl);
    const youtubePlayer = document.getElementById('youtubePlayer');
    const videoModalLabel = document.getElementById('videoModalLabel');

    // Fungsi untuk melakukan pencarian
    const performSearch = async () => {
        const query = searchInput.value.trim();
        if (!query) {
            resultsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Silakan masukkan kata kunci pencarian.</p></div>';
            return;
        }

        if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'GANTI_DENGAN_API_KEY_ANDA') {
            resultsContainer.innerHTML = '<div class="alert alert-danger" role="alert"><strong>Kesalahan:</strong> API Key YouTube belum diatur. Silakan edit file script.js.</div>';
            return;
        }
        
        loadingSpinner.classList.remove('d-none');
        resultsContainer.innerHTML = '';

        const maxResults = 12;
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&type=video&key=${YOUTUBE_API_KEY}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error ${response.status}: ${errorData.error.message}`);
            }
            const data = await response.json();
            displayResults(data.items);
        } catch (error) {
            console.error('Error fetching YouTube data:', error);
            resultsContainer.innerHTML = `<div class="alert alert-danger" role="alert"><strong>Gagal mengambil data:</strong> ${error.message}</div>`;
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    };

    // Fungsi untuk menampilkan hasil
    const displayResults = (videos) => {
        if (videos.length === 0) {
            resultsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Video tidak ditemukan.</p></div>';
            return;
        }

        videos.forEach(video => {
            const videoId = video.id.videoId;
            const title = video.snippet.title;
            const channelTitle = video.snippet.channelTitle;
            const thumbnailUrl = video.snippet.thumbnails.high.url;

            // Perhatikan: tag <a> dihapus, diganti dengan data-* attribute dan class
            const videoElement = `
                <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                    <div class="card video-card h-100 shadow-sm" 
                         data-video-id="${videoId}" 
                         data-video-title="${encodeURIComponent(title)}"
                         style="cursor: pointer;">
                        <img src="${thumbnailUrl}" class="card-img-top" alt="Thumbnail ${title}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title text-dark">${title}</h5>
                            <p class="card-text mt-auto"><i class="bi bi-person-video"></i> ${channelTitle}</p>
                        </div>
                    </div>
                </div>
            `;
            resultsContainer.innerHTML += videoElement;
        });
    };
    
    // Event listener untuk memutar video saat kartu diklik
    resultsContainer.addEventListener('click', (event) => {
        const card = event.target.closest('.video-card');
        if (card) {
            const videoId = card.dataset.videoId;
            const videoTitle = decodeURIComponent(card.dataset.videoTitle);
            
            // Atur judul modal dan sumber video, lalu tampilkan modal
            videoModalLabel.textContent = videoTitle;
            youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
            videoModal.show();
        }
    });

    // Event listener untuk menghentikan video saat modal ditutup
    videoModalEl.addEventListener('hidden.bs.modal', () => {
        youtubePlayer.src = ''; // Hentikan pemutaran video
    });
    
    // Tambahkan event listener untuk tombol dan input
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    
    // Memberikan warna tema dari Telegram ke UI
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor);
});
