/**
 * Blog API Integration for Shain Studio
 * Handles fetching and processing blog data from Strapi CMS
 * @author Shain Studio
 * @version 1.1
 */

window.BlogAPI = (() => {
  // Configuration
  const API_BASE_URL = "https://api.shainwaiyan.com/api";
  const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache
  const CACHE_VERSION = "v1.1";

  // Cache keys
  const CACHE_KEYS = {
    POSTS: `${CACHE_VERSION}_blog_posts`,
    CATEGORIES: `${CACHE_VERSION}_blog_categories`,
    TAGS: `${CACHE_VERSION}_blog_tags`,
    TIMESTAMP: `${CACHE_VERSION}_blog_timestamp`,
  };

  // State
  const allPosts = [];
  const categories = [];
  const tags = [];
  let isLoading = false;
  const currentPage = 1;
  const pageSize = 12;
  const hasMorePosts = true;

  // Declare gtag variable
  const gtag = window.gtag || (() => {});

  /**
   * Cache management functions
   */
  function saveToCache(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
      return true;
    } catch (error) {
      console.warn("Cache storage failed:", error);
      return false;
    }
  }

  function getFromCache(key) {
    try {
      const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
      if (!timestamp || Date.now() - Number.parseInt(timestamp) > CACHE_TTL) {
        return null; // Cache expired
      }

      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn("Cache retrieval failed:", error);
      return null;
    }
  }

  function clearCache() {
    try {
      Object.values(CACHE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      console.log("Blog cache cleared");
    } catch (error) {
      console.warn("Cache clearing failed:", error);
    }
  }

  /**
   * API request helper with error handling
   */
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      console.log(`Making API request to: ${url}`);

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`API response received:`, data);
      return data;
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fetch blog posts with pagination
   */
  async function fetchPosts(page = 1, pageSize = 12, useCache = true) {
    if (isLoading) return { data: [], meta: { pagination: { total: 0 } } };

    // Check cache first for initial load
    if (page === 1 && useCache) {
      const cachedPosts = getFromCache(CACHE_KEYS.POSTS);
      if (cachedPosts) {
        console.log("Using cached blog posts");
        return cachedPosts;
      }
    }

    isLoading = true;

    try {
      const endpoint = `/blogs?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*&sort=publishDate:desc`;
      const response = await apiRequest(endpoint);

      // Cache the response for page 1
      if (page === 1) {
        saveToCache(CACHE_KEYS.POSTS, response);
      }

      return response;
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      return {
        data: [],
        meta: { pagination: { total: 0, pageCount: 0 } },
        error: error.message,
      };
    } finally {
      isLoading = false;
    }
  }

  /**
   * Fetch single blog post by slug
   */
  async function fetchPostBySlug(slug) {
    try {
      const endpoint = `/blogs?filters[slug][$eq]=${encodeURIComponent(
        slug
      )}&populate=*`;
      const response = await apiRequest(endpoint);

      if (response.data && response.data.length > 0) {
        return response.data[0];
      } else {
        throw new Error("Blog post not found");
      }
    } catch (error) {
      console.error("Error fetching blog post:", error);
      throw error;
    }
  }

  /**
   * Fetch categories
   */
  async function fetchCategories(useCache = true) {
    if (useCache) {
      const cachedCategories = getFromCache(CACHE_KEYS.CATEGORIES);
      if (cachedCategories) {
        console.log("Using cached categories");
        return cachedCategories;
      }
    }

    try {
      const response = await apiRequest("/categories?populate=*");
      saveToCache(CACHE_KEYS.CATEGORIES, response);
      return response;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return { data: [] };
    }
  }

  /**
   * Fetch tags
   */
  async function fetchTags(useCache = true) {
    if (useCache) {
      const cachedTags = getFromCache(CACHE_KEYS.TAGS);
      if (cachedTags) {
        console.log("Using cached tags");
        return cachedTags;
      }
    }

    try {
      const response = await apiRequest("/tags?populate=*");
      saveToCache(CACHE_KEYS.TAGS, response);
      return response;
    } catch (error) {
      console.error("Error fetching tags:", error);
      return { data: [] };
    }
  }

  /**
   * Convert Strapi rich text content to HTML string
   */
  function convertRichTextToHtml(content) {
    if (!Array.isArray(content)) {
      return typeof content === "string" ? content : "";
    }

    return content
      .map((block) => {
        if (block.type === "paragraph") {
          const text =
            block.children?.map((child) => child.text || "").join("") || "";
          return text ? `<p>${text}</p>` : "";
        }
        // Add more block types as needed
        return "";
      })
      .join("");
  }

  /**
   * Transform Strapi blog post data to our format
   */
  function transformPostData(strapiPost) {
    if (!strapiPost) {
      console.warn("Invalid post data: post is null or undefined");
      return null;
    }

    console.log("Processing Strapi post:", strapiPost);

    try {
      // Handle both nested (v4) and flat (v5) structures
      const data = strapiPost.attributes || strapiPost;

      // Extract basic fields - handle both Title and title
      const title = data.Title || data.title || "Untitled Post";
      const slug = data.slug || `post-${strapiPost.id}`;
      const excerpt = data.excerpt || "";
      const publishDate = data.publishDate || data.createdAt;
      const updatedAt = data.updatedAt;
      const author = data.author || "Shain Wai Yan";

      // Convert rich text content to HTML
      let content = "";
      if (data.content) {
        if (Array.isArray(data.content)) {
          content = convertRichTextToHtml(data.content);
        } else if (typeof data.content === "string") {
          content = data.content;
        }
      }

      // Extract featured image URL - handle Strapi v5 structure
      let featuredImageUrl = "/placeholder.svg?height=400&width=600";
      if (data.featuredImage) {
        // Direct object structure (Strapi v5)
        if (data.featuredImage.url) {
          featuredImageUrl = data.featuredImage.url;
        }
        // Nested structure (Strapi v4)
        else if (data.featuredImage.data?.attributes?.url) {
          featuredImageUrl = data.featuredImage.data.attributes.url;
        }
        // Check formats for different sizes
        else if (data.featuredImage.formats) {
          const formats = ["large", "medium", "small", "thumbnail"];
          for (const format of formats) {
            if (data.featuredImage.formats[format]?.url) {
              featuredImageUrl = data.featuredImage.formats[format].url;
              break;
            }
          }
        }
      }

      // Extract categories - handle both structures
      const postCategories = [];
      if (data.categories?.data) {
        // Strapi v4 structure
        data.categories.data.forEach((cat) => {
          if (cat.attributes?.name) {
            postCategories.push(cat.attributes.name);
          }
        });
      } else if (data.category) {
        // Single category
        if (typeof data.category === "string") {
          postCategories.push(data.category);
        } else if (data.category.name) {
          postCategories.push(data.category.name);
        }
      }

      // Extract tags - handle both structures
      const postTags = [];
      if (data.tags?.data) {
        // Strapi v4 structure
        data.tags.data.forEach((tag) => {
          if (tag.attributes?.name) {
            postTags.push(tag.attributes.name);
          }
        });
      } else if (Array.isArray(data.tags)) {
        // Direct array of tags
        data.tags.forEach((tag) => {
          if (typeof tag === "string") {
            postTags.push(tag);
          } else if (tag.name) {
            postTags.push(tag.name);
          }
        });
      }

      // Extract SEO data - handle both Seo and seo
      const seo = data.Seo || data.seo || {};

      const transformedPost = {
        id: strapiPost.id,
        title: title,
        slug: slug,
        excerpt: excerpt,
        content: content,
        featuredImage: featuredImageUrl,
        publishDate: publishDate,
        updatedAt: updatedAt,
        author: author,
        categories: postCategories,
        tags: postTags,
        readingTime: calculateReadingTime(content),
        seo: {
          metaTitle: seo.metaTitle || title,
          metaDescription: seo.metaDescription || excerpt,
          ogImage: seo.ogImage?.url || featuredImageUrl,
          canonicalUrl: seo.canonicalUrl || "",
          structuredData: seo.structuredData || null,
        },
      };

      console.log("Transformed post:", transformedPost);
      return transformedPost;
    } catch (error) {
      console.error("Error transforming post data:", error, strapiPost);
      return null;
    }
  }

  /**
   * Calculate estimated reading time
   */
  function calculateReadingTime(content) {
    if (!content) return "1 min read";

    const wordsPerMinute = 200;
    // Strip HTML tags for word count
    const textContent = content.replace(/<[^>]*>/g, "");
    const words = textContent.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);

    return `${minutes} min read`;
  }

  /**
   * Format date for display
   */
  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.warn("Date formatting error:", error);
      return "Date unavailable";
    }
  }

  /**
   * Get URL slug from current page
   */
  function getSlugFromUrl() {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const slugFromParam = urlParams.get("slug");

    if (slugFromParam) {
      return slugFromParam;
    }

    // Check path-based routing
    const path = window.location.pathname;
    const segments = path.split("/").filter((segment) => segment);

    // Assuming URL structure: /blog/post-slug
    if (segments.length >= 2 && segments[0] === "blog") {
      return segments[1];
    }

    // Check if we're on blog-post.html page
    if (path.includes("blog-post.html")) {
      return urlParams.get("slug") || null;
    }

    return null;
  }

  /**
   * Initialize blog post page
   */
  async function initBlogPost() {
    const slug = getSlugFromUrl();

    if (!slug) {
      showError("No blog post specified");
      return;
    }

    try {
      showLoading();

      const strapiPost = await fetchPostBySlug(slug);
      const post = transformPostData(strapiPost);

      if (!post) {
        throw new Error("Failed to process blog post data");
      }

      renderBlogPost(post);
      updateSEOMetadata(post);
      await loadRelatedPosts(post);
    } catch (error) {
      console.error("Error initializing blog post:", error);
      showError(`Failed to load blog post: ${error.message}`);
    }
  }

  /**
   * Render blog post content
   */
  function renderBlogPost(post) {
    const container = document.getElementById("blog-post-content");
    if (!container) return;

    const formattedDate = formatDate(post.publishDate);

    container.innerHTML = `
      <header class="blog-post-header">
        <div class="post-meta">
          <time datetime="${post.publishDate}">${formattedDate}</time>
          <span class="reading-time">${post.readingTime}</span>
          ${
            post.categories.length > 0
              ? `<span class="post-category">${post.categories[0]}</span>`
              : ""
          }
        </div>
        
        <h1 class="post-title">${post.title}</h1>
        
        ${post.excerpt ? `<p class="post-excerpt">${post.excerpt}</p>` : ""}
        
        ${
          post.tags.length > 0
            ? `
          <div class="post-tags">
            ${post.tags
              .map((tag) => `<span class="tag">#${tag}</span>`)
              .join("")}
          </div>
        `
            : ""
        }
      </header>

      ${
        post.featuredImage && !post.featuredImage.includes("placeholder")
          ? `
        <div class="post-featured-image">
          <img src="${post.featuredImage}" alt="${post.title}" loading="lazy">
        </div>
      `
          : ""
      }

      <div class="post-content">
        ${post.content}
      </div>

      <footer class="post-footer">
        <div class="post-author">
          <p>Written by <strong>${post.author}</strong></p>
        </div>
        
        <div class="post-share">
          <h3>Share this post</h3>
          <div class="share-buttons">
            <button onclick="sharePost('twitter')" class="share-btn twitter" aria-label="Share on Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </button>
            
            <button onclick="sharePost('facebook')" class="share-btn facebook" aria-label="Share on Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </button>
            
            <button onclick="sharePost('linkedin')" class="share-btn linkedin" aria-label="Share on LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1-6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </button>
            
            <button onclick="sharePost('copy')" class="share-btn copy" aria-label="Copy link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
          </div>
        </div>
      </footer>
    `;

    // Update breadcrumb
    const breadcrumb = document.getElementById("current-post-breadcrumb");
    if (breadcrumb) {
      breadcrumb.textContent = post.title;
    }

    // Add share functionality
    window.sharePost = (platform) => {
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(post.title);
      const text = encodeURIComponent(post.excerpt || post.title);

      let shareUrl = "";

      switch (platform) {
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
          break;
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
          break;
        case "linkedin":
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
          break;
        case "copy":
          navigator.clipboard.writeText(window.location.href).then(() => {
            alert("Link copied to clipboard!");
          });
          return;
      }

      if (shareUrl) {
        window.open(shareUrl, "_blank", "width=600,height=400");
      }
    };
  }

  /**
   * Update SEO metadata for blog post
   */
  function updateSEOMetadata(post) {
    // Update title
    document.title = `${post.seo.metaTitle} | Shain Studio`;

    // Update meta tags
    const metaTags = {
      "post-description": post.seo.metaDescription,
      "post-keywords": post.tags.join(", "),
      "og-title": post.seo.metaTitle,
      "og-description": post.seo.metaDescription,
      "og-url": window.location.href,
      "og-image": post.seo.ogImage,
      "twitter-title": post.seo.metaTitle,
      "twitter-description": post.seo.metaDescription,
      "twitter-image": post.seo.ogImage,
      "article-published": post.publishDate,
      "article-modified": post.updatedAt,
    };

    Object.entries(metaTags).forEach(([id, content]) => {
      const element = document.getElementById(id);
      if (element && content) {
        element.setAttribute("content", content);
      }
    });

    // Update canonical URL
    const canonicalUrl = document.getElementById("canonical-url");
    if (canonicalUrl) {
      canonicalUrl.setAttribute(
        "href",
        post.seo.canonicalUrl || window.location.href
      );
    }

    // Update structured data
    const structuredData = document.getElementById("structured-data");
    if (structuredData) {
      const schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.seo.metaDescription,
        image: post.seo.ogImage,
        author: {
          "@type": "Person",
          name: post.author,
          alternateName: ["xolbine", "明元易"],
          sameAs: [
            "https://www.linkedin.com/in/shainwaiyan",
            "https://github.com/Shain-Wai-Yan",
          ],
        },
        publisher: {
          "@type": "Organization",
          name: "Shain Studio",
          logo: {
            "@type": "ImageObject",
            url: "https://www.shainwaiyan.com/images/Shain Studio.png",
          },
        },
        datePublished: post.publishDate,
        dateModified: post.updatedAt,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": window.location.href,
        },
      };

      structuredData.textContent = JSON.stringify(schema);
    }
  }

  /**
   * Load related posts based on current post categories
   */
  async function loadRelatedPosts(currentPost) {
    try {
      // Fetch more posts to have a better selection pool
      const response = await fetchPosts(1, 50, true);

      if (!response.data || response.data.length === 0) {
        console.log("No posts available for related posts");
        return;
      }

      const allPosts = response.data
        .map(transformPostData)
        .filter((post) => post && post.id !== currentPost.id); // Exclude current post

      // Find posts that share at least one category with the current post
      const relatedPosts = allPosts.filter((post) => {
        return post.categories.some((category) =>
          currentPost.categories.some(
            (currentCategory) =>
              category.toLowerCase() === currentCategory.toLowerCase()
          )
        );
      });

      // If we have related posts, randomize and pick 2
      let selectedPosts = [];
      if (relatedPosts.length > 0) {
        // Shuffle the related posts array
        const shuffled = relatedPosts.sort(() => 0.5 - Math.random());
        selectedPosts = shuffled.slice(0, 2);
      } else {
        // Fallback: if no category matches, pick 2 random recent posts
        const shuffled = allPosts.sort(() => 0.5 - Math.random());
        selectedPosts = shuffled.slice(0, 2);
      }

      if (selectedPosts.length > 0) {
        renderRelatedPosts(selectedPosts);

        // Add analytics tracking for related posts
        trackRelatedPostsShown(
          currentPost.id,
          selectedPosts.map((p) => p.id)
        );
      }
    } catch (error) {
      console.error("Error loading related posts:", error);
    }
  }

  /**
   * Render related posts with enhanced styling and engagement features
   */
  function renderRelatedPosts(posts) {
    const container = document.getElementById("related-posts-grid");
    const section = document.getElementById("related-posts");

    if (!container || !section) return;

    container.innerHTML = posts
      .map(
        (post) => `
      <article class="related-post-card" data-post-id="${post.id}">
        <a href="blog-post.html?slug=${
          post.slug
        }" class="related-post-link" onclick="trackRelatedPostClick('${
          post.id
        }')">
          <div class="related-post-image">
            <img src="${post.featuredImage}" alt="${post.title}" loading="lazy" 
                 onerror="this.src='/placeholder.svg?height=200&width=300&text=Blog+Post'">
            ${
              post.categories.length > 0
                ? `<span class="related-post-category">${post.categories[0]}</span>`
                : ""
            }
          </div>
          <div class="related-post-content">
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            <div class="related-post-meta">
              <time datetime="${post.publishDate}">${formatDate(
          post.publishDate
        )}</time>
              <span class="reading-time">${post.readingTime}</span>
            </div>
            <div class="related-post-tags">
              ${post.tags
                .slice(0, 2)
                .map((tag) => `<span class="tag">#${tag}</span>`)
                .join("")}
            </div>
            <div class="read-more-indicator">
              <span>Read more</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </a>
      </article>
    `
      )
      .join("");

    // Show the section with a nice animation
    section.style.display = "block";
    section.style.opacity = "0";
    section.style.transform = "translateY(20px)";

    // Animate in
    setTimeout(() => {
      section.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      section.style.opacity = "1";
      section.style.transform = "translateY(0)";
    }, 100);

    // Add hover effects
    addRelatedPostInteractions();
  }

  /**
   * Add interactive hover effects to related posts
   */
  function addRelatedPostInteractions() {
    const relatedCards = document.querySelectorAll(".related-post-card");

    relatedCards.forEach((card) => {
      card.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-8px) scale(1.02)";
        this.style.boxShadow = "0 12px 25px rgba(0, 0, 0, 0.15)";
      });

      card.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0) scale(1)";
        this.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
      });
    });
  }

  /**
   * Track related post analytics
   */
  function trackRelatedPostsShown(currentPostId, relatedPostIds) {
    // Track that related posts were shown
    if (typeof gtag !== "undefined") {
      gtag("event", "related_posts_shown", {
        current_post_id: currentPostId,
        related_post_ids: relatedPostIds.join(","),
        related_posts_count: relatedPostIds.length,
      });
    }

    console.log(
      `Related posts shown for post ${currentPostId}:`,
      relatedPostIds
    );
  }

  /**
   * Track when a related post is clicked
   */
  function trackRelatedPostClick(relatedPostId) {
    // Track related post clicks for analytics
    if (typeof gtag !== "undefined") {
      gtag("event", "related_post_click", {
        related_post_id: relatedPostId,
        source: "related_posts_section",
      });
    }

    console.log(`Related post clicked: ${relatedPostId}`);
  }

  // Make the tracking function globally available
  window.trackRelatedPostClick = trackRelatedPostClick;
  /**
   * Show loading state
   */
  function showLoading() {
    const container = document.getElementById("blog-post-content");
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading blog post...</p>
        </div>
      `;
    }
  }

  /**
   * Show error state
   */
  function showError(message) {
    const container = document.getElementById("blog-post-content");
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <h1>Oops! Something went wrong</h1>
          <p>${message}</p>
          <div class="error-actions">
            <a href="/blog" class="btn btn-primary">Back to Blog</a>
            <button onclick="window.location.reload()" class="btn btn-secondary">Try Again</button>
          </div>
        </div>
      `;
    }
  }

  // Public API
  return {
    fetchPosts,
    fetchPostBySlug,
    fetchCategories,
    fetchTags,
    transformPostData,
    formatDate,
    calculateReadingTime,
    clearCache,
    initBlogPost,

    // Getters for state
    get allPosts() {
      return allPosts;
    },
    get categories() {
      return categories;
    },
    get tags() {
      return tags;
    },
    get isLoading() {
      return isLoading;
    },
    get hasMorePosts() {
      return hasMorePosts;
    },
  };
})();

// Initialize API when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("Blog API initialized");
});
