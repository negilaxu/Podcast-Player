document.addEventListener("DOMContentLoaded", () => {
  const searchHistory = document.getElementById("searchHistory");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const resetButton = document.getElementById("resetButton");
  const loader = document.getElementById("loader");
  const responseContainer = document.getElementById("response");
  const queueContainer = document.querySelector(".queue");

  function getSavedSearches() {
    const savedSearches = localStorage.getItem("searchHistory");
    if (!savedSearches) {
      return [];
    }

    try {
      const parsedSearches = JSON.parse(savedSearches);
      if (!Array.isArray(parsedSearches)) {
        throw new Error("Search history must be an array");
      }

      return parsedSearches.filter(
        (searchTerm) => typeof searchTerm === "string",
      );
    } catch (error) {
      console.warn("Invalid search history was cleared:", error.message);
      localStorage.removeItem("searchHistory");
      return [];
    }
  }

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
    const savedSearches = getSavedSearches();
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
    const savedSearches = getSavedSearches();
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

  // Format date
  function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  }

  // Show loading animation
  function showLoader() {
    loader.style.display = "flex";
    responseContainer.style.display = "none";
  }

  // Hide loading animation
  function hideLoader() {
    loader.style.display = "none";
    responseContainer.style.display = "flex";
    responseContainer.scrollTo({
      top: 0,
    });
  }

  // Search Podcasts
  async function searchPodcast() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      saveSearchHistory(searchTerm);
      loadSearchHistory();
    } else {
      responseContainer.innerText = "Please enter a podcast title.";
      return;
    }

    showLoader();

    responseContainer.textContent = "";

    const titles = new Set();

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchTerm)}`,
      );
      const data = await response.json();

      if (data.feeds && data.feeds.length > 0) {
        data.feeds.forEach((podcast) => {
          if (podcast.episodeCount > 0 && !titles.has(podcast.title)) {
            titles.add(podcast.title);
            const card = createCard(podcast);
            responseContainer.appendChild(card);
          }
        });
        hideLoader();
      } else {
        responseContainer.innerText = "No Results Found";
        hideLoader();
      }
    } catch (error) {
      responseContainer.innerText = `Error: ${error.message}`;
      hideLoader();
    }
  }

  // Creating Podcast Card
  function createCard(podcast) {
    const card = document.createElement("div");
    card.className = "card pointer";

    const img = document.createElement("img");
    img.src = podcast.image || "./default-podcast.png";
    img.alt = podcast.title;
    img.loading = "lazy";
    img.onerror = () => {
      img.src = "./default-podcast.png";
      img.onerror = null;
    };

    const content = document.createElement("div");
    content.className = "card-content";

    const title = document.createElement("h3");
    title.innerText = podcast.title;

    const description = document.createElement("p");
    description.innerText = podcast.description;

    const episodeCount = document.createElement("p");
    episodeCount.className = "episode-count";
    episodeCount.innerText = `Episodes: ${podcast.episodeCount}`;

    const pubDate = document.createElement("p");
    pubDate.className = "pub-date";
    pubDate.innerText = `Newest Episode: ${podcast.newestItemPubDate ? formatDate(podcast.newestItemPubDate) : "Not Available"}`;

    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(episodeCount);
    content.appendChild(pubDate);

    card.appendChild(img);
    card.appendChild(content);

    card.addEventListener("click", () =>
      loadEpisodes(podcast.itunesId, podcast.episodeCount),
    );

    return card;
  }

  // Load Episodes
  async function loadEpisodes(feedId, count) {
    if (!feedId) return;
    showLoader();

    responseContainer.textContent = "";
    currentEpisodes = [];
    currentEpisodeIndex = -1;
    const episodeLimit = Math.min(Number(count) || 25, 25);

    try {
      const response = await fetch(
        `/api/episodes?feedId=${encodeURIComponent(feedId)}&max=${episodeLimit}`,
      );
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        currentEpisodes = data.items;
        currentEpisodeIndex = -1;
        data.items.forEach((episode) => {
          const card = createEpisodeCard(episode);
          responseContainer.appendChild(card);
        });
      } else {
        responseContainer.innerText = "No Results Found";
      }
    } catch (error) {
      responseContainer.innerText = `Error: ${error.message}`;
    } finally {
      hideLoader();
    }
  }

  // Creating Episode Card
  function createEpisodeCard(episode) {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = episode.image || episode.feedImage || "./default-podcast.png";
    img.alt = episode.title;
    img.loading = "lazy";
    img.onerror = () => {
      img.src = "./default-podcast.png";
      img.onerror = null;
    };

    const iconContainer = document.createElement("div");
    iconContainer.className = "icon-container";

    const playBtnIcon = document.createElement("i");
    playBtnIcon.className = "fas fa-play-circle mr-10";
    playBtnIcon.title = "Play Podcast";
    playBtnIcon.addEventListener("click", (event) => {
      event.stopPropagation();
      loadPodcast(episode);
    });

    const queueBtnIcon = document.createElement("i");
    queueBtnIcon.className = "fas fa-list";
    queueBtnIcon.title = "Add to Queue";
    queueBtnIcon.addEventListener("click", () => {
      addToQueue(episode);
    });

    const content = document.createElement("div");
    content.className = "card-content";

    const title = document.createElement("h3");
    title.innerText = episode.title;

    const description = document.createElement("p");
    description.innerHTML = episode.description;

    const pubDate = document.createElement("p");
    pubDate.className = "pub-date-alt";
    pubDate.innerText = `Published: ${episode.datePublished ? formatDate(episode.datePublished) : "Not Available"}`;

    iconContainer.appendChild(playBtnIcon);
    iconContainer.appendChild(queueBtnIcon);
    iconContainer.appendChild(pubDate);

    content.appendChild(title);
    content.appendChild(iconContainer);
    content.appendChild(description);

    card.appendChild(img);
    card.appendChild(content);

    return card;
  }

  // Set Queue Array
  let queueItems = [];

  // Add item to queue
  function addToQueue(episode) {
    const card = document.createElement("div");
    card.className = "queue-item";
    const img = document.createElement("img");
    img.src = episode.image || episode.feedImage || "./default-podcast.png";
    img.alt = episode.title;
    img.loading = "lazy";
    img.onerror = () => {
      img.src = "./default-podcast.png";
      img.onerror = null;
    };

    const content = document.createElement("div");
    content.className = "queue-content";

    const title = document.createElement("h3");
    title.innerText = episode.title;

    const iconContainer = document.createElement("div");
    iconContainer.className = "icon-container";

    const playBtnIcon = document.createElement("i");
    playBtnIcon.className = "fas fa-play-circle mb-10";
    playBtnIcon.title = "Play Podcast";
    playBtnIcon.addEventListener("click", (event) => {
      event.stopPropagation();
      loadPodcast(episode);
    });

    const removeBtnIcon = document.createElement("i");
    removeBtnIcon.className = "fas fa-trash-alt";
    removeBtnIcon.title = "Remove from Queue";
    removeBtnIcon.addEventListener("click", () => {
      deleteFromQueue(episode);
    });

    const pubDate = document.createElement("p");
    pubDate.className = "pub-date-alt";
    pubDate.innerText = `Published: ${episode.datePublished ? formatDate(episode.datePublished) : "Not Available"}`;

    iconContainer.appendChild(playBtnIcon);
    iconContainer.appendChild(removeBtnIcon);

    content.appendChild(title);
    content.appendChild(iconContainer);

    card.appendChild(img);
    card.appendChild(content);

    queueContainer.appendChild(card);
    saveQueue(episode);
  }

  // Delete item from queue
  function deleteFromQueue(episode) {
    queueItems = queueItems.filter((item) => item.title !== episode.title);
    localStorage.setItem("queue", JSON.stringify(queueItems));

    const queueElements = document.querySelectorAll(".queue-item");
    queueElements.forEach((item) => {
      const title = item.querySelector("h3").innerText;
      if (title === episode.title) item.remove();
    });
  }

  // Save Items to Queue
  function saveQueue(episode) {
    queueItems.push(episode);
    localStorage.setItem("queue", JSON.stringify(queueItems));
  }

  // Load saved queue
  function loadQueue() {
    const savedQueue = JSON.parse(localStorage.getItem("queue"));
    if (savedQueue) {
      savedQueue.forEach((episode) => addToQueue(episode));
    }
  }

  // Navigation
  const searchLink = document.getElementById("searchLink");
  const listenLink = document.getElementById("listenLink");
  const searchContainer = document.querySelector(".search-container");
  const mainContainer = document.querySelector(".main-container");
  const playerContainer = document.querySelector(".player-container");

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

  function navigateToDesktop() {
    searchContainer.style.display = "flex";
    mainContainer.style.display = "flex";
    playerContainer.style.display = "flex";
    queueContainer.style.display = "flex";
    searchLink.classList.add("selected");
    listenLink.classList.remove("selected");
  }

  let lastMobileMode;

  function initializeNavigationMode() {
    const mobileMode = isMobileDevice();
    if (mobileMode === lastMobileMode) return;

    lastMobileMode = mobileMode;
    if (mobileMode) {
      navigateToPlayer();
    } else {
      navigateToDesktop();
    }
  }

  // Player ============================= //
  const image = document.getElementById("image");
  const title = document.getElementById("title");
  const datePublished = document.getElementById("datePublished");
  const player = document.getElementById("player");
  const currentTimeEl = document.getElementById("current-time");
  const durationEl = document.getElementById("duration");
  const progress = document.getElementById("progress");
  const progressContainer = document.getElementById("progress-container");
  const durationWrapper = document.querySelector(".duration-wrapper");
  const prevBtn = document.getElementById("prev");
  const playBtn = document.getElementById("play");
  const nextBtn = document.getElementById("next");
  let currentEpisodes = [];
  let currentEpisodeIndex = -1;

  // Check if Playing
  let isPlaying = false;

  // Play
  async function playPodcast() {
    isPlaying = true;
    playBtn.classList.replace("fa-play", "fa-pause");
    playBtn.setAttribute("title", "Pause");
    try {
      await player.play();
    } catch (error) {
      isPlaying = false;
      playBtn.classList.replace("fa-pause", "fa-play");
      playBtn.setAttribute("title", "Play");
      console.error("Unable to play episode:", error);
    }
  }

  // Pause
  function pausePodcast() {
    isPlaying = false;
    playBtn.classList.replace("fa-pause", "fa-play");
    playBtn.setAttribute("title", "Play");
    player.pause();
  }

  // Play or Pause Event Listener
  playBtn.addEventListener("click", () =>
    isPlaying ? pausePodcast() : playPodcast(),
  );

  // Update Podcast Container
  function setLoadingState(isLoading) {
    progress.classList.toggle("loading", isLoading);
    durationWrapper.style.visibility = isLoading ? "hidden" : "visible";
    currentTimeEl.style.display = isLoading ? "none" : "inline";
    durationEl.style.display = isLoading ? "none" : "inline";
  }

  function loadPodcast(
    episode,
    episodeIndex = currentEpisodes.indexOf(episode),
  ) {
    if (!episode) return;

    if (isMobileDevice()) {
      navigateToPlayer();
    }

    currentEpisodeIndex = episodeIndex;
    pausePodcast();
    setLoadingState(true);
    title.textContent = episode.title;
    datePublished.textContent = `${episode.datePublished ? formatDate(episode.datePublished) : "Not Available"}`;
    image.src = episode.image || episode.feedImage || "./default-podcast.png";
    image.onerror = () => {
      image.src = "./default-podcast.png";
      image.onerror = null;
    };
    player.src = episode.enclosureUrl || episode.enclosure?.url || "";
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";
    progress.style.width = "0%";
    player.onloadedmetadata = () => {
      setLoadingState(false);
      updateTimeDisplay();
      playPodcast();
    };
    player.onerror = () => {
      setLoadingState(false);
      isPlaying = false;
      playBtn.classList.replace("fa-pause", "fa-play");
      playBtn.setAttribute("title", "Play");
      console.error("Unable to load episode audio:", episode.enclosureUrl);
    };
    player.load();
  }

  function playNextEpisode() {
    if (currentEpisodes.length === 0) return;

    const nextIndex =
      currentEpisodeIndex >= currentEpisodes.length - 1
        ? 0
        : currentEpisodeIndex + 1;
    loadPodcast(currentEpisodes[nextIndex], nextIndex);
  }

  function seekBy(seconds) {
    if (!Number.isFinite(player.duration)) return;

    player.currentTime = Math.min(
      Math.max(player.currentTime + seconds, 0),
      player.duration,
    );
    updateTimeDisplay();
  }

  function formatTime(time) {
    if (!Number.isFinite(time) || time < 0) {
      return "0:00";
    }

    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = String(Math.floor(time % 60)).padStart(2, "0");

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`;
    }

    return `${minutes}:${seconds}`;
  }

  function updateTimeDisplay() {
    const { duration, currentTime } = player;
    currentTimeEl.textContent = formatTime(currentTime);
    durationEl.textContent = formatTime(duration);
  }

  // Update Progress Bar & Time
  function updateProgressBar() {
    const { duration, currentTime } = player;
    updateTimeDisplay();

    if (Number.isFinite(duration) && duration > 0) {
      const progressPercent = (currentTime / duration) * 100;
      progress.style.width = `${progressPercent}%`;
    }
  }

  // Set Progress Bar
  function setProgressBar(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const { duration } = player;
    if (Number.isFinite(duration) && duration > 0) {
      player.currentTime = (clickX / width) * duration;
    }
  }

  // Event Listeners
  prevBtn.addEventListener("click", () => seekBy(-15));
  nextBtn.addEventListener("click", () => seekBy(15));
  player.addEventListener("ended", playNextEpisode);
  player.addEventListener("loadedmetadata", updateTimeDisplay);
  player.addEventListener("timeupdate", updateProgressBar);
  progressContainer.addEventListener("click", setProgressBar);

  function isMobileDevice() {
    return window.innerWidth <= 1025;
  }

  window.addEventListener("resize", initializeNavigationMode);

  // Save the player state to local storage every 5 seconds
  setInterval(() => {
    if (isPlaying) {
      const playerState = {
        title: title.textContent,
        datePublished: datePublished.textContent,
        currentTime: player.currentTime,
        duration: player.duration,
        image: image.src,
        src: player.src,
      };
      localStorage.setItem("playerState", JSON.stringify(playerState));
    }
  }, 5000);

  // Load saved player from local storage
  function loadPlayerState() {
    const savedPlayerState = localStorage.getItem("playerState");
    if (!savedPlayerState) return;

    try {
      const savedState = JSON.parse(savedPlayerState);
      if (!savedState.src) return;

      title.textContent = savedState.title || "Podcast Title";
      datePublished.textContent = savedState.datePublished || "Date Published";
      image.src = savedState.image || "./default-podcast.png";
      setLoadingState(true);

      const restoreTime = Number(savedState.currentTime);
      player.src = savedState.src;
      player.addEventListener(
        "loadedmetadata",
        () => {
          const time =
            Number.isFinite(restoreTime) && restoreTime >= 0
              ? Math.min(restoreTime, player.duration)
              : 0;

          player.currentTime = time;
          setLoadingState(false);
          updateTimeDisplay();
          progress.style.width =
            player.duration > 0 ? `${(time / player.duration) * 100}%` : "0%";
        },
        { once: true },
      );
      player.addEventListener(
        "error",
        () => {
          setLoadingState(false);
          localStorage.removeItem("playerState");
        },
        { once: true },
      );
      player.load();
    } catch (error) {
      console.warn("Invalid saved player state was cleared:", error.message);
      localStorage.removeItem("playerState");
    }
  }

  // On startup
  initializeNavigationMode();
  loadPlayerState();
  loadQueue();

  // Service Worker -------------------------------------//
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log(
            "Service Worker registered with scope",
            registration.scope,
          );
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    });
  }
});
