/**
 * Contact form functionality with EmailJS integration
 * Handles form submission, validation, and user feedback with enhanced validation
 */

// Use an immediately invoked function expression to avoid global scope pollution
(function () {
    // Wait for DOM to be fully loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initContactForm);
    } else {
      // DOM already loaded, initialize immediately
      initContactForm();
    }
  
    function initContactForm() {
      console.log("Contact form initialization started");
  
      // Check if we're on the contact page by looking for the contact form
      const contactForm = document.getElementById("contactForm");
      if (!contactForm) {
        console.log("Contact form not found on this page");
        return; // Exit if we're not on the contact page
      }
  
      // Add autocomplete attributes to form fields (addresses browser warning)
      const nameInput = document.getElementById("name");
      const emailInput = document.getElementById("email");
      const messageInput = document.getElementById("message");
  
      if (nameInput) {
        nameInput.setAttribute("autocomplete", "name");
        nameInput.setAttribute("placeholder", "Your full name");
        // Add input event to check if field is filled
        nameInput.addEventListener("input", checkFieldFilled);
      }
  
      if (emailInput) {
        emailInput.setAttribute("autocomplete", "email");
        emailInput.setAttribute("placeholder", "your.email@example.com");
        // Add input event to check if field is filled
        emailInput.addEventListener("input", checkFieldFilled);
      }
  
      if (messageInput) {
        messageInput.setAttribute("autocomplete", "off"); // Usually messages shouldn't be autocompleted
        messageInput.setAttribute("placeholder", "How can I help you today?");
        // Add input event to check if field is filled
        messageInput.addEventListener("input", checkFieldFilled);
      }
  
      // Function to check if field is filled and update parent class
      function checkFieldFilled(e) {
        const field = e.target;
        const fieldParent = field.parentElement;
  
        if (field.value.trim() !== "") {
          fieldParent.classList.add("filled-field");
        } else {
          fieldParent.classList.remove("filled-field");
        }
      }
  
      // Initialize social media icons layout for mobile
      initSocialIconsLayout();
      window.addEventListener("resize", initSocialIconsLayout);
  
      function initSocialIconsLayout() {
        const socialLinks = document.querySelector(".social-links");
        if (!socialLinks) return;
  
        const socialIcons = socialLinks.querySelectorAll(".social-icon");
        if (socialIcons.length === 0) return;
  
        // Check if we're on mobile
        if (window.innerWidth <= 768) {
          // Check if container already exists
          let iconsContainer = socialLinks.querySelector(
            ".social-icons-container"
          );
  
          if (!iconsContainer) {
            // Create container for icons
            iconsContainer = document.createElement("div");
            iconsContainer.className = "social-icons-container";
  
            // Move all icons to the container
            socialIcons.forEach((icon) => {
              iconsContainer.appendChild(icon);
            });
  
            // Append container after the heading
            const heading = socialLinks.querySelector("h2");
            if (heading) {
              heading.after(iconsContainer);
            } else {
              socialLinks.appendChild(iconsContainer);
            }
          }
        } else {
          // On desktop, remove the container if it exists
          const iconsContainer = socialLinks.querySelector(
            ".social-icons-container"
          );
          if (iconsContainer) {
            // Move icons back to the main container
            const icons = iconsContainer.querySelectorAll(".social-icon");
            icons.forEach((icon) => {
              socialLinks.appendChild(icon);
            });
  
            // Remove the container
            iconsContainer.remove();
          }
        }
      }
  
      const charCount = document.getElementById("charCount");
      const formMessages = document.getElementById("formMessages");
      const maxChars = 500; // Maximum characters for message
  
      console.log("Form elements found:", {
        form: !!contactForm,
        name: !!nameInput,
        email: !!emailInput,
        message: !!messageInput,
        charCount: !!charCount,
        formMessages: !!formMessages,
      });
  
      // Character counter for message field
      if (messageInput && charCount) {
        // Initial character count
        updateCharCount();
  
        // Update character count on input
        messageInput.addEventListener("input", updateCharCount);
      }
  
      // Function to update character count
      function updateCharCount() {
        const remainingChars = maxChars - messageInput.value.length;
        charCount.textContent = `${remainingChars} characters remaining`;
  
        // Add warning class if less than 50 characters remaining
        if (remainingChars < 50) {
          charCount.classList.add("warning");
        } else {
          charCount.classList.remove("warning");
        }
      }
  
      // CRITICAL FIX: Remove any existing submit event listeners
      // This prevents multiple handlers from being attached
      const clonedForm = contactForm.cloneNode(true);
      contactForm.parentNode.replaceChild(clonedForm, contactForm);
  
      // Get the new form reference after cloning
      const newContactForm = document.getElementById("contactForm");
  
      // Re-attach event listeners to cloned elements
      const newNameInput = document.getElementById("name");
      const newEmailInput = document.getElementById("email");
      const newMessageInput = document.getElementById("message");
  
      if (newNameInput) {
        newNameInput.setAttribute("autocomplete", "name");
        newNameInput.setAttribute("placeholder", "Your full name");
        newNameInput.addEventListener("input", checkFieldFilled);
      }
  
      if (newEmailInput) {
        newEmailInput.setAttribute("autocomplete", "email");
        newEmailInput.setAttribute("placeholder", "your.email@example.com");
        newEmailInput.addEventListener("input", checkFieldFilled);
      }
  
      if (newMessageInput) {
        newMessageInput.setAttribute("autocomplete", "off");
        newMessageInput.setAttribute("placeholder", "How can I help you today?");
        newMessageInput.addEventListener("input", checkFieldFilled);
        if (charCount) {
          newMessageInput.addEventListener("input", updateCharCount);
          updateCharCount(); // Update initial count
        }
      }
  
      // Wrap each input in a parent div for better styling control
      const formFields = newContactForm.querySelectorAll("input, textarea");
      formFields.forEach((field) => {
        // Check if field is already wrapped
        if (
          field.parentElement.tagName !== "DIV" ||
          !field.parentElement.classList.contains("field-wrapper")
        ) {
          const wrapper = document.createElement("div");
          wrapper.className = "field-wrapper";
          field.parentNode.insertBefore(wrapper, field);
          wrapper.appendChild(field);
        }
      });
  
      // Add submit event listener to the new form
      newContactForm.addEventListener("submit", handleFormSubmit);
      console.log("Form submit event listener attached");
  
      function handleFormSubmit(event) {
        console.log("Form submission started");
        event.preventDefault();
  
        // Mark form as attempted to show validation styles
        newContactForm.classList.add("attempted");
  
        // Get fresh references to form elements
        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const messageInput = document.getElementById("message");
  
        // Validate form
        if (!validateForm()) {
          console.log("Form validation failed");
          return;
        }
  
        // Show loading state
        showLoadingState(true);
        console.log("Sending email via EmailJS...");
  
        // Prepare template parameters
        const templateParams = {
          from_name: nameInput.value,
          name: nameInput.value,
          email: emailInput.value,
          message: messageInput.value,
          reply_to: emailInput.value,
        };
  
        console.log("Template params:", templateParams);
  
        // Send email using EmailJS
        emailjs
          .send("service_gph5jrm", "template_822ymvo", templateParams)
          .then(function (response) {
            console.log("SUCCESS!", response.status, response.text);
            showSuccessMessage();
            newContactForm.reset();
  
            // Reset filled-field classes
            const fieldWrappers =
              newContactForm.querySelectorAll(".field-wrapper");
            fieldWrappers.forEach((wrapper) => {
              wrapper.classList.remove("filled-field");
            });
  
            if (newMessageInput && charCount) updateCharCount();
  
            // Add success animation to the form
            newContactForm.classList.add("form-success-animation");
            setTimeout(() => {
              newContactForm.classList.remove("form-success-animation");
            }, 1500);
          })
          .catch(function (error) {
            console.error("FAILED...", error);
            showErrorMessage(
              "We apologize, but there was an issue sending your message. Please try again or contact us directly via the email address listed below."
            );
          })
          .finally(function () {
            showLoadingState(false);
            newContactForm.classList.remove("attempted");
          });
      }
  
      // Form validation with enhanced messages
      function validateForm() {
        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const messageInput = document.getElementById("message");
        const newContactForm = document.getElementById("contactForm");
  
        let isValid = true;
  
        // Remove any existing error messages
        const existingErrors = newContactForm.querySelectorAll(".error-message");
        existingErrors.forEach((error) => error.remove());
  
        // Validate name
        if (nameInput.value.trim() === "") {
          showInputError(nameInput, "Please enter your full name");
          isValid = false;
        } else if (nameInput.value.trim().length < 2) {
          showInputError(nameInput, "Please enter your complete name");
          isValid = false;
        }
  
        // Enhanced email validation
        if (emailInput.value.trim() === "") {
          showInputError(emailInput, "Please provide your email address");
          isValid = false;
        } else if (!isValidEmail(emailInput.value)) {
          showInputError(
            emailInput,
            "Please enter a valid email address (e.g., name@example.com)"
          );
          isValid = false;
        }
  
        // Validate message with more specific feedback
        if (messageInput.value.trim() === "") {
          showInputError(messageInput, "Please enter your message");
          isValid = false;
        } else if (messageInput.value.trim().length < 10) {
          showInputError(messageInput, "Please provide a more detailed message");
          isValid = false;
        } else if (messageInput.value.length > maxChars) {
          showInputError(
            messageInput,
            `Your message exceeds the ${maxChars} character limit`
          );
          isValid = false;
        }
  
        return isValid;
      }
  
      // Show input error with improved styling
      function showInputError(input, message) {
        const errorElement = document.createElement("div");
        errorElement.className = "error-message";
  
        // Create icon element for the error message
        const iconSpan = document.createElement("span");
        iconSpan.className = "error-icon";
        iconSpan.setAttribute("aria-hidden", "true");
  
        // Create text element for the error message
        const textSpan = document.createElement("span");
        textSpan.textContent = message;
  
        // Append icon and text to error element
        errorElement.appendChild(iconSpan);
        errorElement.appendChild(textSpan);
  
        // Add error class to input
        input.classList.add("error");
  
        // Find the parent wrapper
        const parentWrapper = input.closest(".field-wrapper") || input.parentNode;
        parentWrapper.appendChild(errorElement);
  
        // Add focus to the first invalid field
        if (!document.querySelector(".error:focus")) {
          input.focus();
        }
  
        // Remove error when input changes
        input.addEventListener(
          "input",
          function () {
            input.classList.remove("error");
            const error = parentWrapper.querySelector(".error-message");
            if (error) {
              error.remove();
            }
          },
          { once: true }
        );
      }
  
      // Enhanced email validation with more comprehensive regex
      function isValidEmail(email) {
        // More comprehensive email regex that checks for:
        // - Proper format with @ and domain
        // - No spaces in email address
        // - Valid TLD (at least 2 characters)
        // - Common email format requirements
        const emailRegex =
          /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return emailRegex.test(email);
      }
  
      // Show loading state with improved visual feedback - centered indicator instead of overlay
      function showLoadingState(isLoading) {
        const newContactForm = document.getElementById("contactForm");
        const submitButton = newContactForm.querySelector(
          'button[type="submit"]'
        );
        const formFields = newContactForm.querySelectorAll("input, textarea");
  
        // Remove any existing loading indicators
        const existingIndicator = document.querySelector(".loading-indicator");
        if (existingIndicator) {
          existingIndicator.remove();
        }
  
        if (isLoading) {
          // Create centered loading indicator
          const loadingIndicator = document.createElement("div");
          loadingIndicator.className = "loading-indicator";
  
          const spinner = document.createElement("span");
          spinner.className = "loading-spinner";
  
          const loadingText = document.createElement("span");
          loadingText.className = "loading-indicator-text";
          loadingText.textContent = "Sending message...";
  
          loadingIndicator.appendChild(spinner);
          loadingIndicator.appendChild(loadingText);
  
          // Add to form
          newContactForm.appendChild(loadingIndicator);
  
          // Disable all form fields during submission
          formFields.forEach((field) => {
            field.disabled = true;
          });
  
          // Disable the button
          submitButton.disabled = true;
          submitButton.dataset.originalText = submitButton.textContent;
          submitButton.textContent = "Sending...";
        } else {
          // Re-enable all form fields after submission
          formFields.forEach((field) => {
            field.disabled = false;
          });
  
          // Re-enable the button and restore original text
          submitButton.disabled = false;
          submitButton.textContent =
            submitButton.dataset.originalText || "Send Message";
        }
      }
  
      // Show success message with improved styling
      function showSuccessMessage() {
        const formMessages = document.getElementById("formMessages");
        // Clear any existing messages
        formMessages.innerHTML = "";
  
        // Create success message element with enhanced structure
        const messageElement = document.createElement("div");
        messageElement.className = "form-message success";
        messageElement.innerHTML = `
          <div class="success-title">Thank you for your message!</div>
          <div class="success-description">
            Your message has been sent successfully. I'll respond to your inquiry within 24-48 hours.
          </div>
        `;
  
        // Add to the DOM
        formMessages.appendChild(messageElement);
  
        // Scroll to the message
        messageElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
  
        // Remove after 5 seconds with fade effect
        setTimeout(() => {
          messageElement.style.opacity = "0";
          setTimeout(() => {
            messageElement.remove();
          }, 300);
        }, 5000);
      }
  
      // Show error message with improved styling
      function showErrorMessage(message) {
        const formMessages = document.getElementById("formMessages");
        // Clear any existing messages
        formMessages.innerHTML = "";
  
        // Create error message element with enhanced structure
        const messageElement = document.createElement("div");
        messageElement.className = "form-message error";
        messageElement.innerHTML = `
          <div class="error-title">Unable to send message</div>
          <div class="error-description">${message}</div>
        `;
  
        // Add to the DOM
        formMessages.appendChild(messageElement);
  
        // Scroll to the message
        messageElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
  
      console.log("Contact form script fully initialized");
    }
  })();
  