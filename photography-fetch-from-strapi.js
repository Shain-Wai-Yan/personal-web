/**
 * Photography Fetch from Strapi
 * Optimized for performance, image quality, and mobile responsiveness
 */

document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const masonryGrid = document.getElementById("masonry-grid");
    const photoLightbox = document.getElementById("photo-lightbox");
    const loadMoreBtn = document.getElementById("load-more");
    const filterButtons = document.querySelectorAll(".filter-button");
    const searchInput = document.getElementById("photo-search");
  
    // Related photos elements
    const relatedPhotosOverlay = document.getElementById(
      "related-photos-overlay"
    );
    const relatedPhotosContainer = document.getElementById(
      "related-photos-container"
    );
    const relatedPhotosClose = document.getElementById("related-photos-close");
  
    // State
    let currentIndex = 0;
    let galleryItems = [];
    let page = 1;
    const pageSize = 12;
    const activeItem = null;
    let relatedPhotosActive = false;
    let isLoading = false;
    let allPhotos = [];
    let filteredPhotos = [];
    const categories = [];
    const tags = [];
    const preloadedImages = {};
    let lastScrollPosition = 0;
    let navigationDirection = 0;
    let hasMorePhotos = true;
  
    // API Configuration
    const API_URL = "https://backend-cms-89la.onrender.com/api";
  
    // Responsive image sizes for different devices
    const IMAGE_SIZES = {
      thumbnail: 400,
      small: 800,
      medium: 1200,
      large: 1600,
      xlarge: 2000,
    };
  
    // Cache control - set TTL in milliseconds (1 hour)
    const CACHE_TTL = 60 * 60 * 1000;
    const CACHE_KEY_PHOTOS = "strapi_photos_cache";
    const CACHE_KEY_CATEGORIES = "strapi_categories_cache";
    const CACHE_KEY_TAGS = "strapi_tags_cache";
    const CACHE_KEY_TIMESTAMP = "strapi_cache_timestamp";
  
    // Debug Strapi response structure
    function debugStrapiResponse(response) {
      console.group("Strapi API Response Debug");
      console.log(
        "Response structure:",
        JSON.stringify(response, null, 2).substring(0, 500) + "..."
      );
  
      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        const firstItem = response.data[0];
        console.log("First item ID:", firstItem.id);
        console.log("First item attributes:", firstItem.attributes);
  
        if (firstItem.attributes?.image?.data) {
          console.log("Image data:", firstItem.attributes.image.data);
        }
      }
  
      console.log("Pagination info:", response.meta?.pagination);
      console.groupEnd();
    }
  
    // Helper Functions
    function setAspectRatio(img, container) {
      const ratio = img.naturalWidth / img.naturalHeight;
      container.style.setProperty("--img-ratio", ratio);
    }
  
    // FIXED: Updated to match the new grid-auto-rows value in CSS
    function calculateRowSpan(element) {
      const ROW_HEIGHT = 10; // FIXED: Match CSS grid-auto-rows (changed back to 10px)
      const height = element.getBoundingClientRect().height;
      return Math.ceil(height / ROW_HEIGHT);
    }
  
    // Cache management
    function saveToCache(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
      } catch (error) {
        console.warn("Cache storage failed:", error);
      }
    }
  
    function getFromCache(key) {
      try {
        const timestamp = localStorage.getItem(CACHE_KEY_TIMESTAMP);
        if (!timestamp || Date.now() - Number.parseInt(timestamp) > CACHE_TTL) {
          // Cache expired
          return null;
        }
  
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.warn("Cache retrieval failed:", error);
        return null;
      }
    }
  
    function clearCache() {
      try {
        localStorage.removeItem(CACHE_KEY_PHOTOS);
        localStorage.removeItem(CACHE_KEY_CATEGORIES);
        localStorage.removeItem(CACHE_KEY_TAGS);
        localStorage.removeItem(CACHE_KEY_TIMESTAMP);
      } catch (error) {
        console.warn("Cache clearing failed:", error);
      }
    }
  
    // FIXED: Image optimization function that properly handles Cloudinary URLs
    function getOptimizedImageUrl(url, width, aspectRatio = "landscape") {
      if (!url || url.startsWith("data:")) {
        // Create an adaptive placeholder based on aspect ratio
        return createAdaptivePlaceholder(width, aspectRatio);
      }
  
      try {
        // Check if it's a Cloudinary URL
        if (url.includes("cloudinary.com")) {
          // Don't modify the URL if it already contains transformation parameters
          if (url.includes("/upload/c_") || url.includes("/upload/w_")) {
            return url;
          }
  
          // Split the URL at the /upload/ part
          const parts = url.split("/upload/");
          if (parts.length < 2) return url;
  
          // Insert transformation parameters - use c_fill to maintain aspect ratio
          return `${parts[0]}/upload/c_fill,w_${width},q_auto:good,f_auto/${parts[1]}`;
        }
  
        // For Strapi local uploads, we can't transform them
        // Just return the original URL
        console.log("Using original URL (non-Cloudinary):", url);
        return url;
      } catch (error) {
        console.warn("Image URL optimization failed:", error);
        return createAdaptivePlaceholder(width, aspectRatio);
      }
    }
  
    // Create adaptive placeholder based on image dimensions and aspect ratio
    function createAdaptivePlaceholder(width, aspectRatio = "landscape") {
      // Default height based on common aspect ratios
      let height;
      let ratio;
  
      if (typeof aspectRatio === "number") {
        // If aspectRatio is already a number, use it directly
        ratio = aspectRatio;
      } else {
        // Otherwise, use predefined ratios based on format names
        switch (aspectRatio.toLowerCase()) {
          case "portrait":
            ratio = 0.75; // 3:4 aspect ratio
            break;
          case "square":
            ratio = 1; // 1:1 aspect ratio
            break;
          case "panorama":
            ratio = 2.5; // 5:2 aspect ratio
            break;
          case "wide":
            ratio = 1.85; // 16:9 aspect ratio (approximately)
            break;
          case "landscape":
          default:
            ratio = 1.5; // 3:2 aspect ratio (standard landscape)
            break;
        }
      }
  
      height = Math.round(width / ratio);
  
      // Create SVG with the correct dimensions
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <rect width="100%" height="100%" fill="url(#gradient)"/>
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f8f8f8" />
            <stop offset="50%" stop-color="#f0f0f0" />
            <stop offset="100%" stop-color="#e8e8e8" />
          </linearGradient>
        </defs>
        <text x="50%" y="50%" font-family="Arial" font-size="${Math.max(
          width / 20,
          14
        )}" text-anchor="middle" dominant-baseline="middle" fill="#999">Loading...</text>
      </svg>`;
  
      // Convert SVG to data URL
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }
  
    // Get responsive image size based on viewport and device
    function getResponsiveImageSize() {
      const width = window.innerWidth;
      const pixelRatio = window.devicePixelRatio || 1;
  
      // Adjust size based on screen width and pixel ratio
      if (width < 768) {
        return Math.min(width * pixelRatio, IMAGE_SIZES.small);
      } else if (width < 1200) {
        return Math.min(width * 0.5 * pixelRatio, IMAGE_SIZES.medium);
      } else {
        return Math.min(width * 0.33 * pixelRatio, IMAGE_SIZES.large);
      }
    }
  
    // Preload images for smoother transitions
    function preloadImage(src) {
      if (preloadedImages[src]) return preloadedImages[src];
  
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // FIXED: Add CORS support
        img.onload = () => {
          preloadedImages[src] = img;
          resolve(img);
        };
        img.onerror = reject;
        img.src = src;
      });
    }
  
    // Preload adjacent images
    function preloadAdjacentImages(currentIndex) {
      if (galleryItems.length <= 1) return;
  
      const nextIndex = (currentIndex + 1) % galleryItems.length;
      const prevIndex =
        (currentIndex - 1 + galleryItems.length) % galleryItems.length;
  
      const nextImg = galleryItems[nextIndex].querySelector("img");
      const prevImg = galleryItems[prevIndex].querySelector("img");
  
      preloadImage(nextImg.src);
      preloadImage(prevImg.src);
    }
  
    // Calculate original position for zoom animation
    function getImagePosition(item) {
      const rect = item
        .querySelector(".masonry-image-container")
        .getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
  
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        // Calculate origin point as percentage
        originX: ((rect.left + rect.width / 2) / windowWidth) * 100,
        originY: ((rect.top + rect.height / 2) / windowHeight) * 100,
      };
    }
  
    // FIXED: API Functions with improved error handling
    async function fetchPhotos(page = 1, pageSize = 12) {
      try {
        // Show loading state
        const loadingIndicator = document.createElement("div");
        loadingIndicator.className = "loading-indicator";
        loadingIndicator.innerHTML =
          '<div class="loading-spinner"></div><p>Loading photos...</p>';
  
        if (masonryGrid.children.length === 0) {
          masonryGrid.appendChild(loadingIndicator);
        }
  
        // Check cache first
        const cachedPhotos = getFromCache(CACHE_KEY_PHOTOS);
        if (cachedPhotos) {
          console.log("Using cached photos data");
          return cachedPhotos;
        }
  
        // Updated for Strapi v5.12 - simplified populate syntax
        const url = `${API_URL}/photographies?pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc&populate=*`;
  
        console.log(`Fetching photos from: ${url}`);
  
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
          },
        });
  
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
  
        const data = await response.json();
        console.log("API Response:", data); // Debug log
  
        // Add detailed debug logging
        debugStrapiResponse(data);
  
        // Save to cache
        saveToCache(CACHE_KEY_PHOTOS, data);
  
        return data;
      } catch (error) {
        console.error("Error fetching photos:", error);
  
        // Show error in the grid
        if (masonryGrid.querySelector(".loading-indicator")) {
          masonryGrid.querySelector(".loading-indicator").remove();
        }
  
        const errorMessage = document.createElement("div");
        errorMessage.className = "error-message";
        errorMessage.innerHTML = `
          <p>Error loading photos: ${error.message}</p>
          <p>Please check your network connection and try again.</p>
          <button class="retry-button">Retry</button>
        `;
        masonryGrid.appendChild(errorMessage);
  
        // Add retry button functionality
        errorMessage
          .querySelector(".retry-button")
          .addEventListener("click", () => {
            errorMessage.remove();
            loadPhotos();
          });
  
        // Return empty data structure
        return { data: [], meta: { pagination: { total: 0, pageCount: 0 } } };
      }
    }
  
    async function fetchCategories() {
      try {
        // Check cache first
        const cachedCategories = getFromCache(CACHE_KEY_CATEGORIES);
        if (cachedCategories) {
          console.log("Using cached categories data");
          return cachedCategories;
        }
  
        // Updated for Strapi v5.12
        const response = await fetch(`${API_URL}/categories?populate=*`);
  
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
  
        const data = await response.json();
        console.log("Categories data:", data); // Debug log
  
        // Save to cache
        saveToCache(CACHE_KEY_CATEGORIES, data);
  
        return data;
      } catch (error) {
        console.error("Error fetching categories:", error);
        return { data: [] };
      }
    }
  
    async function fetchTags() {
      try {
        // Check cache first
        const cachedTags = getFromCache(CACHE_KEY_TAGS);
        if (cachedTags) {
          console.log("Using cached tags data");
          return cachedTags;
        }
  
        // Updated for Strapi v5.12
        const response = await fetch(`${API_URL}/tags?populate=*`);
  
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
  
        const data = await response.json();
        console.log("Tags data:", data); // Debug log
  
        // Save to cache
        saveToCache(CACHE_KEY_TAGS, data);
  
        return data;
      } catch (error) {
        console.error("Error fetching tags:", error);
        return { data: [] };
      }
    }
  
    // FIXED: Transform Strapi data to our format with improved URL handling
    function transformPhotoData(strapiPhotos) {
      if (!strapiPhotos || !Array.isArray(strapiPhotos)) {
        console.error("Invalid photos data:", strapiPhotos);
        return [];
      }
  
      return strapiPhotos.map((photo) => {
        // Debug log the photo structure
        console.log("Processing photo:", photo);
  
        try {
          // Initialize default values
          let imageUrl = "";
          let categoryName = "uncategorized";
          let photoTags = [];
          let title = "Untitled";
          let alt_text = "Photo";
          let location = "";
          let aspectRatio = "landscape"; // Default aspect ratio
  
          // Extract data from Strapi v5.12 structure
          if (photo.attributes) {
            // Basic photo information
            title = photo.attributes.title || "Untitled";
            alt_text =
              photo.attributes.alt_text || photo.attributes.title || "Photo";
            location = photo.attributes.location || "";
  
            // Get aspect ratio if available
            if (photo.attributes.aspect_ratio) {
              aspectRatio = photo.attributes.aspect_ratio;
            }
  
            // FIXED: Extract image URL - Updated for Strapi v5.12
            if (photo.attributes.image?.data?.attributes?.url) {
              imageUrl = photo.attributes.image.data.attributes.url;
              console.log("Found image URL:", imageUrl);
            } else if (
              photo.attributes.image?.data?.attributes?.formats?.large?.url
            ) {
              // Try to get the large format if available
              imageUrl = photo.attributes.image.data.attributes.formats.large.url;
              console.log("Found large format URL:", imageUrl);
            } else if (
              photo.attributes.image?.data?.attributes?.formats?.medium?.url
            ) {
              // Try to get the medium format if available
              imageUrl =
                photo.attributes.image.data.attributes.formats.medium.url;
              console.log("Found medium format URL:", imageUrl);
            } else if (
              photo.attributes.image?.data?.attributes?.formats?.small?.url
            ) {
              // Try to get the small format if available
              imageUrl = photo.attributes.image.data.attributes.formats.small.url;
              console.log("Found small format URL:", imageUrl);
            } else if (
              photo.attributes.image?.data?.attributes?.formats?.thumbnail?.url
            ) {
              // Try to get the thumbnail format if available
              imageUrl =
                photo.attributes.image.data.attributes.formats.thumbnail.url;
              console.log("Found thumbnail format URL:", imageUrl);
            }
  
            // Extract category - Updated for Strapi v5.12
            if (photo.attributes.category?.data?.attributes?.name) {
              categoryName =
                photo.attributes.category.data.attributes.name.toLowerCase();
            }
  
            // Extract tags - Updated for Strapi v5.12
            if (
              photo.attributes.tags?.data &&
              Array.isArray(photo.attributes.tags.data)
            ) {
              photoTags = photo.attributes.tags.data
                .filter((tag) => tag && tag.attributes)
                .map((tag) => tag.attributes.name.toLowerCase());
            }
          }
  
          // Ensure we have a valid image URL
          if (!imageUrl) {
            console.warn("No image URL found for photo:", photo);
            // Use inline SVG data URL instead of placeholder.svg
            imageUrl = createAdaptivePlaceholder(600, aspectRatio);
          }
  
          // Make sure the URL is absolute - UPDATED for Strapi v5.12
          if (imageUrl.startsWith("/")) {
            // Extract the base URL from API_URL (remove /api)
            const apiBase = API_URL.split("/api")[0];
            imageUrl = `${apiBase}${imageUrl}`;
            console.log("Converted to absolute URL:", imageUrl);
          }
  
          // FIXED: Don't create multiple versions of the same image
          // Use the original URL for all sizes, and let Cloudinary handle the transformations
          const originalUrl = imageUrl;
  
          // Create the photo object with all necessary data
          return {
            id: photo.id || Math.random().toString(36).substring(2, 9),
            title: title,
            alt_text: alt_text,
            location: location,
            src: originalUrl,
            aspectRatio: aspectRatio,
            category: categoryName,
            tags: photoTags,
            // Add responsive image URLs with aspect ratio - use the same URL for all sizes
            // and let the getOptimizedImageUrl function handle the transformations
            thumbnailSrc: getOptimizedImageUrl(
              originalUrl,
              IMAGE_SIZES.thumbnail,
              aspectRatio
            ),
            smallSrc: getOptimizedImageUrl(
              originalUrl,
              IMAGE_SIZES.small,
              aspectRatio
            ),
            mediumSrc: getOptimizedImageUrl(
              originalUrl,
              IMAGE_SIZES.medium,
              aspectRatio
            ),
            largeSrc: getOptimizedImageUrl(
              originalUrl,
              IMAGE_SIZES.large,
              aspectRatio
            ),
          };
        } catch (error) {
          console.error("Error transforming photo data:", error, photo);
          // Return a placeholder for failed photos using inline SVG
          const aspectRatio = photo.attributes?.aspect_ratio || "landscape";
          const fallbackSvg = createAdaptivePlaceholder(
            IMAGE_SIZES.medium,
            aspectRatio
          );
          return {
            id: photo.id || Math.random().toString(36).substring(2, 9),
            title: "Photo Load Error",
            alt_text: "Error loading photo",
            location: "",
            src: fallbackSvg,
            aspectRatio: aspectRatio,
            category: "uncategorized",
            tags: [],
            thumbnailSrc: fallbackSvg,
            smallSrc: fallbackSvg,
            mediumSrc: fallbackSvg,
            largeSrc: fallbackSvg,
          };
        }
      });
    }
  
    // FIXED: Handle image loading errors
    function handleImageLoadError(img, fallbackImage, item) {
      console.error("Image failed to load:", img.src);
  
      // Hide loading spinner
      const loadingElement = img
        .closest(".masonry-item")
        .querySelector(".image-loading");
      if (loadingElement) {
        loadingElement.style.display = "none";
      }
  
      // Show error placeholder
      img.src = fallbackImage;
      img.alt = "Error loading image";
  
      // Set a default aspect ratio
      const imageContainer = img.closest(".masonry-image-container");
      if (imageContainer) {
        imageContainer.style.setProperty("--img-ratio", "1.5");
        imageContainer.style.minHeight = "150px";
      }
  
      // Set minimum row span
      if (item) {
        item.style.gridRowEnd = "span 20"; // Minimum 20 rows (200px with 10px row height)
      }
    }
  
    // FIXED: Create masonry item with improved image loading and compact layout
    function createMasonryItem(photo) {
      const item = document.createElement("div");
      item.className = `masonry-item new`;
      item.dataset.id = photo.id;
      item.dataset.category = photo.category;
      item.dataset.tags = photo.tags.join(",");
      item.dataset.aspect = photo.aspectRatio; // FIXED: Add aspect ratio as data attribute
  
      // FIXED: Set default grid row span to ensure visibility
      item.style.gridRowEnd = "span 20"; // Default span of 20 rows (200px with 10px row height)
  
      // Determine appropriate image size based on viewport
      const responsiveSize = getResponsiveImageSize();
      const optimizedSrc =
        photo.mediumSrc ||
        getOptimizedImageUrl(photo.src, responsiveSize, photo.aspectRatio);
      const thumbnailSrc = photo.thumbnailSrc || optimizedSrc;
  
      // Log the image URLs for debugging
      console.log("Creating masonry item with image:", {
        original: photo.src,
        optimized: optimizedSrc,
        thumbnail: thumbnailSrc,
        aspectRatio: photo.aspectRatio,
      });
  
      // Use inline SVG as fallback for error images
      const fallbackImage = createAdaptivePlaceholder(
        responsiveSize,
        photo.aspectRatio
      );
  
      // FIXED: Simplified HTML structure to reduce vertical space
      item.innerHTML = `
    <div class="masonry-image-container">
      <div class="image-loading">
        <div class="loading-spinner"></div>
      </div>
      <img 
        src="${thumbnailSrc}" 
        data-src="${optimizedSrc}"
        alt="${photo.alt_text}" 
        loading="lazy" 
        class="lazy-image"
        crossorigin="anonymous"
      />
      <div class="photo-info-overlay">
        <h3>${photo.title}</h3>
        <p>${photo.location}</p>
      </div>
    </div>
    <div class="masonry-info">
      <h3 class="masonry-title">${photo.title}</h3>
      <p class="masonry-location">${photo.location}</p>
    </div>
  `;
  
      const imageContainer = item.querySelector(".masonry-image-container");
      const img = item.querySelector("img");
  
      // FIXED: Set aspect ratio based on photo data
      if (photo.aspectRatio) {
        switch (photo.aspectRatio.toLowerCase()) {
          case "portrait":
            imageContainer.style.setProperty("--img-ratio", "0.75");
            break;
          case "square":
            imageContainer.style.setProperty("--img-ratio", "1");
            break;
          case "panorama":
            imageContainer.style.setProperty("--img-ratio", "2.5");
            break;
          case "wide":
            imageContainer.style.setProperty("--img-ratio", "1.85");
            break;
          case "landscape":
          default:
            imageContainer.style.setProperty("--img-ratio", "1.5");
            break;
        }
      }
  
      // Handle image load event
      img.onload = () => {
        console.log("Image loaded successfully:", img.src);
        // Hide loading spinner
        item.querySelector(".image-loading").style.display = "none";
  
        // Set aspect ratio based on actual image dimensions
        if (img.naturalWidth && img.naturalHeight) {
          const ratio = img.naturalWidth / img.naturalHeight;
          imageContainer.style.setProperty("--img-ratio", ratio);
        }
  
        // Calculate and set row span
        const rowSpan = calculateRowSpan(item);
        item.style.gridRowEnd = `span ${Math.max(rowSpan, 20)}`; // Ensure minimum height
      };
  
      // Handle image error
      img.onerror = () => {
        handleImageLoadError(img, fallbackImage, item);
      };
  
      return item;
    }
  
    function updateGalleryItems() {
      galleryItems = Array.from(document.querySelectorAll(".masonry-item"));
    }
  
    // Create related images strip for lightbox
    function createRelatedStrip(currentIndex) {
      // Get current image data
      const currentItem = galleryItems[currentIndex];
      const currentCategory = currentItem.dataset.category;
      const currentTags = currentItem.dataset.tags.split(",");
  
      // Find related images (3-5 images with similar category or tags)
      const relatedIndices = galleryItems
        .map((item, index) => {
          if (index === currentIndex) return null; // Skip current image
  
          const itemCategory = item.dataset.category;
          const itemTags = item.dataset.tags.split(",");
  
          // Calculate relevance score (higher for same category and shared tags)
          let score = 0;
          if (itemCategory === currentCategory) score += 3;
  
          // Count shared tags
          const sharedTags = itemTags.filter((tag) => currentTags.includes(tag));
          score += sharedTags.length;
  
          return { index, score };
        })
        .filter((item) => item !== null)
        .sort((a, b) => b.score - a.score) // Sort by relevance
        .slice(0, 5) // Get top 5 related images
        .map((item) => item.index);
  
      // Always include adjacent images if we don't have enough related ones
      if (relatedIndices.length < 3) {
        const nextIndex = (currentIndex + 1) % galleryItems.length;
        const prevIndex =
          (currentIndex - 1 + galleryItems.length) % galleryItems.length;
  
        if (!relatedIndices.includes(nextIndex)) relatedIndices.push(nextIndex);
        if (!relatedIndices.includes(prevIndex)) relatedIndices.push(prevIndex);
      }
  
      // Create the related strip container if it doesn't exist
      let relatedStrip = document.querySelector(".related-strip");
      if (!relatedStrip) {
        relatedStrip = document.createElement("div");
        relatedStrip.className = "related-strip";
        document.querySelector(".lightbox-container").appendChild(relatedStrip);
  
        // Add touch event listeners for mobile swipe
        setupStripTouchScroll(relatedStrip);
      } else {
        relatedStrip.innerHTML = ""; // Clear existing thumbnails
      }
  
      // Add the current image and related images to the strip
      const allIndices = [currentIndex, ...relatedIndices].slice(0, 5);
  
      allIndices.forEach((index) => {
        const item = galleryItems[index];
        const img = item.querySelector("img");
        const ratio = img.naturalWidth / img.naturalHeight || 1.5;
  
        const thumb = document.createElement("div");
        thumb.className = `related-thumb ${
          index === currentIndex ? "active" : ""
        }`;
        thumb.dataset.index = index;
        thumb.style.setProperty("--thumb-ratio", ratio);
  
        // Use thumbnail size for the strip
        const thumbnailSrc = img.dataset.src || img.src;
        thumb.innerHTML = `<img src="${thumbnailSrc}" alt="${img.alt}" crossorigin="anonymous" />`;
  
        thumb.addEventListener("click", () => {
          if (index !== currentIndex) {
            // Determine direction for animation
            navigationDirection = index > currentIndex ? 1 : -1;
            openLightboxAt(index);
          }
        });
  
        relatedStrip.appendChild(thumb);
      });
  
      // Scroll to active thumbnail
      setTimeout(() => {
        const activeThumb = relatedStrip.querySelector(".related-thumb.active");
        if (activeThumb) {
          activeThumb.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }, 100);
  
      // Save scroll position
      lastScrollPosition = relatedStrip.scrollLeft;
    }
  
    // Function to close related photos overlay
    function closeRelatedPhotos() {
      if (relatedPhotosOverlay) {
        relatedPhotosOverlay.classList.remove("active");
      }
      relatedPhotosActive = false;
    }
  
    // Enhanced lightbox opening with zoom animation from clicked position
    async function openLightboxAt(index, sourceItem = null) {
      if (galleryItems.length === 0) return;
  
      // Close related photos if open
      if (relatedPhotosActive) {
        closeRelatedPhotos();
      }
  
      // Get the target item
      const targetIndex = index;
      currentIndex = targetIndex;
      const item = galleryItems[currentIndex];
      const img = item.querySelector("img");
      const title = item.querySelector(".masonry-title").textContent;
      const location = item.querySelector(".masonry-location").textContent;
  
      // Use high quality image for lightbox
      const highQualitySrc = img.dataset.src || img.src;
  
      // Preload the image for smoother transition
      await preloadImage(highQualitySrc);
  
      // Create or update the lightbox container
      let lightboxContainer = document.querySelector(".lightbox-container");
      let lightboxMain = document.querySelector(".lightbox-main");
      let lightboxImageContainer = document.querySelector(
        ".lightbox-image-container"
      );
      let lightboxInfo = document.querySelector(".lightbox-info");
      let lightboxNavigation = document.querySelector(".lightbox-navigation");
  
      if (!lightboxContainer) {
        // Create the new lightbox structure
        lightboxContainer = document.createElement("div");
        lightboxContainer.className = "lightbox-container";
  
        lightboxMain = document.createElement("div");
        lightboxMain.className = "lightbox-main";
  
        lightboxImageContainer = document.createElement("div");
        lightboxImageContainer.className = "lightbox-image-container";
  
        lightboxInfo = document.createElement("div");
        lightboxInfo.className = "lightbox-info";
        lightboxInfo.innerHTML = `
          <h3 id="lightbox-title"></h3>
          <p id="lightbox-location"></p>
        `;
  
        lightboxNavigation = document.createElement("div");
        lightboxNavigation.className = "lightbox-navigation";
        lightboxNavigation.innerHTML = `
          <button class="lightbox-prev" aria-label="Previous image">&lt;</button>
          <button class="lightbox-next" aria-label="Next image">&gt;</button>
        `;
  
        const lightboxClose = document.createElement("button");
        lightboxClose.className = "lightbox-close";
        lightboxClose.innerHTML = "&times;";
        lightboxClose.addEventListener("click", closeLightbox);
  
        // Add swipe indicator for mobile
        const swipeIndicator = document.createElement("div");
        swipeIndicator.className = "swipe-indicator";
        swipeIndicator.textContent = "Swipe to navigate";
  
        // Add pinch indicator for mobile
        const pinchIndicator = document.createElement("div");
        pinchIndicator.className = "pinch-indicator";
        pinchIndicator.textContent = "Pinch to zoom";
  
        // Assemble the structure
        const lightboxMainImage = document.createElement("img");
        lightboxMainImage.id = "lightbox-main-image";
        lightboxMainImage.crossOrigin = "anonymous"; // FIXED: Add CORS support
        lightboxImageContainer.appendChild(lightboxMainImage);
        lightboxMain.appendChild(lightboxImageContainer);
        lightboxMain.appendChild(lightboxInfo);
        lightboxMain.appendChild(lightboxNavigation);
        lightboxMain.appendChild(swipeIndicator);
        lightboxMain.appendChild(pinchIndicator);
  
        lightboxContainer.appendChild(lightboxMain);
        lightboxContainer.appendChild(lightboxClose);
  
        photoLightbox.appendChild(lightboxContainer);
  
        // Update element references
        const lightboxPrev = document.querySelector(".lightbox-prev");
        const lightboxNext = document.querySelector(".lightbox-next");
  
        // Add event listeners
        lightboxPrev.addEventListener("click", () => navigateLightbox(-1));
        lightboxNext.addEventListener("click", () => navigateLightbox(1));
  
        // Add touch event listeners for mobile
        setupTouchNavigation(lightboxMain);
      }
  
      // Get the main image and info elements
      const lightboxMainImage = document.getElementById("lightbox-main-image");
      const lightboxTitle = document.getElementById("lightbox-title");
      const lightboxLocation = document.getElementById("lightbox-location");
  
      // Set main image and info
      lightboxMainImage.src = highQualitySrc;
      lightboxMainImage.alt = img.alt;
      lightboxTitle.textContent = title;
      lightboxLocation.textContent = location;
  
      // Apply animation classes based on navigation direction
      lightboxImageContainer.classList.remove(
        "zooming-in",
        "zooming-out",
        "slide-from-left",
        "slide-from-right"
      );
  
      if (photoLightbox.classList.contains("active")) {
        // Already open, apply slide animation
        if (navigationDirection > 0) {
          lightboxImageContainer.classList.add("slide-from-right");
        } else if (navigationDirection < 0) {
          lightboxImageContainer.classList.add("slide-from-left");
        }
      } else {
        // Opening for the first time, apply zoom animation from clicked position
        if (sourceItem) {
          const position = getImagePosition(sourceItem);
          lightboxMainImage.style.setProperty(
            "--origin-x",
            `${position.originX}%`
          );
          lightboxMainImage.style.setProperty(
            "--origin-y",
            `${position.originY}%`
          );
        }
        lightboxImageContainer.classList.add("zooming-in");
  
        // Show swipe indicator on first open for mobile
        if (window.innerWidth <= 768) {
          const swipeIndicator = document.querySelector(".swipe-indicator");
          if (swipeIndicator) {
            swipeIndicator.classList.add("visible");
            setTimeout(() => {
              swipeIndicator.classList.remove("visible");
            }, 2000);
          }
  
          // Show pinch indicator
          const pinchIndicator = document.querySelector(".pinch-indicator");
          if (pinchIndicator) {
            pinchIndicator.classList.add("visible");
            setTimeout(() => {
              pinchIndicator.classList.remove("visible");
            }, 2000);
          }
        }
      }
  
      // Create related images strip
      createRelatedStrip(currentIndex);
  
      // Show lightbox if not already visible
      if (!photoLightbox.classList.contains("active")) {
        photoLightbox.classList.add("active");
        document.body.style.overflow = "hidden";
      }
  
      // Preload adjacent images for smoother navigation
      preloadAdjacentImages(currentIndex);
    }
  
    function closeLightbox() {
      const lightboxImageContainer = document.querySelector(
        ".lightbox-image-container"
      );
  
      // Apply zoom out animation
      lightboxImageContainer.classList.add("zooming-out");
  
      // Wait for animation to complete before hiding
      setTimeout(() => {
        photoLightbox.classList.remove("active");
        document.body.style.overflow = "";
      }, 500);
    }
  
    function navigateLightbox(direction) {
      navigationDirection = direction;
      const newIndex =
        (currentIndex + direction + galleryItems.length) % galleryItems.length;
      openLightboxAt(newIndex);
    }
  
    // Lazy loading with Intersection Observer
    function setupLazyLoading() {
      if ("IntersectionObserver" in window) {
        const imageObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  img.removeAttribute("data-src");
                  img.classList.remove("lazy-image");
                }
                imageObserver.unobserve(img);
              }
            });
          },
          {
            rootMargin: "200px", // Load images 200px before they come into view
            threshold: 0.01,
          }
        );
  
        // Observe all lazy images
        document.querySelectorAll("img.lazy-image").forEach((img) => {
          imageObserver.observe(img);
        });
  
        return imageObserver;
      } else {
        // Fallback for browsers that don't support IntersectionObserver
        loadAllImages();
        return null;
      }
    }
  
    // Fallback for older browsers
    function loadAllImages() {
      document.querySelectorAll("img.lazy-image").forEach((img) => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          img.classList.remove("lazy-image");
        }
      });
    }
  
    async function loadPhotos() {
      if (isLoading) return;
      isLoading = true;
  
      try {
        // Show loading indicator
        if (page === 1) {
          const loadingIndicator = document.createElement("div");
          loadingIndicator.className = "loading-indicator";
          loadingIndicator.innerHTML =
            '<div class="loading-spinner"></div><p>Loading photos...</p>';
  
          // Clear the grid first if it's the first page
          masonryGrid.innerHTML = "";
          masonryGrid.appendChild(loadingIndicator);
        }
  
        // Fetch photos from API with pagination
        const response = await fetchPhotos(page, pageSize);
        console.log("Processed API response:", response); // Debug log
  
        // Remove loading indicator
        const loadingIndicator = masonryGrid.querySelector(".loading-indicator");
        if (loadingIndicator) {
          loadingIndicator.remove();
        }
  
        // Check if we have more photos to load
        const pagination = response.meta?.pagination;
        hasMorePhotos = pagination && page < pagination.pageCount;
  
        // Transform Strapi data to our format
        const newPhotos = transformPhotoData(response.data);
        console.log("Transformed photos:", newPhotos); // Debug log
  
        // Add to our collection
        allPhotos = [...allPhotos, ...newPhotos];
        filteredPhotos = allPhotos;
  
        // Initially show all photos
  
        // Create and append masonry items
        if (newPhotos.length === 0) {
          // No photos found
          const noPhotosMessage = document.createElement("div");
          noPhotosMessage.className = "no-photos-message";
          noPhotosMessage.innerHTML =
            "<p>No photos found. Please try again later.</p>";
          masonryGrid.appendChild(noPhotosMessage);
        } else {
          newPhotos.forEach((photo) => {
            const item = createMasonryItem(photo);
            masonryGrid.appendChild(item);
          });
        }
  
        // Update gallery items array
        updateGalleryItems();
  
        // Setup lazy loading
        setupLazyLoading();
  
        // FIXED: Recalculate grid layout after images load
        setTimeout(() => {
          recalculateGrid();
  
          // Remove the 'new' class after animation completes
          document.querySelectorAll(".masonry-item.new").forEach((item) => {
            item.classList.remove("new");
          });
        }, 500);
  
        // Update load more button visibility
        if (loadMoreBtn) {
          loadMoreBtn.style.display = hasMorePhotos ? "block" : "none";
        }
  
        // Update infinite scroll trigger visibility
        const scrollTrigger = document.querySelector(".scroll-trigger");
        if (scrollTrigger) {
          scrollTrigger.style.display = hasMorePhotos ? "block" : "none";
          scrollTrigger.classList.remove("loading");
        }
      } catch (error) {
        console.error("Error loading photos:", error);
  
        // Show error message in the grid
        const errorMessage = document.createElement("div");
        errorMessage.className = "error-message";
        errorMessage.innerHTML = `
        <p>Error loading photos: ${error.message}</p>
        <button class="retry-button">Retry</button>
      `;
  
        // Remove loading indicator if exists
        const loadingIndicator = masonryGrid.querySelector(".loading-indicator");
        if (loadingIndicator) {
          loadingIndicator.remove();
        }
  
        masonryGrid.appendChild(errorMessage);
  
        // Add retry button functionality
        errorMessage
          .querySelector(".retry-button")
          .addEventListener("click", () => {
            errorMessage.remove();
            loadPhotos();
          });
      } finally {
        isLoading = false;
      }
    }
  
    // FIXED: Add function to recalculate grid layout
    function recalculateGrid() {
      const items = document.querySelectorAll(".masonry-item");
      items.forEach((item) => {
        const img = item.querySelector("img");
        const imageContainer = item.querySelector(".masonry-image-container");
  
        if (img.complete && img.naturalWidth > 0) {
          // Image is already loaded
          setAspectRatio(img, imageContainer);
          const rowSpan = calculateRowSpan(item);
          item.style.gridRowEnd = `span ${Math.max(rowSpan, 20)}`; // Ensure minimum height
        }
      });
    }
  
    function loadMorePhotos() {
      if (!isLoading && hasMorePhotos) {
        page++;
        loadPhotos();
      }
    }
  
    // Setup infinite scroll with Intersection Observer
    function setupInfiniteScroll() {
      // Create scroll trigger element if it doesn't exist
      if (!document.querySelector(".scroll-trigger")) {
        const scrollTrigger = document.createElement("div");
        scrollTrigger.className = "scroll-trigger";
        scrollTrigger.innerHTML = '<div class="scroll-trigger-spinner"></div>';
  
        // Insert after masonry grid
        masonryGrid.parentNode.insertBefore(
          scrollTrigger,
          masonryGrid.nextSibling
        );
  
        // Create and setup the observer
        const scrollObserver = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting && !isLoading && hasMorePhotos) {
              scrollTrigger.classList.add("loading");
              loadMorePhotos();
            }
          },
          {
            rootMargin: "200px", // Trigger 200px before reaching the end
            threshold: 0.1,
          }
        );
  
        scrollObserver.observe(scrollTrigger);
  
        // Hide the load more button if we're using infinite scroll
        if (loadMoreBtn) loadMoreBtn.style.display = "none";
      }
    }
  
    // Filter photos by category
    function filterPhotos(category) {
      if (category === "all") {
        filteredPhotos = allPhotos;
      } else {
        filteredPhotos = allPhotos.filter((photo) => {
          // Check if the photo's category matches the filter
          if (photo.category === category) return true;
  
          // Check if the photo's tags include the filter
          if (photo.tags.includes(category)) return true;
  
          // Special case for "sunset" category
          if (
            category === "sunset" &&
            (photo.category.includes("sunset") ||
              photo.category.includes("sunrise"))
          ) {
            return true;
          }
  
          // Special case for "cafe" category
          if (
            category === "cafe" &&
            (photo.category.includes("cafe") || photo.category.includes("bar"))
          ) {
            return true;
          }
  
          return false;
        });
      }
  
      // Clear grid and display filtered photos
      masonryGrid.innerHTML = "";
  
      if (filteredPhotos.length === 0) {
        // No photos in this category
        const noCategoryMessage = document.createElement("div");
        noCategoryMessage.className = "no-photos-message";
        noCategoryMessage.innerHTML = `<p>No photos found in the "${category}" category.</p>`;
        masonryGrid.appendChild(noCategoryMessage);
      } else {
        filteredPhotos.forEach((photo) => {
          const item = createMasonryItem(photo);
          masonryGrid.appendChild(item);
        });
      }
  
      // Update gallery items array
      updateGalleryItems();
  
      // Setup lazy loading for new items
      setupLazyLoading();
  
      // FIXED: Recalculate grid after filter
      setTimeout(recalculateGrid, 500);
    }
  
    // Search photos by title, location, or tags
    function searchPhotos(searchTerm) {
      if (!searchTerm) {
        // If search is cleared, restore current filter
        const activeFilter = document.querySelector(".filter-button.active")
          .dataset.filter;
        filterPhotos(activeFilter);
        return;
      }
  
      const normalizedSearchTerm = searchTerm.toLowerCase();
  
      // Filter from the current filtered set (respects category filters)
      const searchResults = filteredPhotos.filter(
        (photo) =>
          photo.title.toLowerCase().includes(normalizedSearchTerm) ||
          photo.location.toLowerCase().includes(normalizedSearchTerm) ||
          photo.tags.some((tag) => tag.includes(normalizedSearchTerm))
      );
  
      // Clear grid and display search results
      masonryGrid.innerHTML = "";
  
      if (searchResults.length === 0) {
        // No search results
        const noResultsMessage = document.createElement("div");
        noResultsMessage.className = "no-photos-message";
        noResultsMessage.innerHTML = `<p>No photos found matching "${searchTerm}".</p>`;
        masonryGrid.appendChild(noResultsMessage);
      } else {
        searchResults.forEach((photo) => {
          const item = createMasonryItem(photo);
          masonryGrid.appendChild(item);
        });
      }
  
      // Update gallery items array
      updateGalleryItems();
  
      // Setup lazy loading for new items
      setupLazyLoading();
  
      // FIXED: Recalculate grid after search
      setTimeout(recalculateGrid, 500);
    }
  
    // Setup touch scroll for related strip
    function setupStripTouchScroll(strip) {
      let isScrolling = false;
      let startX = 0;
      let scrollLeft = 0;
  
      strip.addEventListener("touchstart", (e) => {
        isScrolling = true;
        startX = e.touches[0].clientX - strip.offsetLeft;
        scrollLeft = strip.scrollLeft;
      });
  
      strip.addEventListener("touchmove", (e) => {
        if (!isScrolling) return;
        e.preventDefault();
        const x = e.touches[0].clientX - strip.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed multiplier
        strip.scrollLeft = scrollLeft - walk;
      });
  
      strip.addEventListener("touchend", () => {
        isScrolling = false;
  
        // Find the closest thumbnail to snap to
        const thumbs = strip.querySelectorAll(".related-thumb");
        let minDistance = Number.POSITIVE_INFINITY;
        let closestThumb = null;
  
        thumbs.forEach((thumb) => {
          const thumbRect = thumb.getBoundingClientRect();
          const stripRect = strip.getBoundingClientRect();
          const distance = Math.abs(
            thumbRect.left +
              thumbRect.width / 2 -
              (stripRect.left + stripRect.width / 2)
          );
  
          if (distance < minDistance) {
            minDistance = distance;
            closestThumb = thumb;
          }
        });
  
        if (closestThumb) {
          closestThumb.scrollIntoView({ behavior: "smooth", inline: "center" });
        }
      });
    }
  
    // Setup touch navigation for mobile
    function setupTouchNavigation(element) {
      let startX = 0;
      let startY = 0;
      let initialPinchDistance = 0;
      let currentScale = 1;
      let isDragging = false;
      let lastTapTime = 0;
  
      // Touch start event
      element.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
          // Single touch - prepare for swipe
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          isDragging = true;
  
          // Check for double tap
          const currentTime = new Date().getTime();
          const tapLength = currentTime - lastTapTime;
  
          if (tapLength < 300 && tapLength > 0) {
            // Double tap detected
            e.preventDefault();
  
            // Toggle zoom
            const mainImage = document.querySelector("#lightbox-main-image");
            if (mainImage) {
              if (currentScale === 1) {
                currentScale = 2;
                mainImage.style.transform = `scale(${currentScale})`;
              } else {
                currentScale = 1;
                mainImage.style.transform = "scale(1)";
              }
            }
          }
  
          lastTapTime = currentTime;
        } else if (e.touches.length === 2) {
          // Pinch gesture - prepare for zoom
          e.preventDefault();
          initialPinchDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      });
  
      // Touch move event
      element.addEventListener("touchmove", (e) => {
        if (isDragging && e.touches.length === 1) {
          // Handle drag/swipe
          const currentX = e.touches[0].clientX;
          const currentY = e.touches[0].clientY;
          const diffX = startX - currentX;
          const diffY = startY - currentY;
  
          // If horizontal swipe is more significant than vertical
          if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
            e.preventDefault(); // Prevent page scrolling
          }
        } else if (e.touches.length === 2) {
          // Handle pinch zoom
          e.preventDefault();
  
          const currentPinchDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
  
          if (initialPinchDistance > 0) {
            const pinchScale = currentPinchDistance / initialPinchDistance;
            currentScale = Math.min(Math.max(pinchScale, 0.5), 3); // Limit scale between 0.5 and 3
  
            const mainImage = document.querySelector("#lightbox-main-image");
            if (mainImage) {
              mainImage.style.transform = `scale(${currentScale})`;
            }
          }
        }
      });
  
      // Touch end event
      element.addEventListener("touchend", (e) => {
        if (isDragging) {
          const endX = e.changedTouches[0].clientX;
          const diffX = startX - endX;
  
          // Detect swipe direction if significant movement
          if (Math.abs(diffX) > 50) {
            if (diffX > 0) {
              // Swipe left - next image
              navigateLightbox(1);
            } else {
              // Swipe right - previous image
              navigateLightbox(-1);
            }
          }
  
          isDragging = false;
        }
  
        // Reset pinch zoom state
        initialPinchDistance = 0;
      });
    }
  
    // Initialize the gallery
    async function initGallery() {
      try {
        // Add CSS for loading and error states
        const style = document.createElement("style");
        style.textContent = `
      .loading-indicator, .error-message, .no-photos-message {
        width: 100%;
        padding: 2rem;
        text-align: center;
        background-color: #f8f9f9;
        border-radius: 8px;
        margin: 2rem 0;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(25, 25, 112, 0.3);
        border-radius: 50%;
        border-top-color: #191970;
        animation: spin 1s ease-in-out infinite;
        margin: 0 auto 1rem;
      }
      
      .error-message {
        color: #721c24;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
      }
      
      .retry-button {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background-color: #191970;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .refresh-button {
        position: absolute;
        right: 10px;
        top: 10px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: #f0f0f0;
        border: none;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .no-photos-message {
        color: #856404;
        background-color: #fff3cd;
        border: 1px solid #ffeeba;
      }
      
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `;
        document.head.appendChild(style);
  
        // Update category filters (use predefined ones)
        await updateCategoryFilters();
  
        // Fetch initial data
        await loadPhotos();
  
        // Setup infinite scroll
        setupInfiniteScroll();
  
        // Add event listeners
        if (loadMoreBtn) {
          loadMoreBtn.addEventListener("click", loadMorePhotos);
        }
  
        // Add search functionality
        if (searchInput) {
          let debounceTimeout;
          searchInput.addEventListener("input", () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
              const searchTerm = searchInput.value.toLowerCase();
              searchPhotos(searchTerm);
            }, 300); // Debounce search for better performance
          });
        }
  
        // Add click event for masonry grid
        masonryGrid.addEventListener("click", (event) => {
          const item = event.target.closest(".masonry-item");
          if (!item) return;
  
          // Open lightbox
          const index = galleryItems.indexOf(item);
          if (index !== -1) {
            openLightboxAt(index, item);
          }
        });
  
        // Add keyboard navigation
        document.addEventListener("keydown", (event) => {
          if (photoLightbox.classList.contains("active")) {
            switch (event.key) {
              case "Escape":
                closeLightbox();
                break;
              case "ArrowLeft":
                navigateLightbox(-1);
                break;
              case "ArrowRight":
                navigateLightbox(1);
                break;
            }
          }
        });
  
        // Add refresh button for clearing cache
        const searchContainer = document.querySelector(".search-container");
        if (searchContainer) {
          const refreshButton = document.createElement("button");
          refreshButton.className = "refresh-button";
          refreshButton.innerHTML = "↻";
          refreshButton.title = "Refresh photos";
          refreshButton.addEventListener("click", () => {
            clearCache();
            page = 1;
            allPhotos = [];
            filteredPhotos = [];
            loadPhotos();
          });
  
          searchContainer.style.position = "relative";
          searchContainer.appendChild(refreshButton);
        }
  
        // FIXED: Add window resize handler to recalculate grid
        window.addEventListener("resize", debounce(recalculateGrid, 200));
  
        // FIXED: Add debounce function
        function debounce(func, wait) {
          let timeout;
          return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
          };
        }
      } catch (error) {
        console.error("Gallery initialization error:", error);
  
        // Show error message
        const errorMessage = document.createElement("div");
        errorMessage.className = "error-message";
        errorMessage.innerHTML = `
      <p>Unable to load photos: ${error.message}</p>
      <button class="retry-button">Retry</button>
    `;
        masonryGrid.innerHTML = "";
        masonryGrid.appendChild(errorMessage);
  
        // Add retry button functionality
        errorMessage
          .querySelector(".retry-button")
          .addEventListener("click", () => {
            errorMessage.remove();
            initGallery();
          });
      }
    }
  
    // Add a function to dynamically update category filters from API
    async function updateCategoryFilters() {
      try {
        // Get the filter controls container
        const filterControls = document.querySelector(".filter-controls");
        if (!filterControls) {
          console.warn("Filter controls container not found");
          return;
        }
  
        // Add event listeners to the predefined category buttons
        filterControls.querySelectorAll(".filter-button").forEach((button) => {
          button.addEventListener("click", () => {
            // Remove active class from all buttons
            filterControls.querySelectorAll(".filter-button").forEach((btn) => {
              btn.classList.remove("active");
            });
  
            // Add active class to clicked button
            button.classList.add("active");
  
            // Filter items
            filterPhotos(button.dataset.filter);
          });
        });
  
        console.log("Category filters updated");
      } catch (error) {
        console.error("Error updating category filters:", error);
      }
    }
  
    // Start the gallery
    initGallery();
  });
  