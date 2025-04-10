/**
 * Document Viewer
 * Handles PDF and PPTX document viewing functionality
 */

// Immediately define a placeholder openDocument function to avoid "not found" errors
// This will be replaced with the real implementation once the document viewer is initialized
if (typeof window.openDocument !== "function") {
    window.openDocument = (fileUrl, title) => {
      console.log(
        "Document viewer not yet initialized, queuing document:",
        fileUrl,
        title
      );
      // Store the request to open it once the viewer is ready
      if (!window._pendingDocuments) window._pendingDocuments = [];
      window._pendingDocuments.push({ fileUrl, title });
    };
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Document viewer script starting initialization");
  
    // Check if the document viewer modal exists in the DOM
    const modalExists = document.querySelector(".document-viewer-modal");
    if (!modalExists) {
      console.error(
        "Document viewer modal not found in the DOM. Adding it dynamically."
      );
      // Add the modal HTML dynamically if it doesn't exist
      const modalHTML = `
        <div class="document-viewer-modal">
          <div class="modal-content">
            <div class="modal-header">
              <h2 id="modal-title">Document Title</h2>
              <button class="close-modal">&times;</button>
            </div>
            <div class="document-container">
              <div id="pdf-viewer"></div>
              <div id="pptx-viewer" class="hidden"></div>
            </div>
            <div class="modal-controls">
              <button id="prev-page" disabled>Previous</button>
              <span id="page-info">
                Page <span id="page-num">1</span> of <span id="page-count">1</span>
              </span>
              <button id="next-page" disabled>Next</button>
              <a id="download-document" href="#" download class="download-btn">
                Download
              </a>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML("beforeend", modalHTML);
  
      // Add basic styles for the modal if they don't exist
      if (!document.querySelector("#document-viewer-styles")) {
        const styleElement = document.createElement("style");
        styleElement.id = "document-viewer-styles";
        styleElement.textContent = `
          .document-viewer-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 1000;
          }
          
          .document-viewer-modal.active {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          
          .modal-content {
            background-color: white;
            width: 90%;
            max-width: 1000px;
            height: 90%;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
          }
          
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            border-bottom: 1px solid #eee;
          }
          
          .close-modal {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
          }
          
          .document-container {
            flex: 1;
            overflow: auto;
            padding: 20px;
            position: relative;
          }
          
          .modal-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            border-top: 1px solid #eee;
          }
          
          .hidden {
            display: none;
          }
          
          .loading-spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 2s linear infinite;
            margin: 20px auto;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .download-btn {
            background-color: #4CAF50;
            color: white;
            padding: 8px 16px;
            text-decoration: none;
            border-radius: 4px;
          }
          
          button {
            padding: 8px 16px;
            background-color: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
          }
          
          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .rotate-screen-btn {
            display: none;
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            padding: 8px;
            z-index: 10;
            cursor: pointer;
          }
          
          .orientation-prompt {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            z-index: 2000;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            text-align: center;
            padding: 20px;
          }
          
          .orientation-prompt.active {
            display: flex;
          }
          
          .orientation-prompt svg {
            width: 50px;
            height: 50px;
            stroke: white;
            margin-bottom: 20px;
          }
          
          .dismiss-prompt {
            background-color: white;
            color: black;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-top: 20px;
            cursor: pointer;
          }
        `;
        document.head.appendChild(styleElement);
      }
    }
  
    // Try to load PDF.js dynamically if not already loaded
    if (typeof window.pdfjsLib === "undefined") {
      console.log("PDF.js not detected, loading dynamically...");
  
      // Load PDF.js main library
      const pdfScript = document.createElement("script");
      pdfScript.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
      pdfScript.onload = () => {
        console.log("PDF.js loaded successfully");
  
        // Load PDF.js worker
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
  
        // Initialize the viewer after library is loaded
        initDocumentViewer();
      };
      pdfScript.onerror = () => {
        console.error("Failed to load PDF.js library");
        alert(
          "PDF viewer could not be loaded. Please check your internet connection."
        );
      };
      document.head.appendChild(pdfScript);
    } else {
      // PDF.js is already loaded, initialize directly
      console.log("PDF.js already loaded");
      initDocumentViewer();
    }
  
    /**
     * Main initialization function for the document viewer
     */
    function initDocumentViewer() {
      console.log("Initializing document viewer");
  
      // Elements
      const modal = document.querySelector(".document-viewer-modal");
      const closeModalBtn = document.querySelector(".close-modal");
      const modalTitle = document.getElementById("modal-title");
      const pdfViewer = document.getElementById("pdf-viewer");
      const pptxViewer = document.getElementById("pptx-viewer");
      const prevPageBtn = document.getElementById("prev-page");
      const nextPageBtn = document.getElementById("next-page");
      const pageNum = document.getElementById("page-num");
      const pageCount = document.getElementById("page-count");
      const downloadBtn = document.getElementById("download-document");
  
      // Check if all required elements exist
      if (!modal || !modalTitle || !pdfViewer) {
        console.error("Required document viewer elements not found:", {
          modal: !!modal,
          modalTitle: !!modalTitle,
          pdfViewer: !!pdfViewer,
        });
        return;
      }
  
      // PDF.js variables
      let pdfDoc = null;
      let pageNum_current = 1;
      let pageRendering = false;
      let pageNumPending = null;
      const scale = 1.5;
  
      // Add rotation button to document container (only for mobile)
      const documentContainer = document.querySelector(".document-container");
      if (documentContainer) {
        const rotateBtn = document.createElement("button");
        rotateBtn.className = "rotate-screen-btn";
        rotateBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 2v7h7"></path>
            <path d="M3 9a9 9 0 1 0 9-9"></path>
          </svg>
        `;
        rotateBtn.setAttribute("aria-label", "Rotate screen");
        rotateBtn.setAttribute("title", "Rotate to landscape for better viewing");
        documentContainer.appendChild(rotateBtn);
  
        // Add orientation prompt
        const orientationPrompt = document.createElement("div");
        orientationPrompt.className = "orientation-prompt";
        orientationPrompt.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12" y2="18"></line>
          </svg>
          <p>Rotate your device to landscape mode for a better viewing experience</p>
          <button class="dismiss-prompt">Continue in Portrait</button>
        `;
        document.body.appendChild(orientationPrompt);
  
        // Function to check if content is landscape and should show rotate button
        let checkContentOrientation = () => {}; // Declare the variable
  
        checkContentOrientation = () => {
          // Only show on mobile devices
          if (!isMobileDevice()) {
            rotateBtn.style.display = "none";
            return;
          }
  
          // Check if we have a PDF loaded
          if (pdfDoc) {
            // Get the current page
            pdfDoc.getPage(pageNum_current).then((page) => {
              const viewport = page.getViewport({ scale: 1.0 });
  
              // If the width is greater than the height, it's landscape content
              const isLandscapeContent = viewport.width > viewport.height;
  
              // Only show the rotate button for landscape content in portrait mode
              const isPortraitMode = window.innerHeight > window.innerWidth;
  
              if (isLandscapeContent && isPortraitMode) {
                rotateBtn.style.display = "flex";
              } else {
                rotateBtn.style.display = "none";
              }
            });
          } else {
            // No PDF loaded, hide the button
            rotateBtn.style.display = "none";
          }
        };
  
        // Handle rotation button click
        rotateBtn.addEventListener("click", () => {
          if (isMobileDevice()) {
            orientationPrompt.classList.add("active");
  
            // Try to request fullscreen for better experience
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch((err) => {
                console.log("Fullscreen request failed:", err);
              });
            }
          } else {
            // For desktop, just toggle landscape class
            document.body.classList.toggle("landscape-mode");
  
            // Re-render current page for better fit
            if (pdfDoc && !pageRendering) {
              renderPage(pageNum_current);
            }
          }
        });
  
        // Handle dismiss button
        const dismissBtn = orientationPrompt.querySelector(".dismiss-prompt");
        if (dismissBtn) {
          dismissBtn.addEventListener("click", () => {
            orientationPrompt.classList.remove("active");
          });
        }
  
        // Listen for orientation change
        window.addEventListener("orientationchange", () => {
          // Hide prompt when orientation changes
          orientationPrompt.classList.remove("active");
  
          // Re-render current page for better fit
          if (pdfDoc && !pageRendering) {
            renderPage(pageNum_current);
          }
  
          // Check if we should show/hide the rotate button
          checkContentOrientation();
        });
  
        // Listen for resize events to update rotate button visibility
        window.addEventListener("resize", () => {
          checkContentOrientation();
        });
      }
  
      // Close modal
      if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeModal);
      }
  
      if (modal) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) closeModal();
        });
      }
  
      // Handle keyboard events
      document.addEventListener("keydown", (e) => {
        if (!modal || !modal.classList.contains("active")) return;
  
        if (e.key === "Escape") {
          closeModal();
        } else if (e.key === "ArrowLeft") {
          if (prevPageBtn && !prevPageBtn.disabled) prevPage();
        } else if (e.key === "ArrowRight") {
          if (nextPageBtn && !nextPageBtn.disabled) nextPage();
        }
      });
  
      // Navigation buttons
      if (prevPageBtn) {
        prevPageBtn.addEventListener("click", prevPage);
      }
  
      if (nextPageBtn) {
        nextPageBtn.addEventListener("click", nextPage);
      }
  
      /**
       * Opens a document in the viewer
       * @param {string} fileUrl - URL of the document to open
       * @param {string} title - Title of the document
       */
      function openDocument(fileUrl, title) {
        console.log("Opening document in viewer:", fileUrl);
  
        if (!modal || !modalTitle) {
          console.error("Modal elements not found", {
            modal: !!modal,
            modalTitle: !!modalTitle,
          });
          return;
        }
  
        modalTitle.textContent = title;
  
        // Check if we have the PDF utils from cloudinary-pdf-solution.js
        const isCloudinaryPdf =
          window.pdfUtils &&
          (typeof window.pdfUtils.isCloudinaryPdf === "function"
            ? window.pdfUtils.isCloudinaryPdf(fileUrl)
            : fileUrl.includes("cloudinary.com") &&
              fileUrl.toLowerCase().endsWith(".pdf"));
  
        console.log("Is Cloudinary PDF:", isCloudinaryPdf);
  
        // Use the PDF utils if available, otherwise use direct URL
        let finalUrl = fileUrl;
        if (
          isCloudinaryPdf &&
          window.pdfUtils &&
          typeof window.pdfUtils.transformCloudinaryPdfUrl === "function"
        ) {
          // Use the utility function from cloudinary-pdf-solution.js
          finalUrl = window.pdfUtils.transformCloudinaryPdfUrl(fileUrl);
          console.log("Using pdfUtils to transform URL:", finalUrl);
        }
  
        if (downloadBtn) {
          downloadBtn.href = finalUrl;
          downloadBtn.download =
            title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".pdf";
        }
  
        // Reset viewers
        if (pdfViewer) pdfViewer.innerHTML = "";
        if (pptxViewer)
          pptxViewer.innerHTML =
            '<p class="pptx-message">PPTX preview is being prepared...</p>';
  
        // Determine file type
        const fileExtension = fileUrl.split(".").pop().toLowerCase();
  
        if (fileExtension === "pdf") {
          if (pdfViewer) pdfViewer.classList.remove("hidden");
          if (pptxViewer) pptxViewer.classList.add("hidden");
  
          // Special handling for Cloudinary PDFs
          if (isCloudinaryPdf) {
            console.log("Cloudinary PDF detected, using special handling");
  
            // For Cloudinary PDFs, check if we should use the viewer or direct download
            if (
              window.pdfUtils &&
              window.pdfUtils.SOLUTION_OPTIONS &&
              window.pdfUtils.SOLUTION_OPTIONS.USE_CLOUDINARY_TRANSFORMATION
            ) {
              // Try to load the PDF with the transformation
              loadPdf(finalUrl);
  
              // Show navigation controls
              if (prevPageBtn) prevPageBtn.style.display = "";
              if (nextPageBtn) nextPageBtn.style.display = "";
              if (document.getElementById("page-info"))
                document.getElementById("page-info").style.display = "";
            } else {
              // Show download option instead of trying to render
              if (pdfViewer) {
                pdfViewer.innerHTML = createCloudinaryDownloadHTML(finalUrl);
              }
  
              // Hide navigation controls for direct download
              if (prevPageBtn) prevPageBtn.style.display = "none";
              if (nextPageBtn) nextPageBtn.style.display = "none";
              if (document.getElementById("page-info"))
                document.getElementById("page-info").style.display = "none";
            }
          } else {
            // Normal PDF handling
            loadPdf(finalUrl);
  
            // Show navigation controls
            if (prevPageBtn) prevPageBtn.style.display = "";
            if (nextPageBtn) nextPageBtn.style.display = "";
            if (document.getElementById("page-info"))
              document.getElementById("page-info").style.display = "";
          }
        } else if (fileExtension === "pptx") {
          if (pdfViewer) pdfViewer.classList.add("hidden");
          if (pptxViewer) pptxViewer.classList.remove("hidden");
          // For now, just show a message about PPTX
          if (pptxViewer) {
            pptxViewer.innerHTML = `
             <div class="pptx-placeholder">
               <h3>PPTX Viewer</h3>
               <p>This is a placeholder for PPTX viewing functionality.</p>
               <p>In a production environment, you would integrate with a PPTX rendering library or convert to PDF server-side.</p>
               <p>For now, you can download the file using the download button below.</p>
               <p>Tip: Rotate to landscape mode for better viewing on mobile devices.</p>
             </div>
           `;
          }
        }
  
        modal.classList.add("active");
        document.body.style.overflow = "hidden"; // Prevent scrolling
  
        // Check if we should show the rotate button
        setTimeout(checkContentOrientation, 500);
      }
  
      // Assign the openDocument function to the window object
      window.openDocument = openDocument;
      console.log("openDocument function registered to window");
  
      /**
       * Creates HTML for Cloudinary PDF download option
       * @param {string} url - URL of the PDF to download
       * @returns {string} - HTML for download option
       */
      function createCloudinaryDownloadHTML(url) {
        return `
         <div class="cloudinary-pdf-message">
           <h3>This document requires download to view</h3>
           <p>Due to security settings, this PDF cannot be viewed directly in the browser.</p>
           <a href="${url}" class="download-btn" target="_blank">
             Download PDF
           </a>
         </div>
       `;
      }
  
      /**
       * Closes the document viewer modal
       */
      function closeModal() {
        if (!modal) return;
  
        modal.classList.remove("active");
        document.body.style.overflow = ""; // Restore scrolling
  
        // Exit fullscreen if we're in it
        if (document.fullscreenElement) {
          document.exitFullscreen().catch((err) => {
            console.log("Error exiting fullscreen:", err);
          });
        }
  
        // Clean up PDF.js
        if (pdfDoc) {
          pdfDoc = null;
          pageNum_current = 1;
          pageRendering = false;
          pageNumPending = null;
        }
      }
  
      /**
       * Loads a PDF document
       * @param {string} url - URL of the PDF to load
       */
      function loadPdf(url) {
        if (!pdfViewer) {
          console.error("PDF viewer element not found");
          return;
        }
  
        console.log("Loading PDF in viewer:", url);
  
        // Show loading indicator
        pdfViewer.innerHTML = '<div class="loading-spinner"></div>';
  
        // Check if PDF.js is available
        if (typeof window.pdfjsLib === "undefined") {
          console.error("PDF.js library not available");
          pdfViewer.innerHTML = `
        <div class="error-message">
          <h3>PDF Viewer Error</h3>
          <p>PDF.js library is not available. Please refresh the page and try again.</p>
        </div>
      `;
          return;
        }
  
        console.log("Loading PDF:", url);
  
        // Load the PDF
        window.pdfjsLib
          .getDocument(url)
          .promise.then((pdf) => {
            console.log("PDF loaded successfully");
            pdfDoc = pdf;
            if (pageCount) pageCount.textContent = pdf.numPages;
  
            // Enable/disable navigation buttons
            updateUIState();
  
            // Render the first page
            renderPage(pageNum_current);
  
            // Check if we should show the rotate button
            checkContentOrientation();
          })
          .catch((error) => {
            console.error("Error loading PDF:", error);
            if (pdfViewer) {
              // Check if this is a Cloudinary 401 error
              if (
                (error.status === 401 || error.message.includes("401")) &&
                url.includes("cloudinary.com")
              ) {
                // Transform the URL and offer download
                let downloadUrl = url;
  
                // Use pdfUtils if available
                if (
                  window.pdfUtils &&
                  typeof window.pdfUtils.transformCloudinaryPdfUrl === "function"
                ) {
                  downloadUrl = window.pdfUtils.transformCloudinaryPdfUrl(url);
                }
  
                pdfViewer.innerHTML = createCloudinaryDownloadHTML(downloadUrl);
  
                // Hide navigation controls
                if (prevPageBtn) prevPageBtn.style.display = "none";
                if (nextPageBtn) nextPageBtn.style.display = "none";
                if (document.getElementById("page-info"))
                  document.getElementById("page-info").style.display = "none";
              } else {
                // Regular error message
                pdfViewer.innerHTML = `
                 <div class="error-message">
                   <h3>Error Loading PDF</h3>
                   <p>${error.message}</p>
                   <p>This might be due to CORS restrictions or an invalid URL.</p>
                   <p>URL: ${url}</p>
                 </div>
               `;
              }
            }
          });
      }
  
      /**
       * Renders a specific page of the PDF
       * @param {number} num - Page number to render
       */
      function renderPage(num) {
        if (!pdfDoc || !pdfViewer) return;
  
        pageRendering = true;
  
        // Update page number display
        if (pageNum) pageNum.textContent = num;
  
        // Get the page
        pdfDoc.getPage(num).then((page) => {
          // Determine scale based on orientation
          let viewportScale = scale;
  
          // If in landscape mode on mobile, adjust scale
          if (
            isMobileDevice() &&
            window.matchMedia("(orientation: landscape)").matches
          ) {
            viewportScale = scale * 1.2; // Increase scale for landscape
          }
  
          const viewport = page.getViewport({ scale: viewportScale });
  
          // Prepare canvas
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;
  
          // Clear previous content
          pdfViewer.innerHTML = "";
          pdfViewer.appendChild(canvas);
  
          // Render PDF page into canvas context
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
          };
  
          const renderTask = page.render(renderContext);
  
          // Wait for rendering to finish
          renderTask.promise.then(() => {
            pageRendering = false;
  
            // Check if there's a pending page
            if (pageNumPending !== null) {
              renderPage(pageNumPending);
              pageNumPending = null;
            }
          });
        });
  
        // Update UI state
        updateUIState();
      }
  
      /**
       * Go to previous page
       */
      function prevPage() {
        if (pageNum_current <= 1) return;
        pageNum_current--;
        queueRenderPage(pageNum_current);
      }
  
      /**
       * Go to next page
       */
      function nextPage() {
        if (!pdfDoc || pageNum_current >= pdfDoc.numPages) return;
        pageNum_current++;
        queueRenderPage(pageNum_current);
      }
  
      /**
       * Queue rendering of a page
       * @param {number} num - Page number to queue for rendering
       */
      function queueRenderPage(num) {
        if (pageRendering) {
          pageNumPending = num;
        } else {
          renderPage(num);
        }
      }
  
      /**
       * Update UI state based on current page
       */
      function updateUIState() {
        if (!pdfDoc) {
          if (prevPageBtn) prevPageBtn.disabled = true;
          if (nextPageBtn) nextPageBtn.disabled = true;
          return;
        }
  
        if (prevPageBtn) prevPageBtn.disabled = pageNum_current <= 1;
        if (nextPageBtn)
          nextPageBtn.disabled = pageNum_current >= pdfDoc.numPages;
      }
  
      /**
       * Check if device is mobile
       * @returns {boolean} - True if the device is mobile
       */
      function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      }
  
      // Handle window resize
      window.addEventListener("resize", () => {
        if (pdfDoc && !pageRendering) {
          // Re-render current page on resize for better viewing experience
          renderPage(pageNum_current);
        }
      });
  
      // Process any pending documents that were queued before initialization
      if (window._pendingDocuments && window._pendingDocuments.length > 0) {
        console.log(
          "Processing pending documents:",
          window._pendingDocuments.length
        );
        window._pendingDocuments.forEach((doc) => {
          openDocument(doc.fileUrl, doc.title);
        });
        window._pendingDocuments = [];
      }
    }
  });
  