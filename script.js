document.addEventListener("DOMContentLoaded", function () {
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

  // Carousel setup
  const track = document.querySelector(".carousel-track");
  const slides = Array.from(track?.children || []);
  const dotNav = document.querySelector(".carousel-nav");
  let currentIndex = 0;

  function setupDots() {
    if (!dotNav) return;
    dotNav.innerHTML = "";
    const total = slides.length;
    const show = total < 7 ? total : 7;
    for (let i = 0; i < show; i++) {
      const dot = document.createElement("button");
      dot.setAttribute("data-slide", i);
      if (i === 0) dot.classList.add("active");
      dotNav.appendChild(dot);
    }
  }
  setupDots();

  function moveToSlide(index) {
    if (slides.length === 0) return;
    track.style.transform = `translateX(-${index * 100}%)`;
    const dots = dotNav.querySelectorAll("button");
    dots.forEach((dot) => dot.classList.remove("active"));
    const activeDot = dots[index % dots.length];
    if (activeDot) activeDot.classList.add("active");
    currentIndex = index;
  }

  setInterval(() => {
    const nextIndex = (currentIndex + 1) % slides.length;
    moveToSlide(nextIndex);
  }, 5000);

  if (dotNav) {
    dotNav.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") {
        const index = parseInt(e.target.getAttribute("data-slide"));
        moveToSlide(index);
      }
    });
  }

  const prevArrow = document.querySelector(".carousel-prev");
  const nextArrow = document.querySelector(".carousel-next");
  if (prevArrow) {
    prevArrow.addEventListener("click", () => {
      const prev = (currentIndex - 1 + slides.length) % slides.length;
      moveToSlide(prev);
    });
  }
  if (nextArrow) {
    nextArrow.addEventListener("click", () => {
      const next = (currentIndex + 1) % slides.length;
      moveToSlide(next);
    });
  }

  // Contact form
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
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
});

// Add this to your existing JavaScript to ensure the menu-open class is properly managed

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
document.addEventListener("DOMContentLoaded", () => {
  checkViewportAndCleanup();

  // Also run when window is resized
  window.addEventListener("resize", checkViewportAndCleanup);
});
