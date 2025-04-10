/**
 * Cloudinary PDF Solution
 * This file provides solutions for accessing protected Cloudinary PDFs
 */

// Solution options for accessing protected Cloudinary PDFs
// Use window to avoid redeclaration errors if loaded multiple times
if (!window.SOLUTION_OPTIONS) {
    window.SOLUTION_OPTIONS = {
      // Option 1: Use a proxy through your own server
      USE_PROXY: false,
      // Option 2: Use Cloudinary transformation to make PDFs accessible
      USE_CLOUDINARY_TRANSFORMATION: true,
      // Option 3: Use signed URLs (requires Cloudinary API secret)
      USE_SIGNED_URLS: false,
    };
  }
  
  /**
   * Transforms a Cloudinary PDF URL to make it accessible
   * @param {string} url - Original Cloudinary URL
   * @returns {string} - Transformed URL that should be accessible
   */
  function transformCloudinaryPdfUrl(url) {
    if (!url || !url.includes("cloudinary.com")) {
      console.log("Not a Cloudinary URL, returning as is:", url);
      return url; // Not a Cloudinary URL, return as is
    }
  
    console.log("Original Cloudinary URL:", url);
    console.log("SOLUTION_OPTIONS:", window.SOLUTION_OPTIONS);
  
    // Option 1: Add fl_attachment transformation to force download instead of preview
    // This often bypasses the authentication requirement for viewing
    if (window.SOLUTION_OPTIONS.USE_CLOUDINARY_TRANSFORMATION) {
      // Parse the URL to insert transformation
      const urlParts = url.split("/upload/");
      console.log("URL parts:", urlParts);
  
      if (urlParts.length === 2) {
        const transformedUrl = `${urlParts[0]}/upload/fl_attachment/${urlParts[1]}`;
        console.log("Transformed URL with fl_attachment:", transformedUrl);
        return transformedUrl;
      } else {
        console.log("URL format not as expected, couldn't transform");
      }
    }
  
    // Option 2: Use a proxy through your own server
    // This requires setting up a proxy endpoint on your server
    if (window.SOLUTION_OPTIONS.USE_PROXY) {
      const encodedUrl = encodeURIComponent(url);
      const proxyUrl = `/api/proxy-pdf?url=${encodedUrl}`;
      console.log("Proxy URL:", proxyUrl);
      return proxyUrl;
    }
  
    // Return original URL if no transformations applied
    return url;
  }
  
  /**
   * Checks if a URL is a Cloudinary PDF
   * @param {string} url - URL to check
   * @returns {boolean} - True if the URL is a Cloudinary PDF
   */
  function isCloudinaryPdf(url) {
    return (
      url && url.includes("cloudinary.com") && url.toLowerCase().endsWith(".pdf")
    );
  }
  
  /**
   * Opens a document in the viewer with proper URL transformation
   * @param {string} fileUrl - Original file URL
   * @param {string} title - Document title
   */
  function openDocumentWithTransform(fileUrl, title) {
    // Transform the URL if it's a Cloudinary PDF
    const transformedUrl = transformCloudinaryPdfUrl(fileUrl);
    console.log("Opening document with transformed URL:", transformedUrl);
  
    // Call the original openDocument function with the transformed URL
    if (typeof window.openDocument === "function") {
      console.log("Calling window.openDocument with transformed URL");
      window.openDocument(transformedUrl, title);
    } else {
      console.error(
        "openDocument function not found, opening in new tab instead"
      );
      // Fallback to opening in a new tab
      window.open(transformedUrl, "_blank");
    }
  }
  
  /**
   * Creates a simple PDF viewer that works with protected PDFs
   * @param {string} containerId - ID of the container element
   * @param {string} fileUrl - URL of the PDF file
   */
  function createSimplePdfViewer(containerId, fileUrl) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error("Container not found:", containerId);
      return;
    }
  
    // Transform the URL
    const transformedUrl = transformCloudinaryPdfUrl(fileUrl);
  
    // Create an iframe to display the PDF
    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "600px";
    iframe.style.border = "none";
  
    // For Cloudinary PDFs, use the download approach
    if (transformedUrl.includes("fl_attachment")) {
      // Create a download button instead
      container.innerHTML = `
         <div style="text-align: center; padding: 20px;">
           <p>This PDF requires download to view.</p>
           <a href="${transformedUrl}" class="download-btn" target="_blank" 
              style="display: inline-block; background-color: #191970; color: white; 
                     text-decoration: none; padding: 10px 20px; border-radius: 4px;">
             Download PDF
           </a>
         </div>
       `;
    } else {
      // Try to embed the PDF
      iframe.src = transformedUrl;
      container.innerHTML = "";
      container.appendChild(iframe);
    }
  }
  
  // Export functions for use in other files
  // Only set if not already defined
  if (!window.pdfUtils) {
    window.pdfUtils = {
      transformCloudinaryPdfUrl,
      openDocumentWithTransform,
      createSimplePdfViewer,
      isCloudinaryPdf,
      SOLUTION_OPTIONS: window.SOLUTION_OPTIONS,
    };
  }
  
  // Initialize - make sure this runs after document-viewer.js is loaded
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Cloudinary PDF Solution initialized");
  });
  