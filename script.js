document.addEventListener("DOMContentLoaded", () => {
  // Smooth scroll for nav links, CTA buttons, bottom links
  document
    .querySelectorAll(".nav a, .cta-btn, .link-bottom")
    .forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        if (this.hash !== "") {
          e.preventDefault();
          const target = document.querySelector(this.hash);
          if (target) {
            target.scrollIntoView({ behavior: "smooth" });
          }
          // Close menu on mobile after clicking a link
          document.querySelector(".nav").classList.remove("active");
          document.querySelector(".hamburger").classList.remove("active");
          document.body.classList.remove("menu-open");
        }
      });
    });

  // Hover effect on CTA and bottom links
  document.querySelectorAll(".cta-btn, .link-bottom").forEach((button) => {
    button.addEventListener("mousemove", function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.style.setProperty("--x", `${x}px`);
      this.style.setProperty("--y", `${y}px`);
    });
  });

  // Portfolio hover effect
  document.querySelectorAll(".portfolio-item").forEach((item) => {
    item.addEventListener("mouseenter", () => {
      item.style.transform = "translateY(-5px) scale(1.05)";
    });
    item.addEventListener("mouseleave", () => {
      item.style.transform = "translateY(0) scale(1)";
    });
  });

  // Contact form
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(contactForm);
      console.log("Form Submission:", Object.fromEntries(formData));
      alert("Thank you for your message! I will get back to you soon.");
      contactForm.reset();
    });
  }

  // Off-canvas Hamburger Menu
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav");
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
      document.body.classList.toggle("menu-open");
    });
  }

  // Highlight active section
  const menuItems = {
    home: document.getElementById("home-link"),
    about: document.getElementById("about-link"),
    portfolio: document.getElementById("portfolio-link"),
    certificates: document.getElementById("certificates-link"),
  };

  const path = window.location.pathname;
  Object.values(menuItems).forEach((link) => {
    if (link) link.style.backgroundColor = "#191970";
  });

  if (path.includes("portfolio")) {
    menuItems.portfolio.style.backgroundColor = "gold";
  } else if (path.includes("certificates")) {
    menuItems.certificates.style.backgroundColor = "gold";
  } else if (path.includes("about")) {
    menuItems.about.style.backgroundColor = "gold";
  } else {
    menuItems.home.style.backgroundColor = "gold";
  }

  // Function to ensure menu-open class is removed in desktop view
  function checkViewportAndCleanup() {
    if (
      window.innerWidth > 768 &&
      document.body.classList.contains("menu-open")
    ) {
      document.body.classList.remove("menu-open");

      // Also ensure hamburger and nav are reset
      const hamburger = document.querySelector(".hamburger");
      const nav = document.querySelector(".nav");

      if (hamburger) hamburger.classList.remove("active");
      if (nav) nav.classList.remove("active");
    }
  }

  // Run on page load
  checkViewportAndCleanup();

  // Also run when window is resized
  window.addEventListener("resize", checkViewportAndCleanup);

  // Certificate carousel functionality
  if (document.getElementById("certificates-container")) {
    fetchCertificates();
  }
});

