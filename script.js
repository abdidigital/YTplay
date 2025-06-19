const apiKey = "AIzaSyCFMAiplOEzTreGfkKpQT4f6blI-bfcoYk";
let currentPlaylist = [];

async function searchVideos() {
  const query = document.getElementById("query").value.trim();
  const resultsContainer = document.getElementById("results");
  const playerContainer = document.getElementById("player-container");

  playerContainer.style.display = "none";
  document.getElementById("ad-player").style.display = "none";
  resultsContainer.innerHTML = "Loading...";

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

    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <img src="${thumbnails.medium.url}" alt="${title}" />
      <h6>${title}</h6>
      <div class="btn-group">
        <button class="btn btn-sm btn-primary" onclick="playVideo('${videoId}')">▶️ Putar</button>
        <button class="btn btn-sm btn-outline-secondary" onclick="downloadVideo('${videoId}')">⬇️ Download</button>
      </div>
    `;

    resultsContainer.appendChild(card);

    // Iklan disisipkan setelah video ke-4
    if (index === 3) {
      const adDiv = document.createElement("div");
      adDiv.className = "text-center my-3";
      adDiv.innerHTML = `
        <script async="async" data-cfasync="false" src="//pl26955455.profitableratecpm.com/e3b9b0e9cdd83dea5f5d3e2b633ff801/invoke.js"></script>
        <div id="container-e3b9b0e9cdd83dea5f5d3e2b633ff801"></div>
      `;
      resultsContainer.appendChild(adDiv);
    }
  });
}

function playVideo(videoId) {
  const playerContainer = document.getElementById("player-container");
  const resultsContainer = document.getElementById("results");
  const adPlayer = document.getElementById("ad-player");

  const playlist = currentPlaylist.filter(id => id !== videoId);
  const playlistParam = playlist.join(",");

  playerContainer.innerHTML = `
    <div class="ratio ratio-16x9 mb-3">
      <iframe 
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&playlist=${playlistParam}" 
        allowfullscreen allow="autoplay; encrypted-media" frameborder="0">
      </iframe>
    </div>
    <button class="btn btn-secondary mb-3" onclick="backToResults()">🔙 Kembali ke Hasil</button>
  `;

  playerContainer.style.display = "block";
  resultsContainer.style.display = "none";
  adPlayer.style.display = "block";
}

function backToResults() {
  document.getElementById("player-container").style.display = "none";
  document.getElementById("ad-player").style.display = "none";
  document.getElementById("results").style.display = "grid";
}

function downloadVideo(videoId) {
  const url = `https://www.y2mate.com/youtube/${videoId}`;
  window.open(url, "_blank");
}
