// Clean AMV Editing Portfolio - No Debug Functions, Auto Load All Videos
document.addEventListener("DOMContentLoaded", () => {
  console.log("AMV Portfolio initializing...");

  // YouTube API Configuration
  const API_KEY = "AIzaSyCxxF0kdu3R4cp98bw6crgEiIVttsucb04";
  const CHANNEL_ID = "UCV4ZLWfXF15d4tyzdJTkzpw";
  const BASE_URL = "https://www.googleapis.com/youtube/v3";

  // Elements
  const videoGrid = document.getElementById("video-grid");
  const videoModal = document.getElementById("video-modal");
  const modalClose = document.querySelector(".modal-close");
  const modalTitle = document.getElementById("modal-title");
  const modalStats = document.getElementById("modal-stats");
  const modalDescription = document.getElementById("modal-description");
  const modalTags = document.getElementById("modal-tags");
  const featuredVideo = document.querySelector(".video-player");
  const featuredPlayerContainer = document.getElementById(
    "featured-player-container"
  );
  const iframeContainer = document.getElementById("modal-iframe-container");

  // Loading and error elements
  const loadingContainer = document.getElementById("loading-container");
  const errorContainer = document.getElementById("error-container");
  const errorText = document.getElementById("error-text");
  const retryBtn = document.getElementById("retry-btn");

  // Channel info elements
  const channelInfo = document.getElementById("channel-info");
  const channelBanner = document.getElementById("channel-banner-img");
  const channelAvatar = document.getElementById("channel-avatar-img");
  const channelTitle = document.getElementById("channel-title");
  const channelStats = document.getElementById("channel-stats");
  const channelDescription = document.getElementById("channel-description");

  // Featured video elements
  const featuredSection = document.getElementById("featured-video-section");
  const featuredThumbnail = document.getElementById("featured-thumbnail");
  const featuredTitleEl = document.getElementById("featured-title");
  const featuredStatsEl = document.getElementById("featured-stats");
  const featuredDescriptionEl = document.getElementById("featured-description");
  const featuredTagsEl = document.getElementById("featured-tags");

  // State
  let allVideos = [];
  let featuredVideoData = null;

  // Mock video data for fallback
  const mockVideos = [
    {
      id: "video1",
      title: "The death from Puss in boots: the last wish edited",
      description:
        "A powerful AMV featuring the emotional scenes from Puss in Boots: The Last Wish, showcasing the character development and stunning animation.",
      thumbnail:
        "https://via.placeholder.com/640x360/191970/ffffff?text=Puss+in+Boots+AMV",
      duration: "1:00",
      views: "6.2K",
      publishedAt: "2 years ago",
      videoId: "8aIsh6rfW4U",
      tags: ["AMV", "Puss in Boots", "Animation"],
    },
    {
      id: "video2",
      title: "Best waifu in anime (who your favourite)",
      description:
        "A compilation showcasing the most beloved female characters in anime, featuring stunning visuals and memorable moments.",
      thumbnail:
        "https://via.placeholder.com/640x360/191970/ffffff?text=Best+Waifu+AMV",
      duration: "0:12",
      views: "542",
      publishedAt: "2 years ago",
      videoId: "dQw4w9WgXcQ",
      tags: ["AMV", "Anime", "Characters"],
    },
    {
      id: "video3",
      title: "Levi Ackerman (a side character who steal the show) AMV/edit",
      description:
        "An epic tribute to Levi Ackerman from Attack on Titan, highlighting his incredible combat skills and character moments.",
      thumbnail:
        "https://via.placeholder.com/640x360/191970/ffffff?text=Levi+Ackerman+AMV",
      duration: "0:08",
      views: "1.2K",
      publishedAt: "2 years ago",
      videoId: "dQw4w9WgXcQ",
      tags: ["AMV", "Attack on Titan", "Levi"],
    },
  ];

  // Utility functions
  function isMobile() {
    return window.innerWidth <= 768;
  }

  function formatDuration(duration) {
    if (!duration) return "0:00";
    if (typeof duration === "string" && duration.includes(":")) {
      return duration;
    }

    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return "0:00";

    const hours = (match[1] || "").replace("H", "");
    const minutes = (match[2] || "").replace("M", "");
    const seconds = (match[3] || "").replace("S", "");

    if (hours) {
      return `${hours}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
    }
    return `${minutes || "0"}:${seconds.padStart(2, "0")}`;
  }

  function formatViewCount(viewCount) {
    if (!viewCount) return "0";
    if (
      typeof viewCount === "string" &&
      (viewCount.includes("K") || viewCount.includes("M"))
    ) {
      return viewCount;
    }

    const num = Number.parseInt(viewCount);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  }

  function formatPublishedDate(publishedAt) {
    if (typeof publishedAt === "string" && publishedAt.includes("ago")) {
      return publishedAt;
    }

    const date = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  function getThumbnailUrl(thumbnails) {
    if (typeof thumbnails === "string") return thumbnails;

    return (
      thumbnails?.maxres?.url ||
      thumbnails?.high?.url ||
      thumbnails?.medium?.url ||
      thumbnails?.default?.url ||
      "https://via.placeholder.com/640x360/191970/ffffff?text=Video+Thumbnail"
    );
  }

  function getBestBannerUrl(brandingSettings) {
    if (!brandingSettings?.image) return null;

    return (
      brandingSettings.image.bannerExternalUrl ||
      brandingSettings.image.bannerTvHighImageUrl ||
      brandingSettings.image.bannerTvMediumImageUrl ||
      brandingSettings.image.bannerTvLowImageUrl ||
      brandingSettings.image.bannerTabletHdImageUrl ||
      brandingSettings.image.bannerTabletImageUrl ||
      brandingSettings.image.bannerMobileHdImageUrl ||
      brandingSettings.image.bannerMobileMediumImageUrl ||
      brandingSettings.image.bannerMobileLowImageUrl ||
      null
    );
  }

  // Simplified embed URL function - NO MORE VIDEO SUGGESTIONS
  function getEmbedUrl(videoId, autoplay = true) {
    const params = new URLSearchParams({
      rel: "0", // Don't show related videos
      showinfo: "0", // Hide video info
      autoplay: autoplay ? "1" : "0",
      enablejsapi: "1", // Enable JS API
      modestbranding: "1", // Remove YouTube branding
      color: "white", // White progress bar
      controls: "1", // Show controls
      disablekb: "0", // Enable keyboard controls
      fs: "1", // Allow fullscreen
      iv_load_policy: "3", // Hide annotations
      loop: "0", // Don't loop
      playsinline: "1", // Play inline on mobile
      start: "0", // Start from beginning
      cc_load_policy: "0", // Don't show captions by default
      hl: "en", // Interface language
      origin: window.location.origin,
      widget_referrer: window.location.origin,
      // THESE ARE THE KEY PARAMETERS TO DISABLE SUGGESTIONS
      end_screen: "0", // Disable end screen
      rel: "0", // No related videos (repeated for emphasis)
      showinfo: "0", // No video info overlay
      branding: "0", // Remove YouTube branding
      autohide: "1", // Auto-hide controls
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }

  // Simplified video player - no more restriction checking or debug warnings
  async function playVideo(videoId, container, autoplay = true) {
    container.innerHTML = `
      <div class="video-loading">
        <div class="loading-spinner"></div>
        <p>Loading video...</p>
      </div>
    `;

    try {
      const embedUrl = getEmbedUrl(videoId, autoplay);

      container.innerHTML = `
        <iframe 
          src="${embedUrl}" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowfullscreen
          loading="lazy">
        </iframe>
      `;
    } catch (error) {
      console.error("Error playing video:", error);
      container.innerHTML = `
        <div class="video-unavailable">
          <div class="unavailable-content">
            <div class="unavailable-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h3>Video Unavailable</h3>
            <p>Unable to load this video.</p>
            <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer" class="watch-on-youtube">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.455 12 20.455 12 20.455s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Watch on YouTube
            </a>
          </div>
        </div>
      `;
    }
  }

  // API functions
  async function getChannelInfo() {
    try {
      const url = `${BASE_URL}/channels?part=snippet,statistics,brandingSettings&id=${CHANNEL_ID}&key=${API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      if (data.items && data.items.length > 0) {
        return data.items[0];
      }
      throw new Error("Channel not found");
    } catch (error) {
      console.warn("YouTube API failed, using fallback channel info:", error);
      return {
        snippet: {
          title: "Shain Studio AMV",
          description:
            "Welcome to my AMV editing channel! Creating dynamic anime music videos that blend storytelling with impactful visuals.",
          thumbnails: {
            high: { url: "images/Shain Studio.png" },
          },
        },
        statistics: {
          subscriberCount: "1200",
          videoCount: "25",
        },
        brandingSettings: {
          image: {
            bannerExternalUrl:
              "https://via.placeholder.com/2560x1440/191970/ffffff?text=Shain+Studio+AMV+Channel",
          },
        },
      };
    }
  }

  // Modified to fetch ALL videos at once
  async function getAllChannelVideos() {
    try {
      const channelUrl = `${BASE_URL}/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;
      const channelResponse = await fetch(channelUrl);

      if (!channelResponse.ok) {
        throw new Error(`HTTP error! status: ${channelResponse.status}`);
      }

      const channelData = await channelResponse.json();
      if (channelData.error) {
        throw new Error(channelData.error.message);
      }

      if (!channelData.items || channelData.items.length === 0) {
        throw new Error("Channel not found");
      }

      const uploadsPlaylistId =
        channelData.items[0].contentDetails.relatedPlaylists.uploads;
      let allVideos = [];
      let nextPageToken = "";

      // Fetch ALL videos by looping through all pages
      do {
        let videosUrl = `${BASE_URL}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${API_KEY}`;
        if (nextPageToken) videosUrl += `&pageToken=${nextPageToken}`;

        const videosResponse = await fetch(videosUrl);
        if (!videosResponse.ok)
          throw new Error(`HTTP error! status: ${videosResponse.status}`);

        const videosData = await videosResponse.json();
        if (videosData.error) throw new Error(videosData.error.message);

        if (videosData.items && videosData.items.length > 0) {
          allVideos = [...allVideos, ...videosData.items];
        }

        nextPageToken = videosData.nextPageToken;
      } while (nextPageToken);

      // Get detailed info for all videos
      if (allVideos.length > 0) {
        const videoIds = allVideos
          .map((item) => item.snippet.resourceId.videoId)
          .join(",");

        // Split into chunks of 50 (API limit)
        const chunks = [];
        for (let i = 0; i < videoIds.split(",").length; i += 50) {
          chunks.push(
            videoIds
              .split(",")
              .slice(i, i + 50)
              .join(",")
          );
        }

        for (const chunk of chunks) {
          const detailsUrl = `${BASE_URL}/videos?part=statistics,contentDetails,status&id=${chunk}&key=${API_KEY}`;
          const detailsResponse = await fetch(detailsUrl);

          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();

            allVideos = allVideos.map((item) => {
              const videoId = item.snippet.resourceId.videoId;
              const details = detailsData.items.find(
                (detail) => detail.id === videoId
              );

              return {
                ...item,
                statistics: details?.statistics || {},
                contentDetails: details?.contentDetails || {},
                status: details?.status || {},
              };
            });
          }
        }
      }

      return { items: allVideos };
    } catch (error) {
      console.warn("YouTube API failed, using mock videos:", error);
      const mockItems = mockVideos.map((video) => ({
        snippet: {
          resourceId: { videoId: video.videoId },
          title: video.title,
          description: video.description,
          thumbnails: { high: { url: video.thumbnail } },
          publishedAt: video.publishedAt,
          channelTitle: "Shain Studio",
        },
        statistics: {
          viewCount: video.views.replace(/[^\d]/g, "") || "0",
        },
        contentDetails: {
          duration: video.duration,
        },
        status: {
          embeddable: true,
          privacyStatus: "public",
        },
      }));

      return { items: mockItems };
    }
  }

  // Display functions
  function displayChannelInfo(channelData) {
    const { snippet, statistics, brandingSettings } = channelData;

    const bestBannerUrl = getBestBannerUrl(brandingSettings);
    if (bestBannerUrl) {
      channelBanner.src = bestBannerUrl;
      channelBanner.style.display = "block";
    }

    if (snippet.thumbnails?.high?.url) {
      channelAvatar.src = snippet.thumbnails.high.url;
    }

    channelTitle.textContent = snippet.title;

    const subscriberCount = formatViewCount(statistics.subscriberCount);
    const videoCount = statistics.videoCount;
    channelStats.textContent = `${subscriberCount} subscribers • ${videoCount} videos`;

    channelDescription.textContent =
      snippet.description || "Welcome to my AMV editing channel!";

    channelInfo.style.display = "block";
  }

  function setFeaturedVideo(video) {
    featuredVideoData = video;
    const videoId = video.snippet.resourceId.videoId;
    const { snippet, statistics } = video;

    featuredThumbnail.src = getThumbnailUrl(snippet.thumbnails);
    featuredThumbnail.alt = snippet.title;

    featuredTitleEl.textContent = snippet.title;

    const viewCount = statistics?.viewCount
      ? formatViewCount(statistics.viewCount)
      : "N/A";
    const publishedDate = formatPublishedDate(snippet.publishedAt);
    featuredStatsEl.textContent = `${viewCount} views • ${publishedDate}`;

    // Mobile-optimized description
    const description = snippet.description || "No description available.";
    if (isMobile() && description.length > 100) {
      featuredDescriptionEl.innerHTML = `
        <span class="description-preview">${description.substring(
          0,
          100
        )}...</span>
        <span class="description-full" style="display: none;">${description}</span>
        <button class="show-more-btn" onclick="toggleDescription(this)">Show More</button>
      `;
    } else {
      featuredDescriptionEl.textContent = description;
    }

    // Mobile-optimized tags
    const tags = ["AMV", "Anime", "Music Video"];
    if (isMobile()) {
      featuredTagsEl.innerHTML = `
        <div class="tags-preview">
          ${tags
            .slice(0, 2)
            .map((tag) => `<span class="tag">${tag}</span>`)
            .join("")}
          ${
            tags.length > 2
              ? `<button class="show-more-tags-btn" onclick="toggleTags(this)">+${
                  tags.length - 2
                } more</button>`
              : ""
          }
        </div>
        <div class="tags-full" style="display: none;">
          ${tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
        </div>
      `;
    } else {
      featuredTagsEl.innerHTML = tags
        .map((tag) => `<span class="tag">${tag}</span>`)
        .join("");
    }

    featuredVideo.dataset.videoId = videoId;
    featuredSection.style.display = "block";
  }

  // Simplified video item creation - NO MORE DEBUG WARNINGS
  function createVideoItem(video) {
    const videoId = video.snippet.resourceId.videoId;
    const { snippet, statistics, contentDetails } = video;

    const item = document.createElement("div");
    item.className = "video-item new";
    item.dataset.id = videoId;

    const thumbnailUrl = getThumbnailUrl(snippet.thumbnails);
    const duration = contentDetails?.duration
      ? formatDuration(contentDetails.duration)
      : "0:00";
    const viewCount = statistics?.viewCount
      ? formatViewCount(statistics.viewCount)
      : "N/A";
    const publishedDate = formatPublishedDate(snippet.publishedAt);

    item.innerHTML = `
      <div class="video-thumbnail-container">
        <img src="${thumbnailUrl}" alt="${snippet.title}" loading="lazy" />
        <span class="video-duration">${duration}</span>
        <div class="play-overlay">
          <div class="play-icon-small"></div>
        </div>
      </div>
      <div class="video-item-info">
        <div class="video-details">
          <h3>${snippet.title}</h3>
          <p class="video-channel">${snippet.channelTitle}</p>
          <p class="video-item-stats">${viewCount} views • ${publishedDate}</p>
        </div>
      </div>
    `;

    return item;
  }

  function openVideoModal(video) {
    const videoId = video.snippet.resourceId.videoId;
    const { snippet, statistics } = video;

    modalTitle.textContent = snippet.title;

    const viewCount = statistics?.viewCount
      ? formatViewCount(statistics.viewCount)
      : "N/A";
    const publishedDate = formatPublishedDate(snippet.publishedAt);
    modalStats.textContent = `${viewCount} views • ${publishedDate}`;

    // Mobile-optimized modal description
    const description = snippet.description || "No description available.";
    if (isMobile() && description.length > 150) {
      modalDescription.innerHTML = `
        <span class="description-preview">${description.substring(
          0,
          150
        )}...</span>
        <span class="description-full" style="display: none;">${description}</span>
        <button class="show-more-btn" onclick="toggleModalDescription(this)">Show More</button>
      `;
    } else {
      modalDescription.textContent = description;
    }

    // Mobile-optimized modal tags
    const tags = ["AMV", "Anime", "Music Video"];
    if (isMobile()) {
      modalTags.innerHTML = `
        <div class="tags-preview">
          ${tags
            .slice(0, 3)
            .map((tag) => `<span class="tag">${tag}</span>`)
            .join("")}
          ${
            tags.length > 3
              ? `<button class="show-more-tags-btn" onclick="toggleModalTags(this)">+${
                  tags.length - 3
                } more</button>`
              : ""
          }
        </div>
        <div class="tags-full" style="display: none;">
          ${tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
        </div>
      `;
    } else {
      modalTags.innerHTML = tags
        .map((tag) => `<span class="tag">${tag}</span>`)
        .join("");
    }

    playVideo(videoId, iframeContainer, true);

    videoModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeVideoModal() {
    videoModal.classList.remove("active");
    document.body.style.overflow = "";
    iframeContainer.innerHTML = "";
  }

  function renderVideoGrid() {
    videoGrid.innerHTML = "";

    allVideos.forEach((video, index) => {
      const item = createVideoItem(video);
      item.style.animationDelay = `${index * 0.1}s`;
      videoGrid.appendChild(item);
    });

    // Hide load more button since we load everything at once
    const loadMoreBtn = document.getElementById("load-more");
    if (loadMoreBtn) {
      loadMoreBtn.style.display = "none";
    }
  }

  function showLoading() {
    loadingContainer.style.display = "flex";
    errorContainer.style.display = "none";
    if (videoGrid) videoGrid.style.display = "none";
    if (channelInfo) channelInfo.style.display = "none";
    if (featuredSection) featuredSection.style.display = "none";
  }

  function hideLoading() {
    loadingContainer.style.display = "none";
    if (videoGrid) videoGrid.style.display = "grid";
  }

  function showError(message) {
    loadingContainer.style.display = "none";
    errorContainer.style.display = "block";
    errorText.textContent = message;
    if (videoGrid) videoGrid.style.display = "none";
    if (channelInfo) channelInfo.style.display = "none";
    if (featuredSection) featuredSection.style.display = "none";
  }

  // Main load function - now loads ALL videos at once
  async function loadInitialData() {
    console.log("Loading all videos...");
    showLoading();

    try {
      const [channelInfoData, videosData] = await Promise.all([
        getChannelInfo(),
        getAllChannelVideos(),
      ]);

      console.log("Data loaded successfully:", { channelInfoData, videosData });

      displayChannelInfo(channelInfoData);

      if (videosData.items && videosData.items.length > 0) {
        setFeaturedVideo(videosData.items[0]);
        allVideos = videosData.items.slice(1);
        renderVideoGrid();
      }

      hideLoading();
    } catch (error) {
      console.error("Error loading data:", error);
      showError("Failed to load videos. Please try again later.");
    }
  }

  // Global functions for mobile toggle functionality
  window.toggleDescription = (button) => {
    const container = button.parentElement;
    const preview = container.querySelector(".description-preview");
    const full = container.querySelector(".description-full");

    if (full.style.display === "none") {
      preview.style.display = "none";
      full.style.display = "inline";
      button.textContent = "Show Less";
    } else {
      preview.style.display = "inline";
      full.style.display = "none";
      button.textContent = "Show More";
    }
  };

  window.toggleTags = (button) => {
    const container = button.closest(".video-tags");
    const preview = container.querySelector(".tags-preview");
    const full = container.querySelector(".tags-full");

    if (full.style.display === "none") {
      preview.style.display = "none";
      full.style.display = "flex";
    } else {
      preview.style.display = "flex";
      full.style.display = "none";
    }
  };

  window.toggleModalDescription = (button) => {
    const container = button.parentElement;
    const preview = container.querySelector(".description-preview");
    const full = container.querySelector(".description-full");

    if (full.style.display === "none") {
      preview.style.display = "none";
      full.style.display = "inline";
      button.textContent = "Show Less";
    } else {
      preview.style.display = "inline";
      full.style.display = "none";
      button.textContent = "Show More";
    }
  };

  window.toggleModalTags = (button) => {
    const container = button.closest(".modal-video-info");
    const tagsContainer = container.querySelector("#modal-tags");
    const preview = tagsContainer.querySelector(".tags-preview");
    const full = tagsContainer.querySelector(".tags-full");

    if (full.style.display === "none") {
      preview.style.display = "none";
      full.style.display = "flex";
    } else {
      preview.style.display = "flex";
      full.style.display = "none";
    }
  };

  // Event Listeners
  if (videoGrid) {
    videoGrid.addEventListener("click", (event) => {
      const item = event.target.closest(".video-item");
      if (!item) return;

      const videoId = item.dataset.id;
      const video = allVideos.find(
        (v) => v.snippet.resourceId.videoId === videoId
      );

      if (video) {
        openVideoModal(video);
      }
    });
  }

  if (featuredVideo) {
    featuredVideo.addEventListener("click", () => {
      if (featuredVideoData) {
        playVideo(
          featuredVideoData.snippet.resourceId.videoId,
          featuredPlayerContainer,
          true
        );
      }
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", closeVideoModal);
  }

  if (retryBtn) {
    retryBtn.addEventListener("click", loadInitialData);
  }

  if (videoModal) {
    videoModal.addEventListener("click", (event) => {
      if (event.target === videoModal) {
        closeVideoModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      videoModal &&
      videoModal.classList.contains("active")
    ) {
      closeVideoModal();
    }
  });

  // Initialize
  console.log("Starting AMV Portfolio initialization...");
  loadInitialData();
});
