/**
 * Improved IndexNow Auto-Submission Script for www.shainwaiyan.com
 * - Smarter content change detection for dynamic pages
 * - Cooldown period to prevent excessive submissions
 * - Ignores non-meaningful changes
 */

(function () {
  // Configuration
  const SUBMISSION_INTERVAL_DAYS = 20;
  const API_KEY = "25573a62d42045b487c0f9ba47fa293a";
  const STORAGE_KEY_LAST_SUBMISSION = "indexnow_last_submission";
  const STORAGE_KEY_PAGE_HASHES = "indexnow_page_hashes";
  const STORAGE_KEY_COOLDOWNS = "indexnow_cooldowns";
  const COOLDOWN_HOURS = 24; // Minimum hours between submissions for the same URL

  // Pages that should be checked less frequently or with special rules
  const DYNAMIC_PAGES = [
    {
      url: "/certificate",
      selector: ".certificate-content",
      ignoreElements: ".timestamp, .dynamic-data",
    },
    {
      url: "/amv-editing",
      selector: ".amv-content",
      ignoreElements: ".view-count, .timestamp",
    },
    {
      url: "/marketing-plan",
      selector: ".marketing-content",
      ignoreElements: ".timestamp, .dynamic-data",
    },
    {
      url: "/business-plan",
      selector: ".business-content",
      ignoreElements: ".timestamp, .dynamic-data",
    },
    {
      url: "/photography",
      selector: ".photography-content",
      ignoreElements: ".timestamp, .view-count",
    },
    {
      url: "/coding-project",
      selector: ".project-content",
      ignoreElements: ".github-stats, .last-commit, .timestamp",
    },
    { url: "/contact", selector: "none", ignoreElements: "all" }, // Skip contact page completely
    // Chinese versions
    {
      url: "/zh/certificate",
      selector: ".certificate-content",
      ignoreElements: ".timestamp, .dynamic-data",
    },
    {
      url: "/zh/amv-editing",
      selector: ".amv-content",
      ignoreElements: ".view-count, .timestamp",
    },
    {
      url: "/zh/marketing-plan",
      selector: ".marketing-content",
      ignoreElements: ".timestamp, .dynamic-data",
    },
    {
      url: "/zh/business-plan",
      selector: ".business-content",
      ignoreElements: ".timestamp, .dynamic-data",
    },
    {
      url: "/zh/photography",
      selector: ".photography-content",
      ignoreElements: ".timestamp, .view-count",
    },
    {
      url: "/zh/coding-project",
      selector: ".project-content",
      ignoreElements: ".github-stats, .last-commit, .timestamp",
    },
    { url: "/zh/contact", selector: "none", ignoreElements: "all" }, // Skip contact page completely
  ];

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

  // Check if a URL is in the dynamic pages list
  function getDynamicPageConfig(url) {
    const path = new URL(url).pathname;
    return DYNAMIC_PAGES.find((page) => path.includes(page.url));
  }

  // Function to generate a smart hash of the page content
  function generatePageContentHash() {
    const currentUrl = window.location.href;
    const dynamicConfig = getDynamicPageConfig(currentUrl);

    // If this is a dynamic page with special handling
    if (dynamicConfig) {
      // For pages we want to completely skip
      if (dynamicConfig.selector === "none") {
        console.log("Skipping content hash for excluded page:", currentUrl);
        return "SKIP_" + Date.now(); // Always different hash to skip submission
      }

      // For pages with specific content areas to focus on
      let contentToHash = "";
      const contentElements = document.querySelectorAll(dynamicConfig.selector);

      if (contentElements.length > 0) {
        // Create a temporary div to manipulate content
        const tempDiv = document.createElement("div");

        contentElements.forEach((element) => {
          // Clone the element to avoid modifying the actual page
          const clone = element.cloneNode(true);
          tempDiv.appendChild(clone);
        });

        // Remove elements that should be ignored
        if (dynamicConfig.ignoreElements !== "all") {
          const ignoreElements = tempDiv.querySelectorAll(
            dynamicConfig.ignoreElements
          );
          ignoreElements.forEach((el) => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
        }

        contentToHash = tempDiv.innerText || tempDiv.textContent;
      } else {
        // Fallback if selector not found
        contentToHash =
          document.title +
          " " +
          document.querySelector("meta[name='description']")?.content;
      }

      // Create a hash from the filtered content
      let hash = 0;
      for (let i = 0; i < contentToHash.length; i++) {
        const char = contentToHash.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }

      return hash.toString();
    } else {
      // Standard hash generation for non-dynamic pages
      const contentElements = document.querySelectorAll(
        "main, article, .content, #content, .main-content"
      );

      let contentToHash = "";

      if (contentElements.length > 0) {
        contentElements.forEach((element) => {
          contentToHash += element.innerText || element.textContent;
        });
      } else {
        const bodyText = document.body.innerText || document.body.textContent;
        contentToHash = bodyText;
      }

      let hash = 0;
      for (let i = 0; i < contentToHash.length; i++) {
        const char = contentToHash.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }

      return hash.toString();
    }
  }

  // Check if a URL is in cooldown period
  function isInCooldown(url) {
    try {
      const cooldowns = JSON.parse(
        localStorage.getItem(STORAGE_KEY_COOLDOWNS) || "{}"
      );
      const lastSubmission = cooldowns[url];

      if (!lastSubmission) return false;

      const hoursSinceLastSubmission =
        (Date.now() - lastSubmission) / (1000 * 60 * 60);
      return hoursSinceLastSubmission < COOLDOWN_HOURS;
    } catch (e) {
      console.error("Error checking cooldown:", e);
      return false;
    }
  }

  // Update cooldown timestamp for a URL
  function updateCooldown(url) {
    try {
      const cooldowns = JSON.parse(
        localStorage.getItem(STORAGE_KEY_COOLDOWNS) || "{}"
      );
      cooldowns[url] = Date.now();
      localStorage.setItem(STORAGE_KEY_COOLDOWNS, JSON.stringify(cooldowns));
    } catch (e) {
      console.error("Error updating cooldown:", e);
    }
  }

  // Function to check if the page content has changed
  function hasPageContentChanged() {
    const currentUrl = window.location.href;

    // Check if URL is in cooldown period
    if (isInCooldown(currentUrl)) {
      console.log("URL is in cooldown period, skipping check:", currentUrl);
      return false;
    }

    const currentHash = generatePageContentHash();

    // If this is a skipped page
    if (currentHash.startsWith("SKIP_")) {
      console.log("Skipping change detection for excluded page:", currentUrl);
      return false;
    }

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
    const lastSubmission = localStorage.getItem(STORAGE_KEY_LAST_SUBMISSION);

    if (!lastSubmission) {
      console.log(
        "No previous IndexNow submission found. Submitting all URLs..."
      );
      return true;
    }

    const lastSubmissionDate = new Date(parseInt(lastSubmission));
    const currentDate = new Date();
    const daysSinceLastSubmission = Math.floor(
      (currentDate - lastSubmissionDate) / (1000 * 60 * 60 * 24)
    );

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

  // Function to submit a URL using the image ping method (avoids CORS)
  function submitUrlWithImagePing(url) {
    console.log("Submitting to IndexNow via image ping:", url);

    // Update cooldown for this URL
    updateCooldown(url);

    // Create a hidden image element to make the request
    const img = new Image();
    img.style.display = "none";

    // Set up success/error handlers
    img.onload = function () {
      console.log("Successfully pinged IndexNow for:", url);
      document.body.removeChild(img);
    };

    img.onerror = function () {
      console.log("Ping to IndexNow completed for:", url);
      document.body.removeChild(img);
    };

    // Set the source to the IndexNow API URL
    img.src = `https://api.indexnow.org/indexnow?url=${encodeURIComponent(
      url
    )}&key=${API_KEY}`;

    // Add to document to initiate the request
    document.body.appendChild(img);
  }

  // Function to submit all URLs to IndexNow using image ping method
  function submitAllUrlsToIndexNow() {
    console.log("Submitting all URLs to IndexNow...");

    // Update the last submission timestamp
    localStorage.setItem(STORAGE_KEY_LAST_SUBMISSION, Date.now().toString());

    // Filter out URLs that are in cooldown
    const urlsToSubmit = ALL_URLS.filter((url) => !isInCooldown(url));

    console.log(
      `Submitting ${urlsToSubmit.length} URLs (${
        ALL_URLS.length - urlsToSubmit.length
      } in cooldown)`
    );

    // For bulk submission, we'll submit URLs one by one with a slight delay
    urlsToSubmit.forEach((url, index) => {
      setTimeout(() => {
        submitUrlWithImagePing(url);
      }, index * 300); // 300ms delay between submissions to avoid overwhelming
    });

    console.log("Started submission of URLs to IndexNow.");
  }

  // Function to submit a single URL (current page)
  function submitCurrentPageToIndexNow() {
    const currentUrl = window.location.href;

    // Skip if in cooldown
    if (isInCooldown(currentUrl)) {
      console.log(
        "URL is in cooldown period, skipping submission:",
        currentUrl
      );
      return;
    }

    console.log("Submitting updated page to IndexNow:", currentUrl);
    submitUrlWithImagePing(currentUrl);
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
