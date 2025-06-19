const apiKey = "AIzaSyCFMAiplOEzTreGfkKpQT4f6blI-bfcoYk";
const defaultQueries = ["musik", "drama korea", "komedi", "gameplay", "trending", "movie trailer", "dangdut", "news", "anime", "vlog"];
let lastResults = [];

window.onload = () => {
  renderCategories();
  const randomQuery = getRandomQuery();
  document.getElementById("query").value = randomQuery;
  searchVideos();
};

function getRandomQuery() {
  return defaultQueries[Math.floor(Math.random() * defaultQueries.length)];
}

function renderCategories() {
  const container = document.getElementById("categories");
  defaultQueries.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-primary btn-sm category-btn";
    btn.innerText = cat;
    btn.onclick = () => {
      document.getElementById("query").value = cat;
      searchVideos();
    };
    container.appendChild(btn);
  });
}

async function searchVideos() {
  const query = document.getElementById("query").value.trim();
  const resultsContainer = document.getElementById("results");
  const playerContainer = document.getElementById("player-container");

  playerContainer.style.display = "none";
  resultsContainer.innerHTML = "<p>Loading...</p>";

  if (!query) {
    resultsContainer.innerHTML = "<p>Ketik kata kunci pencarian.</p>";
    return;
  }

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}&type=video`);
  const data = await res.json();
  resultsContainer.innerHTML = "";

  if (!data.items || data.items.length === 0) {
    resultsContainer.innerHTML = "<p>Tidak ada hasil ditemukan.</p>";
    return;
  }

  lastResults = data.items;
  data.items.forEach((video, index) => {
    const { videoId } = video.id;
    const { title, thumbnails } = video.snippet;

    const col = document.createElement("div");
    col.className = "col-md-6 video-card";

    const card = document.createElement("div");
    card.className = "card h-100";
    card.innerHTML = `
      <img src="${thumbnails.medium.url}" class="card-img-top" alt="${title}">
      <div class="card-body">
        <h6 class="card-title">${title}</h6>
        <button class="btn btn-sm btn-danger me-2" onclick="playVideo('${videoId}')">▶️ Putar</button>
        <button class="btn btn-sm btn-secondary" onclick="downloadVideo('${videoId}')">⬇️ Download</button>
      </div>
    `;

    col.appendChild(card);
    resultsContainer.appendChild(col);

    if (index === 4) {
      const ad = document.createElement("div");
      ad.className = "col-12 text-center my-3";
      ad.innerHTML = `
        <script async="async" data-cfasync="false" src="//pl26955455.profitableratecpm.com/e3b9b0e9cdd83dea5f5d3e2b633ff801/invoke.js"></script>
        <div id="container-e3b9b0e9cdd83dea5f5d3e2b633ff801"></div>
      `;
      resultsContainer.appendChild(ad);
    }
  });
}

function playVideo(videoId) {
  const playerContainer = document.getElementById("player-container");
  const resultsContainer = document.getElementById("results");

  resultsContainer.style.display = "none";
  playerContainer.style.display = "block";

  playerContainer.innerHTML = `
    <div class="ratio ratio-16x9 mb-3">
      <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&playlist=${videoId}&loop=1"
        frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
    </div>
    <div class="text-center">
      <button class="btn btn-outline-secondary" onclick="backToResults()">🔙 Kembali ke Hasil</button>
    </div>
    <div class="mt-4">
      <h5>🎯 Video Terkait:</h5>
      <div class="row">
        ${lastResults.map(v => `
          <div class="col-6 col-md-3 mb-3">
            <img src="${v.snippet.thumbnails.default.url}" alt="${v.snippet.title}" class="img-fluid rounded" onclick="playVideo('${v.id.videoId}')">
            <small>${v.snippet.title}</small>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  document.getElementById("video-ad").innerHTML = `
    <script async="async" data-cfasync="false" src="//pl26955455.profitableratecpm.com/e3b9b0e9cdd83dea5f5d3e2b633ff801/invoke.js"></script>
    <div id="container-e3b9b0e9cdd83dea5f5d3e2b633ff801"></div>
  `;
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
