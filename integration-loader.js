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

  // First, load PDF.js directly with a script tag to ensure it's available
  if (!window.pdfjsLib) {
    console.log("Loading PDF.js directly...");
    const pdfScript = document.createElement("script");
    pdfScript.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    pdfScript.onload = function () {
      console.log("PDF.js loaded successfully");

      // Set PDF.js worker path immediately after loading
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

      // Then load the rest of the scripts
      loadRemainingScripts();
    };
    pdfScript.onerror = function () {
      console.error("Failed to load PDF.js");
      // Continue loading other scripts even if PDF.js fails
      loadRemainingScripts();
    };
    document.head.appendChild(pdfScript);
  } else {
    // PDF.js is already loaded, just set the worker path
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

    // Load the remaining scripts
    loadRemainingScripts();
  }

  function loadRemainingScripts() {
    // Load the rest of the scripts in the correct order
    loadScriptsSequentially(
      [
        "cloudinary-pdf-solution.js",
        "document-viewer.js",
        // Load our integration files based on the current page
        ...(window.location.pathname.includes("/marketing-plan")
          ? ["marketing-plan-integration.js"]
          : []),
        ...(window.location.pathname.includes("/business-plan")
          ? ["business-plan-integration.js"]
          : []),
      ],
      () => {
        console.log("All scripts loaded successfully");

        // Verify PDF.js is loaded
        if (window.pdfjsLib) {
          console.log("PDF.js is available for use");
        } else {
          console.error(
            "PDF.js library not loaded properly. Please check your network connection."
          );
        }
      }
    );
  }
});
