/**
 * IndexNow Auto-Submission Script for www.shainwaiyan.com
 * Features:
 * - Submits all URLs every 20 days
 * - Detects page content changes and submits updated pages immediately
 * - Runs on first load if no previous submission exists
 */

(function () {
  // Configuration
  const SUBMISSION_INTERVAL_DAYS = 20;
  const API_KEY = "25573a62d42045b487c0f9ba47fa293a";
  const STORAGE_KEY_LAST_SUBMISSION = "indexnow_last_submission";
  const STORAGE_KEY_PAGE_HASHES = "indexnow_page_hashes";

  // All website URLs to submit
  const ALL_URLS = [
    // English URLs
    "https://www.shainwaiyan.com/",
    "https://www.shainwaiyan.com/about.html",
    "https://www.shainwaiyan.com/photography.html",
    "https://www.shainwaiyan.com/amv-editing.html",
    "https://www.shainwaiyan.com/marketing-plan.html",
    "https://www.shainwaiyan.com/business-plan.html",
    "https://www.shainwaiyan.com/coding-project.html",
    "https://www.shainwaiyan.com/contact.html",
    "https://www.shainwaiyan.com/portfolio.html",
    "https://www.shainwaiyan.com/certificate.html",

    // Chinese URLs
    "https://www.shainwaiyan.com/zh/",
    "https://www.shainwaiyan.com/zh/about.html",
    "https://www.shainwaiyan.com/zh/photography.html",
    "https://www.shainwaiyan.com/zh/amv-editing.html",
    "https://www.shainwaiyan.com/zh/marketing-plan.html",
    "https://www.shainwaiyan.com/zh/business-plan.html",
    "https://www.shainwaiyan.com/zh/coding-project.html",
    "https://www.shainwaiyan.com/zh/contact.html",
    "https://www.shainwaiyan.com/zh/portfolio.html",
    "https://www.shainwaiyan.com/zh/certificate.html",
  ];

  // Function to generate a simple hash of the page content
  function generatePageContentHash() {
    // Get the main content of the page (excluding scripts, as they might have dynamic content)
    // This targets the main content areas that would typically change during updates
    const contentElements = document.querySelectorAll(
      "main, article, .content, #content, .main-content"
    );

    let contentToHash = "";

    if (contentElements.length > 0) {
      // Use identified content areas
      contentElements.forEach((element) => {
        contentToHash += element.innerText || element.textContent;
      });
    } else {
      // Fallback: use the body content but exclude scripts
      const bodyText = document.body.innerText || document.body.textContent;
      contentToHash = bodyText;
    }

    // Create a simple hash
    let hash = 0;
    for (let i = 0; i < contentToHash.length; i++) {
      const char = contentToHash.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return hash.toString();
  }

  // Function to check if the page content has changed
  function hasPageContentChanged() {
    const currentUrl = window.location.href;
    const currentHash = generatePageContentHash();

    // Get stored hashes
    let storedHashes = {};
    try {
      const storedHashesJson = localStorage.getItem(STORAGE_KEY_PAGE_HASHES);
      if (storedHashesJson) {
        storedHashes = JSON.parse(storedHashesJson);
      }
    } catch (e) {
      console.error("Error parsing stored page hashes:", e);
      storedHashes = {};
    }

    // Check if the hash has changed
    const hasChanged = storedHashes[currentUrl] !== currentHash;

    // Update the stored hash
    storedHashes[currentUrl] = currentHash;
    localStorage.setItem(STORAGE_KEY_PAGE_HASHES, JSON.stringify(storedHashes));

    return hasChanged;
  }

  // Function to check if full submission is needed
  function shouldSubmitAllUrls() {
    // Get the last submission timestamp from localStorage
    const lastSubmission = localStorage.getItem(STORAGE_KEY_LAST_SUBMISSION);

    // If no previous submission, we should submit
    if (!lastSubmission) {
      console.log(
        "No previous IndexNow submission found. Submitting all URLs..."
      );
      return true;
    }

    // Calculate time difference
    const lastSubmissionDate = new Date(parseInt(lastSubmission));
    const currentDate = new Date();
    const daysSinceLastSubmission = Math.floor(
      (currentDate - lastSubmissionDate) / (1000 * 60 * 60 * 24)
    );

    // Check if enough days have passed
    if (daysSinceLastSubmission >= SUBMISSION_INTERVAL_DAYS) {
      console.log(
        `${daysSinceLastSubmission} days since last IndexNow submission. Submitting all URLs...`
      );
      return true;
    }

    console.log(
      `Last IndexNow submission was ${daysSinceLastSubmission} days ago. Next full submission in ${
        SUBMISSION_INTERVAL_DAYS - daysSinceLastSubmission
      } days.`
    );
    return false;
  }

  // Function to submit all URLs to IndexNow
  function submitAllUrlsToIndexNow() {
    fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        host: "www.shainwaiyan.com",
        key: API_KEY,
        urlList: ALL_URLS,
      }),
    })
      .then((response) => {
        if (response.ok) {
          // Update the last submission timestamp
          localStorage.setItem(
            STORAGE_KEY_LAST_SUBMISSION,
            Date.now().toString()
          );
          console.log("Success! All URLs submitted to IndexNow.");
          return response.text();
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      })
      .then((data) => {
        console.log("IndexNow response:", data);
      })
      .catch((error) => {
        console.error("IndexNow submission failed:", error);
      });
  }

  // Function to submit a single URL (current page)
  function submitCurrentPageToIndexNow() {
    const currentUrl = window.location.href;

    console.log("Submitting updated page to IndexNow:", currentUrl);

    fetch(
      `https://api.indexnow.org/indexnow?url=${encodeURIComponent(
        currentUrl
      )}&key=${API_KEY}`,
      {
        method: "GET",
      }
    )
      .then((response) => {
        if (response.ok) {
          console.log(
            "Successfully submitted updated page to IndexNow:",
            currentUrl
          );
        } else {
          console.error(
            "Failed to submit updated page to IndexNow:",
            response.status
          );
        }
      })
      .catch((error) => {
        console.error("Error submitting updated page to IndexNow:", error);
      });
  }

  // Main function to run when the script loads
  function initialize() {
    // First, check if we should submit all URLs (20-day schedule)
    if (shouldSubmitAllUrls()) {
      submitAllUrlsToIndexNow();
    } else {
      // If not submitting all URLs, check if this specific page has changed
      if (hasPageContentChanged()) {
        console.log(
          "Page content has changed. Submitting this page to IndexNow..."
        );
        submitCurrentPageToIndexNow();
      } else {
        console.log("No changes detected on this page. No submission needed.");
      }
    }
  }

  // Run the script when the page is fully loaded
  if (document.readyState === "complete") {
    initialize();
  } else {
    window.addEventListener("load", initialize);
  }
})();
