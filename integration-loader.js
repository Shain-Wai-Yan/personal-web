/**
 * Integration Loader
 * This file ensures proper loading order of the PDF viewer and Cloudinary solution
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("Integration loader initialized");
  
    // Function to check if a script is already loaded
    function isScriptLoaded(src) {
      return document.querySelector(`script[src="${src}"]`) !== null;
    }
  
    // Function to load scripts in sequence
    function loadScriptsSequentially(scripts, callback) {
      let index = 0;
  
      function loadNext() {
        if (index < scripts.length) {
          const scriptSrc = scripts[index];
  
          // Skip if script is already loaded
          if (isScriptLoaded(scriptSrc)) {
            console.log(`Script already loaded: ${scriptSrc}`);
            index++;
            loadNext();
            return;
          }
  
          const script = document.createElement("script");
          script.src = scriptSrc;
          script.onload = () => {
            console.log(`Loaded script: ${scriptSrc}`);
            index++;
            loadNext();
          };
          script.onerror = () => {
            console.error(`Failed to load script: ${scriptSrc}`);
            index++;
            loadNext();
          };
          document.head.appendChild(script);
        } else if (callback) {
          callback();
        }
      }
  
      loadNext();
    }
  
    // Load scripts in the correct order
    loadScriptsSequentially(
      [
        // First load PDF.js if not already loaded
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js",
        // Then load our scripts in the correct order
        "cloudinary-pdf-solution.js",
        "document-viewer.js",
        "strapi-integration.js",
      ],
      () => {
        console.log("All scripts loaded successfully");
  
        // Set PDF.js worker path
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        }
  
        // Initialize the page if not already done
        if (typeof window.initPage === "function") {
          window.initPage();
        }
      }
    );
  });
  