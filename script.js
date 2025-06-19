const apiKey = "AIzaSyCFMAiplOEzTreGfkKpQT4f6blI-bfcoYk";
const resultsContainer = document.getElementById('results'); const playerContainer = document.getElementById('player-container'); const adsBelowPlayer = document.getElementById('ads-below-player');

function searchVideos() { const query = document.getElementById('query').value; if (!query) return;

resultsContainer.innerHTML = '<div class="text-center">🔄 Memuat hasil...</div>';

fetch(https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}) .then(response => response.json()) .then(data => { resultsContainer.innerHTML = '';

data.items.forEach(item => {
    const videoId = item.id.videoId;
    const title = item.snippet.title;
    const thumbnail = item.snippet.thumbnails.medium.url;

    const videoCard = document.createElement('div');
    videoCard.className = 'col-md-6';
    videoCard.innerHTML = `
      <div class="video-card">
        <img src="${thumbnail}" alt="${title}" />
        <div class="card-body">
          <h5>${title}</h5>
          <button class="btn btn-primary btn-sm" onclick="playVideo('${videoId}')">▶️ Putar</button>
          <a class="btn btn-outline-secondary btn-sm" href="https://www.y2mate.com/youtube/${videoId}" target="_blank">⬇️ Download</a>
        </div>
      </div>
    `;
    resultsContainer.appendChild(videoCard);
  });
})
.catch(error => {
  console.error('Error fetching videos:', error);
  resultsContainer.innerHTML = '<div class="text-danger">❌ Gagal memuat video. Coba lagi.</div>';
});

}

function playVideo(videoId) { playerContainer.innerHTML = <div class="ratio ratio-16x9 mb-3"> <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playlist=${videoId}&loop=1" title="YouTube video player" allowfullscreen allow="autoplay"></iframe> </div>; playerContainer.style.display = 'block'; adsBelowPlayer.style.display = 'block'; }

