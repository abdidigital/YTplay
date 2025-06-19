const API_KEY = 'AIzaSyBXEhmJ_a91vXpSiSnkRpi6_WbVTL2Vz0A'; // Ganti dengan API key Anda
let nextPageToken = '';
let currentQuery = '';

// Fungsi untuk mengambil video dari YouTube
async function fetchVideos(query, loadMore = false) {
  // Validasi query
  if (!query || typeof query !== 'string' || query.trim() === '') {
    console.error('Query kosong atau tidak valid.');
    return;
  }

  // Simpan query untuk pemuatan lebih banyak
  if (!loadMore) {
    currentQuery = query;
    nextPageToken = ''; // reset saat pencarian baru
    document.getElementById('videoResults').innerHTML = ''; // kosongkan hasil sebelumnya
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${API_KEY}`
    + (nextPageToken ? `&pageToken=${nextPageToken}` : '');

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    nextPageToken = data.nextPageToken || '';
    displayVideos(data.items);
  } catch (error) {
    console.error('Error:', error);
    showError(`YouTube API Error: ${error.message}`);
  }
}

// Tampilkan video ke dalam layout
function displayVideos(videos) {
  const resultsContainer = document.getElementById('videoResults');

  videos.forEach(video => {
    const videoId = video.id.videoId;
    const title = video.snippet.title;
    const thumbnail = video.snippet.thumbnails.medium.url;

    const videoCard = `
      <div class="col-md-6 mb-4">
        <div class="card h-100 shadow-sm">
          <img src="${thumbnail}" class="card-img-top" alt="${title}">
          <div class="card-body">
            <h5 class="card-title">${title}</h5>
            <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="btn btn-danger btn-sm">Tonton</a>
          </div>
        </div>
      </div>
    `;

    resultsContainer.innerHTML += videoCard;
  });
}

// Tampilkan error dalam alert
function showError(message) {
  const alertContainer = document.getElementById('alertContainer');
  alertContainer.innerHTML = `
    <div class="alert alert-danger shadow-sm" role="alert">
      ${message}
    </div>
  `;
}

// Event handler pencarian
document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const query = document.getElementById('searchInput').value.trim();
  fetchVideos(query);
});

// Event handler tombol "Muat Lebih Banyak"
document.getElementById('loadMoreBtn').addEventListener('click', () => {
  fetchVideos(currentQuery, true);
});

// Jalankan pencarian acak saat halaman pertama kali dibuka
document.addEventListener('DOMContentLoaded', () => {
  const randomKeywords = ['musik', 'trailer', 'berita', 'vlog', 'tutorial'];
  const randomQuery = randomKeywords[Math.floor(Math.random() * randomKeywords.length)];
  fetchVideos(randomQuery);
});
