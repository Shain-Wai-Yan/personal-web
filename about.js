document.addEventListener("DOMContentLoaded", () => {
  // Intersection Observer for scroll animations
  const animatedElements = document.querySelectorAll(".animate-on-scroll");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animated");
          // Once the animation has played, we can stop observing the element
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1, // Trigger when at least 10% of the element is visible
      rootMargin: "0px 0px -50px 0px", // Adjust the trigger point (negative value means trigger before the element is fully visible)
    }
  );

  animatedElements.forEach((element) => {
    observer.observe(element);
  });

  // Profile image hover effect with parallax
  const profileImage = document.querySelector(".profile-image-wrapper");
  if (profileImage) {
    profileImage.addEventListener("mousemove", function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element
      const y = e.clientY - rect.top; // y position within the element

      // Calculate the center of the element
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate the distance from the center (normalized to -1 to 1)
      const moveX = ((x - centerX) / centerX) * 10; // Adjust the 10 to control the effect intensity
      const moveY = ((y - centerY) / centerY) * 10;

      // Apply the transform
      this.style.transform = `perspective(1000px) rotateX(${-moveY}deg) rotateY(${moveX}deg)`;
    });

    profileImage.addEventListener("mouseleave", function () {
      // Reset the transform when mouse leaves
      this.style.transform = "perspective(1000px) rotateX(0) rotateY(0)";
    });
  }

  // Timeline hover effect
  const timelineItems = document.querySelectorAll(".timeline-item");
  timelineItems.forEach((item) => {
    item.addEventListener("mouseenter", function () {
      // Add a subtle pulse animation to the timeline dot
      const dot = this.querySelector("::after");
      if (dot) {
        dot.style.animation = "pulse 1s infinite";
      }
    });

    item.addEventListener("mouseleave", function () {
      // Remove the animation
      const dot = this.querySelector("::after");
      if (dot) {
        dot.style.animation = "none";
      }
    });
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Adjust for fixed header
          behavior: "smooth",
        });
      }
    });
  });

  // Mobile menu functionality (ensure it works with the existing script.js)
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector(".nav");

  if (hamburger && nav) {
    hamburger.addEventListener("click", function () {
      this.classList.toggle("active");
      nav.classList.toggle("active");
      document.body.classList.toggle("menu-open");
    });
  }

  // Add a scroll event listener to change header style on scroll
  const header = document.querySelector(".header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });
  }

  // Add typing effect to the motto
  const motto = document.querySelector(".motto");
  if (motto) {
    const originalText = motto.textContent;
    motto.textContent = "";

    let i = 0;
    const typingEffect = setInterval(() => {
      if (i < originalText.length) {
        motto.textContent += originalText.charAt(i);
        i++;
      } else {
        clearInterval(typingEffect);
      }
    }, 100); // Adjust typing speed here
  }

  // Add parallax effect to the hero section
  const heroSection = document.querySelector(".about-hero");
  if (heroSection) {
    window.addEventListener("scroll", () => {
      const scrollPosition = window.scrollY;
      heroSection.style.backgroundPosition = `center ${scrollPosition * 0.5}px`;
    });
  }
});
