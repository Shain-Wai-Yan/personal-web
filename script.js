/**
 * Main JavaScript file for the portfolio website
 * Contains core functionality for navigation, UI interactions, and general features
 * @author Original code by Shain, enhanced by v0
 * @version 2.0
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize all core functionality
  initSmoothScroll();
  initHoverEffects();
  initPortfolioItems();
  initContactForm();
  initHamburgerMenu();
  initActiveNavHighlight();
  initViewportCleanup();
  initScrollAnimation();
  initThemePreference();
  initAccessibility();
  addVercelInsights();

  // Initialize performance monitoring
  if (window.performance && window.performance.mark) {
    window.performance.mark("app-loaded");
    console.log("App fully loaded and initialized");
  }
});

// Smooth scroll for navigation links
function initSmoothScroll() {
  document
    .querySelectorAll(".nav a, .cta-btn, .link-bottom")
    .forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        if (this.hash !== "") {
          e.preventDefault();
          const target = document.querySelector(this.hash);
          if (target) {
            // Get header height for offset
            const headerHeight =
              document.querySelector("header")?.offsetHeight || 0;
            const targetPosition =
              target.getBoundingClientRect().top +
              window.pageYOffset -
              headerHeight;

            window.scrollTo({
              top: targetPosition,
              behavior: "smooth",
            });
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
}

// Hover effects for CTA and bottom links
function initHoverEffects() {
  document.querySelectorAll(".cta-btn, .link-bottom").forEach((button) => {
    button.addEventListener("mousemove", function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.style.setProperty("--x", `${x}px`);
      this.style.setProperty("--y", `${y}px`);
    });
  });
}

// Portfolio item hover animations
function initPortfolioItems() {
  document.querySelectorAll(".portfolio-item").forEach((item) => {
    item.addEventListener("mouseenter", () => {
      item.style.transform = "translateY(-5px) scale(1.05)";
    });
    item.addEventListener("mouseleave", () => {
      item.style.transform = "translateY(0) scale(1)";
    });

    // Add click event for portfolio items
    item.addEventListener("click", function () {
      const link = this.querySelector("a");
      if (link && link.href) {
        if (link.target === "_blank") {
          window.open(link.href, "_blank");
        } else {
          window.location.href = link.href;
        }
      }
    });
  });
}

// Contact form submission handling with validation
function initContactForm() {
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    // Add input validation
    const inputs = contactForm.querySelectorAll("input, textarea");
    inputs.forEach((input) => {
      input.addEventListener("blur", validateInput);
      input.addEventListener("input", () => {
        if (input.classList.contains("error")) {
          validateInput.call(input);
        }
      });
    });

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Validate all inputs before submission
      let isValid = true;
      inputs.forEach((input) => {
        if (!validateInput.call(input)) {
          isValid = false;
        }
      });

      if (!isValid) {
        showFormMessage("Please fix the errors before submitting.", "error");
        return;
      }

      const formData = new FormData(contactForm);
      console.log("Form Submission:", Object.fromEntries(formData));

      // Show success message with animation
      showFormMessage(
        "Thank you for your message! I will get back to you soon.",
        "success"
      );
      contactForm.reset();
    });
  }

  // Input validation function
  function validateInput() {
    const value = this.value.trim();
    const errorElement = this.nextElementSibling?.classList.contains(
      "error-message"
    )
      ? this.nextElementSibling
      : null;

    let errorMessage = "";

    if (this.required && value === "") {
      errorMessage = `${
        this.name.charAt(0).toUpperCase() + this.name.slice(1)
      } is required`;
    } else if (
      this.type === "email" &&
      value !== "" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      errorMessage = "Please enter a valid email address";
    }

    if (errorMessage) {
      this.classList.add("error");
      if (errorElement) {
        errorElement.textContent = errorMessage;
      } else {
        const error = document.createElement("div");
        error.className = "error-message";
        error.textContent = errorMessage;
        this.insertAdjacentElement("afterend", error);
      }
      return false;
    } else {
      this.classList.remove("error");
      if (errorElement) {
        errorElement.textContent = "";
      }
      return true;
    }
  }

  // Show form message
  function showFormMessage(message, type) {
    let messageElement = document.querySelector(".form-message");

    if (!messageElement) {
      messageElement = document.createElement("div");
      messageElement.className = "form-message";
      contactForm.insertAdjacentElement("afterend", messageElement);
    }

    messageElement.textContent = message;
    messageElement.className = `form-message ${type}`;
    messageElement.style.opacity = "0";

    // Fade in
    setTimeout(() => {
      messageElement.style.opacity = "1";
    }, 10);

    // Fade out after 5 seconds
    setTimeout(() => {
      messageElement.style.opacity = "0";
      setTimeout(() => {
        messageElement.remove();
      }, 300);
    }, 5000);
  }
}

// Hamburger menu toggle functionality
function initHamburgerMenu() {
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav");
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
      document.body.classList.toggle("menu-open");

      // Set aria-expanded for accessibility
      const expanded = hamburger.classList.contains("active");
      hamburger.setAttribute("aria-expanded", expanded.toString());
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        navMenu.classList.contains("active") &&
        !navMenu.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
        document.body.classList.remove("menu-open");
        hamburger.setAttribute("aria-expanded", "false");
      }
    });
  }
}

// Highlight active navigation section
function initActiveNavHighlight() {
  const path = window.location.pathname;
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
      link.setAttribute("aria-current", "page");
    }
  });

  // Also highlight based on scroll position for single-page sites
  if (path === "/" || path.includes("index.html")) {
    highlightNavOnScroll();
  }
}

// Highlight nav items based on scroll position
function highlightNavOnScroll() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav a");

  if (!sections.length) return;

  window.addEventListener("scroll", () => {
    let current = "";
    const scrollPosition = window.scrollY + 100; // Offset for header

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        current = "#" + section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      link.removeAttribute("aria-current");

      if (link.getAttribute("href") === current) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  });
}

// Ensure menu-open class is removed in desktop view
function initViewportCleanup() {
  // Function to check viewport and clean up menu state
  function checkViewportAndCleanup() {
    if (
      window.innerWidth > 768 &&
      document.body.classList.contains("menu-open")
    ) {
      document.body.classList.remove("menu-open");

      // Also ensure hamburger and nav are reset
      const hamburger = document.querySelector(".hamburger");
      const nav = document.querySelector(".nav");

      if (hamburger) {
        hamburger.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
      }
      if (nav) nav.classList.remove("active");
    }
  }

  // Run on page load
  checkViewportAndCleanup();

  // Also run when window is resized
  window.addEventListener("resize", checkViewportAndCleanup);
}

// Initialize scroll animations
function initScrollAnimation() {
  const animatedElements = document.querySelectorAll(".animate-on-scroll");

  if (!animatedElements.length) return;

  // Check if IntersectionObserver is supported
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animated");
            // Stop observing after animation is triggered
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    animatedElements.forEach((element) => {
      // Add initial state class
      element.classList.add("pre-animation");
      observer.observe(element);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    animatedElements.forEach((element) => {
      element.classList.add("animated");
    });
  }
}

// Initialize theme preference (light/dark mode)
function initThemePreference() {
  const themeToggle = document.getElementById("theme-toggle");

  if (!themeToggle) return;

  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  // Set initial theme
  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    document.documentElement.classList.add("dark-theme");
    themeToggle.checked = true;
  }

  // Toggle theme when button is clicked
  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      document.documentElement.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");
    }
  });

  // Listen for system theme changes
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        if (e.matches) {
          document.documentElement.classList.add("dark-theme");
          themeToggle.checked = true;
        } else {
          document.documentElement.classList.remove("dark-theme");
          themeToggle.checked = false;
        }
      }
    });
}

// Initialize accessibility features
function initAccessibility() {
  // Add proper ARIA attributes
  const hamburger = document.querySelector(".hamburger");
  if (hamburger) {
    hamburger.setAttribute("aria-label", "Menu");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("role", "button");
    hamburger.setAttribute("tabindex", "0");

    // Allow keyboard activation
    hamburger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        hamburger.click();
      }
    });
  }

  // Make portfolio items keyboard accessible
  document.querySelectorAll(".portfolio-item").forEach((item) => {
    if (!item.getAttribute("tabindex")) {
      item.setAttribute("tabindex", "0");
    }

    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        item.click();
      }
    });
  });

  // Add skip to content link for keyboard users
  if (!document.getElementById("skip-link")) {
    const skipLink = document.createElement("a");
    skipLink.id = "skip-link";
    skipLink.className = "skip-to-content";
    skipLink.href = "#main-content";
    skipLink.textContent = "Skip to content";
    document.body.insertAdjacentElement("afterbegin", skipLink);

    // Add main-content id to main content if it doesn't exist
    const main = document.querySelector("main");
    if (main && !document.getElementById("main-content")) {
      main.id = "main-content";
      main.setAttribute("tabindex", "-1");
    }
  }
}

// Add Vercel Analytics and Speed Insights
function addVercelInsights() {
  // Set up Analytics
  window.va =
    window.va ||
    (() => {
      (window.vaq = window.vaq || []).push(arguments);
    });

  // Create and add the Analytics script
  const analyticsScript = document.createElement("script");
  analyticsScript.src = "/_vercel/insights/script.js";
  analyticsScript.defer = true;
  document.head.appendChild(analyticsScript);

  // Set up Speed Insights
  window.vsi =
    window.vsi ||
    (() => {
      (window.vsiq = window.vsiq || []).push(arguments);
    });

  // Create and add the Speed Insights script
  const speedInsightsScript = document.createElement("script");
  speedInsightsScript.src = "/_vercel/speed-insights/script.js";
  speedInsightsScript.defer = true;
  document.head.appendChild(speedInsightsScript);
}

// Add CSS styles for new features
document.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement("style");
  style.textContent = `
    /* Form validation styles */
    input.error, textarea.error {
      border-color: #dc3545 !important;
      background-color: rgba(220, 53, 69, 0.05);
    }
    
    .error-message {
      color: #dc3545;
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }
    
    .form-message {
      padding: 0.75rem 1rem;
      border-radius: 4px;
      margin-top: 1rem;
      transition: opacity 0.3s ease;
    }
    
    .form-message.success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .form-message.error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    /* Animation classes */
    .pre-animation {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .animated {
      opacity: 1;
      transform: translateY(0);
    }
    
    /* Skip to content link */
    .skip-to-content {
      position: absolute;
      top: -40px;
      left: 0;
      background: #191970;
      color: white;
      padding: 8px;
      z-index: 100;
      transition: top 0.3s ease;
    }
    
    .skip-to-content:focus {
      top: 0;
    }
    
    /* Dark theme support */
    .dark-theme {
      --bg-color: #121212;
      --text-color: #e0e0e0;
      --card-bg: #1e1e1e;
      --border-color: #333;
    }
    
    .dark-theme body {
      background-color: var(--bg-color);
      color: var(--text-color);
    }
    
    .dark-theme .certificate-image-container {
      background-color: #2a2a2a;
      border-color: #444;
    }
    
    .dark-theme .certificate-info h3 {
      color: #a0c4ff;
    }
    
    .dark-theme .toggle-description {
      color: #a0c4ff;
    }
    
    .dark-theme .carousel-nav button {
      background-color: #555;
    }
    
    .dark-theme .carousel-nav button.active {
      background-color: #a0c4ff;
    }
  `;
  document.head.appendChild(style);
});
