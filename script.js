// Smooth scrolling for navigation links, CTA button, and bottom links
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
      }
    });
  });

// Button hover effect (mouse-near-button animation)
document.querySelectorAll(".cta-btn, .link-bottom").forEach((button) => {
  button.addEventListener("mousemove", function (e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.style.setProperty("--x", `${x}px`);
    this.style.setProperty("--y", `${y}px`);
  });
});

// Portfolio Item Hover Effect - Removed Shadow from Mouse Movement
const portfolioItems = document.querySelectorAll(".portfolio-item");

// Portfolio hover effect (subtle lift and scale)
portfolioItems.forEach((item) => {
  item.addEventListener("mouseenter", () => {
    item.style.transform = "translateY(-5px) scale(1.05)"; // Slight lift and scale
  });

  item.addEventListener("mouseleave", () => {
    item.style.transform = "translateY(0) scale(1)"; // Reset the transform on mouse leave
  });
});

// Certificate Carousel Setup
const track = document.querySelector(".carousel-track");
const slides = Array.from(track?.children || []);
const dotNav = document.querySelector(".carousel-nav");
let currentIndex = 0;

// Setup dot navigation based on slides count
function setupDots() {
  if (!dotNav) return;
  dotNav.innerHTML = "";
  const totalSlides = slides.length;
  const dotsToShow = totalSlides < 7 ? totalSlides : 7;
  for (let i = 0; i < dotsToShow; i++) {
    const dot = document.createElement("button");
    if (i === 0) dot.classList.add("active");
    dot.setAttribute("data-slide", i);
    dotNav.appendChild(dot);
  }
}
setupDots();

// Move to a specific slide
function moveToSlide(index) {
  if (slides.length === 0) return;
  track.style.transform = `translateX(-${index * 100}%)`;
  // Update dots
  const dots = dotNav.querySelectorAll("button");
  dots.forEach((dot) => dot.classList.remove("active"));
  const activeDot = dots[index % dots.length];
  if (activeDot) activeDot.classList.add("active");
  currentIndex = index;
}

// Auto-play carousel every 5 seconds
setInterval(() => {
  let nextIndex = (currentIndex + 1) % slides.length;
  moveToSlide(nextIndex);
}, 5000);

// Dot navigation click event
if (dotNav) {
  dotNav.addEventListener("click", function (e) {
    if (e.target.tagName === "BUTTON") {
      const index = parseInt(e.target.getAttribute("data-slide"));
      moveToSlide(index);
    }
  });
}

// Arrow navigation for carousel
const prevArrow = document.querySelector(".carousel-prev");
const nextArrow = document.querySelector(".carousel-next");

if (prevArrow) {
  prevArrow.addEventListener("click", () => {
    let prevIndex = (currentIndex - 1 + slides.length) % slides.length;
    moveToSlide(prevIndex);
  });
}

if (nextArrow) {
  nextArrow.addEventListener("click", () => {
    let nextIndex = (currentIndex + 1) % slides.length;
    moveToSlide(nextIndex);
  });
}

// Contact form submission (demo)
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

// Hamburger Menu Toggle
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav");

if (hamburger && navMenu) {
  hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("nav-active");
  });
}

// Button color change for active page
const menuLinks = document.querySelectorAll(".nav a");
const menuItems = {
  home: document.getElementById("home-link"),
  about: document.getElementById("about-link"),
  portfolio: document.getElementById("portfolio-link"),
  certificates: document.getElementById("certificates-link"),
};

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  if (path.includes("portfolio")) {
    menuItems.portfolio.style.backgroundColor = "gold";
    menuItems.home.style.backgroundColor = "#191970"; // Reset other menu items
    menuItems.about.style.backgroundColor = "#191970";
    menuItems.certificates.style.backgroundColor = "#191970";
  } else if (path.includes("certificates")) {
    menuItems.certificates.style.backgroundColor = "gold";
    menuItems.home.style.backgroundColor = "#191970";
    menuItems.about.style.backgroundColor = "#191970";
    menuItems.portfolio.style.backgroundColor = "#191970";
  } else if (path.includes("about")) {
    menuItems.about.style.backgroundColor = "gold";
    menuItems.home.style.backgroundColor = "#191970";
    menuItems.portfolio.style.backgroundColor = "#191970";
    menuItems.certificates.style.backgroundColor = "#191970";
  } else {
    menuItems.home.style.backgroundColor = "gold";
    menuItems.about.style.backgroundColor = "#191970";
    menuItems.portfolio.style.backgroundColor = "#191970";
    menuItems.certificates.style.backgroundColor = "#191970";
  }
});
