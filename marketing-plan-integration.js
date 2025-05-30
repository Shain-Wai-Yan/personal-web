/**
 * Marketing Plan Strapi Integration
 * This file handles fetching and displaying ONLY marketing plans from Strapi CMS
 * To be included only on the marketing plan page
 */

// Create a namespace for marketing plan functions to avoid global conflicts
window.MarketingPlanIntegration = (() => {
  // Private variables and functions
  const MODULE_NAME = "Marketing Plans";

  // Configuration - use window to avoid redeclaration errors if loaded multiple times
  if (typeof window.STRAPI_API_URL === "undefined") {
    window.STRAPI_API_URL = "https://api.shainwaiyan.com/api/";
  }

  // Add your Strapi API token here if your API requires authentication
  if (typeof window.STRAPI_API_TOKEN === "undefined") {
    window.STRAPI_API_TOKEN =
      "ae2fdd66167465a3dbef4c71ed375a28a0530b41047111a65563c182950afbf1dd445255ffeea3dc2f00345ea264c007e16e09ff1682d8f887babff2d110226e6f4f20de5d17950106f91a6c46b58c7f9bd7c972e406a51a98d9c2804c491c8ba2b027f5a2ea81ef99d3bcf08b4cd4eea607f7f03cea136a766c1b26d44229b8";
  }

  // Function to check if we're on the marketing plan page
  function isMarketingPlanPage() {
    const currentPath = window.location.pathname;
    return currentPath.includes("/marketing-plan");
  }

  // Log early to help with debugging
  console.log(
    `[${MODULE_NAME}] Script loaded - checking path:`,
    window.location.pathname
  );

  // Exit early if not on marketing plan page
  if (!isMarketingPlanPage()) {
    console.log(`[${MODULE_NAME}] Not on marketing plan page - exiting`);
    return {
      // Return empty public API if not on marketing plan page
      init: () => {
        console.log(`[${MODULE_NAME}] Not initializing - wrong page`);
      },
    };
  }

  /**
   * Fetches data from Strapi API with error handling
   */
  async function fetchFromStrapi(endpoint, queryParams = {}) {
    try {
      // Build query string from params object
      const queryString = Object.keys(queryParams)
        .map(
          (key) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`
        )
        .join("&");

      const url = `${window.STRAPI_API_URL}${endpoint}${
        queryString ? `?${queryString}` : ""
      }`;
      console.log(`[${MODULE_NAME}] Fetching from:`, url);

      // Prepare headers with authentication if token is available
      const headers = {
        "Content-Type": "application/json",
      };

      if (window.STRAPI_API_TOKEN) {
        headers["Authorization"] = `Bearer ${window.STRAPI_API_TOKEN}`;
      }

      // Add timeout to fetch to avoid long waits
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle common HTTP error codes
        if (response.status === 403) {
          console.error(
            `[${MODULE_NAME}] Authentication error: You need a valid API token to access this Strapi endpoint`
          );
          throw new Error(
            "Authentication required. Please add your Strapi API token to marketing-plan-integration.js"
          );
        }

        if (response.status === 404) {
          console.error(`[${MODULE_NAME}] API endpoint not found:`, url);
          throw new Error(
            "API endpoint not found. Please check your Strapi collection names."
          );
        }

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[${MODULE_NAME}] API Response:`, data);
        return data;
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          throw new Error(
            "Request timed out. The API server might be unreachable."
          );
        }
        throw fetchError;
      }
    } catch (error) {
      console.error(`[${MODULE_NAME}] Error fetching from Strapi:`, error);

      // Show more helpful error message based on error type
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("timed out")
      ) {
        console.error(
          `[${MODULE_NAME}] Network error: Please check if the Strapi server is running and accessible.`
        );
      }

      if (error.message.includes("Authentication required")) {
        return {
          data: [],
          error:
            "Authentication required. Please add your Strapi API token to marketing-plan-integration.js",
        };
      }

      return { data: [], error: error.message };
    }
  }

  /**
   * Truncates text to a specific number of lines and adds "See more" button
   */
  function truncateDescription(text, lines = 2) {
    if (!text || text.length < 100) return text; // Don't truncate short text

    return `
      <div class="truncated-text" data-lines="${lines}">
        <div class="truncated-content">${text}</div>
        <button class="see-more-btn">See more</button>
        <button class="see-less-btn" style="display: none;">See less</button>
      </div>
    `;
  }

  /**
   * Generates HTML for a document item based on Strapi data
   */
  function generateDocumentItemHTML(item) {
    console.log(`[${MODULE_NAME}] Processing item:`, item);

    // Safety check - if item is not properly structured, return an error item
    if (!item || typeof item !== "object") {
      console.error(`[${MODULE_NAME}] Invalid item structure:`, item);
      return `
       <div class="document-item error-item">
         <div class="document-details">
           <h2>Error: Invalid Document</h2>
           <p class="document-description">This document could not be processed due to invalid data structure.</p>
         </div>
       </div>
     `;
    }

    try {
      const title = item.Title || "Untitled Document";
      const description = item.Description || "";
      const slug = item.Slug || "";

      console.log(`[${MODULE_NAME}] Document properties:`, {
        title,
        description,
        slug,
      });

      // Get document file URL with fallback - FIXED for Strapi v5 flat structure
      let documentUrl = "";
      let fileType = ""; // Default empty

      // Check if DocumentFile exists and extract URL
      if (item.DocumentFile) {
        console.log(`[${MODULE_NAME}] DocumentFile found:`, item.DocumentFile);

        // Handle Strapi v5 flat structure (direct object with url)
        if (item.DocumentFile.url) {
          documentUrl = item.DocumentFile.url;
          console.log(
            `[${MODULE_NAME}] Found direct URL in DocumentFile:`,
            documentUrl
          );
        }
        // Handle Strapi v4 nested structure (data.attributes.url)
        else if (
          item.DocumentFile.data &&
          item.DocumentFile.data.attributes &&
          item.DocumentFile.data.attributes.url
        ) {
          documentUrl = item.DocumentFile.data.attributes.url;
          console.log(
            `[${MODULE_NAME}] Found nested URL in DocumentFile:`,
            documentUrl
          );
        }
        // Handle array format
        else if (
          Array.isArray(item.DocumentFile) &&
          item.DocumentFile.length > 0
        ) {
          const documentFile = item.DocumentFile[0];
          if (documentFile && documentFile.url) {
            documentUrl = documentFile.url;
          } else if (
            documentFile &&
            documentFile.data &&
            documentFile.data.attributes &&
            documentFile.data.attributes.url
          ) {
            documentUrl = documentFile.data.attributes.url;
          }
        }
        // Handle direct string URL
        else if (typeof item.DocumentFile === "string") {
          documentUrl = item.DocumentFile;
        }

        console.log(`[${MODULE_NAME}] Extracted document URL:`, documentUrl);

        // Ensure URL is absolute
        if (documentUrl && !documentUrl.startsWith("http")) {
          documentUrl = `${window.STRAPI_API_URL.replace(
            "/api/",
            ""
          )}${documentUrl}`;
        }

        // Determine file type from URL or mime type
        if (documentUrl) {
          const fileExt = documentUrl.split(".").pop().toLowerCase();
          // Set the file type based on the actual extension
          fileType = fileExt.toUpperCase();
        }
      }

      // Create an inline SVG placeholder instead of using an external file
      const placeholderDataURI =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' text-anchor='middle' fill='%23999999'%3ENo Image%3C/text%3E%3C/svg%3E";

      let coverImageUrl = placeholderDataURI; // Default placeholder

      // Handle CoverImage extraction - FIXED for Strapi v5 flat structure
      if (item.CoverImage) {
        console.log(`[${MODULE_NAME}] CoverImage found:`, item.CoverImage);

        // Handle Strapi v5 flat structure (direct object with url)
        if (item.CoverImage.url) {
          coverImageUrl = item.CoverImage.url;
          console.log(
            `[${MODULE_NAME}] Found direct URL in CoverImage:`,
            coverImageUrl
          );
        }
        // Handle Strapi v4 nested structure (data.attributes.url)
        else if (
          item.CoverImage.data &&
          item.CoverImage.data.attributes &&
          item.CoverImage.data.attributes.url
        ) {
          coverImageUrl = item.CoverImage.data.attributes.url;
          console.log(
            `[${MODULE_NAME}] Found nested URL in CoverImage:`,
            coverImageUrl
          );
        }
        // Handle array format
        else if (Array.isArray(item.CoverImage) && item.CoverImage.length > 0) {
          const coverImage = item.CoverImage[0];
          if (coverImage && coverImage.url) {
            coverImageUrl = coverImage.url;
          } else if (
            coverImage &&
            coverImage.data &&
            coverImage.data.attributes &&
            coverImage.data.attributes.url
          ) {
            coverImageUrl = coverImage.data.attributes.url;
          }
        }
        // Handle direct string URL
        else if (typeof item.CoverImage === "string") {
          coverImageUrl = item.CoverImage;
        }

        // Ensure URL is absolute
        if (
          coverImageUrl &&
          !coverImageUrl.startsWith("http") &&
          !coverImageUrl.startsWith("data:")
        ) {
          coverImageUrl = `${window.STRAPI_API_URL.replace(
            "/api/",
            ""
          )}${coverImageUrl}`;
        }

        console.log(
          `[${MODULE_NAME}] Extracted cover image URL:`,
          coverImageUrl
        );
      }

      // Format date if available
      const date = item.createdAt ? new Date(item.createdAt) : new Date();
      const formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });

      console.log(`[${MODULE_NAME}] Final document data:`, {
        title,
        description,
        slug,
        documentUrl,
        fileType,
        coverImageUrl,
        formattedDate,
      });

      // Truncate description to 2 lines with "See more" button
      const truncatedDescription = truncateDescription(description, 2);

      // Generate HTML - removed title and date overlay from the thumbnail
      return `
       <div class="document-item" data-file="${documentUrl}" data-slug="${slug}">
         <div class="document-cover" style="background-image: url('${coverImageUrl}'); background-size: cover; background-position: center; position: relative;">
           ${
             fileType
               ? `<div class="document-type-badge">${fileType}</div>`
               : ""
           }
         </div>
         <div class="document-details">
           <h2>${title}</h2>
           <div class="document-meta">
             ${
               fileType
                 ? `<span class="document-type">${fileType} Document</span>`
                 : ""
             }
             <span class="document-date">${formattedDate}</span>
           </div>
           <div class="document-description">${truncatedDescription}</div>
           <button class="view-document-btn" ${!documentUrl ? "disabled" : ""}>
             ${documentUrl ? "View Document" : "No Document Available"}
           </button>
         </div>
       </div>
     `;
    } catch (error) {
      console.error(
        `[${MODULE_NAME}] Error generating document HTML:`,
        error,
        item
      );
      return `
       <div class="document-item error-item">
         <div class="document-details">
           <h2>Error Processing Document</h2>
           <p class="document-description">This document could not be processed: ${error.message}</p>
         </div>
       </div>
     `;
    }
  }

  /**
   * Loads marketing plans from Strapi and displays them on the page
   */
  async function loadMarketingPlans() {
    console.log(`[${MODULE_NAME}] Loading marketing plans...`);

    const documentList = document.querySelector(".document-list");

    if (!documentList) {
      console.error(`[${MODULE_NAME}] Document list container not found`);
      return;
    }

    // Show loading state
    documentList.innerHTML = `
     <div class="loading-state">
       <div class="loading-spinner"></div>
       <p>Loading marketing plans...</p>
     </div>
   `;

    try {
      // Always use the marketing-plans endpoint - no detection needed
      const endpoint = "marketing-plans";

      // Fetch data with populated relations
      const response = await fetchFromStrapi(endpoint, {
        populate: "*", // Populate all relations (document file, cover image)
      });

      console.log(`[${MODULE_NAME}] Full API response:`, response);

      // Check if we have an error in the response
      if (response.error) {
        documentList.innerHTML = `
         <div class="error-state">
           <p>Error: ${response.error}</p>
           <button class="retry-btn">Retry</button>
         </div>
       `;

        // Add retry button functionality
        const retryBtn = documentList.querySelector(".retry-btn");
        if (retryBtn) {
          retryBtn.addEventListener("click", () => loadMarketingPlans());
        }

        return;
      }

      // Check if we have data in the expected format
      if (!response || !response.data) {
        console.error(
          `[${MODULE_NAME}] Unexpected API response format:`,
          response
        );
        documentList.innerHTML = `
         <div class="error-state">
           <p>Unexpected API response format.</p>
           <p>Please check the browser console for details.</p>
         </div>
       `;
        return;
      }

      // Handle empty data array
      if (Array.isArray(response.data) && response.data.length === 0) {
        documentList.innerHTML = `
         <div class="no-documents">
           <p>No marketing plans found. Please add some documents in your Strapi admin panel.</p>
         </div>
       `;
        return;
      }

      // Handle null data
      if (response.data === null) {
        documentList.innerHTML = `
         <div class="error-state">
           <p>No access to content. This might be due to permission settings in Strapi.</p>
           <p>Please check your Strapi permissions for public access to marketing plans.</p>
         </div>
       `;
        return;
      }

      // Generate HTML for each document
      let documentsHTML = "";

      if (Array.isArray(response.data)) {
        // Handle array of items
        documentsHTML = response.data
          .map((item) => generateDocumentItemHTML(item))
          .join("");
      } else if (typeof response.data === "object") {
        // Handle single item
        documentsHTML = generateDocumentItemHTML(response.data);
      } else {
        throw new Error("Unexpected data format");
      }

      // Update the document list
      documentList.innerHTML = documentsHTML;

      // Attach event listeners to the new document items
      attachDocumentViewerEvents();

      // Attach event listeners to "See more" buttons
      attachSeeMoreEvents();
    } catch (error) {
      console.error(`[${MODULE_NAME}] Error loading documents:`, error);
      documentList.innerHTML = `
       <div class="error-state">
         <p>Error loading marketing plans: ${error.message}</p>
         <p>Please check the browser console for more details.</p>
         <button class="retry-btn">Retry</button>
       </div>
     `;

      // Add retry button functionality
      const retryBtn = documentList.querySelector(".retry-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => loadMarketingPlans());
      }
    }
  }

  /**
   * Attaches event listeners to "See more" buttons
   */
  function attachSeeMoreEvents() {
    const seeMoreButtons = document.querySelectorAll(".see-more-btn");
    const seeLessButtons = document.querySelectorAll(".see-less-btn");

    seeMoreButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const container = this.closest(".truncated-text");
        if (container) {
          container.classList.add("expanded");
          this.style.display = "none";
          const seeLessBtn = container.querySelector(".see-less-btn");
          if (seeLessBtn) {
            seeLessBtn.style.display = "inline-block";
          }
        }
      });
    });

    seeLessButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const container = this.closest(".truncated-text");
        if (container) {
          container.classList.remove("expanded");
          this.style.display = "none";
          const seeMoreBtn = container.querySelector(".see-more-btn");
          if (seeMoreBtn) {
            seeMoreBtn.style.display = "inline-block";
          }
        }
      });
    });
  }

  /**
   * Attaches event listeners to document items for viewing documents
   */
  function attachDocumentViewerEvents() {
    const documentItems = document.querySelectorAll(".document-item");
    console.log(
      `[${MODULE_NAME}] Attaching events to document items:`,
      documentItems.length
    );

    documentItems.forEach((item) => {
      const viewBtn = item.querySelector(".view-document-btn");
      if (viewBtn) {
        viewBtn.addEventListener("click", () => {
          // Skip if button is disabled
          if (viewBtn.hasAttribute("disabled")) {
            return;
          }

          const fileUrl = item.getAttribute("data-file");
          console.log(`[${MODULE_NAME}] Clicked view document, URL:`, fileUrl);

          if (!fileUrl) {
            alert("No document file available for this item.");
            return;
          }

          const title = item.querySelector("h2").textContent;
          console.log(`[${MODULE_NAME}] Opening document with title:`, title);

          // Check if PDF.js is loaded
          if (!window.pdfjsLib) {
            console.error(
              `[${MODULE_NAME}] PDF.js library not loaded. Cannot open document.`
            );
            alert(
              "PDF viewer is not available. Please try refreshing the page."
            );
            return;
          }

          // Use the PDF utils if available, otherwise use regular openDocument
          if (
            window.pdfUtils &&
            typeof window.pdfUtils.openDocumentWithTransform === "function"
          ) {
            // Use the utility function from cloudinary-pdf-solution.js
            console.log(
              `[${MODULE_NAME}] Using pdfUtils.openDocumentWithTransform`
            );
            window.pdfUtils.openDocumentWithTransform(fileUrl, title);
          } else {
            console.log(
              `[${MODULE_NAME}] pdfUtils not available, using fallback`
            );
            // Fallback to regular openDocument
            if (typeof window.openDocument === "function") {
              window.openDocument(fileUrl, title);
            } else {
              // If openDocument is not available, offer direct download
              console.log(
                `[${MODULE_NAME}] openDocument not available, opening in new tab`
              );
              window.open(fileUrl, "_blank");
            }
          }
        });
      }
    });
  }

  /**
   * Adds custom styles for document items
   */
  function addCustomStyles() {
    // Check if styles are already added
    if (document.getElementById("marketing-plan-styles")) {
      return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = "marketing-plan-styles";
    styleElement.textContent = `
      .document-cover {
        height: 200px;
        border-radius: 8px 8px 0 0;
        overflow: hidden;
        position: relative;
      }
      .document-type-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: rgba(25, 25, 112, 0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        z-index: 2;
      }
      .document-item {
        border: 1px solid #eee;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 20px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .document-item:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }
      .document-details {
        padding: 15px;
      }
      .document-meta {
        display: flex;
        gap: 15px;
        margin: 5px 0 10px;
        font-size: 14px;
        color: #666;
      }
      .view-document-btn {
        background-color: #191970;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
        transition: background-color 0.2s ease;
      }
      .view-document-btn:hover {
        background-color: #0f0f4b;
      }
      .view-document-btn:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
      .document-description {
        margin-bottom: 15px;
        color: #333;
        line-height: 1.5;
      }
      
      /* Truncated text styles */
      .truncated-text {
        position: relative;
      }
      .truncated-text .truncated-content {
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        line-height: 1.5;
      }
      .truncated-text.expanded .truncated-content {
        -webkit-line-clamp: unset;
        overflow: visible;
      }
      .see-more-btn, .see-less-btn {
        background: none;
        border: none;
        color: #191970;
        padding: 0;
        font-size: 14px;
        cursor: pointer;
        margin-top: 5px;
        text-decoration: underline;
      }
      .see-more-btn:hover, .see-less-btn:hover {
        color: #0f0f4b;
      }
    `;
    document.head.appendChild(styleElement);
  }

  /**
   * Initializes the marketing plan integration
   */
  function init() {
    console.log(`[${MODULE_NAME}] Marketing plan integration initialized`);

    // Add custom styles
    addCustomStyles();

    // Load marketing plans
    loadMarketingPlans();
  }

  // Return public API
  return {
    init: init,
  };
})();

// Initialize the module when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize if we're on the marketing plan page
  if (window.location.pathname.includes("/marketing-plan")) {
    window.MarketingPlanIntegration.init();
  }
});
