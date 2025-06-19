const apiKey = "AIzaSyCFMAiplOEzTreGfkKpQT4f6blI-bfcoYk";



const defaultQueries = [ "musik", "drama korea", "komedi", "gameplay", "trending", "movie trailer", "dangdut", "news", "anime", "vlog" ];

function getRandomQuery() { return defaultQueries[Math.floor(Math.random() * defaultQueries.length)]; }

window.onload = () => { const query = getRandomQuery(); document.getElementById("query").value = query; searchVideos(query); };

function setCategories() { const container = document.getElementById("category-buttons"); defaultQueries.forEach(q => { const btn = document.createElement("button"); btn.className = "btn btn-outline-primary m-1"; btn.textContent = q; btn.onclick = () => { document.getElementById("query").value = q; searchVideos(q); }; container.appendChild(btn); }); }

setCategories();

async function searchVideos(query = "") { const q = query || document.getElementById("query").value.trim(); const resultsContainer = document.getElementById("results"); const playerContainer = document.getElementById("player-container"); const videoAd = document.getElementById("video-ad");

playerContainer.style.display = "none"; resultsContainer.style.display = "flex"; resultsContainer.innerHTML = "<p>Loading...</p>"; videoAd.innerHTML = "";

if (!q) { resultsContainer.innerHTML = "<p>Ketik kata kunci pencarian.</p>"; return; }

const res = await fetch(https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(q)}&key=${apiKey}&type=video); const data = await res.json();

resultsContainer.innerHTML = "";

if (!data.items || data.items.length === 0) { resultsContainer.innerHTML = "<p>Tidak ada hasil ditemukan.</p>"; return; }

data.items.forEach((video, index) => { const { videoId } = video.id; const { title, thumbnails } = video.snippet;

const col = document.createElement("div");
col.className = "col-md-6 mb-4";

const card = document.createElement("div");
card.className = "card h-100 video-card";
card.innerHTML = `
  <img src="${thumbnails.medium.url}" class="card-img-top" alt="${title}">
  <div class="card-body">
    <h5 class="card-title">${title}</h5>
    <button class="btn btn-danger btn-sm me-2" onclick="playVideo('${videoId}', '${q}')">▶️ Putar</button>
    <button class="btn btn-secondary btn-sm" onclick="downloadVideo('${videoId}')">⬇️ Download</button>
  </div>
`;

col.appendChild(card);
resultsContainer.appendChild(col);

if (index === 4) {
  const adSlot = document.createElement("div");
  adSlot.className = "col-12 text-center mb-4";
  adSlot.innerHTML = `
    <script type="text/javascript">
      atOptions = {
        'key': 'ac316fe8b253dbbf12c471c0c8be41c2',
        'format': 'iframe',
        'height': 60,
        'width': 468,
        'params': {}
      };
    </script>
    <script type="text/javascript" src="//www.highperformanceformat.com/ac316fe8b253dbbf12c471c0c8be41c2/invoke.js"></script>
  `;
  resultsContainer.appendChild(adSlot);
}

}); }

function playVideo(videoId, query) { const playerContainer = document.getElementById("player-container"); const resultsContainer = document.getElementById("results"); const videoAd = document.getElementById("video-ad");

resultsContainer.style.display = "none"; playerContainer.style.display = "block";

playerContainer.innerHTML = <div class="ratio ratio-16x9"> <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&playlist=${videoId}&loop=1" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe> </div> <div class="text-center mt-3"> <button class="btn btn-secondary" onclick="backToResults()">🔙 Kembali ke Hasil</button> </div> <h5 class="mt-4">Terkait:</h5> <div id="related" class="row row-cols-1 row-cols-md-2 g-4"></div>;

videoAd.innerHTML = <script async="async" data-cfasync="false" src="//pl26955455.profitableratecpm.com/e3b9b0e9cdd83dea5f5d3e2b633ff801/invoke.js"></script> <div id="container-e3b9b0e9cdd83dea5f5d3e2b633ff801"></div>;

fetch(https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=4&q=${encodeURIComponent(query)}&key=${apiKey}&type=video) .then(res => res.json()) .then(data => { const related = document.getElementById("related"); related.innerHTML = ""; data.items.forEach(video => { const { videoId } = video.id; const { title, thumbnails } = video.snippet;

const card = document.createElement("div");
    card.className = "col";
    card.innerHTML = `
      <div class="card h-100">
        <img src="${thumbnails.medium.url}" class="card-img-top" alt="${title}">
        <div class="card-body">
          <h6 class="card-title">${title}</h6>
          <button class="btn btn-danger btn-sm" onclick="playVideo('${videoId}', '${query}')">Putar</button>
        </div>
      </div>
    `;
    related.appendChild(card);
  });
});

}

function backToResults() { document.getElementById("player-container").style.display = "none"; document.getElementById("results").style.display = "flex"; document.getElementById("video-ad").innerHTML = ""; }

function downloadVideo(videoId) { const url = https://www.y2mate.com/youtube/${videoId}; window.open(url, "_blank"); }

  
