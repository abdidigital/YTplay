const apiKey = "MASUKKAN_API_KEY_YOUTUBE_KAMU";

async function searchVideos() {
  const query = document.getElementById("query").value.trim();
  const resultsContainer = document.getElementById("results");
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
    resultsContainer.innerHTML = "Gagal mengambil data dari YouTube API.";
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
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  window.open(url, "_blank");
}

function downloadVideo(videoId) {
  const url = `https://www.y2mate.com/youtube/${videoId}`; // atau ganti dengan layanan converter lain
  window.open(url, "_blank");
}
