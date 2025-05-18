/**
 * Certificate-specific JavaScript functionality
 * Handles certificate display, API fetching, and carousel functionality
 * @author Original code by Shain, enhanced by v0
 * @version 3.0
 */

// Declare allCertificates variable
let allCertificates = [];

// Use configurable API URL instead of hardcoded URL
const API_BASE_URL = window.strapi_api || "https://api.shainwaiyan.com";

// Declare generatePlaceholderImage function
function generatePlaceholderImage(width, height, text) {
  return `https://via.placeholder.com/${width}x${height}.png?text=${text}`;
}

// Update handleMobileAdjustments to ensure full width on mobile
function handleMobileAdjustments() {
  const isMobile = window.innerWidth < 768;
  const container = document.querySelector(".carousel-container");

  if (container) {
    if (isMobile) {
      container.classList.add("mobile-view");

      // Ensure the container uses full width
      container.style.width = "100%";
      container.style.margin = "0";
      container.style.padding = "0";

      // Ensure the parent section uses full width
      const section = document.querySelector(".certificates-section");
      if (section) {
        section.style.width = "100%";
        section.style.padding = "0";
        section.style.margin = "0";
      }

      // Adjust carousel navigation for better mobile experience
      const prevArrow = document.querySelector(".carousel-prev");
      const nextArrow = document.querySelector(".carousel-next");

      if (prevArrow && nextArrow) {
        prevArrow.classList.add("mobile-arrow");
        nextArrow.classList.add("mobile-arrow");

        // Move arrows between image and description for mobile
        moveArrowsForMobile();
      }

      // Optimize certificate images for mobile
      optimizeMobileImages();

      // Handle orientation
      handleOrientationChange();

      // Ensure all slides use full width
      const slides = document.querySelectorAll(".carousel-slide");
      slides.forEach((slide) => {
        slide.style.width = "100%";
        slide.style.padding = "0";

        // Ensure image container and info use full width
        const imageContainer = slide.querySelector(
          ".certificate-image-container"
        );
        const infoContainer = slide.querySelector(".certificate-info");

        if (imageContainer) {
          imageContainer.style.width = "100%";
          imageContainer.style.margin = "0";
          imageContainer.style.borderRadius = "0";
        }

        if (infoContainer) {
          infoContainer.style.width = "100%";
          infoContainer.style.margin = "0";
          infoContainer.style.borderRadius = "0";
        }
      });
    } else {
      // Reset styles for desktop view
      container.classList.remove("mobile-view");
      container.style.width = "";
      container.style.margin = "";
      container.style.padding = "";

      const section = document.querySelector(".certificates-section");
      if (section) {
        section.style.width = "";
        section.style.padding = "";
        section.style.margin = "";
      }

      const prevArrow = document.querySelector(".carousel-prev");
      const nextArrow = document.querySelector(".carousel-next");

      if (prevArrow && nextArrow) {
        prevArrow.classList.remove("mobile-arrow");
        nextArrow.classList.remove("mobile-arrow");

        // Restore arrows to original position for desktop
        restoreArrowsForDesktop();
      }

      // Reset any mobile-specific styles
      const slides = document.querySelectorAll(".carousel-slide");
      slides.forEach((slide) => {
        slide.style.width = "";
        slide.style.padding = "";

        const imageContainer = slide.querySelector(
          ".certificate-image-container"
        );
        const infoContainer = slide.querySelector(".certificate-info");

        if (imageContainer) {
          imageContainer.style.width = "";
          imageContainer.style.margin = "";
          imageContainer.style.borderRadius = "";
        }

        if (infoContainer) {
          infoContainer.style.width = "";
          infoContainer.style.margin = "";
          infoContainer.style.borderRadius = "";
        }
      });
    }
  }
}

// Update the moveArrowsForMobile function to fix arrow positioning
function moveArrowsForMobile() {
  const prevArrow = document.querySelector(".carousel-prev");
  const nextArrow = document.querySelector(".carousel-next");

  if (!prevArrow || !nextArrow) return;

  // Check if we already have a controls container
  let controlsContainer = document.querySelector(
    ".carousel-controls-container"
  );

  if (!controlsContainer) {
    // Create a container for the arrows
    controlsContainer = document.createElement("div");
    controlsContainer.className = "carousel-controls-container";

    // Add touch hint for mobile users
    const touchHint = document.createElement("div");
    touchHint.className = "touch-hint";
    touchHint.textContent = "Swipe to navigate";
    touchHint.style.fontSize = "0.8rem";
    touchHint.style.opacity = "0.7";
    touchHint.style.textAlign = "center";
    touchHint.style.padding = "0.25rem 0";

    // Add the touch hint to the controls container
    controlsContainer.appendChild(touchHint);

    // Get all slides
    const slides = document.querySelectorAll(".carousel-slide");

    slides.forEach((slide) => {
      const imageContainer = slide.querySelector(
        ".certificate-image-container"
      );
      const infoContainer = slide.querySelector(".certificate-info");

      if (imageContainer && infoContainer) {
        // Create a clone of the controls container for each slide
        const slideControlsContainer = controlsContainer.cloneNode(true);

        // Insert the controls container between image and info
        imageContainer.after(slideControlsContainer);
      }
    });

    // Move the arrows into the first container
    const firstControlsContainer = document.querySelector(
      ".carousel-controls-container"
    );
    if (firstControlsContainer) {
      // Insert arrows before the touch hint
      firstControlsContainer.insertBefore(
        prevArrow,
        firstControlsContainer.firstChild
      );
      firstControlsContainer.insertBefore(
        nextArrow,
        firstControlsContainer.firstChild
      );

      // Style the arrows for better mobile experience
      prevArrow.style.margin = "0 1rem";
      nextArrow.style.margin = "0 1rem";

      // FIX: Remove any transform or position styles that cause movement on press
      prevArrow.style.position = "static";
      nextArrow.style.position = "static";
      prevArrow.style.transform = "none";
      nextArrow.style.transform = "none";
      prevArrow.style.top = "auto";
      nextArrow.style.top = "auto";

      // Make the touch hint disappear after 5 seconds
      setTimeout(() => {
        const hints = document.querySelectorAll(".touch-hint");
        hints.forEach((hint) => {
          hint.style.transition = "opacity 1s ease";
          hint.style.opacity = "0";
        });
      }, 5000);
    }
  }
}

