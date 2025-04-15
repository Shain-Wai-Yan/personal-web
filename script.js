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
          const nav = document.querySelector(".nav");
          const hamburger = document.querySelector(".hamburger");
          if (nav) nav.classList.remove("active");
          if (hamburger) hamburger.classList.remove("active");
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

  // Highlight active section - With null checks
  const path = window.location.pathname;

  // Use querySelectorAll to find all nav links
  const navLinks = document.querySelectorAll(".nav a");

  // Reset all links to default color
  navLinks.forEach((link) => {
    if (link) link.style.backgroundColor = "";
  });

  // Set active link based on current path
  navLinks.forEach((link) => {
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    if (
      (path.includes("portfolio") && href.includes("portfolio")) ||
      (path.includes("certificate") && href.includes("certificate")) ||
      (path.includes("about") && href.includes("about")) ||
      (path === "/" && href === "index.html") ||
      (path.includes("index.html") && href === "index.html")
    ) {
      link.classList.add("active");
    }
  });

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

// Function to handle image loading and aspect ratio detection
function handleImageLoad(img) {
  // Get natural dimensions of the image
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  // Determine if image is landscape, portrait, or square
  if (width > height) {
    img.classList.add("landscape");
  } else if (height > width) {
    img.classList.add("portrait");
  } else {
    img.classList.add("square");
  }

  // Remove loading class once image is loaded
  img.classList.remove("loading");
  img.classList.add("loaded");

  // Adjust parent container if needed
  const slide = img.closest(".carousel-slide");
  if (slide) {
    slide.classList.add("image-loaded");
  }
}

// Make sure the function is available globally
window.handleImageLoad = handleImageLoad;

// Function to generate placeholder image data URLs
function generatePlaceholderImage(
  width = 300,
  height = 200,
  text = "Certificate"
) {
  // Create a canvas element
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  // Get the drawing context
  const ctx = canvas.getContext("2d");

  // Draw background
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, width, height);

  // Draw border
  ctx.strokeStyle = "#191970";
  ctx.lineWidth = 5;
  ctx.strokeRect(5, 5, width - 10, height - 10);

  // Draw text
  ctx.fillStyle = "#191970";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Handle multi-line text
  const words = text.split("+");
  const lineHeight = 30;
  const startY = height / 2 - ((words.length - 1) * lineHeight) / 2;

  words.forEach((word, index) => {
    ctx.fillText(word, width / 2, startY + index * lineHeight);
  });

  // Return data URL
  return canvas.toDataURL("image/png");
}

// Debug function to test API connectivity
async function testApiConnection() {
  const API_URL =
    "https://backend-cms-89la.onrender.com/api/certificates?populate=*";

  try {
    console.log("Testing API connection to:", API_URL);

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      mode: "cors",
      credentials: "omit",
    });

    console.log("API Response Status:", response.status);
    console.log("API Response OK:", response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log("API Data received:", data);
      return { success: true, data };
    } else {
      console.error("API returned error status:", response.status);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.error("API connection test failed:", error);
    return { success: false, error: error.message };
  }
}

