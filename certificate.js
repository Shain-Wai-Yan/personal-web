/**
 * Certificate-specific JavaScript functionality
 * Handles certificate display, API fetching, and carousel functionality
 * @author Original code by Shain, enhanced by v0
 * @version 2.0
 */

document.addEventListener("DOMContentLoaded", () => {
    // Initialize certificate functionality if on the certificates page
    if (document.getElementById("certificates-container")) {
      fetchCertificates();
  
      // Initialize search and filter functionality
      initCertificateSearch();
  
      // Initialize image zoom functionality
      initImageZoom();
    }
  });
  
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
  }
  
  // Function to generate placeholder image data URLs
  function generatePlaceholderImage(
    width = 300,
    height = 200,
    text = "Certificate"
  ) {
    // Create a canvas element
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
  
    // Get the drawing context
    const ctx = canvas.getContext("2d");
  
    // Draw background
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, width, height);
  
    // Draw border
    ctx.strokeStyle = "#191970";
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, width - 10, height - 10);
  
    // Draw text
    ctx.fillStyle = "#191970";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  
    // Handle multi-line text
    const words = text.split("+");
    const lineHeight = 30;
    const startY = height / 2 - ((words.length - 1) * lineHeight) / 2;
  
    words.forEach((word, index) => {
      ctx.fillText(word, width / 2, startY + index * lineHeight);
    });
  
    // Return data URL
    return canvas.toDataURL("image/png");
  }
  
  // Debug function to test API connectivity
  async function testApiConnection() {
    const API_URL =
      "https://backend-cms-89la.onrender.com/api/certificates?populate=*";
  
    try {
      console.log("Testing API connection to:", API_URL);
  
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        mode: "cors",
        credentials: "omit",
      });
  
      console.log("API Response Status:", response.status);
      console.log("API Response OK:", response.ok);
  
      if (response.ok) {
        const data = await response.json();
        console.log("API Data received:", data);
        return { success: true, data };
      } else {
        console.error("API returned error status:", response.status);
        return { success: false, status: response.status };
      }
    } catch (error) {
      console.error("API connection test failed:", error);
      return { success: false, error: error.message };
    }
  }
  
  // Global variable to store all certificates for filtering
  let allCertificates = [];
  
  // Improved fetchCertificates function - ALWAYS try API first
  async function fetchCertificates() {
    const API_URL =
      "https://backend-cms-89la.onrender.com/api/certificates?populate=*";
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
  
      // Always try to fetch from API first
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        mode: "cors",
        credentials: "omit", // Try without credentials to avoid CORS preflight issues
      });
  
      if (!response.ok) {
        throw new Error(`API returned status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log("API data received:", result);
  
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
    } catch (error) {
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
              : `https://backend-cms-89la.onrender.com${imageData.url}`;
          } else if (imageData.formats) {
            const formats = ["large", "medium", "small", "thumbnail"];
            for (const format of formats) {
              if (imageData.formats[format] && imageData.formats[format].url) {
                const formatUrl = imageData.formats[format].url;
                imageUrl = formatUrl.startsWith("http")
                  ? formatUrl
                  : `https://backend-cms-89la.onrender.com${formatUrl}`;
                break;
              }
            }
          }
        }
        // Direct URL structure (older Strapi or custom)
        else if (imageField.url) {
          imageUrl = imageField.url.startsWith("http")
            ? imageField.url
            : `https://backend-cms-89la.onrender.com${imageField.url}`;
        }
        // Formats directly on the image field
        else if (imageField.formats) {
          const formats = ["large", "medium", "small", "thumbnail"];
          for (const format of formats) {
            if (imageField.formats[format] && imageField.formats[format].url) {
              const formatUrl = imageField.formats[format].url;
              imageUrl = formatUrl.startsWith("http")
                ? formatUrl
                : `https://backend-cms-89la.onrender.com${formatUrl}`;
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
            <h3>${title}</h3>
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
  
  // Function to initialize image zoom functionality
  function initImageZoom() {
    // Create zoom modal if it doesn't exist
    if (!document.querySelector(".zoom-modal")) {
      const modal = document.createElement("div");
      modal.className = "zoom-modal";
      modal.innerHTML = `
          <button class="close-btn" aria-label="Close image preview">&times;</button>
          <img src="/placeholder.svg" alt="Certificate preview">
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
    }
  
    // Add event delegation for zoom buttons
    document.addEventListener("click", (e) => {
      // Handle zoom button clicks
      if (e.target.closest(".zoom-btn")) {
        const imgContainer = e.target.closest(".certificate-image-container");
        const img = imgContainer.querySelector("img");
  
        if (img) {
          const modal = document.querySelector(".zoom-modal");
          const modalImg = modal.querySelector("img");
  
          modalImg.src = img.src;
          modalImg.alt = img.alt;
          modal.classList.add("active");
        }
      }
    });
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
  
          // Swipe threshold
          if (Math.abs(diff) > 50) {
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
      </style>
    `
  );
  