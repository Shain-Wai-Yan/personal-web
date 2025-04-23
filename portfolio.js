/**
 * Portfolio page specific JavaScript
 * This file ensures the hamburger menu works correctly on the portfolio page
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("Portfolio page script loaded");

  // Ensure hamburger menu is properly initialized for the portfolio page
  initPortfolioHamburgerMenu();

  // Initialize portfolio item interactions
  initPortfolioItems();
});

// Special hamburger menu initialization for portfolio page
function initPortfolioHamburgerMenu() {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector(".nav");

  if (!hamburger || !nav) {
    console.error("Hamburger menu elements not found on portfolio page");
    return;
  }

  console.log("Portfolio hamburger menu initialized");

  // Force the hamburger to be visible on mobile
  if (window.innerWidth <= 768) {
    hamburger.style.display = "flex";
  }

  // Remove any existing click event listeners
  const newHamburger = hamburger.cloneNode(true);
  hamburger.parentNode.replaceChild(newHamburger, hamburger);

  // Add click event listener
  newHamburger.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    console.log("Portfolio hamburger clicked");
    this.classList.toggle("active");
    nav.classList.toggle("active");
    document.body.classList.toggle("menu-open");

    // Log the state after toggle
    console.log("Portfolio menu state:", {
      hamburgerActive: this.classList.contains("active"),
      navActive: nav.classList.contains("active"),
      bodyMenuOpen: document.body.classList.contains("menu-open"),
    });
  });

  // Ensure the menu closes when clicking outside
  document.addEventListener("click", (e) => {
    if (
      nav.classList.contains("active") &&
      !nav.contains(e.target) &&
      !newHamburger.contains(e.target)
    ) {
      console.log("Clicking outside portfolio menu, closing");
      newHamburger.classList.remove("active");
      nav.classList.remove("active");
      document.body.classList.remove("menu-open");
    }
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    if (window.innerWidth <= 768) {
      newHamburger.style.display = "flex";
    } else {
      // Reset menu state on desktop
      newHamburger.classList.remove("active");
      nav.classList.remove("active");
      document.body.classList.remove("menu-open");
    }
  });
}

// Enhanced portfolio item interactions
function initPortfolioItems() {
  const portfolioItems = document.querySelectorAll(".portfolio-item");

  portfolioItems.forEach((item) => {
    // Make sure the entire item is clickable
    item.style.cursor = "pointer";

    // Get the onclick attribute if it exists
    const onclickAttr = item.getAttribute("onclick");

    if (onclickAttr) {
      // Extract the URL from the onclick attribute
      const urlMatch = onclickAttr.match(/window\.location\.href='([^']+)'/);

      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];

        // Remove the original onclick attribute to prevent conflicts
        item.removeAttribute("onclick");

        // Add a direct click handler that will navigate to the URL
        item.addEventListener("click", () => {
          window.location.href = url;
        });

        // Add data attribute for debugging
        item.setAttribute("data-href", url);
      }
    }

    // Add hover effects
    item.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-15px)";
      this.style.boxShadow = "0 15px 35px rgba(0, 0, 0, 0.2)";

      // Change text color to gold for better visibility
      const h2 = this.querySelector("h2");
      const p = this.querySelector("p");
      if (h2) h2.style.color = "#ffd700"; // Gold
      if (p) p.style.color = "#ffd700"; // Gold
    });

    item.addEventListener("mouseleave", function () {
      this.style.transform = "";
      this.style.boxShadow = "";

      // Reset text color
      const h2 = this.querySelector("h2");
      const p = this.querySelector("p");
      if (h2) h2.style.color = "";
      if (p) p.style.color = "";
    });
  });
}
