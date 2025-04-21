// Assuming these variables are defined elsewhere or will be populated later
const allPhotos = []; // Initialize as an empty array
let filteredPhotos = []; // Initialize as an empty array
let processedPhotoIds = new Set(); // Initialize as a Set
const API_URL = process.env.API_URL || "http://localhost:1337";
const IMAGE_SIZES = {
  thumbnail: 150,
  small: 300,
  medium: 600,
  large: 1000,
};

// Helper function to reset the processed photo IDs
function resetProcessedPhotoIds() {
  processedPhotoIds = new Set();
}

// Helper function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

// Helper function to check if a photo object is valid
function isValidPhoto(photo) {
  return photo && photo.src; // Basic validation: check if photo and src exist
}

// Helper function to generate a random title
function generateRandomTitle() {
  const adjectives = ["Amazing", "Beautiful", "Stunning", "Incredible"];
  const nouns = ["Landscape", "View", "Scene", "Moment"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}

// Helper function to create an adaptive placeholder SVG
function createAdaptivePlaceholder(width, aspectRatio = "landscape") {
  const height =
    aspectRatio === "square"
      ? width
      : aspectRatio === "portrait"
      ? width * 1.33
      : width * 0.75; // Default to landscape
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="#eee" xmlns="http://www.w3.org/2000/svg/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Helper function to get optimized image URL
function getOptimizedImageUrl(originalUrl, size) {
  if (!originalUrl) return null;

  const url = new URL(originalUrl);
  const pathname = url.pathname;

  // Check if the URL already has query parameters
  const hasParams = originalUrl.includes("?");

  // Construct the new URL with the desired width parameter
  const optimizedUrl = hasParams
    ? `${originalUrl}&width=${size}`
    : `${originalUrl}?width=${size}`;

  return optimizedUrl;
}

// Helper function to determine responsive image size
function getResponsiveImageSize() {
  const viewportWidth = window.innerWidth;

  if (viewportWidth <= 600) {
    return IMAGE_SIZES.small;
  } else if (viewportWidth <= 1024) {
    return IMAGE_SIZES.medium;
  } else {
    return IMAGE_SIZES.large;
  }
}

// Helper function to handle image load errors
function handleImageLoadError(img, fallbackImage) {
  console.error("Image failed to load:", img.src);
  img.src = fallbackImage;
  img.alt = "Error loading image";
}

// Helper function to update gallery items (implementation depends on your gallery setup)
function updateGalleryItems() {
  // Implementation depends on your gallery setup
  console.log("Gallery items updated.");
}

// Helper function to setup lazy loading (implementation depends on your lazy loading library)
function setupLazyLoading() {
  // Implementation depends on your lazy loading library
  console.log("Lazy loading setup.");
}

// Helper function to recalculate grid layout (implementation depends on your masonry library)
function recalculateGrid() {
  // Implementation depends on your masonry library
  console.log("Grid recalculated.");
}

// Replace the knownCategories object with your original categories
const knownCategories = {
  mountains: ["mountains", "mountain", "hill"],
  lakes: ["lakes", "lake", "water", "river"],
  scenic: ["scenic", "landscape", "nature", "view"],
  "sunset & sunrise": ["sunset", "sunrise", "dusk", "dawn", "evening"],
  building: ["building", "temple", "pagoda", "architecture", "structure"],
  "cafe & bars": ["cafe", "bar", "restaurant", "coffee", "food"],
  clouds: ["clouds", "cloud", "sky"],
};

// Update the updateCategoryFilters function to preserve your exact category names
async function updateCategoryFilters() {
  try {
    console.log("Starting category filter update...");

    // Get the filter controls container
    const filterControls = document.querySelector(".filter-controls");
    if (!filterControls) {
      console.warn("Filter controls container not found");
      return;
    }

    // Don't clear existing buttons - they're already set up correctly
    // Instead, just make sure they have proper event listeners

    // Add event listeners to all buttons
    document.querySelectorAll(".filter-button").forEach((button) => {
      // Remove any existing listeners by cloning
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      // Add fresh event listener
      newButton.addEventListener("click", function () {
        console.log(
          "Category button clicked:",
          this.dataset.filter,
          "Button text:",
          this.textContent
        );

        // Remove active class from all buttons
        document.querySelectorAll(".filter-button").forEach((btn) => {
          btn.classList.remove("active");
        });

        // Add active class to clicked button
        this.classList.add("active");

        // IMPORTANT: Use the exact text content of the button for filtering
        // This ensures we match the exact category name in the Strapi data
        const filterValue = this.dataset.filter;
        console.log("Filtering by exact value:", filterValue);

        // Filter photos using the button's data-filter attribute for exact matching
        filterPhotos(filterValue);
      });
    });

    // Make sure "All Photos" is active by default
    const allButton = document.querySelector(
      '.filter-button[data-filter="all"]'
    );
    if (allButton) {
      allButton.classList.add("active");
    }

    console.log("Category filter event listeners updated successfully");
  } catch (error) {
    console.error("Error updating category filters:", error);
  }
}

// Update the filterPhotos function to handle your original category names
function filterPhotos(category) {
  console.log("Filtering photos by category:", category);

  // Reset the processed IDs when filtering
  resetProcessedPhotoIds();

  // Get the masonry grid
  const masonryGrid = document.getElementById("masonry-grid");
  if (!masonryGrid) {
    console.error("Masonry grid not found!");
    return;
  }

  // Clear the grid
  masonryGrid.innerHTML = "";

  if (category === "all") {
    // Show all photos
    filteredPhotos = shuffleArray(allPhotos.filter(isValidPhoto));
    console.log("Showing all photos:", filteredPhotos.length);
  } else {
    // Filter photos by category or tags - using more flexible matching
    filteredPhotos = shuffleArray(
      allPhotos.filter((photo) => {
        // Check if photo is valid
        if (!isValidPhoto(photo)) return false;

        // Get photo category and tags
        const photoCategory = photo.category || "";
        const photoTags = photo.tags || [];

        // Log for debugging
        console.log(
          `Checking photo ${photo.id} with category "${photoCategory}" against filter "${category}"`
        );

        // Check if photo matches category - IMPROVED: Use includes for more flexible matching
        const matchesCategory = photoCategory
          .toLowerCase()
          .includes(category.toLowerCase());

        // Check if photo has matching tag - IMPROVED: Use some with includes for more flexible matching
        const matchesTag =
          Array.isArray(photoTags) &&
          photoTags.some((tag) =>
            tag.toLowerCase().includes(category.toLowerCase())
          );

        // Special case handling for compound categories like "sunset & sunrise" or "cafe & bars"
        const isCompoundMatch =
          ((category === "sunset" || category === "sunset & sunrise") &&
            (photoCategory.toLowerCase().includes("sunset") ||
              photoCategory.toLowerCase().includes("sunrise"))) ||
          ((category === "cafe" || category === "cafe & bars") &&
            (photoCategory.toLowerCase().includes("cafe") ||
              photoCategory.toLowerCase().includes("bar"))) ||
          (category === "clouds" &&
            (photoCategory.toLowerCase().includes("cloud") ||
              photoCategory.toLowerCase().includes("sky"))) ||
          (category === "mountains" &&
            (photoCategory.toLowerCase().includes("mountain") ||
              photoCategory.toLowerCase().includes("hill"))) ||
          (category === "lakes" &&
            (photoCategory.toLowerCase().includes("lake") ||
              photoCategory.toLowerCase().includes("water"))) ||
          (category === "building" &&
            (photoCategory.toLowerCase().includes("building") ||
              photoCategory.toLowerCase().includes("temple") ||
              photoCategory.toLowerCase().includes("pagoda")));

        // Log matches for debugging
        if (matchesCategory || matchesTag || isCompoundMatch) {
          console.log(`Photo "${photo.title}" matches category ${category}:`, {
            photoCategory: photoCategory,
            tags: photoTags,
            isCompoundMatch: isCompoundMatch,
          });
        }

        return matchesCategory || matchesTag || isCompoundMatch;
      })
    );
    console.log("Filtered photos count:", filteredPhotos.length);
  }

  // Display filtered photos
  if (filteredPhotos.length === 0) {
    // No photos in this category
    const noCategoryMessage = document.createElement("div");
    noCategoryMessage.className = "no-photos-message";
    noCategoryMessage.innerHTML = `<p>No photos found in the "${category}" category.</p>`;
    masonryGrid.appendChild(noCategoryMessage);
    console.log("No photos found in category:", category);
  } else {
    // Create and append masonry items for filtered photos
    filteredPhotos.forEach((photo) => {
      const item = createMasonryItem(photo);
      if (item) {
        masonryGrid.appendChild(item);
      }
    });
  }

  // Update gallery items array
  updateGalleryItems();

  // Setup lazy loading for new items
  setupLazyLoading();

  // Recalculate grid layout
  setTimeout(recalculateGrid, 300);
}

// Add this helper function to ensure photo objects have category and tags
function transformPhotoData(strapiPhotos) {
  if (!strapiPhotos || !Array.isArray(strapiPhotos)) {
    console.error("Invalid photos data:", strapiPhotos);
    return [];
  }

  return strapiPhotos.map((photo) => {
    console.log(
      "Processing photo ID:",
      photo.id,
      "Attributes exist:",
      !!photo.attributes
    );

    // Initialize default values
    let imageUrl = "";
    let categoryName = "uncategorized";
    let photoTags = [];
    let title = "Untitled";
    let alt_text = "Photo";
    let location = "";

    try {
      // Handle Strapi v4 data structure
      if (photo.attributes) {
        // Extract image URL - FIXED to handle multiple formats
        if (photo.attributes.image && photo.attributes.image.data) {
          const imageData = photo.attributes.image.data;

          // Try to get the URL from different possible locations
          if (imageData.attributes && imageData.attributes.url) {
            imageUrl = imageData.attributes.url;
            console.log("Found image URL:", imageUrl);
          } else if (imageData.attributes && imageData.attributes.formats) {
            // Try to get the best format available
            const formats = imageData.attributes.formats;
            if (formats.large) {
              imageUrl = formats.large.url;
            } else if (formats.medium) {
              imageUrl = formats.medium.url;
            } else if (formats.small) {
              imageUrl = formats.small.url;
            } else if (formats.thumbnail) {
              imageUrl = formats.thumbnail.url;
            }
            console.log("Found image format URL:", imageUrl);
          } else if (imageData.url) {
            imageUrl = imageData.url;
          }
        }

        // Extract category - IMPORTANT: Preserve exact category name from Strapi
        if (photo.attributes.category && photo.attributes.category.data) {
          const categoryData = photo.attributes.category.data;
          if (categoryData.attributes && categoryData.attributes.name) {
            // Preserve exact category name including capitalization
            categoryName = categoryData.attributes.name;
            console.log("Found category:", categoryName);
          } else if (categoryData.name) {
            categoryName = categoryData.name;
            console.log("Found category (direct):", categoryName);
          }
        }

        // Extract tags - IMPORTANT: Preserve exact tag names from Strapi
        if (
          photo.attributes.tags &&
          photo.attributes.tags.data &&
          Array.isArray(photo.attributes.tags.data)
        ) {
          photoTags = photo.attributes.tags.data
            .map((tag) => {
              if (tag.attributes && tag.attributes.name) {
                // Preserve exact tag name including capitalization
                return tag.attributes.name;
              } else if (tag.name) {
                return tag.name;
              }
              return null;
            })
            .filter(Boolean);
          console.log("Found tags:", photoTags);
        }

        // Improve title fallback with random titles if needed
        title = photo.attributes.title || generateRandomTitle() || "Untitled";
        alt_text =
          photo.attributes.alt_text || photo.attributes.title || "Photo";
        location = photo.attributes.location || "";
      } else {
        // Handle direct structure or older Strapi versions
        if (photo.image) {
          if (photo.image.data && photo.image.data.attributes) {
            imageUrl = photo.image.data.attributes.url;
          } else if (photo.image.data && photo.image.data.url) {
            imageUrl = photo.image.data.url;
          } else if (photo.image.url) {
            imageUrl = photo.image.url;
          }
        }

        if (photo.category) {
          if (photo.category.data && photo.category.data.attributes) {
            // Preserve exact category name including capitalization
            categoryName = photo.category.data.attributes.name;
          } else if (photo.category.data && photo.category.data.name) {
            categoryName = photo.category.data.name;
          } else if (photo.category.name) {
            categoryName = photo.category.name;
          }
        }

        if (photo.tags && photo.tags.data && Array.isArray(photo.tags.data)) {
          photoTags = photo.tags.data
            .map((tag) => {
              if (tag.attributes && tag.attributes.name) {
                // Preserve exact tag name including capitalization
                return tag.attributes.name;
              } else if (tag.name) {
                return tag.name;
              }
              return null;
            })
            .filter(Boolean);
        }

        // Improve title fallback with random titles if needed
        title = photo.title || generateRandomTitle() || "Untitled";
        alt_text = photo.alt_text || photo.title || "Photo";
        location = photo.location || "";
      }

      // If we still don't have an image URL, check for other possible structures
      if (!imageUrl && photo.url) {
        imageUrl = photo.url;
      }

      // Ensure we have a valid image URL or use a placeholder
      if (!imageUrl) {
        console.warn("No image URL found for photo:", photo);
        // Use inline SVG data URL instead of placeholder.svg
        imageUrl = createAdaptivePlaceholder(600, "landscape");
      }

      // Make sure the URL is absolute
      if (imageUrl.startsWith("/")) {
        // Convert relative URL to absolute using the API_URL base
        const apiBase = API_URL.split("/api")[0];
        imageUrl = `${apiBase}${imageUrl}`;
        console.log("Converted to absolute URL:", imageUrl);
      }

      // Store the original URL to avoid creating multiple versions
      const originalUrl = imageUrl;

      return {
        id: photo.id || Math.random().toString(36).substring(2, 9),
        title: title,
        alt_text: alt_text,
        location: location,
        src: originalUrl,
        aspectRatio:
          (photo.attributes
            ? photo.attributes.aspect_ratio
            : photo.aspect_ratio) || "landscape",
        category: categoryName, // Using exact category name from Strapi
        tags: photoTags, // Using exact tag names from Strapi
        // Add responsive image URLs - use the same base URL for all sizes
        thumbnailSrc: getOptimizedImageUrl(originalUrl, IMAGE_SIZES.thumbnail),
        smallSrc: getOptimizedImageUrl(originalUrl, IMAGE_SIZES.small),
        mediumSrc: getOptimizedImageUrl(originalUrl, IMAGE_SIZES.medium),
        largeSrc: getOptimizedImageUrl(originalUrl, IMAGE_SIZES.large),
      };
    } catch (error) {
      console.error("Error transforming photo data:", error, photo);
      // Return a placeholder for failed photos
      const fallbackSvg = createAdaptivePlaceholder(600, "landscape");
      return {
        id: photo.id || Math.random().toString(36).substring(2, 9),
        title: "Photo Load Error",
        alt_text: "Error loading photo",
        location: "",
        src: fallbackSvg,
        aspectRatio: "landscape",
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

// Add this function to create masonry items with proper category data
function createMasonryItem(photo) {
  // Skip if this is a duplicate photo
  if (!photo || !photo.id) {
    console.warn("Invalid photo object:", photo);
    return null;
  }

  // Check if we've already processed this photo ID
  if (processedPhotoIds.has(photo.id.toString())) {
    console.log(`Skipping duplicate photo ID: ${photo.id}`);
    return null;
  }

  // Add this ID to our tracking set
  processedPhotoIds.add(photo.id.toString());

  // Validate photo object to prevent "Untitled" boxes
  if (!photo || !photo.id) {
    console.error("Invalid photo object:", photo);
    return document.createElement("div"); // Return empty div instead of broken item
  }

  const item = document.createElement("div");
  item.className = `masonry-item new`;
  item.dataset.id = photo.id;

  // Set category data attributes for filtering - use exact category name
  item.dataset.category = photo.category || "uncategorized";
  item.dataset.tags =
    photo.tags && Array.isArray(photo.tags) ? photo.tags.join(",") : "";

  // FIXED: Ensure we have valid data for all fields with strong fallbacks
  const title = photo.title || generateRandomTitle() || "Untitled";
  const location = photo.location || "";
  const alt_text = photo.alt_text || title || "Photo";
  const tags = photo.tags && Array.isArray(photo.tags) ? photo.tags : [];

  // Determine appropriate image size based on viewport
  const responsiveSize = getResponsiveImageSize();
  const optimizedSrc =
    photo.mediumSrc ||
    (photo.src ? getOptimizedImageUrl(photo.src, responsiveSize) : null);
  const thumbnailSrc = photo.thumbnailSrc || optimizedSrc;

  // Use inline SVG as fallback for error images or missing sources
  const fallbackImage = createAdaptivePlaceholder(
    responsiveSize,
    photo.aspectRatio || "landscape"
  );

  // Use the source that exists or fallback
  const imgSrc = thumbnailSrc || fallbackImage;
  const dataSrc = optimizedSrc || imgSrc;

  // Log the image URLs for debugging
  console.log("Creating masonry item with image:", {
    id: photo.id,
    title: title,
    category: photo.category, // Log exact category name
    tags: photo.tags, // Log exact tag names
    original: photo.src,
    optimized: optimizedSrc,
    thumbnail: thumbnailSrc,
    aspectRatio: photo.aspectRatio,
  });

  item.innerHTML = `
  <div class="masonry-image-container">
    <div class="image-loading">
      <div class="loading-spinner"></div>
    </div>
    <img 
      src="${imgSrc}" 
      data-src="${dataSrc}"
      alt="${alt_text}" 
      loading="lazy" 
      class="lazy-image"
      crossorigin="anonymous"
      onerror="handleImageLoadError(this, '${fallbackImage}')"
    />
    <div class="photo-info-overlay">
      <h3>${title}</h3>
      <p>${location}</p>
      ${
        photo.category
          ? `<span class="photo-category">${photo.category}</span>`
          : ""
      }
    </div>
  </div>
  <div class="masonry-info">
    <h3 class="masonry-title">${title}</h3>
    <p class="masonry-location">${location}</p>
    <div class="masonry-tags">
      ${tags.map((tag) => `<span class="masonry-tag">${tag}</span>`).join("")}
    </div>
  </div>
`;

  const imageContainer = item.querySelector(".masonry-image-container");
  const img = item.querySelector("img");

  // Handle image load event
  img.onload = () => {
    console.log("Image loaded successfully:", img.src);
    // Hide loading spinner
    const loadingElement = item.querySelector(".image-loading");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  };

  // Handle image error with better error handling
  img.onerror = () => {
    console.error("Image failed to load:", img.src);
    // Hide loading spinner
    const loadingElement = item.querySelector(".image-loading");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }

    // Show error placeholder
    img.src = fallbackImage;
    img.alt = "Error loading image";
  };

  return item;
}

/**
 * Photography Main Module
 * Handles initialization and configuration for the photography gallery
 */

document.addEventListener("DOMContentLoaded", () => {
  // Configuration
  const config = {
    // API Configuration
    apiUrl: "https://backend-cms-89la.onrender.com/api",

    // Cloudinary Configuration
    cloudinary: {
      useOriginalUrl: true,
      quality: "auto:good",
      format: "auto",
    },

    // Gallery Configuration
    gallery: {
      pageSize: 12,
      initialPage: 1,
      infiniteScroll: true,
      lazyLoad: true,
      cacheDuration: 60 * 60 * 1000,
    },

    // Element IDs
    elements: {
      masonryGrid: "masonry-grid",
      photoLightbox: "photo-lightbox",
      loadMoreBtn: "load-more",
      photoSearch: "photo-search",
      relatedPhotosOverlay: "related-photos-overlay",
      relatedPhotosContainer: "related-photos-container",
      relatedPhotosClose: "related-photos-close",
    },

    // Responsive image sizes
    imageSizes: {
      thumbnail: 400,
      small: 800,
      medium: 1200,
      large: 1600,
      xlarge: 2000,
    },
  };

  // Initialize the gallery with the configuration
  initializeGallery(config);
});

/**
 * Initialize the gallery with the provided configuration
 * @param {Object} config - Configuration object
 */
function initializeGallery(config) {
  console.log("Initializing photography gallery with config:", config);

  // Add Cloudinary configuration to window object
  window.photographyConfig = config;
}

/**
 * Load a script dynamically
 * @param {string} src - Script source URL
 * @returns {Promise} - Promise that resolves when the script is loaded
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
}

/**
 * Cloudinary URL helper functions
 */

// Get optimized Cloudinary URL
window.getOptimizedCloudinaryUrl = (url, width, options = {}) => {
  if (!url || url.startsWith("data:")) {
    return createPlaceholder(width, options.aspectRatio || "landscape");
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

// Create a placeholder image
function createPlaceholder(width, aspectRatio = "landscape") {
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
  let imageObserver = null; // Store the observer reference
  const processedPhotoIds = new Set(); // Use a Set for tracking processed photo IDs

  // API Configuration
  const API_URL = "https://backend-cms-89la.onrender.com/api";
  const CLOUDINARY_BASE_URL = "https://res.cloudinary.com"; // Will be extracted from image URLs

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

  // Add debug function to help troubleshoot Strapi response structure
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
  // Simplified aspect ratio handling - no complex calculations
  function setAspectRatio(img, container) {
    // Do nothing - let CSS handle natural aspect ratios
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

        // Use c_scale instead of c_fill to preserve aspect ratio
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

  // Preload images for smoother transitions with CORS support
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

  // API Functions
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

      // Fetch with pagination and populate relations (no sorting for random display)
      const url = `${API_URL}/photographies?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`;
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

  // Add this function above transformPhotoData:
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

  // Transform Strapi data to our format with improved URL handling
  function transformPhotoData(strapiPhotos) {
    if (!strapiPhotos || !Array.isArray(strapiPhotos)) {
      console.error("Invalid photos data:", strapiPhotos);
      return [];
    }

    return strapiPhotos.map((photo) => {
      console.log(
        "Processing photo ID:",
        photo.id,
        "Attributes exist:",
        !!photo.attributes
      );

      // Initialize default values
      let imageUrl = "";
      let categoryName = "uncategorized";
      let photoTags = [];
      let title = "Untitled";
      let alt_text = "Photo";
      let location = "";

      try {
        // Handle Strapi v4 data structure
        if (photo.attributes) {
          // Extract image URL - FIXED to handle multiple formats
          if (photo.attributes.image && photo.attributes.image.data) {
            const imageData = photo.attributes.image.data;

            // Try to get the URL from different possible locations
            if (imageData.attributes && imageData.attributes.url) {
              imageUrl = imageData.attributes.url;
              console.log("Found image URL:", imageUrl);
            } else if (imageData.attributes && imageData.attributes.formats) {
              // Try to get the best format available
              const formats = imageData.attributes.formats;
              if (formats.large) {
                imageUrl = formats.large.url;
              } else if (formats.medium) {
                imageUrl = formats.medium.url;
              } else if (formats.small) {
                imageUrl = formats.small.url;
              } else if (formats.thumbnail) {
                imageUrl = formats.thumbnail.url;
              }
              console.log("Found image format URL:", imageUrl);
            } else if (imageData.url) {
              imageUrl = imageData.url;
            }
          }

          // Extract category - IMPORTANT: Preserve exact category name from Strapi
          if (photo.attributes.category && photo.attributes.category.data) {
            const categoryData = photo.attributes.category.data;
            if (categoryData.attributes && categoryData.attributes.name) {
              // Preserve exact category name including capitalization
              categoryName = categoryData.attributes.name;
              console.log("Found category:", categoryName);
            } else if (categoryData.name) {
              categoryName = categoryData.name;
              console.log("Found category (direct):", categoryName);
            }
          }

          // Extract tags - IMPORTANT: Preserve exact tag names from Strapi
          if (
            photo.attributes.tags &&
            photo.attributes.tags.data &&
            Array.isArray(photo.attributes.tags.data)
          ) {
            photoTags = photo.attributes.tags.data
              .map((tag) => {
                if (tag.attributes && tag.attributes.name) {
                  // Preserve exact tag name including capitalization
                  return tag.attributes.name;
                } else if (tag.name) {
                  return tag.name;
                }
                return null;
              })
              .filter(Boolean);
            console.log("Found tags:", photoTags);
          }

          // Improve title fallback with random titles if needed
          title = photo.attributes.title || generateRandomTitle() || "Untitled";
          alt_text =
            photo.attributes.alt_text || photo.attributes.title || "Photo";
          location = photo.attributes.location || "";
        } else {
          // Handle direct structure or older Strapi versions
          if (photo.image) {
            if (photo.image.data && photo.image.data.attributes) {
              imageUrl = photo.image.data.attributes.url;
            } else if (photo.image.data && photo.image.data.url) {
              imageUrl = photo.image.data.url;
            } else if (photo.image.url) {
              imageUrl = photo.image.url;
            }
          }

          if (photo.category) {
            if (photo.category.data && photo.category.data.attributes) {
              // Preserve exact category name including capitalization
              categoryName = photo.category.data.attributes.name;
            } else if (photo.category.data && photo.category.data.name) {
              categoryName = photo.category.data.name;
            } else if (photo.category.name) {
              categoryName = photo.category.name;
            }
          }

          if (photo.tags && photo.tags.data && Array.isArray(photo.tags.data)) {
            photoTags = photo.tags.data
              .map((tag) => {
                if (tag.attributes && tag.attributes.name) {
                  // Preserve exact tag name including capitalization
                  return tag.attributes.name;
                } else if (tag.name) {
                  return tag.name;
                }
                return null;
              })
              .filter(Boolean);
          }

          // Improve title fallback with random titles if needed
          title = photo.title || generateRandomTitle() || "Untitled";
          alt_text = photo.alt_text || photo.title || "Photo";
          location = photo.location || "";
        }

        // If we still don't have an image URL, check for other possible structures
        if (!imageUrl && photo.url) {
          imageUrl = photo.url;
        }

        // Ensure we have a valid image URL or use a placeholder
        if (!imageUrl) {
          console.warn("No image URL found for photo:", photo);
          // Use inline SVG data URL instead of placeholder.svg
          imageUrl = createAdaptivePlaceholder(600, "landscape");
        }

        // Make sure the URL is absolute
        if (imageUrl.startsWith("/")) {
          // Convert relative URL to absolute using the API_URL base
          const apiBase = API_URL.split("/api")[0];
          imageUrl = `${apiBase}${imageUrl}`;
          console.log("Converted to absolute URL:", imageUrl);
        }

        // Store the original URL to avoid creating multiple versions
        const originalUrl = imageUrl;

        return {
          id: photo.id || Math.random().toString(36).substring(2, 9),
          title: title,
          alt_text: alt_text,
          location: location,
          src: originalUrl,
          aspectRatio:
            (photo.attributes
              ? photo.attributes.aspect_ratio
              : photo.aspect_ratio) || "landscape",
          category: categoryName, // Using exact category name from Strapi
          tags: photoTags, // Using exact tag names from Strapi
          // Add responsive image URLs - use the same base URL for all sizes
          thumbnailSrc: getOptimizedImageUrl(
            originalUrl,
            IMAGE_SIZES.thumbnail
          ),
          smallSrc: getOptimizedImageUrl(originalUrl, IMAGE_SIZES.small),
          mediumSrc: getOptimizedImageUrl(originalUrl, IMAGE_SIZES.medium),
          largeSrc: getOptimizedImageUrl(originalUrl, IMAGE_SIZES.large),
        };
      } catch (error) {
        console.error("Error transforming photo data:", error, photo);
        // Return a placeholder for failed photos
        const fallbackSvg = createAdaptivePlaceholder(600, "landscape");
        return {
          id: photo.id || Math.random().toString(36).substring(2, 9),
          title: "Photo Load Error",
          alt_text: "Error loading photo",
          location: "",
          src: fallbackSvg,
          aspectRatio: "landscape",
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

  // Shuffle array using Fisher-Yates algorithm
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Update the calculateRowSpan function if it exists
  function calculateRowSpan(element) {
    const ROW_HEIGHT = 10;
    const GAP = 10;
    const height = element.offsetHeight + GAP;
    return Math.ceil(height / (ROW_HEIGHT + GAP));
  }

  // Add a recalculateGrid function if it doesn't exist
  function recalculateGrid() {
    const items = document.querySelectorAll(".masonry-item");
    items.forEach((item) => {
      const img = item.querySelector("img");
      const imageContainer = item.querySelector(".masonry-image-container");

      if (img.complete && img.naturalWidth > 0) {
        // Image is already loaded
        if (typeof setAspectRatio === "function") {
          setAspectRatio(img, imageContainer);
        }

        if (typeof calculateRowSpan === "function") {
          const rowSpan = calculateRowSpan(item);
          item.style.gridRowEnd = `span ${Math.max(rowSpan, 20)}`; // Ensure minimum height
        }
      }
    });
  }

  // Add this function to handle image loading errors
  function handleImageLoadError(img, fallbackImage) {
    console.error("Image failed to load:", img.src);
    img.src = fallbackImage;
    img.alt = "Error loading image";
  }

  // FIXED: Create masonry item with optimized image loading
  function createMasonryItem(photo) {
    // Skip if this is a duplicate photo
    if (!photo || !photo.id) {
      console.warn("Invalid photo object:", photo);
      return null;
    }

    // Check if we've already processed this photo ID
    if (processedPhotoIds.has(photo.id.toString())) {
      console.log(`Skipping duplicate photo ID: ${photo.id}`);
      return null;
    }

    // Add this ID to our tracking set
    processedPhotoIds.add(photo.id.toString());

    // Validate photo object to prevent "Untitled" boxes
    if (!photo || !photo.id) {
      console.error("Invalid photo object:", photo);
      return document.createElement("div"); // Return empty div instead of broken item
    }

    const item = document.createElement("div");
    item.className = `masonry-item new`;
    item.dataset.id = photo.id;
    item.dataset.category = photo.category || "uncategorized";
    item.dataset.tags =
      photo.tags && Array.isArray(photo.tags) ? photo.tags.join(",") : "";

    // FIXED: Ensure we have valid data for all fields with strong fallbacks
    const title = photo.title || generateRandomTitle() || "Untitled";
    const location = photo.location || "";
    const alt_text = photo.alt_text || title || "Photo";
    const tags = photo.tags && Array.isArray(photo.tags) ? photo.tags : [];

    // Determine appropriate image size based on viewport
    const responsiveSize = getResponsiveImageSize();
    const optimizedSrc =
      photo.mediumSrc ||
      (photo.src ? getOptimizedImageUrl(photo.src, responsiveSize) : null);
    const thumbnailSrc = photo.thumbnailSrc || optimizedSrc;

    // Use inline SVG as fallback for error images or missing sources
    const fallbackImage = createAdaptivePlaceholder(
      responsiveSize,
      photo.aspectRatio || "landscape"
    );

    // Use the source that exists or fallback
    const imgSrc = thumbnailSrc || fallbackImage;
    const dataSrc = optimizedSrc || imgSrc;

    // Log the image URLs for debugging
    console.log("Creating masonry item:", {
      id: photo.id,
      title: title,
      category: photo.category,
      tags: photo.tags,
      original: photo.src,
      optimized: optimizedSrc,
      thumbnail: thumbnailSrc,
    });

    item.innerHTML = `
    <div class="masonry-image-container">
      <div class="image-loading">
        <div class="loading-spinner"></div>
      </div>
      <img 
        src="${imgSrc}" 
        data-src="${dataSrc}"
        alt="${alt_text}" 
        loading="lazy" 
        class="lazy-image"
        crossorigin="anonymous"
        onerror="handleImageLoadError(this, '${fallbackImage}')"
      />
      <div class="photo-info-overlay">
        <h3>${title}</h3>
        <p>${location}</p>
        ${
          photo.category
            ? `<span class="photo-category">${photo.category}</span>`
            : ""
        }
      </div>
    </div>
    <div class="masonry-info">
      <h3 class="masonry-title">${title}</h3>
      <p class="masonry-location">${location}</p>
      <div class="masonry-tags">
        ${tags.map((tag) => `<span class="masonry-tag">${tag}</span>`).join("")}
      </div>
    </div>
  `;

    const imageContainer = item.querySelector(".masonry-image-container");
    const img = item.querySelector("img");

    // Handle image load event
    img.onload = () => {
      console.log("Image loaded successfully:", img.src);
      // Hide loading spinner
      const loadingElement = item.querySelector(".image-loading");
      if (loadingElement) {
        loadingElement.style.display = "none";
      }
    };

    // Handle image error with better error handling
    img.onerror = () => {
      console.error("Image failed to load:", img.src);
      // Hide loading spinner
      const loadingElement = item.querySelector(".image-loading");
      if (loadingElement) {
        loadingElement.style.display = "none";
      }

      // Show error placeholder
      img.src = fallbackImage;
      img.alt = "Error loading image";
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

    // FIXED: Reset any previous transform to ensure image displays at natural size
    lightboxMainImage.style.transform = "scale(1)";

    // FIXED: Ensure the entire image is visible regardless of aspect ratio
    lightboxMainImage.onload = () => {
      // Get the image's natural dimensions
      const imgWidth = lightboxMainImage.naturalWidth;
      const imgHeight = lightboxMainImage.naturalHeight;
      const aspectRatio = imgWidth / imgHeight;

      // Get the container dimensions
      const containerWidth = lightboxMain.clientWidth * 0.9; // 90% of container width
      const containerHeight = lightboxMain.clientHeight * 0.9; // 90% of container height

      // Calculate the dimensions that will fit the image entirely within the container
      // while maintaining aspect ratio
      let displayWidth, displayHeight;

      if (imgWidth / containerWidth > imgHeight / containerHeight) {
        // Image is wider relative to container
        displayWidth = containerWidth;
        displayHeight = containerWidth / aspectRatio;
      } else {
        // Image is taller relative to container
        displayHeight = containerHeight;
        displayWidth = containerHeight * aspectRatio;
      }

      // Apply the calculated dimensions
      lightboxMainImage.style.width = `${displayWidth}px`;
      lightboxMainImage.style.height = `${displayHeight}px`;
      lightboxMainImage.style.maxWidth = "none";
      lightboxMainImage.style.maxHeight = "none";
      lightboxMainImage.style.objectFit = "contain";
    };

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
      // Disconnect previous observer if it exists
      if (imageObserver) {
        imageObserver.disconnect();
      }

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

  // FIXED: Improved loadPhotos function to handle the Node error
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
      let newPhotos = transformPhotoData(response.data);
      console.log("Transformed photos before shuffle:", newPhotos); // Debug log

      // Shuffle the new photos
      newPhotos = shuffleArray(newPhotos);
      console.log("Transformed photos after shuffle:", newPhotos); // Debug log

      // Add to our collection
      allPhotos = [...allPhotos, ...newPhotos];
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
        // FIXED: Check if each item is valid before appending
        newPhotos.forEach((photo) => {
          const item = createMasonryItem(photo);
          if (item) {
            // Only append if item is not null
            masonryGrid.appendChild(item);
          }
        });
      }

      // Update gallery items array
      updateGalleryItems();

      // Setup lazy loading
      setupLazyLoading();

      // Remove the 'new' class after animation completes
      setTimeout(() => {
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

  // Reset the processed IDs when filtering or searching
  function resetProcessedPhotoIds() {
    processedPhotoIds.clear();
  }

  // FIXED: Improved filter photos function with better category handling
  function filterPhotos(category) {
    console.log("Filtering photos by category:", category);

    // Reset the processed IDs when filtering
    resetProcessedPhotoIds();

    if (category === "all") {
      // Make sure we're working with valid photo objects only
      filteredPhotos = shuffleArray(allPhotos.filter(isValidPhoto));
      console.log("Showing all photos:", filteredPhotos.length);
    } else {
      filteredPhotos = shuffleArray(
        allPhotos.filter((photo) => {
          // Check if photo is valid
          if (!isValidPhoto(photo)) return false;

          // Check if photo matches category
          const matchesCategory = photo.category === category;

          // Check if photo has matching tag
          const matchesTag =
            photo.tags &&
            Array.isArray(photo.tags) &&
            photo.tags.some((tag) => tag === category);

          // Log matches for debugging
          if (matchesCategory || matchesTag) {
            console.log(
              `Photo "${photo.title}" matches category ${category}:`,
              {
                category: photo.category,
                tags: photo.tags,
              }
            );
          }

          return matchesCategory || matchesTag;
        })
      );
      console.log("Filtered photos count:", filteredPhotos.length);
    }

    // Clear grid and display filtered photos
    masonryGrid.innerHTML = "";

    if (filteredPhotos.length === 0) {
      // No photos in this category
      const noCategoryMessage = document.createElement("div");
      noCategoryMessage.className = "no-photos-message";
      noCategoryMessage.innerHTML = `<p>No photos found in the "${category}" category.</p>`;
      masonryGrid.appendChild(noCategoryMessage);
      console.log("No photos found in category:", category);
    } else {
      filteredPhotos.forEach((photo) => {
        const item = createMasonryItem(photo);
        if (item) {
          // Only append if not null (not a duplicate)
          masonryGrid.appendChild(item);
        }
      });
    }

    // Update gallery items array
    updateGalleryItems();

    // Setup lazy loading for new items
    setupLazyLoading();

    // Recalculate grid layout
    setTimeout(recalculateGrid, 300);
  }

  // Add a function to validate photo objects to prevent data corruption
  function isValidPhoto(photo) {
    return (
      photo &&
      typeof photo === "object" &&
      photo.id &&
      (photo.title || photo.src)
    );
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
        if (item) {
          // Only append if item is not null
          masonryGrid.appendChild(item);
        }
      });
    }

    // Update gallery items array
    updateGalleryItems();

    // Setup lazy loading for new items
    setupLazyLoading();
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

  // Initialize the enhanced refresh button
  initRefreshButton();
  enhanceNoPhotosMessage();

  // Check if we need to show the no photos message on load
  checkAndShowNoPhotosMessage();

  /**
   * Initialize the enhanced refresh button
   */
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

        // FIXED: Don't clear cache or reset photo arrays completely
        // Instead, create a deep copy of the existing photos to preserve all metadata
        if (window.allPhotos && window.allPhotos.length > 0) {
          // Create deep copies of the photo objects to ensure all metadata is preserved
          const photosCopy = window.allPhotos.map((photo) => ({ ...photo }));

          // Shuffle the copied photos array
          window.allPhotos = shuffleArray(photosCopy);

          // Update filtered photos to match the current filter
          const activeFilter = document.querySelector(".filter-button.active");
          if (activeFilter && activeFilter.dataset.filter === "all") {
            // For "All Photos" view, use the full shuffled array
            window.filteredPhotos = [...window.allPhotos];
          } else if (activeFilter) {
            // For category views, filter the shuffled array
            const category = activeFilter.dataset.filter;
            window.filteredPhotos = window.allPhotos.filter(
              (photo) =>
                photo.category === category || photo.tags.includes(category)
            );
          } else {
            // Fallback to all photos if no active filter
            window.filteredPhotos = [...window.allPhotos];
          }

          // Clear the grid
          const masonryGrid = document.getElementById("masonry-grid");
          if (masonryGrid) {
            masonryGrid.innerHTML = "";

            // Reset the processed IDs when refreshing
            resetProcessedPhotoIds();

            // Re-render the photos from the filtered array
            window.filteredPhotos.forEach((photo) => {
              // Ensure all required properties exist before creating the item
              if (photo && photo.id && photo.title && photo.src) {
                const item = createMasonryItem(photo);
                if (item) {
                  // Only append if item is not null
                  masonryGrid.appendChild(item);
                }
              } else {
                console.warn("Skipping invalid photo object:", photo);
              }
            });

            // Update gallery items and setup lazy loading
            updateGalleryItems();
            setupLazyLoading();

            // Recalculate grid layout
            setTimeout(recalculateGrid, 300);
          }
        } else {
          // Only fetch new photos if we don't have any
          if (typeof clearCache === "function") {
            clearCache();
          }

          if (window.page !== undefined) {
            window.page = 1;
          }

          if (typeof loadPhotos === "function") {
            loadPhotos();
          }
        }

        // Don't reset the active filter - maintain the current view

        // Clear search input
        const searchInput = document.getElementById("photo-search");
        if (searchInput) {
          searchInput.value = "";
        }

        // Remove animation class after rotation completes
        setTimeout(() => {
          this.classList.remove("refreshing");
        }, 800);
      });
    }
  }

  /**
   * Enhance the "No photos found" message
   */
  function enhanceNoPhotosMessage() {
    // Create a more visually appealing template for the no photos message
    window.createNoPhotosMessage = (message, showResetButton = true) => {
      const noPhotosMessage = document.createElement("div");
      noPhotosMessage.className = "no-photos-message";

      // Add icon
      const iconHtml = `
      <div class="no-photos-message-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
          <circle cx="12" cy="12" r="3"></circle>
          <line x1="3" y1="3" x2="21" y2="21"></line>
        </svg>
      </div>
    `;

      // Add message and reset button
      noPhotosMessage.innerHTML = `
      ${iconHtml}
      <p>${message || "No photos found"}</p>
      ${
        showResetButton
          ? '<button class="reset-filters-button">Reset Filters</button>'
          : ""
      }
    `;

      // Add event listener to reset button
      if (showResetButton) {
        const resetButton = noPhotosMessage.querySelector(
          ".reset-filters-button"
        );
        resetButton.addEventListener("click", resetAllFilters);
      }

      return noPhotosMessage;
    };

    // Override the existing search function to use our enhanced message
    const originalSearchPhotos = window.searchPhotos;
    if (typeof originalSearchPhotos === "function") {
      window.searchPhotos = (searchTerm) => {
        originalSearchPhotos(searchTerm);
        checkAndShowNoPhotosMessage();
      };
    }

    // Override the existing filter function to use our enhanced message
    const originalFilterPhotos = window.filterPhotos;
    if (typeof originalFilterPhotos === "function") {
      window.filterPhotos = (category) => {
        originalFilterPhotos(category);
        checkAndShowNoPhotosMessage();
      };
    }
  }

  /**
   * Check if the gallery is empty and show the enhanced no photos message
   */
  function checkAndShowNoPhotosMessage() {
    setTimeout(() => {
      const masonryGrid = document.getElementById("masonry-grid");
      const existingMessage = document.querySelector(".no-photos-message");
      const hasPhotos =
        masonryGrid && masonryGrid.querySelector(".masonry-item");

      // Remove existing message if it exists
      if (existingMessage) {
        existingMessage.remove();
      }

      // If no photos are found, show our enhanced message
      if (masonryGrid && !hasPhotos) {
        // Get search term or active filter for contextual message
        const searchInput = document.getElementById("photo-search");
        const activeFilter = document.querySelector(".filter-button.active");

        let message = "No photos found";

        if (searchInput && searchInput.value) {
          message = `No photos found matching "${searchInput.value}"`;
        } else if (activeFilter && activeFilter.dataset.filter !== "all") {
          message = `No photos found in the "${activeFilter.textContent}" category`;
        }

        const noPhotosMessage = window.createNoPhotosMessage(message, true);
        masonryGrid.appendChild(noPhotosMessage);
      }
    }, 300); // Small delay to ensure DOM is updated
  }

  /**
   * Reset all filters and search
   */
  function resetAllFilters() {
    // Clear search input
    const searchInput = document.getElementById("photo-search");
    if (searchInput) {
      searchInput.value = "";
    }

    // Reset to "All Photos" filter
    const allPhotosButton = document.querySelector(
      '.filter-button[data-filter="all"]'
    );
    if (allPhotosButton) {
      const filterButtons = document.querySelectorAll(".filter-button");
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      allPhotosButton.classList.add("active");

      // Trigger the filter
      if (typeof filterPhotos === "function") {
        filterPhotos("all");
      }
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

      // Update category filters from API
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

  // FIXED: Improved updateCategoryFilters function with better event handling
  async function updateCategoryFilters() {
    try {
      console.log("Starting category filter update...");

      // Fetch categories from API
      const categoriesData = await fetchCategories();
      console.log("Categories data:", categoriesData);

      // Get the filter controls container
      const filterControls = document.querySelector(".filter-controls");
      if (!filterControls) {
        console.warn("Filter controls container not found");
        return;
      }

      // Clear existing buttons
      filterControls.innerHTML = "";

      // Add "All Photos" button
      const allButton = document.createElement("button");
      allButton.className = "filter-button active";
      allButton.dataset.filter = "all";
      allButton.textContent = "All Photos";
      filterControls.appendChild(allButton);

      // Extract categories from API data
      const apiCategories = new Set();
      if (
        categoriesData &&
        categoriesData.data &&
        Array.isArray(categoriesData.data)
      ) {
        categoriesData.data.forEach((category) => {
          let categoryName = "";
          let categorySlug = "";

          // Handle different data structures
          if (category.attributes) {
            categoryName = category.attributes.name;
            categorySlug =
              category.attributes.slug ||
              category.attributes.name.toLowerCase();
          } else {
            categoryName = category.name;
            categorySlug = category.slug || category.name.toLowerCase();
          }

          apiCategories.add(categorySlug);
          console.log("Adding category from API:", categoryName, categorySlug);

          // Create button
          const button = document.createElement("button");
          button.className = "filter-button";
          button.dataset.filter = categorySlug;
          button.textContent =
            categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
          filterControls.appendChild(button);
        });
      }

      // Extract categories directly from photos
      const photoCategories = new Set();

      // Get all photos
      allPhotos.forEach((photo) => {
        if (
          photo.category &&
          photo.category !== "uncategorized" &&
          !apiCategories.has(photo.category)
        ) {
          photoCategories.add(photo.category);
        }

        // Also check tags
        if (photo.tags && Array.isArray(photo.tags)) {
          photo.tags.forEach((tag) => {
            if (tag && !apiCategories.has(tag) && !photoCategories.has(tag)) {
              photoCategories.add(tag);
            }
          });
        }
      });

      console.log(
        "Extracted categories from photos:",
        Array.from(photoCategories)
      );

      // Add buttons for categories found in photos but not in API
      photoCategories.forEach((category) => {
        console.log("Adding category from photos:", category);

        // Create button
        const button = document.createElement("button");
        button.className = "filter-button";
        button.dataset.filter = category;
        button.textContent =
          category.charAt(0).toUpperCase() + category.slice(1);
        filterControls.appendChild(button);
      });

      // Add event listeners to all buttons
      document.querySelectorAll(".filter-button").forEach((button) => {
        // Remove any existing listeners by cloning
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        // Add fresh event listener
        newButton.addEventListener("click", function () {
          console.log("Category button clicked:", this.dataset.filter);

          // Remove active class from all buttons
          document.querySelectorAll(".filter-button").forEach((btn) => {
            btn.classList.remove("active");
          });

          // Add active class to clicked button
          this.classList.add("active");

          // IMPORTANT: Use the exact text content of the button for filtering
          // This ensures we match the exact category name in the Strapi data
          const filterValue = this.dataset.filter;
          console.log("Filtering by exact value:", filterValue);

          // Filter photos using the button's data-filter attribute for exact matching
          filterPhotos(filterValue);
        });
      });

      console.log("Category filters updated successfully");
    } catch (error) {
      console.error("Error updating category filters:", error);
    }
  }

  // FIXED: Proper environment detection for Vercel analytics scripts
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

        console.log(
          "Vercel analytics scripts loaded in production environment"
        );
      } catch (error) {
        console.log("Error loading Vercel analytics scripts:", error);
      }
    } else {
      console.log(
        "Vercel analytics scripts skipped in development environment"
      );
    }
  }

  // Apply the Vercel scripts fix
  conditionallyLoadVercelScripts();

  // Initialize the gallery
  initGallery();

  // The duplicate photo fix will be applied when createMasonryItem is called
  console.log("Photography gallery fixes applied");
});

// Add global handler for image loading errors
window.handleImageLoadError = (img, fallbackImage) => {
  console.error("Image failed to load:", img.src);
  img.src = fallbackImage;
  img.alt = "Error loading image";
};

// Your existing gallery code is above this line
// ...

// Add these enhancements at the END of your file
document.addEventListener("DOMContentLoaded", () => {
  // Wait for your existing photo loading code to finish
  setTimeout(() => {
    // Basic virtual scrolling - only render what's visible
    function setupBasicVirtualScrolling() {
      const container = document.getElementById("masonry-grid");
      const items = Array.from(container.querySelectorAll(".masonry-item"));

      function updateVisibleItems() {
        const viewportTop = window.scrollY;
        const viewportBottom = viewportTop + window.innerHeight;
        const buffer = 1000; // pixels above/below viewport

        items.forEach((item) => {
          const rect = item.getBoundingClientRect();
          const itemTop = rect.top + viewportTop;
          const itemBottom = rect.bottom + viewportTop;

          // Is this item visible?
          const isVisible =
            itemBottom > viewportTop - buffer &&
            itemTop < viewportBottom + buffer;

          // Show/hide based on visibility
          item.style.display = isVisible ? "block" : "none";
        });
      }

      // Update on scroll (with throttling to improve performance)
      let scrollTimeout;
      window.addEventListener("scroll", () => {
        if (!scrollTimeout) {
          scrollTimeout = setTimeout(() => {
            updateVisibleItems();
            scrollTimeout = null;
          }, 100);
        }
      });

      // Initial update
      updateVisibleItems();
    }

    // Progressive image loading
    function setupProgressiveLoading() {
      const images = document.querySelectorAll(".masonry-item img");

      // Use Intersection Observer if available
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src && !img.dataset.loaded) {
                  // Load high quality image
                  img.src = img.dataset.src;
                  img.classList.remove("loading");
                  img.classList.add("loaded");
                  img.dataset.loaded = "true";

                  // Stop observing this image
                  observer.unobserve(img);
                }
              }
            });
          },
          {
            rootMargin: "200px 0px",
            threshold: 0.1,
          }
        );

        // Observe all images
        images.forEach((img) => observer.observe(img));
      } else {
        // Fallback for browsers without IntersectionObserver
        images.forEach((img) => {
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
        });
      }
    }

    // Run the enhancements
    setupBasicVirtualScrolling();
    setupProgressiveLoading();

    console.log("Gallery enhancements applied");
  }, 1000); // Wait 1 second for everything else to initialize
});
