document.addEventListener("DOMContentLoaded", () => {
  const searchHistory = document.getElementById("searchHistory");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const resetButton = document.getElementById("resetButton");
  const responseContainer = document.getElementById("response");

  // Reset search history
  function resetHistory() {
    searchHistory.innerText = "";
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Select a Previous Search";
    searchHistory.appendChild(option);
  }

  // Load Search History from local storage
  function loadSearchHistory() {
    const savedSearches =
      JSON.parse(localStorage.getItem("searchHistory")) || [];
    resetHistory();
    savedSearches.forEach((searchTerm) => {
      const option = document.createElement("option");
      option.value = searchTerm;
      option.textContent = searchTerm;
      searchHistory.appendChild(option);
    });
  }

  // Event listener for dropdown change
  searchHistory.addEventListener("change", () => {
    const selectedSearch = searchHistory.value;
    if (selectedSearch) {
      searchInput.value = selectedSearch;
      searchPodcast();
    }
  });

  // Save the search history to local storage
  function saveSearchHistory(searchTerm) {
    let savedSearches = JSON.parse(localStorage.getItem("searchHistory")) || [];
    if (!savedSearches.includes(searchTerm)) {
      savedSearches.push(searchTerm);
      localStorage.setItem("searchHistory", JSON.stringify(savedSearches));
    }
  }

  // Event listener for search button, input
  searchButton.addEventListener("click", searchPodcast);
  searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      searchPodcast();
    }
  });

  // Event listener for reset button
  resetButton.addEventListener("click", () => {
    localStorage.removeItem("searchHistory");
    resetHistory();
    searchInput.value = "";
  });

  // Event listener to reset search input
  searchInput.addEventListener("focus", () => {
    searchInput.value = "";
  });

  // Load search history when page loads
  loadSearchHistory();

  // Search Podcasts
  async function searchPodcast() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      console.log("searched: ", searchTerm);
      saveSearchHistory(searchTerm);
      loadSearchHistory();
    } else {
      responseContainer.innerText = "Please enter a podcast title.";
    }

    responseContainer.textContent = "";

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchTerm)}`,
      );
        const data = await response.json();
        
        if (data.feeds && data.feeds.length > 0) {
            console.log("Results", data);
        } else {
            responseContainer.innerText = "No Results Found";
        }
    } catch (error) {
      responseContainer.innerText = `Error: ${error.message}`;
    }
  }

  // Navigation
  const searchLink = document.getElementById("searchLink");
  const listenLink = document.getElementById("listenLink");
  const searchContainer = document.querySelector(".search-container");
  const mainContainer = document.querySelector(".main-container");
  const playerContainer = document.querySelector(".player-container");
  const queueContainer = document.querySelector(".queue");

  searchLink.addEventListener("click", navigateToSearch);
  listenLink.addEventListener("click", navigateToPlayer);

  function navigateToSearch() {
    searchContainer.style.display = "flex";
    mainContainer.style.display = "flex";
    playerContainer.style.display = "none";
    queueContainer.style.display = "none";
    searchLink.classList.add("selected");
    listenLink.classList.remove("selected");
  }

  function navigateToPlayer() {
    searchContainer.style.display = "none";
    mainContainer.style.display = "none";
    playerContainer.style.display = "flex";
    queueContainer.style.display = "flex";
    searchLink.classList.remove("selected");
    listenLink.classList.add("selected");
  }
});

/* const image = document.querySelector('img');
const title = document.getElementById('title');
const artist = document.getElementById('artist');
const music = document.querySelector('audio');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');
const prevBtn = document.getElementById('prev');
const playBtn = document.getElementById('play');
const nextBtn = document.getElementById('next');

// Music
const songs = [
  {
    name: 'jacinto-1',
    displayName: 'Electric Chill Machine',
    artist: 'Jacinto Design',
  },
  {
    name: 'jacinto-2',
    displayName: 'Seven Nation Army (Remix)',
    artist: 'Jacinto Design',
  },
  {
    name: 'jacinto-3',
    displayName: 'Goodnight, Disco Queen',
    artist: 'Jacinto Design',
  },
  {
    name: 'metric-1',
    displayName: 'Front Row (Remix)',
    artist: 'Metric/Jacinto Design',
  },
];

// Check if Playing
let isPlaying = false;

// Play
function playSong() {
  isPlaying = true;
  playBtn.classList.replace('fa-play', 'fa-pause');
  playBtn.setAttribute('title', 'Pause');
  music.play();
}

// Pause
function pauseSong() {
  isPlaying = false;
  playBtn.classList.replace('fa-pause', 'fa-play');
  playBtn.setAttribute('title', 'Play');
  music.pause();
}

// Play or Pause Event Listener
playBtn.addEventListener('click', () => (isPlaying ? pauseSong() : playSong()));

// Update DOM
function loadSong(song) {
  title.textContent = song.displayName;
  artist.textContent = song.artist;
  music.src = `music/${song.name}.mp3`;
  image.src = `img/${song.name}.jpg`;
}

// Current Song
let songIndex = 0;

// Previous Song
function prevSong() {
  songIndex--;
  if (songIndex < 0) {
    songIndex = songs.length - 1;
  }
  loadSong(songs[songIndex]);
  playSong();
}

// Next Song
function nextSong() {
  songIndex++;
  if (songIndex > songs.length - 1) {
    songIndex = 0;
  }
  loadSong(songs[songIndex]);
  playSong();
}

// On Load - Select First Song
loadSong(songs[songIndex]);

// Update Progress Bar & Time
function updateProgressBar(e) {
  if (isPlaying) {
    const { duration, currentTime } = e.srcElement;
    // Update progress bar width
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
    // Calculate display for duration
    const durationMinutes = Math.floor(duration / 60);
    let durationSeconds = Math.floor(duration % 60);
    if (durationSeconds < 10) {
      durationSeconds = `0${durationSeconds}`;
    }
    // Delay switching duration Element to avoid NaN
    if (durationSeconds) {
      durationEl.textContent = `${durationMinutes}:${durationSeconds}`;
    }
    // Calculate display for currentTime
    const currentMinutes = Math.floor(currentTime / 60);
    let currentSeconds = Math.floor(currentTime % 60);
    if (currentSeconds < 10) {
      currentSeconds = `0${currentSeconds}`;
    }
    currentTimeEl.textContent = `${currentMinutes}:${currentSeconds}`;
  }
}

// Set Progress Bar
function setProgressBar(e) {
  const width = this.clientWidth;
  const clickX = e.offsetX;
  const { duration } = music;
  music.currentTime = (clickX / width) * duration;
}

// Event Listeners
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
music.addEventListener('ended', nextSong);
music.addEventListener('timeupdate', updateProgressBar);
progressContainer.addEventListener('click', setProgressBar);
 */
