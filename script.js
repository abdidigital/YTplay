const apiKey = "AIzaSyCFMAiplOEzTreGfkKpQT4f6blI-bfcoYk";
const defaultQueries = [
  "musik", "drama korea", "komedi", "gameplay", "trending",
  "movie trailer", "dangdut", "news", "anime", "vlog"
];

// Tampilkan query random di halaman awal
window.onload = () => {
  const randomQuery = getRandomQuery();
  document.getElementById("query").value = randomQuery;
  searchVideos(randomQuery);
  displayCategories();
  setCurrentYear();
};

// Ambil query random
function getRandomQuery() {
  return defaultQueries[Math.floor(Math.random() * defaultQueries.length)];
}

// Atur tahun di footer
function setCurrentYear() {
  document.getElementById("year").textContent = new Date().getFullYear();
}

// Tampilkan kategori
function displayCategories() {
  const categoriesContainer = document.getElementById("categories");
  categoriesContainer.innerHTML = "";

  defaultQueries.forEach(cat => {
    const button = document.createElement("button");
    button.className = "btn btn-outline-light btn-sm m-1";
    button.innerText = cat;
    button.onclick = () => {
      document.getElementById("query").value = cat;
      searchVideos(cat);
    };
    categoriesContainer.appendChild(button);
  });
}

// Event pencarian manual
document.getElementById("searchBtn").addEventListener("click", () => {
  const query = document.getElementById("query").value.trim();
  if (query) searchVideos(query);
});

async function searchVideos(query) {
  const resultsContainer = document.getElementById("results");
  const playerContainer = document.getElementById("player-container");
  resultsContainer.innerHTML = "<p class='text-center'>Memuat...</p>";
  resultsContainer.style.display = "grid";
  playerContainer.style.display = "none";

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
    );
    const data = await res.json();
    resultsContainer.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      resultsContainer.innerHTML = "<p class='text-center'>Tidak ada hasil ditemukan.</p>";
      return;
    }

    data.items.forEach((video, index) => {
      const { videoId } = video.id;
      const { title, thumbnails } = video.snippet;

      const col = document.createElement("div");
      col.className = "col";
      col.innerHTML = `
        <div class="card h-100 video-card">
          <img src="${thumbnails.medium.url}" class="card-img-top" alt="${title}">
          <div class="card-body">
            <h6 class="card-title text-truncate" title="${title}">${title}</h6>
            <button class="btn btn-sm btn-danger me-2" onclick="playVideo('${videoId}', '${query}')">▶️ Putar</button>
            <button class="btn btn-sm btn-secondary" onclick="downloadVideo('${videoId}')">⬇️ Download</button>
          </div>
        </div>
      `;
      resultsContainer.appendChild(col);

      // Sisipkan iklan setelah video ke-2
      if (index === 1) {
        const adCol = document.createElement("div");
        adCol.className = "col";
        adCol.innerHTML = `
          <div class="card p-2 text-center bg-light border">
            <p class="mb-1">🎯 Iklan</p>
            <script async="async" data-cfasync="false" src="//pl26955455.profitableratecpm.com/e3b9b0e9cdd83dea5f5d3e2b633ff801/invoke.js"></script>
            <div id="container-e3b9b0e9cdd83dea5f5d3e2b633ff801"></div>
          </div>
        `;
        resultsContainer.appendChild(adCol);
      }
    });
  } catch (error) {
    resultsContainer.innerHTML = `<p class='text-danger text-center'>Gagal memuat video. ${error.message}</p>`;
  }
}

function playVideo(videoId, query) {
  const playerContainer = document.getElementById("player-container");
  const resultsContainer = document.getElementById("results");
  resultsContainer.style.display = "none";
  playerContainer.style.display = "block";

  playerContainer.innerHTML = `
    <div class="ratio ratio-16x9">
      <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
    </div>
    <div class="text-center my-3">
      <button class="btn btn-light" onclick="backToResults()">🔙 Kembali ke Hasil</button>
    </div>
    <div id="related-videos">
      <h5>🎯 Video Terkait :</h5>
      <div id="related-list" class="row row-cols-1 row-cols-md-2 g-3"></div>
    </div>
  `;

  loadRelatedVideos(query);
}

function backToResults() {
  document.getElementById("player-container").style.display = "none";
  document.getElementById("results").style.display = "grid";
}

async function loadRelatedVideos(query) {
  const container = document.getElementById("related-list");
  container.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
    );
    const data = await res.json();
    container.innerHTML = "";

    data.items.forEach(video => {
      const { videoId } = video.id;
      const { title, thumbnails } = video.snippet;

      const col = document.createElement("div");
      col.className = "col";
      col.innerHTML = `
        <div class="card h-100">
          <img src="${thumbnails.medium.url}" class="card-img-top" alt="${title}">
          <div class="card-body p-2">
            <h6 class="card-title text-truncate" title="${title}">${title}</h6>
            <button class="btn btn-sm btn-danger me-2" onclick="playVideo('${videoId}', '${query}')">▶️</button>
            <button class="btn btn-sm btn-secondary" onclick="downloadVideo('${videoId}')">⬇️</button>
          </div>
        </div>
      `;
      container.appendChild(col);
    });
  } catch (error) {
    container.innerHTML = `<p class="text-danger">Gagal memuat video terkait.</p>`;
  }
}

function downloadVideo(videoId) {
  const url = `https://www.y2mate.com/youtube/${videoId}`;
  window.open(url, "_blank");
    }