// Function to restore arrows to original position for desktop
function restoreArrowsForDesktop() {
  const controlsContainers = document.querySelectorAll(
    ".carousel-controls-container"
  );
  const prevArrow = document.querySelector(".carousel-prev");
  const nextArrow = document.querySelector(".carousel-next");
  const carouselContainer = document.querySelector(".carousel-container");

  if (prevArrow && nextArrow && carouselContainer) {
    // Move arrows back to the carousel container
    carouselContainer.appendChild(prevArrow);
    carouselContainer.appendChild(nextArrow);

    // Reset their styles to original
    prevArrow.style.position = "absolute";
    prevArrow.style.left = "30px";
    prevArrow.style.top = "50%";
    prevArrow.style.transform = "translateY(-50%)";

    nextArrow.style.position = "absolute";
    nextArrow.style.right = "30px";
    nextArrow.style.top = "50%";
    nextArrow.style.transform = "translateY(-50%)";

    // Remove all control containers
    controlsContainers.forEach((container) => {
      container.remove();
    });
  }
}

// Update the optimizeMobileImages function to make images larger
function optimizeMobileImages() {
  // Only run on mobile devices
  if (window.innerWidth > 768) return;

  // Find all certificate images
  const certificateImages = document.querySelectorAll(".certificate-image");

  certificateImages.forEach((img) => {
    // Make sure images expand to fill their containers better on mobile
    img.style.maxWidth = "100%";
    img.style.width = "100%"; // Add this to make images fill the container width

    // Ensure images are large enough to be clearly visible
    img.style.minHeight = "200px";

    // For portrait images, ensure they have enough height
    if (img.classList.contains("portrait")) {
      img.style.maxHeight = "350px"; // Increased from 300px
    }

    // For landscape images, ensure they fit properly
    if (img.classList.contains("landscape")) {
      img.style.width = "100%";
      img.style.height = "auto";
    }

    // Add fade-in animation for smoother loading experience
    img.style.transition = "opacity 0.3s ease";

    // Optimize image loading with lazy loading and low quality placeholder
    if (!img.hasAttribute("loading")) {
      img.setAttribute("loading", "lazy");
    }
  });

  // Adjust container heights if needed
  const imageContainers = document.querySelectorAll(
    ".certificate-image-container"
  );
  imageContainers.forEach((container) => {
    const img = container.querySelector("img");
    if (img) {
      // Ensure container is tall enough for the image
      const minHeight = Math.max(250, img.offsetHeight + 20); // 20px for padding
      container.style.minHeight = `${minHeight}px`;
      container.style.width = "100%"; // Ensure container uses full width
      container.style.margin = "0"; // Remove any margins
    }
  });
}

// Function to handle image loading and aspect ratio detection
function handleImageLoad(img) {
  // Get natural dimensions of the image
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  // Determine if image is landscape, portrait, or square
  if (width > height) {
    img.classList.add("landscape");
  } else if (height > width) {
    img.classList.add("portrait");
  } else {
    img.classList.add("square");
  }

  // Remove loading class once image is loaded
  img.classList.remove("loading");
  img.classList.add("loaded");

  // Adjust parent container if needed
  const slide = img.closest(".carousel-slide");
  if (slide) {
    slide.classList.add("image-loaded");
  }

  // Apply mobile-specific optimizations
  if (window.innerWidth <= 768) {
    optimizeMobileImages();
  }

  // Adjust container height based on image
  const container = img.closest(".certificate-image-container");
  if (container && window.innerWidth <= 768) {
    // Ensure container is tall enough for the image
    const minHeight = Math.max(250, img.offsetHeight + 20); // 20px for padding
    container.style.minHeight = `${minHeight}px`;
  }
}

// Add a function to detect and handle orientation changes
function handleOrientationChange() {
  const isLandscape = window.matchMedia("(orientation: landscape)").matches;
  const isMobile = window.innerWidth < 768;

  if (isMobile && isLandscape) {
    // Optimize layout for landscape orientation on mobile
    const slides = document.querySelectorAll(".carousel-slide");
    slides.forEach((slide) => {
      slide.style.display = "flex";
      slide.style.flexDirection = "row";
      slide.style.alignItems = "center";
      slide.style.gap = "1rem";

      const imageContainer = slide.querySelector(
        ".certificate-image-container"
      );
      const infoContainer = slide.querySelector(".certificate-info");

      if (imageContainer && infoContainer) {
        imageContainer.style.width = "50%";
        infoContainer.style.width = "50%";
        imageContainer.style.margin = "0";
        imageContainer.style.margin = "0";
      }
    });
  } else {
    // Reset to default layout
    const slides = document.querySelectorAll(".carousel-slide");
    slides.forEach((slide) => {
      slide.style.display = "";
      slide.style.flexDirection = "";
      slide.style.alignItems = "";
      slide.style.gap = "";

      const imageContainer = slide.querySelector(
        ".certificate-image-container"
      );
      const infoContainer = slide.querySelector(".certificate-info");

      if (imageContainer && infoContainer) {
        imageContainer.style.width = "";
        infoContainer.style.width = "";
        imageContainer.style.margin = "";
      }
    });
  }
}

