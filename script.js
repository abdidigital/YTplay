const apiKey = "AIzaSyCFMAiplOEzTreGfkKpQT4f6blI-bfcoYk";
let currentPlaylist = [];

async function searchVideos() {
  const query = document.getElementById("query").value.trim();
  const resultsContainer = document.getElementById("results");
  const playerContainer = document.getElementById("player-container");

  playerContainer.style.display = "none";
  resultsContainer.innerHTML = `
    <div class="text-center w-100">
      <div class="spinner-border text-primary" role="status"></div>
      <p>Memuat hasil...</p>
    </div>
  `;

  if (!query) {
    resultsContainer.innerHTML = `<p class="text-danger">Ketik kata kunci pencarian.</p>`;
    return;
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}&type=video`
    );
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      resultsContainer.innerHTML = `<p class="text-danger">Tidak ditemukan video.</p>`;
      return;
    }

    // Simpan playlist videoId
    currentPlaylist = data.items.map(item => item.id.videoId);

    resultsContainer.innerHTML = '';
    data.items.forEach(video => {
      const { videoId } = video.id;
      const { title, thumbnails } = video.snippet;

      const col = document.createElement("div");
      col.className = "col-6";

      col.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img src="${thumbnails.medium.url}" class="card-img-top" alt="${title}">
          <div class="card-body p-2">
            <h6 class="card-title" style="font-size:14px;">${title}</h6>
            <div class="d-grid gap-2">
              <button class="btn btn-sm btn-primary" onclick="playVideo('${videoId}')">▶️ Putar</button>
              <button class="btn btn-sm btn-outline-secondary" onclick="downloadVideo('${videoId}')">⬇️ Download</button>
            </div>
          </div>
        </div>
      `;

      resultsContainer.appendChild(col);
    });
  } catch (err) {
    console.error(err);
    resultsContainer.innerHTML = `<p class="text-danger">Terjadi kesalahan saat mengambil video.</p>`;
  }
}

function playVideo(videoId) {
  const playerContainer = document.getElementById("player-container");
  const resultsContainer = document.getElementById("results");

  // Buat playlist kecuali video yang sedang diputar
  const playlist = currentPlaylist.filter(id => id !== videoId);
  const playlistParam = playlist.join(",");

  playerContainer.style.display = "block";
  resultsContainer.style.display = "none";

  playerContainer.innerHTML = `
    <div class="ratio ratio-16x9 mb-3">
      <iframe 
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&playlist=${playlistParam}" 
        allowfullscreen allow="autoplay; encrypted-media" frameborder="0"></iframe>
    </div>
    <button class="btn btn-secondary mb-3" onclick="backToResults()">🔙 Kembali ke Hasil</button>
  `;
}

function backToResults() {
  document.getElementById("player-container").style.display = "none";
  document.getElementById("results").style.display = "flex";
}

function downloadVideo(videoId) {
  const url = `https://www.y2mate.com/youtube/${videoId}`;
  window.open(url, "_blank");
}