// Improved fetchCertificates function - ALWAYS try API first
async function fetchCertificates() {
  const API_URL =
    "https://backend-cms-89la.onrender.com/api/certificates?populate=*";
  const container = document.getElementById("certificates-container");

  if (!container) return;

  // Show loading state
  container.innerHTML = `
    <li class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading certificates...</p>
    </li>
  `;

  try {
    console.log("Attempting to fetch certificates from API...");

    // Always try to fetch from API first
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      mode: "cors",
      credentials: "omit", // Try without credentials to avoid CORS preflight issues
    });

    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }

    const result = await response.json();
    console.log("API data received:", result);

    // Validate data structure
    if (!result || !result.data) {
      throw new Error("Invalid API response structure");
    }

    // Check if we have certificates
    if (!Array.isArray(result.data) || result.data.length === 0) {
      throw new Error("No certificates found in the CMS");
    }

    // Clear loading state
    container.innerHTML = "";

    // Process each certificate
    result.data.forEach((cert) => {
      // Handle both Strapi 4.x and potential 5.x structures
      const attributes = cert.attributes || cert || {};
      const title =
        attributes.Title || attributes.title || "Untitled Certificate";
      const issuer = attributes.Issuer || attributes.issuer || "Unknown Issuer";
      const description =
        attributes.Description ||
        attributes.description ||
        "No description available";
      const date = attributes.Date || attributes.date || "";

      // Extract image URL - Handle different Strapi versions
      let imageUrl = generatePlaceholderImage(
        300,
        200,
        title.replace(/\s+/g, "+")
      );

      // Try different possible image structures
      const imageField = attributes.Image || attributes.image;

      if (imageField) {
        // Strapi 4.x structure
        if (imageField.data && imageField.data.attributes) {
          const imageData = imageField.data.attributes;

          if (imageData.url) {
            imageUrl = imageData.url.startsWith("http")
              ? imageData.url
              : `https://backend-cms-89la.onrender.com${imageData.url}`;
          } else if (imageData.formats) {
            const formats = ["large", "medium", "small", "thumbnail"];
            for (const format of formats) {
              if (imageData.formats[format] && imageData.formats[format].url) {
                const formatUrl = imageData.formats[format].url;
                imageUrl = formatUrl.startsWith("http")
                  ? formatUrl
                  : `https://backend-cms-89la.onrender.com${formatUrl}`;
                break;
              }
            }
          }
        }
        // Direct URL structure (older Strapi or custom)
        else if (imageField.url) {
          imageUrl = imageField.url.startsWith("http")
            ? imageField.url
            : `https://backend-cms-89la.onrender.com${imageField.url}`;
        }
        // Formats directly on the image field
        else if (imageField.formats) {
          const formats = ["large", "medium", "small", "thumbnail"];
          for (const format of formats) {
            if (imageField.formats[format] && imageField.formats[format].url) {
              const formatUrl = imageField.formats[format].url;
              imageUrl = formatUrl.startsWith("http")
                ? formatUrl
                : `https://backend-cms-89la.onrender.com${formatUrl}`;
              break;
            }
          }
        }
      }

      // Create the certificate slide
      const slide = document.createElement("li");
      slide.className = "carousel-slide";

      // Format the date
      const certDate = date
        ? new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "No date provided";

      // Set the slide HTML with improved image container
      slide.innerHTML = `
        <div class="certificate-image-container">
          <img src="${imageUrl}" 
               alt="${title}"
               class="loading"
               loading="lazy"
               onload="handleImageLoad(this)"
               onerror="this.src='${generatePlaceholderImage(
                 300,
                 200,
                 title.replace(/\s+/g, "+")
               )}'; this.onerror=null; handleImageLoad(this);">
        </div>
        <div class="certificate-info">
          <h3>${title}</h3>
          <div class="meta">
            <span class="issuer">${issuer}</span>
            <time datetime="${date}">${certDate}</time>
          </div>
          <p class="description">${description}</p>
        </div>
      `;

      container.appendChild(slide);
    });

    // Initialize the carousel after adding all slides
    if (container.children.length > 0) {
      initCarousel();
    } else {
      container.innerHTML = `
        <li class="error">
          <p>⚠️ No certificates could be displayed.</p>
          <button onclick="fetchCertificates()" class="retry-btn">Retry</button>
        </li>
      `;
    }
  } catch (error) {
    console.error("Error fetching certificates:", error);

    // Show detailed error information
    container.innerHTML = `
      <li class="error">
        <p>⚠️ Failed to load certificates from API</p>
        <small>${error.message || ""}</small>
        <div class="error-details">
          <p>This could be due to:</p>
          <ul>
            <li>CORS restrictions on the Strapi server</li>
            <li>Network connectivity issues</li>
            <li>Strapi server being offline</li>
          </ul>
        </div>
        <div class="action-buttons">
          <button onclick="fetchCertificates()" class="retry-btn">Retry API</button>
          <button onclick="useSampleCertificates(document.getElementById('certificates-container'))" class="sample-btn">Use Sample Data</button>
        </div>
      </li>
    `;

    // Add style for error details
    document.head.insertAdjacentHTML(
      "beforeend",
      `
      <style>
        .error-details {
          margin-top: 1rem;
          text-align: left;
          font-size: 0.85rem;
        }
        .error-details ul {
          margin-top: 0.5rem;
          padding-left: 1.5rem;
        }
        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1rem;
        }
        .sample-btn {
          padding: 0.5rem 1rem;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .sample-btn:hover {
          background-color: #5a6268;
        }
      </style>
    `
    );
  }
}

