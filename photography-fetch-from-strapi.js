/**
 * Photography Fetch from Strapi
 * Enhanced for scalability with 100+ photos
 */

document.addEventListener("DOMContentLoaded", () => {
  // Check if photography.js is already handling the gallery
  if (window.photographyGalleryInitialized) {
    console.log(
      "Gallery already initialized by photography.js, skipping duplicate initialization"
    );
    return;
  }

  // Mark that this script is handling the gallery
  window.photographyGalleryInitialized = true;

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
  const pageSize = 25; // Increased page size for initial load
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
  let imageObserver = null; // Store the observer reference
  const photoIdMap = new Map(); // Map to track photo IDs and prevent duplicates
  let totalPhotos = 0; // Track total number of photos available

  // API Configuration
  const API_URL = "https://api.shainwaiyan.com/api";

  // Responsive image sizes for different devices
  const IMAGE_SIZES = {
    thumbnail: 400,
    small: 800,
    medium: 1200,
    large: 1600,
    xlarge: 2000,
  };

  // Cache control - set TTL in milliseconds (15 minutes for development, 1 hour for production)
  const CACHE_TTL =
    window.location.hostname === "localhost" ||
    window.location.hostname.includes("127.0.0.1")
      ? 15 * 60 * 1000
      : 60 * 60 * 1000;

  // Add a version number to cache keys to force refresh when code changes
  const CACHE_VERSION = "v2.1"; // Increment when making significant changes
  const CACHE_KEY_PHOTOS = `${CACHE_VERSION}_strapi_photos_cache`;
  const CACHE_KEY_CATEGORIES = `${CACHE_VERSION}_strapi_categories_cache`;
  const CACHE_KEY_TAGS = `${CACHE_VERSION}_strapi_tags_cache`;
  const CACHE_KEY_TIMESTAMP = `${CACHE_VERSION}_strapi_cache_timestamp`;
  const CACHE_KEY_PROCESSED = `${CACHE_VERSION}_strapi_processed_photos`; // Cache key for processed photos
  const CACHE_KEY_TOTAL = `${CACHE_VERSION}_strapi_total_photos`; // Cache key for total photo count

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

  // FIXED: Match CSS grid-auto-rows (10px)
  function calculateRowSpan(element) {
    const ROW_HEIGHT = 10;
    const height = element.getBoundingClientRect().height;
    return Math.ceil(height / ROW_HEIGHT);
  }

  // Cache management with improved error handling and cache busting
  function saveToCache(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
      return true;
    } catch (error) {
      console.warn("Cache storage failed:", error);
      // Try to clear old cache items if storage failed
      try {
        clearOldCacheItems();
      } catch (e) {
        console.error("Failed to clear old cache items:", e);
      }
      return false;
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
      localStorage.removeItem(CACHE_KEY_PROCESSED);
      localStorage.removeItem(CACHE_KEY_TOTAL);
      console.log("Cache cleared successfully");
      return true;
    } catch (error) {
      console.warn("Cache clearing failed:", error);
      return false;
    }
  }

  // Clear old cache items to free up space
  function clearOldCacheItems() {
    try {
      // Get all keys in localStorage
      const keys = Object.keys(localStorage);

      // Find and remove old cache versions
      keys.forEach((key) => {
        // Check if it's one of our cache keys but not the current version
        if (key.includes("strapi_") && !key.includes(CACHE_VERSION)) {
          localStorage.removeItem(key);
          console.log(`Removed old cache item: ${key}`);
        }
      });
    } catch (error) {
      console.warn("Error clearing old cache items:", error);
    }
  }

  // Add a function to bust cache for Safari
  function bustCache() {
    // Add a timestamp to URLs to prevent caching
    return `&_cache=${Date.now()}`;
  }

  // Image optimization function that properly handles Cloudinary URLs
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

        // Insert transformation parameters - use c_scale to maintain aspect ratio
        return `${parts[0]}/upload/c_scale,w_${width},q_auto:good,f_auto/${parts[1]}`;
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

  // Shuffle array using Fisher-Yates algorithm
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
      img.crossOrigin = "anonymous"; // Add CORS support
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

  // API Functions with improved error handling and deduplication
  const pendingRequests = new Map();

  async function fetchPhotos(page = 1, pageSize = 25) {
    try {
      // Create a cache key based on request parameters
      const cacheKey = `${page}-${pageSize}`;

      // Check if we already have a pending request for this data
      if (pendingRequests.has(cacheKey)) {
        console.log(`Using pending request for page ${page}`);
        return pendingRequests.get(cacheKey);
      }

      // Show loading state
      const loadingIndicator = document.createElement("div");
      loadingIndicator.className = "loading-indicator";
      loadingIndicator.innerHTML =
        '<div class="loading-spinner"></div><p>Loading photos...</p>';

      if (masonryGrid && masonryGrid.children.length === 0) {
        masonryGrid.appendChild(loadingIndicator);
      }

      // Check processed photos cache first
      const cachedProcessedPhotos = getFromCache(CACHE_KEY_PROCESSED);
      if (cachedProcessedPhotos) {
        console.log("Using cached processed photos data");
        return {
          processedPhotos: cachedProcessedPhotos,
          meta: {
            pagination: {
              total: cachedProcessedPhotos.length,
              pageCount: Math.ceil(cachedProcessedPhotos.length / pageSize),
            },
          },
        };
      }

      // Check raw photos cache
      const cachedPhotos = getFromCache(CACHE_KEY_PHOTOS);
      if (cachedPhotos) {
        console.log("Using cached photos data");
        return cachedPhotos;
      }

      // Add cache busting parameter for Safari
      const cacheBuster = bustCache();

      // Updated for Strapi v5.12 - simplified populate syntax (no sorting for random display)
      const url = `${API_URL}/photographies?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*${cacheBuster}`;

      console.log(`Fetching photos from: ${url} (${new Date().toISOString()})`);

      // Store the promise in our pending requests map
      const promise = fetch(url, {
        headers: {
          Accept: "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("API Response:", data); // Debug log

          // Add detailed debug logging
          debugStrapiResponse(data);

          // Save to cache
          saveToCache(CACHE_KEY_PHOTOS, data);

          // Save total photos count
          if (data.meta && data.meta.pagination && data.meta.pagination.total) {
            totalPhotos = data.meta.pagination.total;
            saveToCache(CACHE_KEY_TOTAL, totalPhotos);
          }

          return data;
        })
        .finally(() => {
          // Remove from pending requests when done
          pendingRequests.delete(cacheKey);
        });

      pendingRequests.set(cacheKey, promise);
      return promise;
    } catch (error) {
      console.error("Error fetching photos:", error);

      // Show error in the grid
      if (masonryGrid && masonryGrid.querySelector(".loading-indicator")) {
        masonryGrid.querySelector(".loading-indicator").remove();
      }

      const errorMessage = document.createElement("div");
      errorMessage.className = "error-message";
      errorMessage.innerHTML = `
          <p>Error loading photos: ${error.message}</p>
          <p>Please check your network connection and try again.</p>
          <button class="retry-button">Retry</button>
        `;

      if (masonryGrid) {
        masonryGrid.appendChild(errorMessage);

        // Add retry button functionality
        errorMessage
          .querySelector(".retry-button")
          .addEventListener("click", () => {
            errorMessage.remove();
            // Clear cache on retry to ensure fresh data
            clearCache();
            loadPhotos();
          });
      }

      // Return empty data structure
      return { data: [], meta: { pagination: { total: 0, pageCount: 0 } } };
    }
  }

  // Fetch more photos for pagination
  async function fetchMorePhotos(page, pageSize) {
    try {
      // Add cache busting parameter for Safari
      const cacheBuster = bustCache();

      const url = `${API_URL}/photographies?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*${cacheBuster}`;
      console.log(`Fetching more photos from: ${url}`);

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Additional photos response:", data);

      return data;
    } catch (error) {
      console.error("Error fetching more photos:", error);
      throw error;
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

      // Add cache busting parameter for Safari
      const cacheBuster = bustCache();

      // Updated for Strapi v5.12
      const response = await fetch(
        `${API_URL}/categories?populate=*${cacheBuster}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

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

      // Add cache busting parameter for Safari
      const cacheBuster = bustCache();

      // Updated for Strapi v5.12
      const response = await fetch(`${API_URL}/tags?populate=*${cacheBuster}`, {
        headers: {
          Accept: "application/json",
        },
      });

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

  // Generate random title for photos without titles
  function generateRandomTitle() {
    const randomTitles = [
      "Moment in Time",
      "Captured Beauty",
      "Visual Story",
      "Perfect Frame",
      "Light & Shadow",
      "Perspective",
      "Natural Wonder",
      "Urban Scene",
      "Artistic View",
      "Composition",
      "Scenic Vista",
      "Quiet Moment",
      "Vibrant Scene",
      "Hidden Detail",
      "Striking Image",
    ];
    return randomTitles[Math.floor(Math.random() * randomTitles.length)];
  }

  // Transform Strapi data to our format with improved URL handling
  function transformPhotoData(strapiPhotos) {
    if (!strapiPhotos || !Array.isArray(strapiPhotos)) {
      console.error("Invalid photos data:", strapiPhotos);
      return [];
    }

    // Clear the ID map when processing a new batch of photos
    photoIdMap.clear();

    return strapiPhotos
      .map((photo) => {
        // Debug log the photo structure
        console.log(
          "Processing photo ID:",
          photo.id,
          "Attributes exist:",
          !!photo.attributes
        );

        try {
          // Initialize default values
          let imageUrl = "";
          let categoryName = "uncategorized";
          let photoTags = [];
          let title = "Untitled";
          let alt_text = "Photo";
          let location = "";
          let aspectRatio = "landscape"; // Default aspect ratio

          // Extract data from Strapi v5.12 structure with multiple fallbacks
          if (photo.attributes) {
            // Basic photo information
            title = photo.attributes.title || generateRandomTitle();
            alt_text =
              photo.attributes.alt_text || photo.attributes.title || "Photo";
            location = photo.attributes.location || "";
            aspectRatio = photo.attributes.aspect_ratio || "landscape";

            // Extract image URL with proper path for Strapi v4/v5
            if (photo.attributes.image?.data?.attributes?.url) {
              imageUrl = photo.attributes.image.data.attributes.url;
              console.log("Found image URL in standard path:", imageUrl);
            }
          } else {
            // Handle direct structure (older Strapi versions)
            title = photo.title || generateRandomTitle();
            alt_text = photo.alt_text || photo.title || "Photo";
            location = photo.location || "";
            aspectRatio = photo.aspect_ratio || "landscape";

            // Try to extract image URL
            if (photo.image) {
              if (
                photo.image.data &&
                photo.image.data.attributes &&
                photo.image.data.attributes.url
              ) {
                imageUrl = photo.image.data.attributes.url;
              } else if (photo.image.url) {
                imageUrl = photo.image.url;
              }
            }

            // Try to extract category
            if (photo.category) {
              if (
                photo.category.data &&
                photo.category.data.attributes &&
                photo.category.data.attributes.name
              ) {
                categoryName = photo.category.data.attributes.name;
                console.log(
                  "Found category from attributes.name:",
                  categoryName
                );
              } else if (photo.category.data && photo.category.data.name) {
                categoryName = photo.category.data.name;
                console.log("Found category from data.name:", categoryName);
              } else if (typeof photo.category === "string") {
                categoryName = photo.category;
                console.log("Found category as string:", categoryName);
              } else if (photo.category.name) {
                categoryName = photo.category.name;
                console.log("Found category from name property:", categoryName);
              }
            }

            // Try to extract tags
            if (
              photo.tags &&
              photo.tags.data &&
              Array.isArray(photo.tags.data)
            ) {
              photoTags = photo.tags.data
                .filter((tag) => tag && tag.attributes)
                .map((tag) => tag.attributes.name.toLowerCase());
            }
          }

          // Check for image URL in the root of the object
          if (!imageUrl && photo.url) {
            imageUrl = photo.url;
            console.log("Found image URL in root:", imageUrl);
          }

          // Check for Cloudinary URLs in the response
          if (!imageUrl) {
            // Look for any property that might contain a Cloudinary URL
            for (const key in photo) {
              if (
                typeof photo[key] === "string" &&
                photo[key].includes("cloudinary.com")
              ) {
                imageUrl = photo[key];
                console.log("Found Cloudinary URL in property:", key, imageUrl);
                break;
              }
            }

            if (photo.attributes) {
              for (const key in photo.attributes) {
                if (
                  typeof photo.attributes[key] === "string" &&
                  photo.attributes[key].includes("cloudinary.com")
                ) {
                  imageUrl = photo.attributes[key];
                  console.log(
                    "Found Cloudinary URL in attributes:",
                    key,
                    imageUrl
                  );
                  break;
                }
              }
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

          // Don't create multiple versions of the same image
          // Use the original URL for all sizes, and let Cloudinary handle the transformations
          const originalUrl = imageUrl;

          // Check if this photo ID already exists in our map
          const photoId =
            photo.id || Math.random().toString(36).substring(2, 9);
          if (photoIdMap.has(photoId)) {
            console.warn(`Duplicate photo ID detected: ${photoId}. Skipping.`);
            return null; // Skip this photo
          }

          // Add this photo ID to our map
          photoIdMap.set(photoId, true);

          // Create the photo object with all necessary data
          return {
            id: photoId,
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

          // Generate a unique ID for this error placeholder
          const errorId = `error-${Math.random().toString(36).substring(2, 9)}`;

          return {
            id: errorId,
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
      })
      .filter(Boolean); // Filter out null values (duplicates)
  }

  // Handle image loading errors
  function handleImageLoadError(img, fallbackImage, item) {
    console.error("Image failed to load:", img.src);

    // Hide loading spinner
    const loadingElement = img
      .closest(".masonry-item")
      ?.querySelector(".image-loading");
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

  // Create masonry item with improved image loading and compact layout
  function createMasonryItem(photo) {
    // Check if this photo ID already exists in the DOM
    const existingItems = Array.from(masonryGrid.children).filter(
      (item) => item.dataset.id === photo.id.toString()
    );

    if (existingItems.length > 0) {
      console.warn(`Duplicate detected: ${photo.id}. Skipping.`);
      return null; // Skip creating a duplicate item
    }

    const item = document.createElement("div");
    item.className = `masonry-item new`;
    item.dataset.id = photo.id;
    item.dataset.category = photo.category;
    item.dataset.tags = photo.tags.join(",");
    item.dataset.aspect = photo.aspectRatio; // Add aspect ratio as data attribute

    // Set default grid row span to ensure visibility
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

    // Simplified HTML structure to reduce vertical space
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

    // Set aspect ratio based on photo data
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
      lightboxMainImage.crossOrigin = "anonymous"; // Add CORS support
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

  // Improved lazy loading with Intersection Observer
  function setupLazyLoading() {
    // Disconnect previous observer if it exists
    if (imageObserver) {
      imageObserver.disconnect();
    }

    if ("IntersectionObserver" in window) {
      imageObserver = new IntersectionObserver(
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

  // Improved photo loading with better caching and error handling
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

      // Update total photos count
      if (pagination && pagination.total) {
        totalPhotos = pagination.total;
      }

      // Check if we already have processed photos from cache
      let newPhotos;
      if (response.processedPhotos) {
        newPhotos = response.processedPhotos;
        console.log("Using pre-processed photos:", newPhotos);
      } else {
        // Transform Strapi data to our format
        newPhotos = transformPhotoData(response.data);
        console.log("Transformed photos before shuffle:", newPhotos); // Debug log

        // Save processed photos to cache to avoid re-processing on refresh
        saveToCache(CACHE_KEY_PROCESSED, newPhotos);
      }

      // Shuffle the new photos
      newPhotos = shuffleArray(newPhotos);
      console.log("Transformed photos after shuffle:", newPhotos); // Debug log

      // Clear the ID map before adding to allPhotos
      photoIdMap.clear();

      // Add to our collection - Use a Set to ensure uniqueness by ID
      const uniquePhotoIds = new Set(allPhotos.map((photo) => photo.id));
      const uniqueNewPhotos = newPhotos.filter(
        (photo) => !uniquePhotoIds.has(photo.id)
      );

      allPhotos = [...allPhotos, ...uniqueNewPhotos];
      filteredPhotos = allPhotos; // Initially show all photos

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
          if (item) {
            // Only append if item was created (not a duplicate)
            masonryGrid.appendChild(item);
          }
        });
      }

      // Update gallery items array
      updateGalleryItems();

      // Setup lazy loading
      setupLazyLoading();

      // Recalculate grid layout after images load
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

      // Display total photos count
      updatePhotoCounter();
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

  // Add function to display total photos count
  function updatePhotoCounter() {
    // Find or create the counter element
    let counterElement = document.querySelector(".photo-counter");
    if (!counterElement) {
      counterElement = document.createElement("div");
      counterElement.className = "photo-counter";

      // Insert after the filter controls
      const filterControls = document.querySelector(".filter-controls");
      if (filterControls) {
        filterControls.parentNode.insertBefore(
          counterElement,
          filterControls.nextSibling
        );
      } else {
        // Fallback - insert before the masonry grid
        masonryGrid.parentNode.insertBefore(counterElement, masonryGrid);
      }
    }

    // Update the counter text
    const displayedCount = galleryItems.length;
    counterElement.textContent = `Showing ${displayedCount} of ${totalPhotos} photos`;
  }

  // Add function to recalculate grid layout
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

  // Enhanced loadMorePhotos function with proper pagination
  async function loadMorePhotos() {
    if (isLoading || !hasMorePhotos) return;

    isLoading = true;

    try {
      // Show loading state in the scroll trigger
      const scrollTrigger = document.querySelector(".scroll-trigger");
      if (scrollTrigger) {
        scrollTrigger.classList.add("loading");
      }

      // Increment page number
      page++;

      // Fetch the next page of photos
      const response = await fetchMorePhotos(page, pageSize);

      // Check if we have more photos to load
      const pagination = response.meta?.pagination;
      hasMorePhotos = pagination && page < pagination.pageCount;

      // Transform the new photos
      const newPhotos = transformPhotoData(response.data);

      // Shuffle the new photos
      const shuffledNewPhotos = shuffleArray(newPhotos);

      // Add to our collection - Use a Set to ensure uniqueness by ID
      const uniquePhotoIds = new Set(allPhotos.map((photo) => photo.id));
      const uniqueNewPhotos = shuffledNewPhotos.filter(
        (photo) => !uniquePhotoIds.has(photo.id)
      );

      allPhotos = [...allPhotos, ...uniqueNewPhotos];

      // If we're not filtering, add the new photos to the filtered set
      if (
        document.querySelector(".filter-button.active")?.dataset.filter ===
        "all"
      ) {
        filteredPhotos = allPhotos;

        // Create and append masonry items for the new photos
        uniqueNewPhotos.forEach((photo) => {
          const item = createMasonryItem(photo);
          if (item) {
            masonryGrid.appendChild(item);
          }
        });

        // Update gallery items array
        updateGalleryItems();

        // Setup lazy loading for new items
        setupLazyLoading();

        // Recalculate grid layout after images load
        setTimeout(() => {
          recalculateGrid();

          // Remove the 'new' class after animation completes
          document.querySelectorAll(".masonry-item.new").forEach((item) => {
            item.classList.remove("new");
          });
        }, 500);
      }

      // Update load more button visibility
      if (loadMoreBtn) {
        loadMoreBtn.style.display = hasMorePhotos ? "block" : "none";
      }

      // Update infinite scroll trigger visibility
      if (scrollTrigger) {
        scrollTrigger.style.display = hasMorePhotos ? "block" : "none";
        scrollTrigger.classList.remove("loading");
      }

      // Update photo counter
      updatePhotoCounter();
    } catch (error) {
      console.error("Error loading more photos:", error);

      // Show error message
      const scrollTrigger = document.querySelector(".scroll-trigger");
      if (scrollTrigger) {
        scrollTrigger.innerHTML = `
          <div class="error-message">
            <p>Error loading more photos. <button class="retry-button">Retry</button></p>
          </div>
        `;

        // Add retry button functionality
        scrollTrigger
          .querySelector(".retry-button")
          .addEventListener("click", () => {
            scrollTrigger.innerHTML =
              '<div class="scroll-trigger-spinner"></div>';
            loadMorePhotos();
          });
      }
    } finally {
      isLoading = false;
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

  // Improved filter function that preserves image data
  // Update the filterPhotos function to properly handle category matching
  function filterPhotos(category) {
    // Clear the grid first to prevent duplicates
    masonryGrid.innerHTML = "";

    // Clear the ID map before filtering
    photoIdMap.clear();

    console.log("Filtering by category:", category);

    if (category === "all") {
      filteredPhotos = shuffleArray([...allPhotos]);
    } else {
      // FIXED: Improved category matching logic
      filteredPhotos = shuffleArray(
        allPhotos.filter((photo) => {
          // Check if the photo's category matches the filter - use includes for partial matching
          const photoCategory = photo.category || "";
          if (photoCategory.toLowerCase().includes(category.toLowerCase())) {
            console.log(
              `Photo ${photo.id} matches category by name: ${category}`
            );
            return true;
          }

          // Check if the photo's tags include the filter
          if (
            Array.isArray(photo.tags) &&
            photo.tags.some((tag) =>
              tag.toLowerCase().includes(category.toLowerCase())
            )
          ) {
            console.log(`Photo ${photo.id} has matching tag: ${category}`);
            return true;
          }

          // Special case for compound categories
          if (
            (category === "sunset" || category === "sunset & sunrise") &&
            (photoCategory.toLowerCase().includes("sunset") ||
              photoCategory.toLowerCase().includes("sunrise"))
          ) {
            console.log(
              `Photo ${photo.id} matches sunset/sunrise compound category`
            );
            return true;
          }

          // Special case for "cafe" category
          if (
            (category === "cafe" || category === "cafe & bars") &&
            (photoCategory.toLowerCase().includes("cafe") ||
              photoCategory.toLowerCase().includes("bar"))
          ) {
            console.log(
              `Photo ${photo.id} matches cafe/bars compound category`
            );
            return true;
          }

          // Special case for "clouds" category
          if (
            category === "clouds" &&
            (photoCategory.toLowerCase().includes("cloud") ||
              photoCategory.toLowerCase().includes("sky"))
          ) {
            console.log(`Photo ${photo.id} matches clouds category`);
            return true;
          }

          // Special case for "mountains" category
          if (
            category === "mountains" &&
            (photoCategory.toLowerCase().includes("mountain") ||
              photoCategory.toLowerCase().includes("hill"))
          ) {
            console.log(`Photo ${photo.id} matches mountains category`);
            return true;
          }

          // Special case for "lakes" category
          if (
            category === "lakes" &&
            (photoCategory.toLowerCase().includes("lake") ||
              photoCategory.toLowerCase().includes("water"))
          ) {
            console.log(`Photo ${photo.id} matches lakes category`);
            return true;
          }

          // Special case for "building" category
          if (
            category === "building" &&
            (photoCategory.toLowerCase().includes("building") ||
              photoCategory.toLowerCase().includes("temple") ||
              photoCategory.toLowerCase().includes("pagoda"))
          ) {
            console.log(`Photo ${photo.id} matches building category`);
            return true;
          }

          return false;
        })
      );
    }

    if (filteredPhotos.length === 0) {
      // No photos in this category
      const noCategoryMessage = document.createElement("div");
      noCategoryMessage.className = "no-photos-message";
      noCategoryMessage.innerHTML = `<p>No photos found in the "${category}" category.</p>`;
      masonryGrid.appendChild(noCategoryMessage);
      console.log(`No photos found in category: ${category}`);
    } else {
      console.log(
        `Found ${filteredPhotos.length} photos in category: ${category}`
      );

      // Use a Set to track IDs we've already added to the grid
      const addedIds = new Set();

      filteredPhotos.forEach((photo) => {
        // Skip if we've already added this photo ID
        if (addedIds.has(photo.id)) return;

        // Add this ID to our tracking set
        addedIds.add(photo.id);

        const item = createMasonryItem(photo);
        if (item) {
          // Only append if item was created (not a duplicate)
          masonryGrid.appendChild(item);
        }
      });
    }

    // Update gallery items array
    updateGalleryItems();

    // Setup lazy loading for new items
    setupLazyLoading();

    // Update photo counter
    updatePhotoCounter();

    // Recalculate grid after filter
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

    // Filter from the current filtered set (respects category filters) and shuffle
    const searchResults = shuffleArray(
      filteredPhotos.filter(
        (photo) =>
          photo.title.toLowerCase().includes(normalizedSearchTerm) ||
          photo.location.toLowerCase().includes(normalizedSearchTerm) ||
          photo.tags.some((tag) => tag.includes(normalizedSearchTerm))
      )
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
      // Use a Set to track IDs we've already added to the grid
      const addedIds = new Set();

      searchResults.forEach((photo) => {
        // Skip if we've already added this photo ID
        if (addedIds.has(photo.id)) return;

        // Add this ID to our tracking set
        addedIds.add(photo.id);

        const item = createMasonryItem(photo);
        if (item) {
          // Only append if item was created (not a duplicate)
          masonryGrid.appendChild(item);
        }
      });
    }

    // Update gallery items array
    updateGalleryItems();

    // Update photo counter
    updatePhotoCounter();

    // Setup lazy loading for new items
    setupLazyLoading();

    // Recalculate grid after search
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

  // Enhanced refresh button with better animation and state preservation
  function initRefreshButton() {
    // Find the existing refresh button or create a new one
    let refreshButton = document.querySelector(".refresh-button");
    const searchContainer = document.querySelector(".search-container");

    if (!refreshButton && searchContainer) {
      // Create new refresh button with SVG icon
      refreshButton = document.createElement("button");
      refreshButton.className = "refresh-button";
      refreshButton.setAttribute("aria-label", "Refresh photos");
      refreshButton.setAttribute("title", "Refresh photos");

      // Add SVG refresh icon
      refreshButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 2v6h-6"></path>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
      <path d="M3 22v-6h6"></path>
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
    </svg>
  `;

      searchContainer.appendChild(refreshButton);
    }

    // Add enhanced click handler
    if (refreshButton) {
      refreshButton.addEventListener("click", function () {
        // Add rotating animation class
        this.classList.add("refreshing");

        // Clear cache to force a fresh fetch
        clearCache();

        // Reset pagination
        page = 1;

        // Reload photos
        allPhotos = [];
        filteredPhotos = [];
        loadPhotos();

        // Remove animation class after rotation completes
        setTimeout(() => {
          this.classList.remove("refreshing");
        }, 800);
      });
    }
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
        transition: transform 0.8s ease;
      }
      
      .refresh-button.refreshing {
        animation: spin 0.8s linear;
      }
      
      .no-photos-message {
        color: #856404;
        background-color: #fff3cd;
        border: 1px solid #ffeeba;
      }
      
      .photo-counter {
        text-align: center;
        margin: 0.5rem 0;
        font-size: 0.9rem;
        color: #666;
      }
      
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `;
      document.head.appendChild(style);

      // Initialize refresh button
      initRefreshButton();

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

      // Add window resize handler to recalculate grid
      window.addEventListener("resize", debounce(recalculateGrid, 200));

      // Add debounce function
      function debounce(func, wait) {
        let timeout;
        return function () {
          const args = arguments;
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(this, args), wait);
        };
      }

      function conditionallyLoadVercelScripts() {
        // Only load Vercel scripts in production environment
        if (
          window.location.hostname !== "localhost" &&
          !window.location.hostname.includes("127.0.0.1")
        ) {
          const insightsScript = document.createElement("script");
          insightsScript.src = "/_vercel/insights/script.js";
          document.head.appendChild(insightsScript);

          const speedInsightsScript = document.createElement("script");
          speedInsightsScript.src = "/_vercel/speed-insights/script.js";
          document.head.appendChild(speedInsightsScript);
        }
      }

      // Call this at the end of initGallery
      conditionallyLoadVercelScripts();
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

  // Add global handler for image loading errors
  window.handleImageLoadError = (img, fallbackImage) => {
    console.error("Image failed to load:", img.src);

    // Create a fallback image if not provided
    if (!fallbackImage) {
      fallbackImage = createAdaptivePlaceholder(400, "landscape");
    }

    // Set fallback image
    img.src = fallbackImage;
    img.alt = "Error loading image";

    // Hide loading spinner if exists
    const loadingElement = img
      .closest(".masonry-item")
      ?.querySelector(".image-loading");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  };

  // Start the gallery
  initGallery();
});

/**
 * Photography Fetch Helper
 * Provides additional utility functions without duplicating core functionality
 */

// Check if photography.js is already handling the gallery
if (window.photographyGalleryInitialized) {
  console.log(
    "Gallery already initialized by photography.js, skipping duplicate initialization"
  );
}

// Add global handler for image loading errors if not already defined
if (!window.handleImageLoadError) {
  window.handleImageLoadError = (img, fallbackImage) => {
    console.error("Image failed to load:", img.src);

    // Create a fallback image if not provided
    if (!fallbackImage) {
      fallbackImage = createAdaptivePlaceholder(400, "landscape");
    }

    // Set fallback image
    img.src = fallbackImage;
    img.alt = "Error loading image";

    // Hide loading spinner if exists
    const loadingElement = img
      .closest(".masonry-item")
      ?.querySelector(".image-loading");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  };
}

// Create adaptive placeholder based on image dimensions and aspect ratio
// This function is unique to fetcher.js and doesn't exist in photography.js
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

// Cloudinary URL helper functions - these are unique to fetcher.js
window.getOptimizedCloudinaryUrl = (url, width, options = {}) => {
  if (!url || url.startsWith("data:")) {
    return createAdaptivePlaceholder(width, options.aspectRatio || "landscape");
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

      // Get configuration
      const config = window.photographyConfig?.cloudinary || {};
      const quality = options.quality || config.quality || "auto:good";
      const format = options.format || config.format || "auto";

      // Use c_scale instead of c_fill to preserve aspect ratio
      return `${parts[0]}/upload/c_scale,w_${width},q_${quality},f_${format}/${parts[1]}`;
    }

    // For non-Cloudinary URLs, return as is
    return url;
  } catch (error) {
    console.warn("Image URL optimization failed:", error);
    return url;
  }
};

// Debounce function for performance optimization
function debounce(func, wait) {
  let timeout;
  return function () {
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Conditionally load Vercel analytics scripts in production only
function conditionallyLoadVercelScripts() {
  // Only load Vercel scripts in production environment (not on localhost)
  if (
    window.location.hostname !== "localhost" &&
    !window.location.hostname.includes("127.0.0.1") &&
    !window.location.hostname.includes(".local")
  ) {
    try {
      // Create and append Vercel Analytics script
      const insightsScript = document.createElement("script");
      insightsScript.src = "/_vercel/insights/script.js";
      insightsScript.async = true;
      insightsScript.onerror = () =>
        console.log(
          "Vercel Insights script failed to load - this is expected in development"
        );
      document.head.appendChild(insightsScript);

      // Create and append Vercel Speed Insights script
      const speedInsightsScript = document.createElement("script");
      speedInsightsScript.src = "/_vercel/speed-insights/script.js";
      speedInsightsScript.async = true;
      speedInsightsScript.onerror = () =>
        console.log(
          "Vercel Speed Insights script failed to load - this is expected in development"
        );
      document.head.appendChild(speedInsightsScript);

      console.log("Vercel analytics scripts loaded in production environment");
    } catch (error) {
      console.log("Error loading Vercel analytics scripts:", error);
    }
  } else {
    console.log("Vercel analytics scripts skipped in development environment");
  }
}

// Call this function to load Vercel scripts if needed
document.addEventListener("DOMContentLoaded", () => {
  conditionallyLoadVercelScripts();
});

// Generate random title for photos without titles
function generateRandomTitle() {
  const randomTitles = [
    "Moment in Time",
    "Captured Beauty",
    "Visual Story",
    "Perfect Frame",
    "Light & Shadow",
    "Perspective",
    "Natural Wonder",
    "Urban Scene",
    "Artistic View",
    "Composition",
    "Scenic Vista",
    "Quiet Moment",
    "Vibrant Scene",
    "Hidden Detail",
    "Striking Image",
    "Peaceful View",
    "Dynamic Composition",
    "Elegant Capture",
    "Timeless Moment",
    "Creative Vision",
  ];
  return randomTitles[Math.floor(Math.random() * randomTitles.length)];
}

// Export functions that might be needed by photography.js
window.fetcherUtils = {
  createAdaptivePlaceholder,
  generateRandomTitle,
  debounce,
  conditionallyLoadVercelScripts,
};

console.log("Photography fetcher utilities loaded");
