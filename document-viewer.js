/**
 * Document Viewer
 * Complete solution for PDF viewing with enhanced readability
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
  console.log("Document viewer script loaded");

  // Define the openDocument function immediately to handle any early calls
  window.openDocument = (fileUrl, title) => {
    console.log("Opening document:", fileUrl, title);
    openEnhancedPdfViewer(fileUrl, title);
  };

  // Create necessary CSS styles
  createStyles();

  /**
   * Creates and adds the necessary styles to the document
   */
  function createStyles() {
    if (!document.getElementById("document-viewer-styles")) {
      const styleElement = document.createElement("style");
      styleElement.id = "document-viewer-styles";
      styleElement.textContent = `
        /* PDF Viewer Container */
        .pdf-viewer-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 9999;
          background-color: rgba(0, 0, 0, 0.9);
          display: flex;
          flex-direction: column;
        }

        /* Header for the PDF viewer */
        .pdf-viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background-color: #2c3e50;
          color: white;
        }

        .pdf-viewer-title {
          font-size: 16px;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-right: 15px;
        }

        .pdf-viewer-close {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0 10px;
        }

        /* Container for the iframe */
        .pdf-viewer-frame-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        /* The iframe that will contain the PDF.js viewer */
        .pdf-viewer-frame {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        /* Loading indicator */
        .pdf-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: white;
        }

        .pdf-loading-spinner {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          margin: 0 auto 15px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Toolbar with controls */
        .pdf-viewer-toolbar {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 8px;
          background-color: #34495e;
          gap: 10px;
          flex-wrap: wrap; /* Allow wrapping on small screens */
        }

        .pdf-viewer-button {
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .pdf-viewer-button:hover {
          background-color: #2980b9;
        }

        .pdf-viewer-button svg {
          width: 16px;
          height: 16px;
          margin-right: 4px;
        }

        .pdf-page-info {
          color: white;
          margin: 0 10px;
          font-size: 14px;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .pdf-viewer-toolbar {
            padding: 6px 4px;
            gap: 4px;
            justify-content: center;
          }
          
          .pdf-viewer-button {
            padding: 6px 8px;
            font-size: 12px;
            min-width: 0; /* Allow buttons to shrink */
          }
          
          .pdf-page-info {
            font-size: 12px;
            margin: 0 4px;
          }
          
          /* Ensure text doesn't overflow on small screens */
          .pdf-viewer-button svg {
            width: 14px;
            height: 14px;
            margin-right: 3px;
          }
          
          /* For very small screens, show icons only */
          @media (max-width: 480px) {
            .pdf-viewer-button {
              padding: 6px;
            }
            
            .pdf-viewer-button span {
              display: none; /* Hide text, show only icons */
            }
            
            .pdf-viewer-button svg {
              margin-right: 0;
            }
          }
        }
        
        /* Fix for PDF.js viewer on mobile */
        @media (max-width: 768px) {
          /* Ensure PDF.js viewer toolbar is properly sized */
          .pdf-viewer-frame-container iframe {
            -webkit-overflow-scrolling: touch;
          }
          
          /* Improve rendering quality on mobile */
          canvas {
            image-rendering: -webkit-optimize-contrast;
          }
        }
      `;
      document.head.appendChild(styleElement);
    }
  }

  /**
   * Opens the enhanced PDF viewer
   * @param {string} pdfUrl - URL of the PDF to open
   * @param {string} title - Title to display
   */
  function openEnhancedPdfViewer(pdfUrl, title) {
    console.log("Opening enhanced PDF viewer:", pdfUrl);

    // Create viewer container if it doesn't exist
    let viewerContainer = document.getElementById("enhanced-pdf-viewer");
    if (viewerContainer) {
      // If it exists, clean it up
      viewerContainer.innerHTML = "";
    } else {
      viewerContainer = document.createElement("div");
      viewerContainer.id = "enhanced-pdf-viewer";
      viewerContainer.className = "pdf-viewer-container";
      document.body.appendChild(viewerContainer);
    }

    // Create the header
    const header = document.createElement("div");
    header.className = "pdf-viewer-header";

    // Add title
    const titleElement = document.createElement("div");
    titleElement.className = "pdf-viewer-title";
    titleElement.textContent = title || "PDF Document";
    header.appendChild(titleElement);

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.className = "pdf-viewer-close";
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", closeEnhancedViewer);
    header.appendChild(closeButton);

    viewerContainer.appendChild(header);

    // Create toolbar with controls
    const toolbar = document.createElement("div");
    toolbar.className = "pdf-viewer-toolbar";

    // Zoom out button
    const zoomOutButton = document.createElement("button");
    zoomOutButton.className = "pdf-viewer-button zoom-out";
    zoomOutButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
      <span>Zoom Out</span>
    `;
    toolbar.appendChild(zoomOutButton);

    // Zoom in button
    const zoomInButton = document.createElement("button");
    zoomInButton.className = "pdf-viewer-button zoom-in";
    zoomInButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
      </svg>
      <span>Zoom In</span>
    `;
    toolbar.appendChild(zoomInButton);

    // Fit to width button
    const fitWidthButton = document.createElement("button");
    fitWidthButton.className = "pdf-viewer-button fit-width";
    fitWidthButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="9" y1="3" x2="9" y2="21"></line>
        <line x1="15" y1="3" x2="15" y2="21"></line>
      </svg>
      <span>Fit Width</span>
    `;
    toolbar.appendChild(fitWidthButton);

    // Page info
    const pageInfo = document.createElement("div");
    pageInfo.className = "pdf-page-info";
    pageInfo.textContent = "Page: --/--";
    toolbar.appendChild(pageInfo);

    // Previous page button
    const prevButton = document.createElement("button");
    prevButton.className = "pdf-viewer-button prev-page";
    prevButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      <span>Prev</span>
    `;
    toolbar.appendChild(prevButton);

    // Next page button
    const nextButton = document.createElement("button");
    nextButton.className = "pdf-viewer-button next-page";
    nextButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
      <span>Next</span>
    `;
    toolbar.appendChild(nextButton);

    // Rotate button
    const rotateButton = document.createElement("button");
    rotateButton.className = "pdf-viewer-button rotate";
    rotateButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
      </svg>
      <span>Rotate</span>
    `;
    toolbar.appendChild(rotateButton);

    viewerContainer.appendChild(toolbar);

    // Create frame container
    const frameContainer = document.createElement("div");
    frameContainer.className = "pdf-viewer-frame-container";

    // Add loading indicator
    const loading = document.createElement("div");
    loading.className = "pdf-loading";
    loading.innerHTML = `
      <div class="pdf-loading-spinner"></div>
      <div>Loading PDF...</div>
    `;
    frameContainer.appendChild(loading);

    viewerContainer.appendChild(frameContainer);

    // Create a new iframe for the PDF.js viewer
    const iframe = document.createElement("iframe");
    iframe.className = "pdf-viewer-frame";
    frameContainer.appendChild(iframe); // Append iframe immediately

    let useWebViewer = false;

    // First, check if we need to load PDF.js
    loadPdfJs().then(() => {
      // Now we can proceed with rendering the PDF
      if (window.pdfjsLib) {
        // We have PDF.js available, use our custom viewer
        //renderCustomPdfViewer(pdfUrl, frameContainer, loading, pageInfo);
        useWebViewer = false;
      } else {
        // Fallback to PDF.js web viewer
        //usePdfJsWebViewer(pdfUrl, iframe, frameContainer, loading);
        useWebViewer = true;
      }

      if (useWebViewer) {
        usePdfJsWebViewer(pdfUrl, iframe, frameContainer, loading);
      } else {
        renderCustomPdfViewer(pdfUrl, frameContainer, loading, pageInfo);
      }
    });

    // Set up button event listeners
    setupToolbarButtons(toolbar, iframe);

    // Show the viewer
    viewerContainer.style.display = "flex";

    // Prevent scrolling of the main page
    document.body.style.overflow = "hidden";

    // Add keyboard event listener for Escape key
    document.addEventListener("keydown", handleKeyDown);
  }

  /**
   * Loads PDF.js if not already loaded
   * @returns {Promise} - Resolves when PDF.js is loaded
   */
  function loadPdfJs() {
    return new Promise((resolve) => {
      if (window.pdfjsLib) {
        resolve();
        return;
      }

      // Load PDF.js main library
      const pdfScript = document.createElement("script");
      pdfScript.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
      pdfScript.onload = () => {
        console.log("PDF.js loaded successfully");

        // Load PDF.js worker
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

        resolve();
      };
      pdfScript.onerror = () => {
        console.error("Failed to load PDF.js library");
        resolve(); // Resolve anyway to try the fallback
      };
      document.head.appendChild(pdfScript);
    });
  }

  /**
   * Renders a PDF using our custom viewer
   * @param {string} pdfUrl - URL of the PDF to render
   * @param {HTMLElement} container - Container element
   * @param {HTMLElement} loading - Loading indicator element
   * @param {HTMLElement} pageInfo - Page info element
   */
  function renderCustomPdfViewer(pdfUrl, container, loading, pageInfo) {
    // Create a canvas for rendering
    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";

    // Create a div to wrap the canvas for scrolling
    const canvasContainer = document.createElement("div");
    canvasContainer.style.overflow = "auto";
    canvasContainer.style.width = "100%";
    canvasContainer.style.height = "100%";
    canvasContainer.style.display = "flex";
    canvasContainer.style.justifyContent = "center";
    canvasContainer.style.backgroundColor = "#525659";
    canvasContainer.style.webkitOverflowScrolling = "touch"; // Smooth scrolling on iOS
    canvasContainer.appendChild(canvas);

    // Clear container and add canvas container
    container.innerHTML = "";
    container.appendChild(canvasContainer);

    // PDF.js variables
    let pdfDoc = null;
    let currentPage = 1;
    let currentScale = 1.5; // Start with a larger scale for better readability
    let currentRotation = 0;
    let pageRendering = false;
    let pageNumPending = null;
    let isMobile = window.innerWidth < 768;

    // Detect if we're on a high-DPI display
    const pixelRatio = window.devicePixelRatio || 1;

    // Load the PDF
    const loadingTask = window.pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/cmaps/",
      cMapPacked: true,
    });

    loadingTask.promise
      .then((pdf) => {
        pdfDoc = pdf;

        // Update page info
        pageInfo.textContent = `Page: ${currentPage}/${pdf.numPages}`;

        // Render first page
        renderPage(currentPage);

        // Set up page navigation
        setupPageNavigation(pdf.numPages);

        // Auto-fit to width
        setTimeout(() => {
          fitToWidth();
        }, 500);
      })
      .catch((error) => {
        console.error("Error loading PDF:", error);
        container.innerHTML = `
          <div style="color: white; text-align: center; padding: 20px;">
            <h3>Error Loading PDF</h3>
            <p>${error.message}</p>
            <p>This might be due to CORS restrictions or an invalid URL.</p>
          </div>
        `;
      });

    /**
     * Renders a specific page
     * @param {number} pageNum - Page number to render
     */
    function renderPage(pageNum) {
      pageRendering = true;

      // Update page info
      pageInfo.textContent = `Page: ${pageNum}/${pdfDoc.numPages}`;

      // Get the page
      pdfDoc.getPage(pageNum).then((page) => {
        // Create viewport with current scale and rotation
        // Use a higher scale for high-DPI displays on mobile
        const adjustedScale = isMobile
          ? currentScale * Math.min(1.5, pixelRatio)
          : currentScale;

        const viewport = page.getViewport({
          scale: adjustedScale,
          rotation: currentRotation,
        });

        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Get rendering context
        const ctx = canvas.getContext("2d");

        // Enable high-quality rendering for text
        if (ctx.imageSmoothingEnabled !== undefined) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
        }

        // Render PDF page
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);

        renderTask.promise.then(() => {
          pageRendering = false;

          // Check if there's a pending page
          if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
          }

          // Hide loading indicator
          if (loading) {
            loading.style.display = "none";
          }
        });
      });
    }

    /**
     * Queues a page for rendering
     * @param {number} pageNum - Page number to queue
     */
    function queueRenderPage(pageNum) {
      if (pageRendering) {
        pageNumPending = pageNum;
      } else {
        renderPage(pageNum);
      }
    }

    /**
     * Goes to the previous page
     */
    function prevPage() {
      if (currentPage <= 1) return;
      currentPage--;
      queueRenderPage(currentPage);
    }

    /**
     * Goes to the next page
     */
    function nextPage() {
      if (currentPage >= pdfDoc.numPages) return;
      currentPage++;
      queueRenderPage(currentPage);
    }

    /**
     * Zooms in
     */
    function zoomIn() {
      currentScale *= 1.2;
      queueRenderPage(currentPage);
    }

    /**
     * Zooms out
     */
    function zoomOut() {
      currentScale /= 1.2;
      queueRenderPage(currentPage);
    }

    /**
     * Fits the page to width
     */
    function fitToWidth() {
      if (!pdfDoc) return;

      pdfDoc.getPage(currentPage).then((page) => {
        const viewport = page.getViewport({ scale: 1.0 });
        const containerWidth = canvasContainer.clientWidth - 40; // Subtract padding

        // Calculate scale to fit width
        currentScale = containerWidth / viewport.width;

        queueRenderPage(currentPage);
      });
    }

    /**
     * Rotates the page
     */
    function rotate() {
      currentRotation = (currentRotation + 90) % 360;
      queueRenderPage(currentPage);
    }

    /**
     * Sets up page navigation
     * @param {number} numPages - Total number of pages
     */
    function setupPageNavigation(numPages) {
      // Get buttons
      const prevButton = document.querySelector(".pdf-viewer-button.prev-page");
      const nextButton = document.querySelector(".pdf-viewer-button.next-page");
      const zoomInButton = document.querySelector(".pdf-viewer-button.zoom-in");
      const zoomOutButton = document.querySelector(
        ".pdf-viewer-button.zoom-out"
      );
      const fitWidthButton = document.querySelector(
        ".pdf-viewer-button.fit-width"
      );
      const rotateButton = document.querySelector(".pdf-viewer-button.rotate");

      // Add event listeners
      if (prevButton) prevButton.addEventListener("click", prevPage);
      if (nextButton) nextButton.addEventListener("click", nextPage);
      if (zoomInButton) zoomInButton.addEventListener("click", zoomIn);
      if (zoomOutButton) zoomOutButton.addEventListener("click", zoomOut);
      if (fitWidthButton) fitWidthButton.addEventListener("click", fitToWidth);
      if (rotateButton) rotateButton.addEventListener("click", rotate);

      // Add swipe gestures for mobile
      if (isMobile) {
        let touchStartX = 0;
        let touchEndX = 0;

        canvasContainer.addEventListener(
          "touchstart",
          (e) => {
            touchStartX = e.changedTouches[0].screenX;
          },
          { passive: true }
        );

        canvasContainer.addEventListener(
          "touchend",
          (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
          },
          { passive: true }
        );

        function handleSwipe() {
          const swipeThreshold = 50;
          if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe left - next page
            if (currentPage < pdfDoc.numPages) {
              currentPage++;
              queueRenderPage(currentPage);
            }
          } else if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe right - previous page
            if (currentPage > 1) {
              currentPage--;
              queueRenderPage(currentPage);
            }
          }
        }
      }

      // Keyboard navigation
      document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") prevPage();
        if (e.key === "ArrowRight") nextPage();
        if (e.key === "+" || e.key === "=") zoomIn();
        if (e.key === "-") zoomOut();
      });
    }

    // Handle window resize
    window.addEventListener("resize", () => {
      isMobile = window.innerWidth < 768;
      if (pdfDoc) {
        fitToWidth();
      }
    });
  }

  /**
   * Uses the PDF.js web viewer as a fallback
   * @param {string} pdfUrl - URL of the PDF to view
   * @param {HTMLIFrameElement} iframe - The iframe element
   * @param {HTMLElement} container - Container element
   * @param {HTMLElement} loading - Loading indicator element
   */
  function usePdfJsWebViewer(pdfUrl, iframe, container, loading) {
    // The PDF.js viewer URL - using the CDN version
    const pdfJsViewerUrl =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/web/viewer.html";

    // Encode the PDF URL to pass as a parameter
    const encodedPdfUrl = encodeURIComponent(pdfUrl);

    // Set the iframe source to the PDF.js viewer with our PDF
    iframe.src = `${pdfJsViewerUrl}?file=${encodedPdfUrl}`;

    // Handle iframe load event
    iframe.onload = () => {
      // Hide loading indicator
      if (loading) {
        loading.style.display = "none";
      }

      // Try to set initial view mode to fit page width
      try {
        setTimeout(() => {
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow && iframeWindow.PDFViewerApplication) {
            // Set view mode to fit page width for better reading
            iframeWindow.PDFViewerApplication.pdfViewer.currentScaleValue =
              "page-width";

            // Apply mobile optimizations if needed
            if (window.innerWidth < 768) {
              applyMobileOptimizations(iframeWindow);
            }
          }
        }, 1000); // Give it a second to initialize
      } catch (e) {
        console.error("Error setting initial view mode:", e);
      }
    };
  }

  /**
   * Apply mobile-specific optimizations to the PDF.js viewer
   * @param {Window} iframeWindow - The iframe's window object
   */
  function applyMobileOptimizations(iframeWindow) {
    try {
      // Get the document inside the iframe
      const iframeDoc = iframeWindow.document;

      // Add mobile-specific styles
      const mobileStyle = iframeDoc.createElement("style");
      mobileStyle.textContent = `
        /* Mobile optimizations for PDF.js viewer */
        @media (max-width: 768px) {
          /* Make toolbar buttons more visible */
          .toolbarButton {
            min-width: 28px !important;
            height: 28px !important;
          }
          
          /* Ensure text is readable */
          .toolbarLabel {
            font-size: 14px !important;
          }
          
          /* Improve page navigation visibility */
          #pageNumber {
            width: 40px !important;
            font-size: 14px !important;
          }
          
          /* Ensure toolbar is properly sized */
          #toolbarContainer {
            min-width: 100% !important;
          }
          
          /* Improve touch targets */
          button, select, input {
            touch-action: manipulation !important;
          }
          
          /* Ensure canvas renders sharply */
          .canvasWrapper canvas {
            image-rendering: -webkit-optimize-contrast !important;
          }
        }
      `;
      iframeDoc.head.appendChild(mobileStyle);
    } catch (e) {
      console.error("Error applying mobile optimizations:", e);
    }
  }

  /**
   * Sets up toolbar button event listeners
   * @param {HTMLElement} toolbar - The toolbar element
   * @param {HTMLIFrameElement} iframe - The iframe element
   */
  function setupToolbarButtons(toolbar, iframe) {
    // Get buttons
    const zoomInButton = toolbar.querySelector(".zoom-in");
    const zoomOutButton = toolbar.querySelector(".zoom-out");
    const fitWidthButton = toolbar.querySelector(".fit-width");
    const prevButton = toolbar.querySelector(".prev-page");
    const nextButton = toolbar.querySelector(".next-page");
    const rotateButton = toolbar.querySelector(".rotate");

    // Add event listeners for iframe-based viewer
    if (zoomInButton) {
      zoomInButton.addEventListener("click", () => {
        try {
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow && iframeWindow.PDFViewerApplication) {
            iframeWindow.PDFViewerApplication.zoomIn();
          }
        } catch (e) {
          console.error("Error zooming in:", e);
        }
      });
    }

    if (zoomOutButton) {
      zoomOutButton.addEventListener("click", () => {
        try {
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow && iframeWindow.PDFViewerApplication) {
            iframeWindow.PDFViewerApplication.zoomOut();
          }
        } catch (e) {
          console.error("Error zooming out:", e);
        }
      });
    }

    if (fitWidthButton) {
      fitWidthButton.addEventListener("click", () => {
        try {
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow && iframeWindow.PDFViewerApplication) {
            iframeWindow.PDFViewerApplication.pdfViewer.currentScaleValue =
              "page-width";
          }
        } catch (e) {
          console.error("Error fitting to width:", e);
        }
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        try {
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow && iframeWindow.PDFViewerApplication) {
            iframeWindow.PDFViewerApplication.page--;
          }
        } catch (e) {
          console.error("Error going to previous page:", e);
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        try {
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow && iframeWindow.PDFViewerApplication) {
            iframeWindow.PDFViewerApplication.page++;
          }
        } catch (e) {
          console.error("Error going to next page:", e);
        }
      });
    }

    if (rotateButton) {
      rotateButton.addEventListener("click", () => {
        try {
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow && iframeWindow.PDFViewerApplication) {
            // Rotate 90 degrees clockwise
            const currentRotation =
              iframeWindow.PDFViewerApplication.pdfViewer.pagesRotation;
            iframeWindow.PDFViewerApplication.pdfViewer.pagesRotation =
              (currentRotation + 90) % 360;
          }
        } catch (e) {
          console.error("Error rotating:", e);
        }
      });
    }
  }

  /**
   * Closes the enhanced PDF viewer
   */
  function closeEnhancedViewer() {
    const viewerContainer = document.getElementById("enhanced-pdf-viewer");
    if (viewerContainer) {
      viewerContainer.style.display = "none";

      // Remove all iframes to stop any running PDF.js instances
      const frames = viewerContainer.querySelectorAll("iframe");
      frames.forEach((frame) => frame.remove());
    }

    // Restore scrolling of the main page
    document.body.style.overflow = "";

    // Remove keyboard event listener
    document.removeEventListener("keydown", handleKeyDown);
  }

  /**
   * Handles keyboard events for the viewer
   * @param {KeyboardEvent} e - The keyboard event
   */
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      closeEnhancedViewer();
    }
  }

  // Find all "View Document" buttons and attach click handlers
  function setupViewDocumentButtons() {
    const viewButtons = document.querySelectorAll(
      'a[href*=".pdf"], button:contains("View Document")'
    );

    viewButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        // Check if this is a "View Document" button
        if (this.textContent.trim() === "View Document") {
          e.preventDefault();

          // Find the closest parent article or section
          const container =
            this.closest("article") ||
            this.closest("section") ||
            this.parentElement;

          // Try to find a title and PDF URL
          let title = "";
          let pdfUrl = "";

          // Look for a title in headings
          const heading = container.querySelector("h1, h2, h3, h4, h5, h6");
          if (heading) {
            title = heading.textContent.trim();
          }

          // Look for a PDF link
          const pdfLink = container.querySelector('a[href*=".pdf"]');
          if (pdfLink) {
            pdfUrl = pdfLink.href;
          }

          // If we found both, open the document
          if (title && pdfUrl) {
            openEnhancedPdfViewer(pdfUrl, title);
          } else {
            console.error("Could not find PDF URL or title");
          }
        }
        // If it's a direct PDF link
        else if (this.href && this.href.toLowerCase().endsWith(".pdf")) {
          e.preventDefault();
          const title = this.textContent.trim() || "PDF Document";
          openEnhancedPdfViewer(this.href, title);
        }
      });
    });
  }

  // Set up the document viewer when the page is fully loaded
  window.addEventListener("load", () => {
    setupViewDocumentButtons();

    // Also look for any elements with onclick="openDocument(...)"
    document
      .querySelectorAll('[onclick*="openDocument"]')
      .forEach((element) => {
        const onclickAttr = element.getAttribute("onclick");
        if (onclickAttr) {
          // Extract the parameters from the onclick attribute
          const match = onclickAttr.match(
            /openDocument\s*$$\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*$$/
          );
          if (match) {
            const [_, url, title] = match;

            // Replace the onclick with our own handler
            element.removeAttribute("onclick");
            element.addEventListener("click", (e) => {
              e.preventDefault();
              openEnhancedPdfViewer(url, title);
            });
          }
        }
      });
  });

  // Process any pending documents to open
  if (window._pendingDocuments && window._pendingDocuments.length > 0) {
    console.log(
      "Processing pending documents:",
      window._pendingDocuments.length
    );
    window._pendingDocuments.forEach((doc) => {
      window.openDocument(doc.fileUrl, doc.title);
    });
    window._pendingDocuments = [];
  }
});