// Optimize image loading for faster first visit
document.addEventListener("DOMContentLoaded", () => {
  // Initialize certificate functionality if on the certificates page
  if (document.getElementById("certificates-container")) {
    // Preload images for faster display
    preloadCertificateImages();

    fetchCertificates();

    // Initialize search and filter functionality
    initCertificateSearch();

    // Initialize image zoom functionality
    initImageZoom();

    // Handle mobile adjustments
    handleMobileAdjustments();

    // Listen for window resize to adjust mobile view
    window.addEventListener("resize", handleMobileAdjustments);

    // Add resize listener to handle orientation changes
    window.addEventListener("resize", optimizeMobileImages);

    // Add specific orientation change listener
    window.addEventListener("orientationchange", () => {
      setTimeout(handleOrientationChange, 100); // Small delay to ensure DOM updates
    });

    // Add listener for device pixel ratio changes (for zoom)
    window
      .matchMedia("(resolution: 1dppx)")
      .addEventListener("change", handleMobileAdjustments);
  }
});

// Function to preload certificate images for faster display
function preloadCertificateImages() {
  // Check if we have cached certificate data
  const cachedData = localStorage.getItem("certificateData");
  if (cachedData) {
    try {
      const certificates = JSON.parse(cachedData);

      // Preload images from cache
      certificates.forEach((cert) => {
        const attributes = cert.attributes || cert || {};
        const imageField = attributes.Image || attributes.image;

        if (imageField) {
          let imageUrl = "";

          // Extract image URL based on structure
          if (imageField.data && imageField.data.attributes) {
            const imageData = imageField.data.attributes;
            if (imageData.url) {
              imageUrl = imageData.url.startsWith("http")
                ? imageData.url
                : `${API_BASE_URL}${imageData.url}`;
            } else if (imageData.formats) {
              const formats = ["medium", "small", "thumbnail"];
              for (const format of formats) {
                if (
                  imageData.formats[format] &&
                  imageData.formats[format].url
                ) {
                  const formatUrl = imageData.formats[format].url;
                  imageUrl = formatUrl.startsWith("http")
                    ? formatUrl
                    : `${API_BASE_URL}${formatUrl}`;
                  break;
                }
              }
            }
          } else if (imageField.url) {
            imageUrl = imageField.url.startsWith("http")
              ? imageField.url
              : `${API_BASE_URL}${imageField.url}`;
          }

          // If we found an image URL, preload it
          if (imageUrl) {
            const img = new Image();
            img.src = imageUrl;
          }
        }
      });
    } catch (error) {
      console.error("Error preloading cached images:", error);
    }
  }
}

// Update fetchCertificates to use configurable API URL
function fetchCertificates() {
  const API_URL = `${API_BASE_URL}/api/certificates?populate=*`;
  const container = document.getElementById("certificates-container");

  if (!container) return;

  // Show loading state
  container.innerHTML = `
      <li class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading certificates...</p>
      </li>
    `;

  try {
    console.log("Attempting to fetch certificates from API...");
    console.log(`Using API URL: ${API_URL}`);

    // Check if we have cached data that's less than 1 hour old
    const cachedData = localStorage.getItem("certificateData");
    const cachedTimestamp = localStorage.getItem("certificateTimestamp");
    const now = new Date().getTime();

    // Use cached data if it's less than 1 hour old
    if (
      cachedData &&
      cachedTimestamp &&
      now - Number.parseInt(cachedTimestamp) < 3600000
    ) {
      console.log("Using cached certificate data");
      const result = JSON.parse(cachedData);
      processApiResult(result, container);

      // Fetch fresh data in the background for next time
      fetchFreshDataInBackground(API_URL);
      return;
    }

    // Always try to fetch from API first
    fetch(API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      mode: "cors",
      credentials: "omit", // Try without credentials to avoid CORS preflight issues
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API returned status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        // Cache the result for future use
        localStorage.setItem("certificateData", JSON.stringify(result));
        localStorage.setItem(
          "certificateTimestamp",
          new Date().getTime().toString()
        );

        processApiResult(result, container);
      })
      .catch((error) => {
        handleApiError(error, container);
      });
  } catch (error) {
    handleApiError(error, container);
  }
}

// Function to fetch fresh data in the background
function fetchFreshDataInBackground(API_URL) {
  fetch(API_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    mode: "cors",
    credentials: "omit",
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(
        `Background API fetch returned status: ${response.status}`
      );
    })
    .then((result) => {
      // Update the cache with fresh data
      localStorage.setItem("certificateData", JSON.stringify(result));
      localStorage.setItem(
        "certificateTimestamp",
        new Date().getTime().toString()
      );
      console.log("Background fetch completed, cache updated");
    })
    .catch((error) => {
      console.error("Background fetch error:", error);
    });
}

// Function to process API result
function processApiResult(result, container) {
  // Validate data structure
  if (!result || !result.data) {
    throw new Error("Invalid API response structure");
  }

  // Check if we have certificates
  if (!Array.isArray(result.data) || result.data.length === 0) {
    throw new Error("No certificates found in the CMS");
  }

  // Store all certificates for filtering
  allCertificates = result.data;

  // Clear loading state
  container.innerHTML = "";

  // Process each certificate
  renderCertificates(allCertificates, container);

  // Initialize the carousel after adding all slides
  if (container.children.length > 0) {
    initCarousel();
  } else {
    container.innerHTML = `
        <li class="error">
          <p>⚠️ No certificates could be displayed.</p>
          <button onclick="fetchCertificates()" class="retry-btn">Retry</button>
        </li>
      `;
  }

  // Add styles for the description toggle
  addDescriptionStyles();

  // Update filter options based on available certificates
  updateFilterOptions(allCertificates);

  // Apply mobile adjustments after rendering
  handleMobileAdjustments();
}

