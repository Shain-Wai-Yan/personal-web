/**
 * Certificate Swipe Hint
 * Adds a temporary swipe hint overlay for mobile users
 */

document.addEventListener("DOMContentLoaded", () => {
  // Only show swipe hint on mobile devices
  if (window.innerWidth <= 768 && document.querySelector(".carousel")) {
    // Create swipe hint element
    const swipeHint = document.createElement("div");
    swipeHint.className = "swipe-hint";
    swipeHint.innerHTML = `
          <div class="swipe-hint-text">
            <span class="swipe-arrow swipe-arrow-left">←</span>
            <span>Swipe to navigate</span>
            <span class="swipe-arrow swipe-arrow-right">→</span>
          </div>
        `;

    // Add to body
    document.body.appendChild(swipeHint);

    // Remove after animation completes (5 seconds)
    setTimeout(() => {
      if (swipeHint && swipeHint.parentNode) {
        swipeHint.parentNode.removeChild(swipeHint);
      }
    }, 5000);

    // Store in session storage that we've shown the hint
    // This prevents showing it again in the same session
    sessionStorage.setItem("swipeHintShown", "true");
  }
});

// Add event listener to detect actual swipes and remove hint early
document.addEventListener(
  "touchmove",
  () => {
    const swipeHint = document.querySelector(".swipe-hint");
    if (swipeHint) {
      swipeHint.style.opacity = "0";
      setTimeout(() => {
        if (swipeHint && swipeHint.parentNode) {
          swipeHint.parentNode.removeChild(swipeHint);
        }
      }, 300);
    }
  },
  { passive: true }
);
