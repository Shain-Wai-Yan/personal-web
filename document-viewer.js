/**
 * Document Viewer
 * Complete solution for PDF viewing with enhanced readability
 * Adaptive to different PDF layouts and orientations
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

        /* Font handling for PDF rendering */
        @font-face {
          font-family: 'pdf-viewer-fonts';
          src: local('pdf-viewer-fonts');
          font-display: block;
        }

        /* Ensure PDF text is rendered with proper font smoothing */
        canvas {
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Ensure PDF container properly handles embedded fonts */
        .pdf-viewer-frame-container {
          font-family: sans-serif; /* Fallback */
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

          /* Improve font rendering on mobile */
          canvas {
            text-rendering: optimizeLegibility !important;
            -webkit-font-smoothing: antialiased !important;
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

    // Fit to page button (new)
    const fitPageButton = document.createElement("button");
    fitPageButton.className = "pdf-viewer-button fit-page";
    fitPageButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="3" y1="9" x2="21" y2="9"></line>
        <line x1="3" y1="15" x2="21" y2="15"></line>
      </svg>
      <span>Fit Page</span>
    `;
    toolbar.appendChild(fitPageButton);

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

    // First, check if we need to load PDF.js
    loadPdfJs().then(() => {
      // Now we can proceed with rendering the PDF
      let useWebViewer = false;
      if (window.pdfjsLib) {
        // We have PDF.js available, use our custom viewer
        useWebViewer = false;
        renderCustomPdfViewer(pdfUrl, frameContainer, loading, pageInfo);
      } else {
        // Fallback to PDF.js web viewer
        useWebViewer = true;
        usePdfJsWebViewer(pdfUrl, iframe, frameContainer, loading);
      }
    });

    // Set up button event listeners
    setupToolbarButtons(toolbar, iframe, frameContainer);

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
   * Preloads fonts from a PDF document
   * @param {Object} pdfDocument - The PDF document object
   * @returns {Promise} - Resolves when fonts are loaded
   */
  function preloadPdfFonts(pdfDocument) {
    return new Promise((resolve) => {
      if (!pdfDocument || !pdfDocument.getPage) {
        resolve();
        return;
      }

      console.log("Preloading fonts from PDF...");

      // Get the first page to extract font information
      pdfDocument
        .getPage(1)
        .then((page) => {
          // Force the page to create and load its font resources
          page
            .getOperatorList()
            .then(() => {
              // Give a moment for fonts to load
              setTimeout(resolve, 100);
            })
            .catch(() => {
              // Continue even if there's an error
              resolve();
            });
        })
        .catch(() => {
          // Continue even if there's an error
          resolve();
        });
    });
  }

  /**
   * Analyzes PDF layout to determine optimal viewing settings
   * @param {Object} pdfDocument - The PDF document object
   * @returns {Promise<Object>} - Resolves with layout information
   */
  function analyzePdfLayout(pdfDocument) {
    return new Promise(async (resolve) => {
      try {
        // Default layout info
        const layoutInfo = {
          isPortrait: true,
          hasMultipleColumns: false,
          hasComplexLayout: false,
          aspectRatio: 0.707, // Default A4 aspect ratio
          recommendedScale: 1.0,
          recommendedMode: "auto",
        };

        // Get the first page to analyze layout
        const page = await pdfDocument.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });

        // Determine orientation
        layoutInfo.isPortrait = viewport.width < viewport.height;
        layoutInfo.aspectRatio = viewport.width / viewport.height;

        // Try to detect complex layouts by analyzing text layers
        const textContent = await page.getTextContent();

        // Count text items and their positions to detect columns
        const textItems = textContent.items;
        const xPositions = new Set();

        textItems.forEach((item) => {
          xPositions.add(Math.round(item.transform[4] / 10) * 10); // Round to nearest 10 to group similar positions
        });

        // If we have many different x positions, it might be a multi-column layout
        if (xPositions.size > 5) {
          layoutInfo.hasMultipleColumns = true;
        }

        // If we have many text items, it might be a complex layout
        if (textItems.length > 100) {
          layoutInfo.hasComplexLayout = true;
        }

        // Set recommended viewing mode based on analysis
        if (layoutInfo.hasComplexLayout || layoutInfo.hasMultipleColumns) {
          // For complex layouts, use a more conservative scale
          layoutInfo.recommendedScale = layoutInfo.isPortrait ? 0.9 : 1.0;
          layoutInfo.recommendedMode = "auto";
        } else {
          // For simple layouts, fit to width is usually better
          layoutInfo.recommendedScale = layoutInfo.isPortrait ? 1.0 : 1.2;
          layoutInfo.recommendedMode = "width";
        }

        // Adjust for very wide or very tall documents
        if (layoutInfo.aspectRatio < 0.5) {
          // Very tall
          layoutInfo.recommendedMode = "page";
        } else if (layoutInfo.aspectRatio > 1.5) {
          // Very wide
          layoutInfo.recommendedMode = "width";
        }

        console.log("PDF Layout Analysis:", layoutInfo);
        resolve(layoutInfo);
      } catch (error) {
        console.error("Error analyzing PDF layout:", error);
        // Return default values if analysis fails
        resolve({
          isPortrait: true,
          hasMultipleColumns: false,
          hasComplexLayout: false,
          aspectRatio: 0.707,
          recommendedScale: 1.0,
          recommendedMode: "auto",
        });
      }
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
    let currentScale = 1.0; // Start with a neutral scale and adjust based on PDF layout
    let currentRotation = 0;
    let pageRendering = false;
    let pageNumPending = null;
    let isMobile = window.innerWidth < 768;
    let layoutInfo = null; // Will store PDF layout analysis results

    // Detect if we're on a high-DPI display
    const pixelRatio = window.devicePixelRatio || 1;

    // Load the PDF with font handling enabled
    const pdfLoadingTask = window.pdfjsLib.getDocument({
      url: pdfUrl,
      // Enable font handling
      cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/cmaps/",
      cMapPacked: true,
      // These settings ensure original fonts are used
      disableFontFace: false,
      fontExtraProperties: true,
      nativeImageDecoderSupport: "all",
      useSystemFonts: false, // Don't use system fonts as fallbacks
      isEvalSupported: true,
      useWorkerFetch: true,
    });

    pdfLoadingTask.promise
      .then((pdf) => {
        pdfDoc = pdf;

        // Update page info
        pageInfo.textContent = `Page: ${currentPage}/${pdf.numPages}`;

        // Analyze PDF layout to determine optimal viewing settings
        return analyzePdfLayout(pdf).then((info) => {
          layoutInfo = info;

          // Set initial scale based on layout analysis
          currentScale =
            layoutInfo.recommendedScale *
            (isMobile ? Math.min(1.2, pixelRatio) : 1.0);

          // Preload fonts before rendering
          return preloadPdfFonts(pdf).then(() => {
            // Render first page
            renderPage(currentPage);

            // Set up page navigation
            setupPageNavigation(pdf.numPages);

            // Auto-fit based on layout analysis
            setTimeout(() => {
              if (layoutInfo.recommendedMode === "width") {
                fitToWidth();
              } else if (layoutInfo.recommendedMode === "page") {
                fitToPage();
              } else {
                // Auto mode - use a balanced approach
                autoFit();
              }
            }, 300);
          });
        });
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
      pdfDoc.getPage(pageNum).then(async (page) => {
        // Analyze this specific page's layout
        const rawViewport = page.getViewport({ scale: 1.0 });
        const isPagePortrait = rawViewport.width < rawViewport.height;
        const pageAspectRatio = rawViewport.width / rawViewport.height;

        // Determine if this is a complex page (tables, multi-columns, etc.)
        let isComplexPage = false;
        try {
          const textContent = await page.getTextContent();
          // Simple heuristic: if there are many text items with different positions, it might be complex
          const xPositions = new Set();
          textContent.items.forEach((item) => {
            xPositions.add(Math.round(item.transform[4] / 10) * 10);
          });
          isComplexPage = xPositions.size > 5 || textContent.items.length > 100;
        } catch (e) {
          console.log("Could not analyze page complexity:", e);
        }

        // Adjust scale for the specific page characteristics
        let adjustedScale = currentScale;

        // For mobile devices, apply special handling
        if (isMobile) {
          if (isPagePortrait) {
            // For portrait pages on mobile, use a more conservative scale
            adjustedScale =
              Math.min(currentScale, isComplexPage ? 0.9 : 1.0) * pixelRatio;
          } else if (pageAspectRatio > 1.5) {
            // For very wide landscape pages, reduce scale to fit better
            adjustedScale = Math.min(currentScale, 0.8) * pixelRatio;
          } else {
            // For normal landscape pages on mobile
            adjustedScale = currentScale * pixelRatio;
          }
        } else {
          // For desktop, adjust based on page complexity
          if (isComplexPage) {
            adjustedScale = Math.min(currentScale, isPagePortrait ? 1.2 : 1.0);
          }
        }

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

        // Render PDF page with enhanced text rendering
        const pdfRenderContext = {
          canvasContext: ctx,
          viewport: viewport,
          textLayer: true,
          renderInteractiveForms: true,
          enableWebGL: true,
          // Enable enhanced font rendering
          enhanceTextSelection: true,
          renderTextLayer: true,
        };

        const renderTask = page.render(pdfRenderContext);

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

          // Center the content vertically if it's smaller than the container
          if (canvas.height < canvasContainer.clientHeight) {
            canvas.style.marginTop = `${Math.max(
              0,
              (canvasContainer.clientHeight - canvas.height) / 2
            )}px`;
          } else {
            canvas.style.marginTop = "0";
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
        let newScale = containerWidth / viewport.width;

        // Apply different scaling strategies based on device and layout
        if (isMobile) {
          // For mobile, limit maximum scale to prevent text from being cut off
          newScale = Math.min(newScale, 1.2);

          // Ensure minimum readability
          newScale = Math.max(newScale, 0.8);
        } else {
          // On desktop, we can use the full width but cap it for very wide screens
          newScale = Math.min(newScale, 2.0);
        }

        currentScale = newScale;
        queueRenderPage(currentPage);
      });
    }

    /**
     * Fits the entire page to the viewport
     */
    function fitToPage() {
      if (!pdfDoc) return;

      pdfDoc.getPage(currentPage).then((page) => {
        const viewport = page.getViewport({ scale: 1.0 });
        const containerWidth = canvasContainer.clientWidth - 40; // Subtract padding
        const containerHeight = canvasContainer.clientHeight - 40; // Subtract padding

        // Calculate scales for width and height
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;

        // Use the smaller scale to ensure the entire page fits
        let newScale = Math.min(scaleX, scaleY);

        // Ensure minimum readability
        newScale = Math.max(newScale, 0.5);

        // Limit maximum scale
        newScale = Math.min(newScale, 2.0);

        currentScale = newScale;
        queueRenderPage(currentPage);
      });
    }

    /**
     * Automatically determines the best fit based on content
     */
    function autoFit() {
      if (!pdfDoc) return;

      pdfDoc.getPage(currentPage).then(async (page) => {
        const viewport = page.getViewport({ scale: 1.0 });
        const isPagePortrait = viewport.width < viewport.height;
        const pageAspectRatio = viewport.width / viewport.height;

        // Try to detect if this is a complex page
        let isComplexPage = false;
        try {
          const textContent = await page.getTextContent();
          const xPositions = new Set();
          textContent.items.forEach((item) => {
            xPositions.add(Math.round(item.transform[4] / 10) * 10);
          });
          isComplexPage = xPositions.size > 5 || textContent.items.length > 100;
        } catch (e) {
          console.log("Could not analyze page complexity:", e);
        }

        // For very wide pages or complex layouts, fit to page
        if (pageAspectRatio > 1.5 || (isComplexPage && !isPagePortrait)) {
          fitToPage();
        }
        // For very tall pages, fit to width
        else if (pageAspectRatio < 0.5) {
          fitToWidth();
        }
        // For normal pages, use a balanced approach
        else {
          const containerWidth = canvasContainer.clientWidth - 40;
          const containerHeight = canvasContainer.clientHeight - 40;

          // Calculate scales for width and height
          const scaleX = containerWidth / viewport.width;
          const scaleY = containerHeight / viewport.height;

          // For portrait pages, prioritize width but consider height
          if (isPagePortrait) {
            // If fitting to width would make the page too tall, use a balanced approach
            if (viewport.height * scaleX > containerHeight * 1.5) {
              currentScale = Math.min(scaleX, scaleY * 1.2);
            } else {
              currentScale = scaleX * 0.95; // Slightly smaller than full width
            }
          }
          // For landscape pages, prioritize fitting the whole page
          else {
            currentScale = Math.min(scaleX, scaleY * 1.1);
          }

          // Ensure minimum readability
          currentScale = Math.max(currentScale, 0.7);

          // Limit maximum scale
          currentScale = Math.min(currentScale, 1.5);

          queueRenderPage(currentPage);
        }
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
      const fitPageButton = document.querySelector(
        ".pdf-viewer-button.fit-page"
      );
      const rotateButton = document.querySelector(".pdf-viewer-button.rotate");

      // Add event listeners
      if (prevButton) prevButton.addEventListener("click", prevPage);
      if (nextButton) nextButton.addEventListener("click", nextPage);
      if (zoomInButton) zoomInButton.addEventListener("click", zoomIn);
      if (zoomOutButton) zoomOutButton.addEventListener("click", zoomOut);
      if (fitWidthButton) fitWidthButton.addEventListener("click", fitToWidth);
      if (fitPageButton) fitPageButton.addEventListener("click", fitToPage);
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
        // Re-apply the current fitting mode
        if (layoutInfo && layoutInfo.recommendedMode === "width") {
          fitToWidth();
        } else if (layoutInfo && layoutInfo.recommendedMode === "page") {
          fitToPage();
        } else {
          autoFit();
        }
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

    // Set the iframe source with improved font rendering options
    iframe.src = `${pdfJsViewerUrl}?file=${encodedPdfUrl}&disableFontFace=false&useSystemFonts=false`;

    // Handle iframe load event
    iframe.onload = () => {
      // Hide loading indicator
      if (loading) {
        loading.style.display = "none";
      }

      // Try to set initial view mode based on PDF orientation
      try {
        setTimeout(() => {
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow && iframeWindow.PDFViewerApplication) {
            // Wait for the PDF to be loaded
            if (iframeWindow.PDFViewerApplication.pdfDocument) {
              handlePdfLoaded(iframeWindow);
            } else {
              // If PDF isn't loaded yet, wait for the event
              iframeWindow.PDFViewerApplication.eventBus.on(
                "documentloaded",
                () => {
                  handlePdfLoaded(iframeWindow);
                }
              );
            }
          }
        }, 1000); // Give it a second to initialize
      } catch (e) {
        console.error("Error setting initial view mode:", e);
      }
    };

    function handlePdfLoaded(iframeWindow) {
      // Get the first page to determine layout
      const pdfViewer = iframeWindow.PDFViewerApplication.pdfViewer;
      const firstPage = pdfViewer.getPageView(0);

      if (firstPage && firstPage.viewport) {
        const viewport = firstPage.viewport;
        const isPortrait = viewport.width < viewport.height;
        const aspectRatio = viewport.width / viewport.height;
        const isMobile = window.innerWidth < 768;

        // Analyze the PDF structure to determine the best viewing mode
        analyzePdfStructure(iframeWindow).then((layoutInfo) => {
          // Apply different scaling strategies based on layout analysis
          if (layoutInfo.hasComplexLayout || layoutInfo.hasMultipleColumns) {
            // For complex layouts, use "auto" scale which fits the page to the viewport
            pdfViewer.currentScaleValue = "auto";

            // After a short delay, check if text is visible and adjust if needed
            setTimeout(() => {
              // If scale is too small, increase it slightly but keep content visible
              if (pdfViewer.currentScale < 0.8) {
                pdfViewer.currentScale = 0.8;
              } else if (pdfViewer.currentScale > 1.5) {
                // If scale is too large, reduce it to prevent content being cut off
                pdfViewer.currentScale = 1.5;
              }

              // Ensure the viewer scrolls to show the beginning of the document
              iframeWindow.scrollTo(0, 0);
            }, 300);
          } else if (isPortrait && isMobile) {
            // For simple portrait PDFs on mobile, use a balanced approach
            pdfViewer.currentScaleValue = "page-fit";

            setTimeout(() => {
              if (pdfViewer.currentScale < 0.8) {
                pdfViewer.currentScale = 0.8;
              }
            }, 300);
          } else if (aspectRatio > 1.5) {
            // For very wide documents, fit to page
            pdfViewer.currentScaleValue = "page-fit";
          } else {
            // For standard documents on desktop, use page-width
            pdfViewer.currentScaleValue = "page-width";

            setTimeout(() => {
              // Limit maximum scale for readability
              if (pdfViewer.currentScale > 2.0) {
                pdfViewer.currentScale = 2.0;
              }
            }, 300);
          }
        });
      } else {
        // Fallback if we can't determine orientation
        iframeWindow.PDFViewerApplication.pdfViewer.currentScaleValue = "auto";
      }

      // Apply mobile optimizations if needed
      if (window.innerWidth < 768) {
        applyMobileOptimizations(iframeWindow);
      }
    }

    /**
     * Analyzes the PDF structure to determine the best viewing mode
     * @param {Window} iframeWindow - The iframe's window object
     * @returns {Promise<Object>} - Layout information
     */
    function analyzePdfStructure(iframeWindow) {
      return new Promise((resolve) => {
        try {
          const pdfViewer = iframeWindow.PDFViewerApplication.pdfViewer;
          const pdfDocument = iframeWindow.PDFViewerApplication.pdfDocument;

          // Default layout info
          const layoutInfo = {
            hasMultipleColumns: false,
            hasComplexLayout: false,
            hasLargeImages: false,
          };

          // If we can access the document structure, analyze it
          if (pdfDocument && pdfDocument.getPage) {
            pdfDocument
              .getPage(1)
              .then((page) => {
                // Try to get text content to analyze layout
                page
                  .getTextContent()
                  .then((textContent) => {
                    const textItems = textContent.items;
                    const xPositions = new Set();

                    textItems.forEach((item) => {
                      xPositions.add(Math.round(item.transform[4] / 10) * 10);
                    });

                    // If we have many different x positions, it might be a multi-column layout
                    if (xPositions.size > 5) {
                      layoutInfo.hasMultipleColumns = true;
                    }

                    // If we have many text items, it might be a complex layout
                    if (textItems.length > 100) {
                      layoutInfo.hasComplexLayout = true;
                    }

                    resolve(layoutInfo);
                  })
                  .catch(() => {
                    // If we can't get text content, use default values
                    resolve(layoutInfo);
                  });
              })
              .catch(() => {
                resolve(layoutInfo);
              });
          } else {
            resolve(layoutInfo);
          }
        } catch (e) {
          console.error("Error analyzing PDF structure:", e);
          resolve({
            hasMultipleColumns: false,
            hasComplexLayout: false,
            hasLargeImages: false,
          });
        }
      });
    }
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
        
        /* Improve font rendering */
        .textLayer {
          opacity: 1 !important;
        }
        
        /* Ensure text is rendered with proper font smoothing */
        .textLayer span, .textLayer div {
          text-rendering: optimizeLegibility !important;
          -webkit-font-smoothing: antialiased !important;
        }
        
        /* Prevent horizontal overflow for portrait PDFs */
        .page {
          margin: 0 auto !important;
          max-width: 100% !important;
        }
        
        /* Ensure content is fully visible */
        #viewerContainer {
          overflow: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        
        /* Prevent text from being cut off */
        .textLayer span {
          white-space: normal !important;
        }
        
        /* Improve readability for portrait PDFs */
        .pdfViewer .page.portrait {
          max-width: 100% !important;
          margin: 0 auto !important;
        }
        
        /* Fix for multi-column layouts */
        .textLayer .endOfContent {
          display: block !important;
          clear: both !important;
        }
        
        /* Ensure tables and complex layouts are visible */
        .textLayer span[role="presentation"] {
          max-width: 100% !important;
          white-space: normal !important;
        }
      }
    `;
      iframeDoc.head.appendChild(mobileStyle);

      // Try to enable better font rendering in the PDF.js viewer
      if (iframeWindow.PDFViewerApplication) {
        // Set text layer mode to enable
        if (iframeWindow.PDFViewerApplication.pdfViewer) {
          iframeWindow.PDFViewerApplication.pdfViewer.textLayerMode = 1; // Enable text layer

          // Add event listener for page change to maintain proper scaling
          iframeWindow.PDFViewerApplication.eventBus.on("pagechanging", () => {
            // Check if we're on mobile and adjust scale if needed
            if (window.innerWidth < 768) {
              const pdfViewer = iframeWindow.PDFViewerApplication.pdfViewer;
              const currentPage = pdfViewer.getPageView(
                pdfViewer.currentPageNumber - 1
              );

              if (currentPage && currentPage.viewport) {
                const viewport = currentPage.viewport;
                const isPortrait = viewport.width < viewport.height;
                const aspectRatio = viewport.width / viewport.height;

                // For portrait pages, ensure content is fully visible
                if (isPortrait) {
                  // If scale is too large, reduce it to prevent content being cut off
                  if (pdfViewer.currentScale > 1.2) {
                    pdfViewer.currentScale = 1.2;
                  } else if (pdfViewer.currentScale < 0.8) {
                    // If scale is too small, increase it for readability
                    pdfViewer.currentScale = 0.8;
                  }
                }
                // For very wide pages, fit to page
                else if (aspectRatio > 1.5) {
                  pdfViewer.currentScaleValue = "page-fit";
                }
              }
            }
          });
        }

        // Force font loading
        if (iframeWindow.PDFViewerApplication.fontLoader) {
          iframeWindow.PDFViewerApplication.fontLoader.bind(
            iframeWindow.PDFViewerApplication
          );
        }
      }
    } catch (e) {
      console.error("Error applying mobile optimizations:", e);
    }
  }

  /**
   * Sets up toolbar button event listeners
   * @param {HTMLElement} toolbar - The toolbar element
   * @param {HTMLIFrameElement} iframe - The iframe element
   * @param {HTMLElement} container - The container element
   */
  function setupToolbarButtons(toolbar, iframe, container) {
    // Get buttons
    const zoomInButton = toolbar.querySelector(".zoom-in");
    const zoomOutButton = toolbar.querySelector(".zoom-out");
    const fitWidthButton = toolbar.querySelector(".fit-width");
    const fitPageButton = toolbar.querySelector(".fit-page");
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
            // Check if the PDF is portrait or landscape
            const pdfViewer = iframeWindow.PDFViewerApplication.pdfViewer;
            const currentPage = pdfViewer.getPageView(
              pdfViewer.currentPageNumber - 1
            );

            if (currentPage && currentPage.viewport) {
              const viewport = currentPage.viewport;
              const isPortrait = viewport.width < viewport.height;
              const aspectRatio = viewport.width / viewport.height;
              const isMobile = window.innerWidth < 768;

              // For very wide documents, fit to page instead of width
              if (aspectRatio > 1.5) {
                pdfViewer.currentScaleValue = "page-fit";
              } else {
                // For portrait PDFs on mobile, use a more conservative scale
                if (isPortrait && isMobile) {
                  pdfViewer.currentScaleValue = "page-width";
                  setTimeout(() => {
                    if (pdfViewer.currentScale > 1.2) {
                      pdfViewer.currentScale = 1.2;
                    }
                  }, 100);
                } else {
                  // For landscape or desktop, use page-width
                  pdfViewer.currentScaleValue = "page-width";
                }
              }
            } else {
              // Fallback to page-width
              pdfViewer.currentScaleValue = "page-width";
            }
          }
        } catch (e) {
          console.error("Error fitting to width:", e);
        }
      });
    }

    if (fitPageButton) {
      fitPageButton.addEventListener("click", () => {
        try {
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow && iframeWindow.PDFViewerApplication) {
            iframeWindow.PDFViewerApplication.pdfViewer.currentScaleValue =
              "page-fit";
          }
        } catch (e) {
          console.error("Error fitting to page:", e);
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
