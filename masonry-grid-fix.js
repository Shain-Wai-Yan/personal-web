/**
 * Masonry Grid Width Fix
 * This script fixes the issue where the masonry grid doesn't fill the entire width when filters are applied
 */

document.addEventListener("DOMContentLoaded", () => {
  // Wait for the main gallery scripts to initialize
  setTimeout(() => {
    // Apply the fix
    applyMasonryGridFix();

    // Also apply the fix whenever window is resized
    window.addEventListener("resize", debounce(applyMasonryGridFix, 200));

    // Add event listeners to filter buttons to apply fix after filtering
    document.querySelectorAll(".filter-button").forEach((button) => {
      // Use event capturing to run after the original click handler
      button.addEventListener(
        "click",
        () => {
          // Wait for the filter to be applied
          setTimeout(applyMasonryGridFix, 300);
        },
        true
      );
    });

    // Search input fix
    const searchInput = document.getElementById("photo-search");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        debounce(() => {
          setTimeout(applyMasonryGridFix, 300);
        }, 300)
      );
    }

    console.log("Masonry grid width fix applied");
  }, 500);

  // Debounce function to prevent excessive calls
  function debounce(func, wait) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // The main fix function
  function applyMasonryGridFix() {
    const grid = document.getElementById("masonry-grid");
    if (!grid) return;

    // Get the current viewport width
    const viewportWidth = window.innerWidth;

    // Determine the optimal column count based on viewport width
    let columnCount;
    if (viewportWidth >= 1200) {
      columnCount = 4;
    } else if (viewportWidth >= 768) {
      columnCount = 3;
    } else if (viewportWidth >= 480) {
      columnCount = 2;
    } else {
      columnCount = 1;
    }

    // Apply the CSS fix to ensure the grid fills the width
    grid.style.columnCount = columnCount;

    // Force a reflow to ensure the grid layout updates
    grid.style.display = "none";
    void grid.offsetHeight; // This triggers a reflow
    grid.style.display = "";

    // Add a small CSS fix for items to ensure they fill the width
    const items = grid.querySelectorAll(".masonry-item");
    items.forEach((item) => {
      item.style.width = "100%";
      item.style.breakInside = "avoid";
    });

    console.log(
      `Grid fixed with ${columnCount} columns at ${viewportWidth}px width`
    );
  }
});
