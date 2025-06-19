const apiKey = "AIzaSyCFMAiplOEzTreGfkKpQT4f6blI-bfcoYk";

async function searchVideos() {
  const query = document.getElementById('query').value.trim();
  const resultsContainer = document.getElementById('results');
  const playerContainer = document.getElementById('player-container');

  resultsContainer.innerHTML = '<p class="text-center">🔍 Mencari...</p>';
  playerContainer.style.display = 'none';

  if (!query) {
    resultsContainer.innerHTML = '<p class="text-center text-danger">❗ Masukkan kata kunci</p>';
    return;
  }

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}`);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      resultsContainer.innerHTML = '<p class="text-center text-warning">⚠️ Tidak ada hasil ditemukan.</p>';
      return;
    }

    resultsContainer.innerHTML = ''; // Kosongkan

    data.items.forEach(item => {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const thumbnail = item.snippet.thumbnails.medium.url;

      const videoCard = document.createElement('div');
      videoCard.className = 'video-card';
      videoCard.innerHTML = `
        <img src="${thumbnail}" alt="${title}" class="img-fluid rounded" />
        <h6 class="mt-2">${title}</h6>
        <button class="btn btn-sm btn-primary" onclick="playVideo('${videoId}')">▶️ Putar</button>
        <a class="btn btn-sm btn-secondary" target="_blank" href="https://www.y2mate.com/youtube/${videoId}">⬇️ Download</a>
      `;

      resultsContainer.appendChild(videoCard);
    });

  } catch (error) {
    console.error('Error:', error);
    resultsContainer.innerHTML = '<p class="text-danger text-center">❌ Gagal mengambil data dari YouTube.</p>';
  }
}

function playVideo(videoId) {
  const playerContainer = document.getElementById('player-container');
  const resultsContainer = document.getElementById('results');

  playerContainer.innerHTML = `
    <div class="ratio ratio-16x9 mb-3">
      <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playlist=${videoId}&loop=1"
        title="YouTube player" frameborder="0" allowfullscreen allow="autoplay"></iframe>
    </div>
  `;
  playerContainer.style.display = 'block';
  resultsContainer.style.display = 'none';
        }
