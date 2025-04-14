document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const videoGrid = document.getElementById("video-grid");
  const videoModal = document.getElementById("video-modal");
  const modalClose = document.querySelector(".modal-close");
  const modalTitle = document.getElementById("modal-title");
  const modalStats = document.getElementById("modal-stats");
  const modalDescription = document.getElementById("modal-description");
  const modalTags = document.getElementById("modal-tags");
  const loadMoreBtn = document.getElementById("load-more");
  const featuredVideo = document.querySelector(".video-player");
  const iframeContainer = document.querySelector(
    ".responsive-iframe-container"
  );

  // State
  let page = 1;
  const videosPerPage = 8;

  // Sample data (will be replaced with API data later)
  const sampleVideos = [
    {
      id: 1,
      title: "Battle Symphony - Attack on Titan",
      thumbnail: "https://via.placeholder.com/640x360?text=Action+AMV",
      duration: "3:45",
      channel: "Action Series",
      views: "8.5K",
      published: "2 months ago",
      description:
        "An intense compilation of the most epic battle scenes from Attack on Titan, synchronized with a powerful orchestral soundtrack.",
      tags: ["Action", "Attack on Titan", "Battle"],
      isPortrait: false,
    },
    {
      id: 2,
      title: "Emotional Journey - Violet Evergarden",
      thumbnail: "https://via.placeholder.com/640x360?text=Drama+AMV",
      duration: "4:12",
      channel: "Drama Series",
      views: "6.2K",
      published: "5 months ago",
      description:
        "A touching tribute to the emotional journey of Violet Evergarden, highlighting the character's growth and the series' beautiful animation.",
      tags: ["Drama", "Violet Evergarden", "Emotional"],
      isPortrait: false,
    },
    {
      id: 3,
      title: "Laugh Track - Konosuba",
      thumbnail: "https://via.placeholder.com/360x640?text=Comedy+AMV",
      duration: "2:58",
      channel: "Comedy Series",
      views: "7.8K",
      published: "1 month ago",
      description:
        "A hilarious compilation of the funniest moments from Konosuba, set to upbeat music that enhances the comedic timing.",
      tags: ["Comedy", "Konosuba", "Humor"],
      isPortrait: true,
    },
    {
      id: 4,
      title: "Love Story - Your Name",
      thumbnail: "https://via.placeholder.com/640x360?text=Romance+AMV",
      duration: "5:21",
      channel: "Romance Series",
      views: "12.3K",
      published: "4 months ago",
      description:
        "A romantic montage showcasing the beautiful love story from Your Name, emphasizing the emotional connection between the characters.",
      tags: ["Romance", "Your Name", "Love"],
      isPortrait: false,
    },
    {
      id: 5,
      title: "Power Unleashed - My Hero Academia",
      thumbnail: "https://via.placeholder.com/640x360?text=Action+AMV+2",
      duration: "4:05",
      channel: "Action Series",
      views: "9.1K",
      published: "3 months ago",
      description:
        "A dynamic showcase of the most powerful moments from My Hero Academia, featuring the incredible quirks and abilities of the characters.",
      tags: ["Action", "My Hero Academia", "Superpower"],
      isPortrait: false,
    },
    {
      id: 6,
      title: "Silent Tears - Tokyo Ghoul",
      thumbnail: "https://via.placeholder.com/360x640?text=Drama+AMV+2",
      duration: "3:37",
      channel: "Drama Series",
      views: "5.7K",
      published: "2 months ago",
      description:
        "A haunting exploration of the tragic elements of Tokyo Ghoul, focusing on the internal struggles of the main character.",
      tags: ["Drama", "Tokyo Ghoul", "Tragedy"],
      isPortrait: true,
    },
    {
      id: 7,
      title: "Slice of Life - Laid-Back Camp",
      thumbnail: "https://via.placeholder.com/640x360?text=Comedy+AMV+2",
      duration: "3:15",
      channel: "Comedy Series",
      views: "4.3K",
      published: "6 months ago",
      description:
        "A relaxing compilation of the cozy moments from Laid-Back Camp, perfect for unwinding and enjoying the simple pleasures of life.",
      tags: ["Comedy", "Laid-Back Camp", "Slice of Life"],
      isPortrait: false,
    },
    {
      id: 8,
      title: "Eternal Bond - Weathering With You",
      thumbnail: "https://via.placeholder.com/360x640?text=Romance+AMV+2",
      duration: "4:48",
      channel: "Romance Series",
      views: "10.5K",
      published: "5 months ago",
      description:
        "A beautiful tribute to the emotional connection between the main characters in Weathering With You, set against stunning visual backgrounds.",
      tags: ["Romance", "Weathering With You", "Makoto Shinkai"],
      isPortrait: true,
    },
    {
      id: 9,
      title: "Samurai Spirit - Demon Slayer",
      thumbnail: "https://via.placeholder.com/640x360?text=Action+AMV+3",
      duration: "3:52",
      channel: "Action Series",
      views: "15.2K",
      published: "1 month ago",
      description:
        "An action-packed tribute to the incredible sword fighting sequences in Demon Slayer, highlighting the unique animation style.",
      tags: ["Action", "Demon Slayer", "Samurai"],
      isPortrait: false,
    },
    {
      id: 10,
      title: "Psychological Depths - Neon Genesis Evangelion",
      thumbnail: "https://via.placeholder.com/360x640?text=Drama+AMV+3",
      duration: "5:05",
      channel: "Drama Series",
      views: "7.9K",
      published: "7 months ago",
      description:
        "A deep dive into the psychological aspects of Neon Genesis Evangelion, exploring the complex themes and character development.",
      tags: ["Drama", "Evangelion", "Psychological"],
      isPortrait: true,
    },
    {
      id: 11,
      title: "Daily Chaos - Nichijou",
      thumbnail: "https://via.placeholder.com/640x360?text=Comedy+AMV+3",
      duration: "2:42",
      channel: "Comedy Series",
      views: "6.1K",
      published: "3 months ago",
      description:
        "A fast-paced compilation of the absurd and hilarious moments from Nichijou, showcasing the unique comedy style of the series.",
      tags: ["Comedy", "Nichijou", "Absurd"],
      isPortrait: false,
    },
    {
      id: 12,
      title: "First Love - Toradora",
      thumbnail: "https://via.placeholder.com/640x360?text=Romance+AMV+3",
      duration: "4:27",
      channel: "Romance Series",
      views: "8.7K",
      published: "4 months ago",
      description:
        "A sweet montage of the developing romance in Toradora, capturing the essence of first love and the growth of the characters.",
      tags: ["Romance", "Toradora", "School"],
      isPortrait: false,
    },
  ];

  // Featured video data
  const featuredVideoData = {
    title: "Epic Battle Sequences - Demon Slayer",
    views: "10.2K",
    published: "3 months ago",
    description:
      "A dynamic compilation of the most intense battle sequences from Demon Slayer, synchronized with an epic orchestral soundtrack to highlight the stunning animation and emotional impact of each scene.",
    tags: ["Action", "Demon Slayer", "Battle"],
  };

  // Functions
  function createVideoItem(video) {
    const item = document.createElement("div");
    item.className = "video-item new";
    item.dataset.id = video.id;

    item.innerHTML = `
        <div class="video-thumbnail-container ${
          video.isPortrait ? "portrait" : ""
        }">
          <img src="${video.thumbnail}" alt="${
      video.title
    } thumbnail" loading="lazy" onload="handleImageLoad(this)" />
          <span class="video-duration">${video.duration}</span>
          <div class="play-overlay">
            <div class="play-icon-small"></div>
          </div>
        </div>
        <div class="video-item-info">
          <div class="channel-avatar">
            <img src="https://via.placeholder.com/40x40" alt="Channel avatar" />
          </div>
          <div class="video-details">
            <h3>${video.title}</h3>
            <p class="video-channel">${video.channel}</p>
            <p class="video-item-stats">${video.views} views • ${
      video.published
    }</p>
          </div>
        </div>
      `;

    return item;
  }

  function openVideoModal(video) {
    modalTitle.textContent = video.title;
    modalStats.textContent = `${video.views} views • ${video.published}`;
    modalDescription.textContent = video.description;

    // Clear and add tags
    modalTags.innerHTML = "";
    video.tags.forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.className = "tag";
      tagElement.textContent = tag;
      modalTags.appendChild(tagElement);
    });

    // In a real implementation, this would embed a video player
    // For now, we'll show a placeholder message
    iframeContainer.innerHTML = `
        <div class="placeholder-message">
          <p>Video player would load here when connected to your video hosting service.</p>
          <p>Title: ${video.title}</p>
        </div>
      `;

    videoModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeVideoModal() {
    videoModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  function loadMoreVideos() {
    // In a real implementation, this would fetch from an API
    // For now, we'll simulate by showing more of our sample data
    const startIndex = page * videosPerPage;
    const endIndex = Math.min(startIndex + videosPerPage, sampleVideos.length);

    if (startIndex >= sampleVideos.length) {
      loadMoreBtn.style.display = "none";
      return;
    }

    for (let i = startIndex; i < endIndex; i++) {
      if (sampleVideos[i]) {
        const item = createVideoItem(sampleVideos[i]);
        videoGrid.appendChild(item);
      }
    }

    page++;

    if (endIndex >= sampleVideos.length) {
      loadMoreBtn.style.display = "none";
    }

    // Remove the 'new' class after animation completes
    setTimeout(() => {
      document.querySelectorAll(".video-item.new").forEach((item) => {
        item.classList.remove("new");
      });
    }, 500);
  }

  // Event Listeners
  videoGrid.addEventListener("click", (event) => {
    const item = event.target.closest(".video-item");
    if (!item) return;

    const videoId = Number.parseInt(item.dataset.id);
    const video = sampleVideos.find((v) => v.id === videoId);

    if (video) {
      openVideoModal(video);
    }
  });

  featuredVideo.addEventListener("click", () => {
    openVideoModal({
      ...featuredVideoData,
      id: 0,
      views: featuredVideoData.views,
      published: featuredVideoData.published,
    });
  });

  modalClose.addEventListener("click", closeVideoModal);
  loadMoreBtn.addEventListener("click", loadMoreVideos);

  // Close modal when clicking outside the content
  videoModal.addEventListener("click", (event) => {
    if (event.target === videoModal) {
      closeVideoModal();
    }
  });

  // Keyboard navigation
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && videoModal.classList.contains("active")) {
      closeVideoModal();
    }
  });

  // Prepare for future API integration
  // This function would be used to fetch data from Strapi/Cloudinary
  async function fetchVideosFromAPI() {
    try {
      // This will be implemented later when the API is ready
      // const response = await fetch('your-strapi-api-endpoint');
      // const data = await response.json();
      // return data;

      // For now, return sample data
      return sampleVideos;
    } catch (error) {
      console.error("Error fetching videos:", error);
      return [];
    }
  }
});
