const apiKey = "AIzaSyCFMAiplOEzTreGfkKpQT4f6blI-bfcoYk";

const defaultQueries = [
  "musik", "drama korea", "komedi", "gameplay", "trending",
  "movie trailer", "dangdut", "berita hari ini", "anime", "vlog"
];

function getRandomQuery() {
  return defaultQueries[Math.floor(Math.random() * defaultQueries.length)];
}

window.onload = () => {
  const randomQuery = getRandomQuery();
  document.getElementById("query").value = randomQuery;
  searchVideos(randomQuery);
};

async function searchVideos(queryParam = null) {
  const query = queryParam || document.getElementById("query").value.trim();
  const resultsContainer = document.getElementById("results");
  const playerContainer = document.getElementById("player-container");
  const videoAd = document.getElementById("video-ad");

  playerContainer.style.display = "none";
  resultsContainer.style.display = "flex";
  resultsContainer.innerHTML = "<p>Loading...</p>";
  videoAd.innerHTML = "";

  if (!query) {
    resultsContainer.innerHTML = "<p>Ketik kata kunci pencarian.</p>";
    return;
  }

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}&type=video`);
    const data = await res.json();

    resultsContainer.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      resultsContainer.innerHTML = "<p>Tidak ada hasil ditemukan.</p>";
      return;
    }

    data.items.forEach(video => {
      const { videoId } = video.id;
      const { title, thumbnails } = video.snippet;

      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-6 col-xl-6 mb-4";

      const card = document.createElement("div");
      card.className = "card h-100";
      card.innerHTML = `
        <img src="${thumbnails.medium.url}" class="card-img-top" alt="${title}">
        <div class="card-body">
          <h5 class="card-title">${title}</h5>
          <button class="btn btn-danger btn-sm me-2" onclick="playVideo('${videoId}', '${query}')">▶️ Putar</button>
          <button class="btn btn-secondary btn-sm" onclick="downloadVideo('${videoId}')">⬇️ Download</button>
        </div>
      `;

      col.appendChild(card);
      resultsContainer.appendChild(col);
    });

  } catch (error) {
    resultsContainer.innerHTML = "<p>Terjadi kesalahan saat mengambil data.</p>";
    console.error(error);
  }
}

function playVideo(videoId, query) {
  const playerContainer = document.getElementById("player-container");
  const resultsContainer = document.getElementById("results");
  const videoAd = document.getElementById("video-ad");

  resultsContainer.style.display = "none";
  playerContainer.style.display = "block";

  playerContainer.innerHTML = `
    <div class="ratio ratio-16x9 mb-3">
      <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&playlist=${videoId}&loop=1" 
        frameborder="0" allowfullscreen allow="autoplay; encrypted-media">
      </iframe>
    </div>
    <div class="text-center mb-3">
      <button class="btn btn-secondary" onclick="backToResults()">🔙 Kembali ke Hasil</button>
    </div>
  `;

  videoAd.innerHTML = `
    <script async="async" data-cfasync="false" src="//pl26955455.profitableratecpm.com/e3b9b0e9cdd83dea5f5d3e2b633ff801/invoke.js"></script>
    <div id="container-e3b9b0e9cdd83dea5f5d3e2b633ff801"></div>
  `;

  // Tampilkan video terkait (opsional)
  searchVideos(query); // load ulang hasil pencarian sebagai "video terkait"
}

function backToResults() {
  document.getElementById("player-container").style.display = "none";
  document.getElementById("results").style.display = "flex";
  document.getElementById("video-ad").innerHTML = "";
}

function downloadVideo(videoId) {
  const url = `https://www.y2mate.com/youtube/${videoId}`;
  window.open(url, "_blank");
}

function selectCategory(query) {
  document.getElementById("query").value = query;
  searchVideos(query);
}
