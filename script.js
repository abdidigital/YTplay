const apiKey = "AIzaSyCFMAiplOEzTreGfkKpQT4f6blI-bfcoYk";

async function searchVideos() {
  const query = document.getElementById("query").value.trim();
  const resultsContainer = document.getElementById("results");
  const playerContainer = document.getElementById("player-container");

  playerContainer.style.display = "none";
  resultsContainer.innerHTML = "Loading...";

  if (!query) {
    resultsContainer.innerHTML = "Ketik kata kunci pencarian.";
    return;
  }

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&key=${apiKey}&type=video`
  );

  const data = await res.json();

  if (!data.items) {
    resultsContainer.innerHTML = "Gagal mengambil data.";
    return;
  }

  resultsContainer.innerHTML = "";
  data.items.forEach(video => {
    const { videoId } = video.id;
    const { title, thumbnails } = video.snippet;

    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <img src="${thumbnails.medium.url}" alt="${title}" />
      <h4>${title}</h4>
      <button onclick="playVideo('${videoId}')">▶️ Putar</button>
      <button onclick="downloadVideo('${videoId}')">⬇️ Download</button>
    `;
    resultsContainer.appendChild(card);
  });
}

function playVideo(videoId) {
  const playerContainer = document.getElementById("player-container");
  const resultsContainer = document.getElementById("results");

  playerContainer.innerHTML = `
    <iframe width="100%" height="250" src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
      frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
    <br/>
    <button onclick="backToResults()">🔙 Kembali ke Hasil</button>
  `;

  playerContainer.style.display = "block";
  resultsContainer.style.display = "none";
}

function backToResults() {
  document.getElementById("player-container").style.display = "none";
  document.getElementById("results").style.display = "block";
}

function downloadVideo(videoId) {
  const url = `https://www.y2mate.com/youtube/${videoId}`;
  window.open(url, "_blank");
}