// Function to use sample certificates in development mode
function useSampleCertificates(container) {
  if (!container) return;

  console.log("Using sample certificates for development");

  // Sample certificate data for development
  const sampleCertificates = [
    {
      title: "Web Development Certification",
      issuer: "Coding Academy",
      date: "2023-05-15",
      description:
        "Comprehensive certification in modern web development technologies including HTML5, CSS3, JavaScript, and responsive design principles.",
      imageUrl: generatePlaceholderImage(300, 200, "Web+Development"),
    },
    {
      title: "JavaScript Advanced Course",
      issuer: "JS Masters",
      date: "2022-11-20",
      description:
        "Advanced JavaScript concepts including ES6+, async programming, functional programming, and modern frameworks.",
      imageUrl: generatePlaceholderImage(300, 200, "JavaScript"),
    },
    {
      title: "UI/UX Design Fundamentals",
      issuer: "Design Institute",
      date: "2023-02-10",
      description:
        "Principles of user interface and user experience design, including wireframing, prototyping, and user testing methodologies.",
      imageUrl: generatePlaceholderImage(300, 200, "UI/UX+Design"),
    },
  ];

  // Clear loading state
  container.innerHTML = "";

  // Add sample certificates
  sampleCertificates.forEach((cert) => {
    const slide = document.createElement("li");
    slide.className = "carousel-slide";

    // Format the date
    const certDate = cert.date
      ? new Date(cert.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "No date provided";

    // Set the slide HTML with improved image container
    slide.innerHTML = `
      <div class="certificate-image-container">
        <img src="${cert.imageUrl}" 
             alt="${cert.title}"
             class="loading"
             loading="lazy"
             onload="handleImageLoad(this)"
             onerror="this.src='${generatePlaceholderImage(
               300,
               200,
               cert.title.replace(/\s+/g, "+")
             )}'; this.onerror=null; handleImageLoad(this);">
      </div>
      <div class="certificate-info">
        <h3>${cert.title}</h3>
        <div class="meta">
          <span class="issuer">${cert.issuer}</span>
          <time datetime="${cert.date}">${certDate}</time>
        </div>
        <p class="description">${cert.description}</p>
      </div>
    `;

    container.appendChild(slide);
  });

  // Initialize the carousel
  initCarousel();

  // Add development mode notice
  const notice = document.createElement("div");
  notice.className = "dev-notice";
  notice.innerHTML = `
    <p>⚠️ Using Sample Data</p>
    <small>Could not connect to Strapi API. Using sample certificates instead.</small>
    <button onclick="fetchCertificates()" class="retry-api-btn">Try API Again</button>
  `;
  container.parentNode.insertAdjacentElement("afterend", notice);

  // Add style for the notice
  document.head.insertAdjacentHTML(
    "beforeend",
    `
    <style>
      .dev-notice {
        background-color: #fff3cd;
        color: #856404;
        padding: 0.75rem;
        margin-top: 1rem;
        border-radius: 0.25rem;
        text-align: center;
        font-size: 0.9rem;
      }
      .dev-notice small {
        display: block;
        margin-top: 0.5rem;
        opacity: 0.8;
      }
      .retry-api-btn {
        margin-top: 0.75rem;
        padding: 0.4rem 0.8rem;
        background-color: #856404;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
      }
      .retry-api-btn:hover {
        background-color: #6d5204;
      }
    </style>
  `
  );
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

  // Exit if no slides or track
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
    if (!slides.length || !track) return;

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
      if (dots[activeDotIndex]) {
        dots[activeDotIndex].classList.add("active");
      }
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
  if (track) {
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
  }

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
// Add Vercel Analytics
function addVercelAnalytics() {
  // Add the initialization function
  window.va =
    window.va ||
    (() => {
      (window.vaq = window.vaq || []).push(arguments);
    });

  // Create and add the script element
  const script = document.createElement("script");
  script.src = "/_vercel/insights/script.js";
  script.defer = true;
  document.head.appendChild(script);
}

// Call the function to add analytics
addVercelAnalytics();

// Rest of your existing JavaScript code
