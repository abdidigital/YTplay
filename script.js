const apiKey = "AIzaSyCFMAiplOEzTreGfkKpQT4f6blI-bfcoYk";
let currentPlaylist = [];

async function searchVideos() {
  const query = document.getElementById("query").value.trim();
  const resultsContainer = document.getElementById("results");
  const playerContainer = document.getElementById("player-container");

  playerContainer.style.display = "none";
  document.getElementById("ad-player").style.display = "none";
  resultsContainer.innerHTML = "Loading...";
  resultsContainer.style.display = "flex";

  if (!query) {
    resultsContainer.innerHTML = "Ketik kata kunci pencarian.";
    return;
  }

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}&type=video`
  );

  const data = await res.json();

  if (!data.items) {
    resultsContainer.innerHTML = "Gagal mengambil data.";
    return;
  }

  currentPlaylist = data.items.map(video => video.id.videoId);

  resultsContainer.innerHTML = "";
  data.items.forEach((video, index) => {
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

    // Tambahkan iklan setelah video ke-4 (index 3)
    if (index === 3) {
      const adCol = document.createElement("div");
      adCol.className = "col-12 text-center";
      adCol.innerHTML = `
        <script async="async" data-cfasync="false" src="//pl26955455.profitableratecpm.com/e3b9b0e9cdd83dea5f5d3e2b633ff801/invoke.js"></script>
        <div id="container-e3b9b0e9cdd83dea5f5d3e2b633ff801"></div>
      `;
      resultsContainer.appendChild(adCol);
    }
  });
}

function playVideo(videoId) {
  const playerContainer = document.getElementById("player-container");
  const resultsContainer = document.getElementById("results");

  const playlist = currentPlaylist.filter(id => id !== videoId);
  const playlistParam = playlist.join(",");

  playerContainer.style.display = "block";
  resultsContainer.style.display = "none";
  document.getElementById("ad-player").style.display = "block";

  playerContainer.innerHTML = `
    <div class="ratio ratio-16x9 mb-3">
      <iframe 
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&playlist=${playlistParam}" 
        allowfullscreen allow="autoplay; encrypted-media" frameborder="0">
      </iframe>
    </div>
    <button class="btn btn-secondary mb-3" onclick="backToResults()">🔙 Kembali ke Hasil</button>
  `;
}

function backToResults() {
  document.getElementById("player-container").style.display = "none";
  document.getElementById("ad-player").style.display = "none";
  document.getElementById("results").style.display = "flex";
}

function downloadVideo(videoId) {
  const url = `https://www.y2mate.com/youtube/${videoId}`;
  window.open(url, "_blank");
}
