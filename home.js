document.addEventListener("DOMContentLoaded", () => {
  // Add missing Font Awesome icon
  if (!document.querySelector(".fa-chart-network")) {
    const style = document.createElement("style");
    style.textContent = `
        .fa-chart-network:before {
          content: "\\f64f"; /* Using network icon code */
        }
      `;
    document.head.appendChild(style);
  }
  // Animate skill bars when they come into view
  const skillBars = document.querySelectorAll(".skill-progress");

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.5,
  };

  const skillObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const skillBar = entry.target;
        const width =
          skillBar.parentElement.previousElementSibling.querySelector(
            "span:last-child"
          ).textContent;
        skillBar.style.width = width;
        observer.unobserve(skillBar);
      }
    });
  }, observerOptions);

  skillBars.forEach((bar) => {
    skillObserver.observe(bar);
  });

  // Animate stats counter when in view
  const statNumbers = document.querySelectorAll(".stat-number");

  const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const statNumber = entry.target;
        const finalValue = Number.parseInt(
          statNumber.getAttribute("data-count")
        );
        let currentValue = 0;
        const duration = 2000; // 2 seconds
        const increment = finalValue / (duration / 16); // 60fps

        const counter = setInterval(() => {
          currentValue += increment;
          if (currentValue >= finalValue) {
            statNumber.textContent = finalValue;
            clearInterval(counter);
          } else {
            statNumber.textContent = Math.floor(currentValue);
          }
        }, 16);

        observer.unobserve(statNumber);
      }
    });
  }, observerOptions);

  statNumbers.forEach((number) => {
    statsObserver.observe(number);
  });

  // Scroll animation for sections
  const sections = document.querySelectorAll("section:not(.hero-section)");

  const sectionObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("section-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    }
  );

  sections.forEach((section) => {
    section.classList.add("section-hidden");
    sectionObserver.observe(section);
  });

  // Add CSS for the animations
  const style = document.createElement("style");
  style.textContent = `
      .section-hidden {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      
      .section-visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;
  document.head.appendChild(style);

  // Smooth scroll for the scroll indicator
  document.querySelector(".scroll-indicator").addEventListener("click", () => {
    const expertiseSection = document.querySelector(".expertise-section");
    expertiseSection.scrollIntoView({ behavior: "smooth" });
  });
});