// Function to handle API errors
function handleApiError(error, container) {
  console.error("Error fetching certificates:", error);

  // Show detailed error information
  container.innerHTML = `
      <li class="error">
        <p>⚠️ Failed to load certificates from API</p>
        <small>${error.message || ""}</small>
        <div class="error-details">
          <p>This could be due to:</p>
          <ul>
            <li>CORS restrictions on the Strapi server</li>
            <li>Network connectivity issues</li>
            <li>Strapi server being offline</li>
          </ul>
        </div>
        <div class="action-buttons">
          <button onclick="fetchCertificates()" class="retry-btn">Retry API</button>
          <button onclick="useSampleCertificates(document.getElementById('certificates-container'))" class="sample-btn">Use Sample Data</button>
        </div>
      </li>
    `;

  // Add style for error details
  document.head.insertAdjacentHTML(
    "beforeend",
    `
      <style>
        .error-details {
          margin-top: 1rem;
          text-align: left;
          font-size: 0.85rem;
        }
        .error-details ul {
          margin-top: 0.5rem;
          padding-left: 1.5rem;
        }
        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1rem;
        }
        .sample-btn {
          padding: 0.5rem 1rem;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .sample-btn:hover {
          background-color: #5a6268;
        }
      </style>
    `
  );
}

// Function to render certificates
function renderCertificates(certificates, container) {
  // Clear container
  container.innerHTML = "";

  // Process each certificate
  certificates.forEach((cert) => {
    // Handle both Strapi 4.x and potential 5.x structures
    const attributes = cert.attributes || cert || {};
    const title =
      attributes.Title || attributes.title || "Untitled Certificate";
    const issuer = attributes.Issuer || attributes.issuer || "Unknown Issuer";
    const description =
      attributes.Description ||
      attributes.description ||
      "No description available";
    const date = attributes.Date || attributes.date || "";
    const category =
      attributes.Category || attributes.category || "Uncategorized";

    // Extract image URL - Handle different Strapi versions
    let imageUrl = generatePlaceholderImage(
      300,
      200,
      title.replace(/\s+/g, "+")
    );

    // Try different possible image structures
    const imageField = attributes.Image || attributes.image;

    if (imageField) {
      // Strapi 4.x structure
      if (imageField.data && imageField.data.attributes) {
        const imageData = imageField.data.attributes;

        if (imageData.url) {
          imageUrl = imageData.url.startsWith("http")
            ? imageData.url
            : `${API_BASE_URL}${imageData.url}`;
        } else if (imageData.formats) {
          const formats = ["large", "medium", "small", "thumbnail"];
          for (const format of formats) {
            if (imageData.formats[format] && imageData.formats[format].url) {
              const formatUrl = imageData.formats[format].url;
              imageUrl = formatUrl.startsWith("http")
                ? formatUrl
                : `${API_BASE_URL}${formatUrl}`;
              break;
            }
          }
        }
      }
      // Direct URL structure (older Strapi or custom)
      else if (imageField.url) {
        imageUrl = imageField.url.startsWith("http")
          ? imageField.url
          : `${API_BASE_URL}${imageField.url}`;
      }
      // Formats directly on the image field
      else if (imageField.formats) {
        const formats = ["large", "medium", "small", "thumbnail"];
        for (const format of formats) {
          if (imageField.formats[format] && imageField.formats[format].url) {
            const formatUrl = imageField.formats[format].url;
            imageUrl = formatUrl.startsWith("http")
              ? formatUrl
              : `${API_BASE_URL}${formatUrl}`;
            break;
          }
        }
      }
    }

    // Create the certificate slide
    const slide = document.createElement("li");
    slide.className = "carousel-slide";
    slide.dataset.category = category;
    slide.dataset.issuer = issuer;

    if (date) {
      const dateObj = new Date(date);
      slide.dataset.year = dateObj.getFullYear();
    }

    // Format the date
    const certDate = date
      ? new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "No date provided";

    // Create a truncated version of the description for mobile
    const shortDescription =
      description.length > 150
        ? description.substring(0, 150) + "..."
        : description;

    // Set the slide HTML with improved image container and see more/less functionality
    const slideHTML = `
        <div class="certificate-image-container">
          <img src="${imageUrl}" 
               alt="${title}"
               class="loading certificate-image"
               loading="lazy"
               onload="handleImageLoad(this)"
               onerror="this.src='${generatePlaceholderImage(
                 300,
                 200,
                 title.replace(/\s+/g, "+")
               )}'; this.onerror=null; handleImageLoad(this);">
          <div class="image-controls">
            <button class="zoom-btn" aria-label="Zoom image">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-zoom-in"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            </button>
          </div>
        </div>
        <div class="certificate-info">
          <h3 class="certificate-title">${title}</h3>
          <div class="meta">
            <span class="issuer">${issuer}</span>
            <time datetime="${date}">${certDate}</time>
          </div>
          <div class="description-container">
            <p class="description description-short">${shortDescription}</p>
            <p class="description description-full" style="display: none;">${description}</p>
            ${
              description.length > 150
                ? `<button class="toggle-description" data-state="short">See more</button>`
                : ""
            }
          </div>
        </div>
      `;

    slide.innerHTML = slideHTML;

    container.appendChild(slide);

    // Add event listener for the see more/less button
    const toggleBtn = slide.querySelector(".toggle-description");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", function () {
        const container = this.closest(".description-container");
        const shortDesc = container.querySelector(".description-short");
        const fullDesc = container.querySelector(".description-full");
        const currentState = this.getAttribute("data-state");

        if (currentState === "short") {
          shortDesc.style.display = "none";
          fullDesc.style.display = "block";
          this.textContent = "See less";
          this.setAttribute("data-state", "full");
        } else {
          shortDesc.style.display = "block";
          fullDesc.style.display = "none";
          this.textContent = "See more";
          this.setAttribute("data-state", "short");
        }
      });
    }
  });

  // Apply mobile adjustments after rendering
  handleMobileAdjustments();
}

