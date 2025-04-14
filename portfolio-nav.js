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

  // Update active state in portfolio categories based on current page
  const currentPath = window.location.pathname;
  const filename = currentPath.substring(currentPath.lastIndexOf("/") + 1);

  const portfolioCategories = document.querySelectorAll(".portfolio-category");
  portfolioCategories.forEach((category) => {
    const categoryHref = category.getAttribute("href");
    if (
      categoryHref === filename ||
      (categoryHref === "portfolio.html" && filename === "portfolio.html") ||
      (categoryHref === "photography.html" &&
        filename === "photography.html") ||
      (categoryHref === "amv-editing.html" && filename === "amv-editing.html")
    ) {
      category.classList.add("active");
    } else {
      category.classList.remove("active");
    }
  });
});
