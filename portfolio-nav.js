document.addEventListener("DOMContentLoaded", () => {
  // Mobile dropdown toggle
  const dropdowns = document.querySelectorAll(".nav-dropdown");

  // For mobile navigation
  dropdowns.forEach((dropdown) => {
    // Get the main link in the dropdown
    const mainLink = dropdown.querySelector("a");

    // Only on mobile view
    if (window.innerWidth <= 768) {
      // Prevent the main link from navigating on mobile
      mainLink.addEventListener("click", (e) => {
        // Only prevent default if we're in mobile view
        if (window.innerWidth <= 768) {
          e.preventDefault();
          dropdown.classList.toggle("active");
        }
      });
    }
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      // Remove active class from all dropdowns when switching to desktop
      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("active");
      });
    }
  });

  // Add IDs to portfolio items if they don't exist
  const portfolioItems = document.querySelectorAll(".portfolio-item");
  portfolioItems.forEach((item, index) => {
    if (!item.id) {
      const heading = item.querySelector("h2");
      if (heading) {
        const id = heading.textContent.toLowerCase().replace(/\s+/g, "-");
        item.id = id;
      } else {
        item.id = `portfolio-item-${index}`;
      }
    }
  });

  // IMPROVED: Detect current page with Cloudflare compatibility
  function getCurrentPageIdentifier() {
    const path = window.location.pathname;
    console.log("Original path:", path);

    // Define all portfolio page identifiers (both with and without extensions)
    const portfolioPages = {
      "business-plan": [
        "business-plan",
        "business-plan.html",
        "business-plan/",
      ],
      "marketing-plan": [
        "marketing-plan",
        "marketing-plan.html",
        "marketing-plan/",
      ],
      "coding-project": [
        "coding-project",
        "coding-project.html",
        "coding-project/",
      ],
      photography: ["photography", "photography.html", "photography/"],
      "amv-editing": ["amv-editing", "amv-editing.html", "amv-editing/"],
    };

    // Extract the last part of the path
    let pathSegment = "";

    if (path === "/" || path === "/index.html" || path === "/index") {
      return "index";
    }

    // Remove trailing slash if present
    const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path;

    // Get the last segment of the path
    const segments = normalizedPath.split("/").filter(Boolean);
    pathSegment = segments.length > 0 ? segments[segments.length - 1] : "";

    console.log("Path segment extracted:", pathSegment);

    // If the segment has an extension, remove it
    if (pathSegment.includes(".")) {
      pathSegment = pathSegment.substring(0, pathSegment.lastIndexOf("."));
    }

    // Check if this segment matches any of our portfolio pages
    for (const [pageId, variations] of Object.entries(portfolioPages)) {
      if (
        variations.some((v) => {
          const variation = v.endsWith("/") ? v.slice(0, -1) : v;
          return (
            variation.includes(pathSegment) ||
            pathSegment.includes(variation.replace(".html", ""))
          );
        })
      ) {
        console.log("Matched portfolio page:", pageId);
        return pageId;
      }
    }

    // If we're here, we didn't match any specific portfolio page
    console.log("No specific portfolio page matched, returning:", pathSegment);
    return pathSegment;
  }

  const currentPageId = getCurrentPageIdentifier();
  console.log("Current page identifier:", currentPageId);

  // Update active state in portfolio categories
  const portfolioCategories = document.querySelectorAll(".portfolio-category");
  portfolioCategories.forEach((category) => {
    const categoryHref = category.getAttribute("href");
    const categoryId = categoryHref
      .substring(categoryHref.lastIndexOf("/") + 1)
      .replace(".html", "");

    console.log(
      "Checking category:",
      categoryId,
      "against current:",
      currentPageId
    );

    if (categoryId === currentPageId) {
      category.classList.add("active");
      console.log("Set active for category:", categoryId);
    } else {
      category.classList.remove("active");
    }
  });

  // Update active state in dropdown navigation items
  const dropdownItems = document.querySelectorAll(".nav-dropdown-content a");
  dropdownItems.forEach((item) => {
    const itemHref = item.getAttribute("href");
    const itemId = itemHref
      .substring(itemHref.lastIndexOf("/") + 1)
      .replace(".html", "");

    console.log(
      "Checking dropdown item:",
      itemId,
      "against current:",
      currentPageId
    );

    if (itemId === currentPageId) {
      item.classList.add("active");
      console.log("Set active for dropdown item:", itemId);

      // Also set the parent dropdown link as active
      const parentDropdown = item.closest(".nav-dropdown");
      if (parentDropdown) {
        const parentLink = parentDropdown.querySelector("a");
        if (parentLink) {
          parentLink.classList.add("active");
          console.log("Set active for parent dropdown");
        }
      }
    } else {
      item.classList.remove("active");
    }
  });

  // Special case for portfolio main page
  if (currentPageId === "portfolio") {
    const portfolioNavLink = document.querySelector(
      '.nav a[href="portfolio.html"]'
    );
    if (portfolioNavLink) {
      portfolioNavLink.classList.add("active");
      console.log("Set active for main portfolio link");
    }
  }
});