// Function to add styles for description toggle and new features
function addDescriptionStyles() {
  document.head.insertAdjacentHTML(
    "beforeend",
    `
      <style>
        .description-container {
          position: relative;
          width: 100%;
        }
        
        .description {
          margin-bottom: 0.5rem;
          line-height: 1.5;
          font-size: 0.95rem;
        }
        
        .toggle-description {
          background: none;
          border: none;
          color: #191970;
          font-weight: 600;
          cursor: pointer;
          padding: 0.25rem 0;
          font-size: 0.85rem;
          text-decoration: underline;
        }
        
        .toggle-description:hover {
          color: #0f0f50;
        }
        
        /* Category badge */
        .category-badge {
          display: inline-block;
          background-color: #191970;
          color: white;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          margin-bottom: 0.75rem;
        }
        
        /* Image controls */
        .image-controls {
          position: absolute;
          bottom: 10px;
          right: 10px;
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .certificate-image-container:hover .image-controls {
          opacity: 1;
        }
        
        .zoom-btn, .download-btn {
          background-color: rgba(25, 25, 112, 0.8);
          color: white;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .zoom-btn:hover, .download-btn:hover {
          background-color: rgba(25, 25, 112, 1);
        }
        
        /* Zoom modal */
        .zoom-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        
        .zoom-modal.active {
          opacity: 1;
          pointer-events: auto;
        }
        
        .zoom-modal img {
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
        }
        
        .zoom-modal .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
        }
        
        /* Search and filter */
        .certificate-controls {
          margin-bottom: 2rem;
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }
        
        .search-container {
          flex: 1;
          min-width: 250px;
          position: relative;
        }
        
        .search-container input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .search-container svg {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
        }
        
        .filter-container {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .filter-select {
          padding: 0.75rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          background-color: white;
          min-width: 150px;
        }
        
        @media (max-width: 768px) {
          .description {
            font-size: 0.9rem;
            line-height: 1.4;
          }
          
          .certificate-controls {
            flex-direction: column;
            align-items: stretch;
          }
          
          .search-container, .filter-container {
            width: 100%;
          }
        }
      </style>
    `
  );
}

