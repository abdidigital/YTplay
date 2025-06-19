const apiKey = "AIzaSyCFMAiplOEzTreGfkKpQT4f6blI-bfcoYk";
let latestVideos = []; // Simpan hasil pencarian terakhir

async function searchVideos() {
  const query = document.getElementById("query").value.trim();
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

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}&type=video`
  );
  const data = await res.json();
  resultsContainer.innerHTML = "";

  if (!data.items || data.items.length === 0) {
    resultsContainer.innerHTML = "<p>Tidak ada hasil ditemukan.</p>";
    return;
  }

  latestVideos = data.items; // Simpan hasil pencarian

  data.items.forEach(video => {
    const { videoId } = video.id;
    const { title, thumbnails } = video.snippet;

    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-6 mb-4";

    const card = document.createElement("div");
    card.className = "card h-100 video-card";
    card.innerHTML = `
      <img src="${thumbnails.medium.url}" class="card-img-top" alt="${title}">
      <div class="card-body">
        <h5 class="card-title">${title}</h5>
        <button class="btn btn-sm btn-danger me-2" onclick="playVideo('${videoId}')">▶️ Putar</button>
        <button class="btn btn-sm btn-secondary" onclick="downloadVideo('${videoId}')">⬇️ Download</button>
      </div>
    `;
    col.appendChild(card);
    resultsContainer.appendChild(col);
  });
}

function playVideo(videoId) {
  const playerContainer = document.getElementById("player-container");
  const resultsContainer = document.getElementById("results");
  const videoAd = document.getElementById("video-ad");
  const relatedList = document.getElementById("related-list");

  resultsContainer.style.display = "none";
  playerContainer.style.display = "block";

  playerContainer.querySelector(".ratio")?.remove(); // hapus player lama
  const iframe = document.createElement("div");
  iframe.className = "ratio ratio-16x9";
  iframe.innerHTML = `
    <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&playlist=${videoId}&loop=1" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
  `;
  playerContainer.prepend(iframe);

  videoAd.innerHTML = `
    <script async="async" data-cfasync="false" src="//pl26955455.profitableratecpm.com/e3b9b0e9cdd83dea5f5d3e2b633ff801/invoke.js"></script>
    <div id="container-e3b9b0e9cdd83dea5f5d3e2b633ff801"></div>
  `;

  // Tampilkan 4 video selain yang sedang diputar
  relatedList.innerHTML = "";
  latestVideos
    .filter(v => v.id.videoId !== videoId)
    .slice(0, 4)
    .forEach(video => {
      const { videoId: vid, snippet } = video;
      const div = document.createElement("div");
      div.className = "col-md-6 mb-3";
      div.innerHTML = `
        <div class="card h-100">
          <img src="${snippet.thumbnails.medium.url}" class="card-img-top" alt="${snippet.title}">
          <div class="card-body">
            <h6 class="card-title">${snippet.title}</h6>
            <button class="btn btn-sm btn-danger" onclick="playVideo('${vid}')">▶️ Putar</button>
          </div>
        </div>
      `;
      relatedList.appendChild(div);
    });
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