// Fixed fetchCertificates function for your specific Strapi structure
async function fetchCertificates() {
  const API_URL =
    "https://personal-cms-production.up.railway.app/api/certificates?populate=*";
  const container = document.getElementById("certificates-container");

  if (!container) return;

  try {
    console.log("Fetching certificates from:", API_URL);

    // Show loading state
    container.innerHTML = `
      <li class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading certificates...</p>
      </li>
    `;

    // Fetch with no-cache to avoid stale data
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log("API Response received");

    // Validate data structure
    if (!result || !result.data) {
      throw new Error("Invalid API response structure");
    }

    // Check if we have certificates
    if (!Array.isArray(result.data) || result.data.length === 0) {
      container.innerHTML = `
        <li class="error">
          <p>⚠️ No certificates found in the CMS.</p>
          <small>Please add certificates to your Strapi instance.</small>
          <button onclick="fetchCertificates()" class="retry-btn">Retry</button>
        </li>
      `;
      return;
    }

    console.log(`Found ${result.data.length} certificates`);

    // Clear loading state
    container.innerHTML = "";

    // Process each certificate
    result.data.forEach((cert, index) => {
      console.log(`Processing certificate ${index + 1}: ${cert.Title}`);

      // Extract image URL - Cloudinary specific structure
      let imageUrl = null;

      // Try to get the image URL using different possible paths
      if (cert.Image) {
        // Direct URL (your API shows this structure)
        if (cert.Image.url) {
          imageUrl = cert.Image.url;
          console.log(`Using direct URL: ${imageUrl}`);
        }
        // Try medium format
        else if (cert.Image.formats && cert.Image.formats.medium) {
          imageUrl = cert.Image.formats.medium.url;
          console.log(`Using medium format: ${imageUrl}`);
        }
        // Try other formats
        else if (cert.Image.formats) {
          const formats = ["large", "small", "thumbnail"];
          for (const format of formats) {
            if (cert.Image.formats[format]) {
              imageUrl = cert.Image.formats[format].url;
              console.log(`Using ${format} format: ${imageUrl}`);
              break;
            }
          }
        }
      }

      // Final fallback
      if (!imageUrl) {
        imageUrl = "/placeholder.svg?height=300&width=500";
        console.log("No image URL found, using placeholder");
      }

      // Create the certificate slide
      const slide = document.createElement("li");
      slide.className = "carousel-slide";

      // Format the date
      const certDate = cert.Date
        ? new Date(cert.Date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "No date provided";

      // Set the slide HTML
      slide.innerHTML = `
        <img src="${imageUrl}" 
             alt="${cert.Title || "Certificate"}"
             loading="lazy"
             onerror="this.src='/placeholder.svg?height=300&width=500'; this.onerror=null; console.error('Image failed to load: ${imageUrl}');">
        <div class="certificate-info">
          <h3>${cert.Title || "Untitled Certificate"}</h3>
          <div class="meta">
            <span class="issuer">${cert.Issuer || "Unknown Issuer"}</span>
            <time datetime="${cert.Date || ""}">${certDate}</time>
          </div>
          <p class="description">${
            cert.Description || "No description available"
          }</p>
        </div>
      `;

      container.appendChild(slide);
    });

    // Initialize the carousel after adding all slides
    if (container.children.length > 0) {
      console.log(
        `Initializing carousel with ${container.children.length} slides`
      );
      initCarousel();
    } else {
      console.log("No slides were created");
      container.innerHTML = `
        <li class="error">
          <p>⚠️ No certificates could be displayed.</p>
          <button onclick="fetchCertificates()" class="retry-btn">Retry</button>
        </li>
      `;
    }
  } catch (error) {
    console.error("Error fetching certificates:", error);
    container.innerHTML = `
      <li class="error">
        <p>⚠️ Failed to load certificates.</p>
        <small>${error.message || ""}</small>
        <button onclick="fetchCertificates()" class="retry-btn">Retry</button>
      </li>
    `;
  }
}

// Initialize carousel functionality
function initCarousel() {
  const track = document.querySelector(".carousel-track");
  const slides = Array.from(track?.children || []);
  const dotNav = document.querySelector(".carousel-nav");
  const prevArrow = document.querySelector(".carousel-prev");
  const nextArrow = document.querySelector(".carousel-next");
  let currentIndex = 0;
  let autoplayInterval;

  // Exit if no slides
  if (!slides.length || !track) return;

  // Setup navigation dots
  if (dotNav) {
    dotNav.innerHTML = "";
    const totalSlides = slides.length;
    const maxDots = totalSlides < 7 ? totalSlides : 7;

    for (let i = 0; i < maxDots; i++) {
      const dot = document.createElement("button");
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.setAttribute("data-slide", i);
      if (i === 0) dot.classList.add("active");
      dotNav.appendChild(dot);
    }
  }

  // Function to move to a specific slide
  function moveToSlide(index) {
    if (!slides.length) return;

    // Ensure index is within bounds
    const safeIndex = ((index % slides.length) + slides.length) % slides.length;

    // Move the track
    track.style.transform = `translateX(-${safeIndex * 100}%)`;

    // Update active dot
    if (dotNav) {
      const dots = dotNav.querySelectorAll("button");
      dots.forEach((dot) => dot.classList.remove("active"));

      // Calculate which dot to activate (for when we have more slides than dots)
      const activeDotIndex = safeIndex % dots.length;
      dots[activeDotIndex]?.classList.add("active");
    }

    currentIndex = safeIndex;
  }

  // Start autoplay
  function startAutoplay() {
    stopAutoplay(); // Clear any existing interval
    autoplayInterval = setInterval(() => {
      moveToSlide(currentIndex + 1);
    }, 5000);
  }

  // Stop autoplay
  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
    }
  }

  // Event listeners for navigation
  if (dotNav) {
    dotNav.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") {
        const index = Number.parseInt(
          e.target.getAttribute("data-slide") || "0"
        );
        moveToSlide(index);
        startAutoplay(); // Reset autoplay timer
      }
    });
  }

  if (prevArrow) {
    prevArrow.addEventListener("click", () => {
      moveToSlide(currentIndex - 1);
      startAutoplay(); // Reset autoplay timer
    });
  }

  if (nextArrow) {
    nextArrow.addEventListener("click", () => {
      moveToSlide(currentIndex + 1);
      startAutoplay(); // Reset autoplay timer
    });
  }

  // Pause autoplay when user interacts with carousel
  track.addEventListener("mouseenter", stopAutoplay);
  track.addEventListener("mouseleave", startAutoplay);

  // Touch events for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoplay();
    },
    { passive: true }
  );

  track.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;

      // Swipe threshold
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          // Swipe left, go to next slide
          moveToSlide(currentIndex + 1);
        } else {
          // Swipe right, go to previous slide
          moveToSlide(currentIndex - 1);
        }
      }

      startAutoplay();
    },
    { passive: true }
  );

  // Initialize with first slide
  moveToSlide(0);
  startAutoplay();
}

// Add this style for the retry button
document.head.insertAdjacentHTML(
  "beforeend",
  `
  <style>
    .retry-btn {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background-color: #191970;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .retry-btn:hover {
      background-color: #0f0f50;
    }
  </style>
`
);