// Function to initialize certificate search and filter
function initCertificateSearch() {
  const certificatesSection = document.querySelector(".certificates-section");
  if (!certificatesSection) return;

  // Create controls container if it doesn't exist
  let controlsContainer = document.querySelector(".certificate-controls");
  if (!controlsContainer) {
    controlsContainer = document.createElement("div");
    controlsContainer.className = "certificate-controls";

    // Add search input
    const searchContainer = document.createElement("div");
    searchContainer.className = "search-container";
    searchContainer.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" id="certificate-search" placeholder="Search certificates..." aria-label="Search certificates">
      `;

    // Add filter container
    const filterContainer = document.createElement("div");
    filterContainer.className = "filter-container";

    // Add issuer filter
    const issuerFilter = document.createElement("select");
    issuerFilter.className = "filter-select";
    issuerFilter.id = "issuer-filter";
    issuerFilter.innerHTML = '<option value="">All Issuers</option>';

    // Add year filter
    const yearFilter = document.createElement("select");
    yearFilter.className = "filter-select";
    yearFilter.id = "year-filter";
    yearFilter.innerHTML = '<option value="">All Years</option>';

    // Append filters to container
    filterContainer.appendChild(issuerFilter);
    filterContainer.appendChild(yearFilter);

    // Append all to controls container
    controlsContainer.appendChild(searchContainer);
    controlsContainer.appendChild(filterContainer);

    // Insert controls before the carousel
    const carousel = certificatesSection.querySelector(".carousel-container");
    if (carousel) {
      certificatesSection.insertBefore(controlsContainer, carousel);
    } else {
      certificatesSection.prepend(controlsContainer);
    }

    // Add event listeners
    const searchInput = document.getElementById("certificate-search");
    if (searchInput) {
      searchInput.addEventListener("input", filterCertificates);
    }

    const filters = document.querySelectorAll(".filter-select");
    filters.forEach((filter) => {
      filter.addEventListener("change", filterCertificates);
    });
  }
}

// Function to update filter options based on available certificates
function updateFilterOptions(certificates) {
  const issuers = new Set();
  const years = new Set();

  certificates.forEach((cert) => {
    const attributes = cert.attributes || cert || {};

    // Extract issuer
    const issuer = attributes.Issuer || attributes.issuer;
    if (issuer) issuers.add(issuer);

    // Extract year
    const date = attributes.Date || attributes.date;
    if (date) {
      const year = new Date(date).getFullYear();
      if (!isNaN(year)) years.add(year);
    }
  });

  // Update issuer filter
  const issuerFilter = document.getElementById("issuer-filter");
  if (issuerFilter) {
    // Keep the first option
    const firstOption = issuerFilter.options[0];
    issuerFilter.innerHTML = "";
    issuerFilter.appendChild(firstOption);

    // Add sorted issuers
    Array.from(issuers)
      .sort()
      .forEach((issuer) => {
        const option = document.createElement("option");
        option.value = issuer;
        option.textContent = issuer;
        issuerFilter.appendChild(option);
      });
  }

  // Update year filter
  const yearFilter = document.getElementById("year-filter");
  if (yearFilter) {
    // Keep the first option
    const firstOption = yearFilter.options[0];
    yearFilter.innerHTML = "";
    yearFilter.appendChild(firstOption);

    // Add sorted years (newest first)
    Array.from(years)
      .sort((a, b) => b - a)
      .forEach((year) => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
      });
  }
}

// Function to filter certificates
function filterCertificates() {
  const searchInput = document.getElementById("certificate-search");
  const issuerFilter = document.getElementById("issuer-filter");
  const yearFilter = document.getElementById("year-filter");

  if (!searchInput || !allCertificates.length) return;

  const searchTerm = searchInput.value.toLowerCase();
  const issuerValue = issuerFilter ? issuerFilter.value : "";
  const yearValue = yearFilter ? yearFilter.value : "";

  // Filter certificates based on search and filters
  const filteredCertificates = allCertificates.filter((cert) => {
    const attributes = cert.attributes || cert || {};
    const title = (attributes.Title || attributes.title || "").toLowerCase();
    const description = (
      attributes.Description ||
      attributes.description ||
      ""
    ).toLowerCase();
    const issuer = attributes.Issuer || attributes.issuer || "";
    const date = attributes.Date || attributes.date || "";

    // Check if matches search term
    const matchesSearch =
      searchTerm === "" ||
      title.includes(searchTerm) ||
      description.includes(searchTerm) ||
      issuer.toLowerCase().includes(searchTerm);

    // Check if matches issuer filter
    const matchesIssuer = issuerValue === "" || issuer === issuerValue;

    // Check if matches year filter
    let matchesYear = true;
    if (yearValue !== "") {
      const certYear = date ? new Date(date).getFullYear().toString() : "";
      matchesYear = certYear === yearValue;
    }

    return matchesSearch && matchesIssuer && matchesYear;
  });

  // Render filtered certificates
  const container = document.getElementById("certificates-container");
  if (container) {
    if (filteredCertificates.length > 0) {
      renderCertificates(filteredCertificates, container);
      initCarousel(); // Reinitialize carousel with filtered items
    } else {
      container.innerHTML = `
          <li class="no-results">
            <p>No certificates match your search criteria.</p>
            <button onclick="resetFilters()" class="reset-btn">Reset Filters</button>
          </li>
        `;
    }
  }
}

// Function to reset filters
function resetFilters() {
  const searchInput = document.getElementById("certificate-search");
  const filters = document.querySelectorAll(".filter-select");

  if (searchInput) searchInput.value = "";

  filters.forEach((filter) => {
    filter.selectedIndex = 0;
  });

  // Re-render all certificates
  const container = document.getElementById("certificates-container");
  if (container && allCertificates.length) {
    renderCertificates(allCertificates, container);
    initCarousel();
  }
}

// Enhance the initImageZoom function for better mobile experience
function initImageZoom() {
  // Declare currentScale variable
  let currentScale = 1;

  // Create zoom modal if it doesn't exist
  if (!document.querySelector(".zoom-modal")) {
    const modal = document.createElement("div");
    modal.className = "zoom-modal";
    modal.innerHTML = `
        <button class="close-btn" aria-label="Close image preview">&times;</button>
        <img src="/placeholder.svg" alt="Certificate preview">
        <div class="lightbox-nav">
          <button class="lightbox-prev" aria-label="Previous certificate">&lsaquo;</button>
          <button class="lightbox-next" aria-label="Next certificate">&rsaquo;</button>
        </div>
      `;
    document.body.appendChild(modal);

    // Close modal when clicking close button or outside the image
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.classList.contains("close-btn")) {
        modal.classList.remove("active");
      }
    });

    // Close modal with escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("active")) {
        modal.classList.remove("active");
      }
    });

    // Add swipe functionality for mobile with improved sensitivity
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;

    modal.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      },
      { passive: true }
    );

    modal.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;

        // Only register as horizontal swipe if horizontal movement is greater than vertical
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
          if (diffX > 0) {
            // Swipe left - next image
            const nextBtn = modal.querySelector(".lightbox-next");
            if (nextBtn) nextBtn.click();
          } else {
            // Swipe right - previous image
            const prevBtn = modal.querySelector(".lightbox-prev");
            if (prevBtn) prevBtn.click();
          }
        }
      },
      { passive: true }
    );

    // Add navigation functionality for lightbox
    const prevBtn = modal.querySelector(".lightbox-prev");
    const nextBtn = modal.querySelector(".lightbox-next");

    if (prevBtn) {
      prevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigateLightbox("prev");
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigateLightbox("next");
      });
    }

    // Add pinch-to-zoom support for mobile
    let initialDistance = 0;

    const modalImg = modal.querySelector("img");

    modal.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 2) {
          initialDistance = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
          );
        }
      },
      { passive: true }
    );

    modal.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length === 2) {
          const currentDistance = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
          );

          if (initialDistance > 0) {
            const newScale = currentScale * (currentDistance / initialDistance);
            // Limit scale between 0.5 and 3
            const limitedScale = Math.min(Math.max(newScale, 0.5), 3);

            if (modalImg) {
              modalImg.style.transform = `scale(${limitedScale})`;
            }
          }
        }
      },
      { passive: true }
    );

    modal.addEventListener(
      "touchend",
      () => {
        if (modalImg && modalImg.style.transform) {
          // Get the current scale from the transform
          const match = modalImg.style.transform.match(/scale$$([^)]+)$$/);
          if (match && match[1]) {
            currentScale = Number.parseFloat(match[1]);
          }

          // Reset if double-tapped
          if (currentScale === 1) {
            initialDistance = 0;
          }
        }
      },
      { passive: true }
    );

    // Add double-tap to zoom
    let lastTap = 0;
    modal.addEventListener("touchend", (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;

      if (tapLength < 300 && tapLength > 0) {
        // Double tap detected
        e.preventDefault();

        if (modalImg) {
          if (currentScale === 1) {
            modalImg.style.transform = "scale(2)";
            currentScale = 2;
          } else {
            modalImg.style.transform = "scale(1)";
            currentScale = 1;
          }
        }
      }

      lastTap = currentTime;
    });
  }

  // Add event delegation for zoom buttons
  document.addEventListener("click", (e) => {
    // Handle zoom button clicks
    if (e.target.closest(".zoom-btn")) {
      const imgContainer = e.target.closest(".certificate-image-container");
      const img = imgContainer.querySelector("img");
      const slide = imgContainer.closest(".carousel-slide");

      if (img && slide) {
        const modal = document.querySelector(".zoom-modal");
        const modalImg = modal.querySelector("img");

        // Store the current slide index for navigation
        const allSlides = Array.from(
          document.querySelectorAll(".carousel-slide")
        );
        const currentIndex = allSlides.indexOf(slide);
        modal.dataset.currentIndex = currentIndex;

        modalImg.src = img.src;
        modalImg.alt = img.alt;
        modalImg.style.transform = "scale(1)"; // Reset any previous zoom
        modal.classList.add("active");

        // Reset scale for new image
        currentScale = 1;
      }
    }
  });
}

// Function to navigate between certificates in the lightbox
function navigateLightbox(direction) {
  const modal = document.querySelector(".zoom-modal");
  if (!modal || !modal.classList.contains("active")) return;

  const modalImg = modal.querySelector("img");
  const currentIndex = Number.parseInt(modal.dataset.currentIndex || "0");
  const allSlides = Array.from(document.querySelectorAll(".carousel-slide"));

  if (!allSlides.length) return;

  let newIndex;
  if (direction === "next") {
    newIndex = (currentIndex + 1) % allSlides.length;
  } else {
    newIndex = (currentIndex - 1 + allSlides.length) % allSlides.length;
  }

  const newSlide = allSlides[newIndex];
  const newImg = newSlide.querySelector(".certificate-image");

  if (newImg) {
    modalImg.src = newImg.src;
    modalImg.alt = newImg.alt;
    modal.dataset.currentIndex = newIndex.toString();
  }
}

// Function to use sample certificates in development mode
function useSampleCertificates(container) {
  if (!container) return;

  console.log("Using sample certificates for development");

  // Sample certificate data for development
  const sampleCertificates = [
    {
      title: "Web Development Certification",
      issuer: "Coding Academy",
      date: "2023-05-15",
      description:
        "Comprehensive certification in modern web development technologies including HTML5, CSS3, JavaScript, and responsive design principles.",
      imageUrl: generatePlaceholderImage(300, 200, "Web+Development"),
      category: "Development",
    },
    {
      title: "JavaScript Advanced Course",
      issuer: "JS Masters",
      date: "2022-11-20",
      description:
        "Advanced JavaScript concepts including ES6+, async programming, functional programming, and modern frameworks.",
      imageUrl: generatePlaceholderImage(300, 200, "JavaScript"),
      category: "Programming",
    },
    {
      title: "UI/UX Design Fundamentals",
      issuer: "Design Institute",
      date: "2023-02-10",
      description:
        "Principles of user interface and user experience design, including wireframing, prototyping, and user testing methodologies.",
      imageUrl: generatePlaceholderImage(300, 200, "UI/UX+Design"),
      category: "Design",
    },
  ];

  // Store sample certificates for filtering
  allCertificates = sampleCertificates.map((cert) => ({
    attributes: {
      Title: cert.title,
      Issuer: cert.issuer,
      Date: cert.date,
      Description: cert.description,
      Image: { url: cert.imageUrl },
    },
  }));

  // Clear loading state
  container.innerHTML = "";

  // Render certificates
  renderCertificates(allCertificates, container);

  // Initialize the carousel
  initCarousel();

  // Add styles for the description toggle
  addDescriptionStyles();

  // Update filter options
  updateFilterOptions(allCertificates);

  // Add development mode notice
  const notice = document.createElement("div");
  notice.className = "dev-notice";
  notice.innerHTML = `
      <p>⚠️ Using Sample Data</p>
      <small>Could not connect to Strapi API. Using sample certificates instead.</small>
      <button onclick="fetchCertificates()" class="retry-api-btn">Try API Again</button>
    `;
  container.parentNode.insertAdjacentElement("afterend", notice);

  // Add style for the notice
  document.head.insertAdjacentHTML(
    "beforeend",
    `
      <style>
        .dev-notice {
          background-color: #fff3cd;
          color: #856404;
          padding: 0.75rem;
          margin-top: 1rem;
          border-radius: 0.25rem;
          text-align: center;
          font-size: 0.9rem;
        }
        .dev-notice small {
          display: block;
          margin-top: 0.5rem;
          opacity: 0.8;
        }
        .retry-api-btn {
          margin-top: 0.75rem;
          padding: 0.4rem 0.8rem;
          background-color: #856404;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .retry-api-btn:hover {
          background-color: #6d5204;
        }
      </style>
    `
  );
}

// Initialize carousel functionality
function initCarousel() {
  const track = document.querySelector(".carousel-track");
  const slides = Array.from(track?.children || []);
  const dotNav = document.querySelector(".carousel-nav");
  const prevArrow = document.querySelector(".carousel-prev");
  const nextArrow = document.querySelector(".carousel-next");
  let currentIndex = 0;
  let autoplayInterval;

  // Exit if no slides or track
  if (!slides.length || !track) return;

  // Setup navigation dots with original styling
  if (dotNav) {
    dotNav.innerHTML = "";
    const totalSlides = slides.length;
    const maxDots = totalSlides < 7 ? totalSlides : 7;

    for (let i = 0; i < maxDots; i++) {
      const dot = document.createElement("button");
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.setAttribute("data-slide", i);
      if (i === 0) dot.classList.add("active");
      dotNav.appendChild(dot);
    }
  }

  // Create certificate counter element
  const counterContainer = document.createElement("div");
  counterContainer.className = "certificate-counter";
  counterContainer.innerHTML = `
    <span class="current">1</span>
    <span class="separator">/</span>
    <span class="total">${slides.length}</span>
  `;

  // Insert counter after dot navigation
  if (dotNav) {
    dotNav.after(counterContainer);
  } else {
    // If no dot nav, append to carousel container
    const carouselContainer = document.querySelector(".carousel");
    if (carouselContainer) {
      carouselContainer.appendChild(counterContainer);
    }
  }

  // Function to move to a specific slide
  function moveToSlide(index) {
    if (!slides.length || !track) return;

    // Ensure index is within bounds
    const safeIndex = ((index % slides.length) + slides.length) % slides.length;

    // Move the track
    track.style.transform = `translateX(-${safeIndex * 100}%)`;

    // Update active dot with original styling
    if (dotNav) {
      const dots = dotNav.querySelectorAll("button");
      dots.forEach((dot) => dot.classList.remove("active"));

      // Calculate which dot to activate (for when we have more slides than dots)
      const activeDotIndex = safeIndex % dots.length;
      if (dots[activeDotIndex]) {
        dots[activeDotIndex].classList.add("active");
      }
    }

    // Update certificate counter
    const counterElement = document.querySelector(".certificate-counter");
    if (counterElement) {
      const currentElement = counterElement.querySelector(".current");
      if (currentElement) {
        currentElement.textContent = safeIndex + 1;
      }
    }

    currentIndex = safeIndex;

    // Announce slide change for screen readers
    const liveRegion = document.getElementById("carousel-live-region");
    if (liveRegion) {
      const currentSlide = slides[safeIndex];
      const title =
        currentSlide.querySelector("h3")?.textContent || "Certificate";
      liveRegion.textContent = `Showing certificate: ${title}, slide ${
        safeIndex + 1
      } of ${slides.length}`;
    }
  }

  // Start autoplay
  function startAutoplay() {
    stopAutoplay(); // Clear any existing interval
    autoplayInterval = setInterval(() => {
      moveToSlide(currentIndex + 1);
    }, 5000);
  }

  // Stop autoplay
  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
    }
  }

  // Event listeners for navigation
  if (dotNav) {
    dotNav.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") {
        const index = Number.parseInt(
          e.target.getAttribute("data-slide") || "0"
        );
        moveToSlide(index);
        startAutoplay(); // Reset autoplay timer
      }
    });
  }

  if (prevArrow) {
    prevArrow.addEventListener("click", () => {
      moveToSlide(currentIndex - 1);
      startAutoplay(); // Reset autoplay timer
    });

    // Add keyboard support
    prevArrow.setAttribute("tabindex", "0");
    prevArrow.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        moveToSlide(currentIndex - 1);
        startAutoplay();
      }
    });
  }

  if (nextArrow) {
    nextArrow.addEventListener("click", () => {
      moveToSlide(currentIndex + 1);
      startAutoplay(); // Reset autoplay timer
    });

    // Add keyboard support
    nextArrow.setAttribute("tabindex", "0");
    nextArrow.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        moveToSlide(currentIndex + 1);
        startAutoplay();
      }
    });
  }

  // Pause autoplay when user interacts with carousel
  if (track) {
    track.addEventListener("mouseenter", stopAutoplay);
    track.addEventListener("mouseleave", startAutoplay);

    // Touch events for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoplay();
      },
      { passive: true }
    );

    track.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;

        // Reduced swipe threshold for mobile
        if (Math.abs(diff) > 30) {
          if (diff > 0) {
            // Swipe left, go to next slide
            moveToSlide(currentIndex + 1);
          } else {
            // Swipe right, go to previous slide
            moveToSlide(currentIndex - 1);
          }
        }

        startAutoplay();
      },
      { passive: true }
    );

    // Add keyboard navigation
    track.setAttribute("tabindex", "0");
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        moveToSlide(currentIndex - 1);
        startAutoplay();
      } else if (e.key === "ArrowRight") {
        moveToSlide(currentIndex + 1);
        startAutoplay();
      }
    });
  }

  // Add global keyboard navigation for arrow keys
  document.addEventListener("keydown", (e) => {
    // Only respond to arrow keys if we're on the certificates page
    if (document.getElementById("certificates-container")) {
      if (e.key === "ArrowLeft") {
        moveToSlide(currentIndex - 1);
        startAutoplay();
      } else if (e.key === "ArrowRight") {
        moveToSlide(currentIndex + 1);
        startAutoplay();
      }
    }
  });

  // Add live region for accessibility
  if (!document.getElementById("carousel-live-region")) {
    const liveRegion = document.createElement("div");
    liveRegion.id = "carousel-live-region";
    liveRegion.className = "sr-only";
    liveRegion.setAttribute("aria-live", "polite");
    document.querySelector(".carousel-container")?.appendChild(liveRegion);
  }

  // Initialize with first slide
  moveToSlide(0);
  startAutoplay();
}

// Add styles for the retry button and accessibility
document.head.insertAdjacentHTML(
  "beforeend",
  `
    <style>
      .retry-btn {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background-color: #191970;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      .retry-btn:hover {
        background-color: #0f0f50;
      }
      
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
      
      .no-results {
        text-align: center;
        padding: 2rem;
        background-color: #f8f9fa;
        border-radius: 8px;
      }
      
      .reset-btn {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background-color: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .reset-btn:hover {
        background-color: #5a6268;
      }
      
      /* Focus styles for accessibility */
      a:focus, button:focus, input:focus, select:focus, textarea:focus, [tabindex]:focus {
        outline: 3px solid rgba(25, 25, 112, 0.5);
        outline-offset: 2px;
      }
      
      /* Lightbox styles */
      .zoom-modal .lightbox-nav {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        transform: translateY(-50%);
        padding: 0 1rem;
      }
      
      .zoom-modal .lightbox-nav button {
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s ease;
      }
      
      .zoom-modal .lightbox-nav button:hover {
        background: rgba(0, 0, 0, 0.8);
      }
    </style>
  `
);

// Improve image loading with priority loading for visible images
function handleImageLoadFn(img) {
  // Get natural dimensions of the image
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  // Determine if image is landscape, portrait, or square
  if (width > height) {
    img.classList.add("landscape");
  } else if (height > width) {
    img.classList.add("portrait");
  } else {
    img.classList.add("square");
  }

  // Remove loading class once image is loaded
  img.classList.remove("loading");
  img.classList.add("loaded");

  // Adjust parent container if needed
  const slide = img.closest(".carousel-slide");
  if (slide) {
    slide.classList.add("image-loaded");
  }

  // Apply mobile-specific optimizations
  if (window.innerWidth <= 768) {
    optimizeMobileImages();
  }

  // Adjust container height based on image
  const container = img.closest(".certificate-image-container");
  if (container && window.innerWidth <= 768) {
    // Ensure container is tall enough for the image
    const minHeight = Math.max(250, img.offsetHeight + 20); // 20px for padding
    container.style.minHeight = `${minHeight}px`;
  }
}
