/**
 * Advanced Blog System for Shain Studio - FULLY COMPATIBLE VERSION
 * Production-ready blog functionality optimized for 1000+ posts
 * Features: Virtual scrolling, advanced caching, image optimization, performance monitoring
 * Compatible with updated blog-api.js
 * @author Shain Studio
 * @version 2.1
 */

class AdvancedBlogSystem {
  constructor() {
    this.config = {
      postsPerPage: 20,
      virtualScrollThreshold: 100,
      cacheSize: 500,
      debounceDelay: 300,
      imageOptimization: {
        quality: "auto",
        format: "auto",
        sizes: {
          thumbnail: "w_400,h_300,c_fill",
          medium: "w_800,h_600,c_fill",
          large: "w_1200,h_900,c_fill",
        },
      },
      performance: {
        enableMetrics: true,
        logThreshold: 100, // ms
      },
    };

    this.state = {
      allPosts: new Map(),
      filteredPosts: [],
      displayedPosts: [],
      currentPage: 1,
      totalPages: 0,
      isLoading: false,
      hasMorePosts: true,
      searchQuery: "",
      activeFilters: {
        category: "",
        tag: "",
        dateRange: null,
      },
      virtualScroll: {
        startIndex: 0,
        endIndex: 0,
        itemHeight: 400,
        containerHeight: 0,
      },
      availableCategories: [],
      availableTags: [],
    };

    this.cache = new Map();
    this.observers = new Map();
    this.debounceTimers = new Map();
    this.performanceMetrics = new Map();

    this.init();
  }

  /**
   * Initialize the blog system
   */
  async init() {
    try {
      this.startPerformanceTimer("initialization");

      await this.setupDOM();
      await this.loadInitialData();
      this.setupEventListeners();
      this.setupIntersectionObservers();
      this.setupVirtualScrolling();
      this.handleUrlParameters();

      this.endPerformanceTimer("initialization");
      console.log("Advanced Blog System initialized successfully");
    } catch (error) {
      console.error("Blog initialization failed:", error);
      this.showError("Failed to initialize blog system");
    }
  }

  /**
   * Setup DOM elements and validate structure
   */
  async setupDOM() {
    this.elements = {
      postsGrid: document.getElementById("blog-posts-grid"),
      searchInput: document.getElementById("blog-search"),
      categoryFilter: document.getElementById("category-filter"),
      tagFilter: document.getElementById("tag-filter"),
      refreshBtn: document.getElementById("refresh-blog"),
      loadMoreBtn: document.getElementById("load-more-posts"),
      postCount: document.getElementById("post-count"),
      liveRegion: document.getElementById("blog-live-region"),
      scrollTrigger: document.querySelector(".scroll-trigger"),
    };

    // Validate required elements
    const requiredElements = ["postsGrid"];
    for (const element of requiredElements) {
      if (!this.elements[element]) {
        throw new Error(`Required element ${element} not found`);
      }
    }

    // Setup virtual scroll container
    if (this.elements.postsGrid) {
      this.elements.postsGrid.style.position = "relative";
      this.createVirtualScrollContainer();
    }
  }

  /**
   * Create virtual scroll container for performance
   */
  createVirtualScrollContainer() {
    const virtualContainer = document.createElement("div");
    virtualContainer.className = "virtual-scroll-container";
    virtualContainer.style.cssText = `
      position: relative;
      overflow: hidden;
      will-change: transform;
    `;

    const viewport = document.createElement("div");
    viewport.className = "virtual-scroll-viewport";
    viewport.style.cssText = `
      position: relative;
      transform: translateZ(0);
    `;

    virtualContainer.appendChild(viewport);
    this.elements.postsGrid.appendChild(virtualContainer);

    this.elements.virtualContainer = virtualContainer;
    this.elements.viewport = viewport;
  }

  /**
   * Load initial data with caching - UPDATED FOR COMPATIBILITY
   */
  async loadInitialData() {
    this.startPerformanceTimer("dataLoad");

    try {
      // Fetch posts first
      const postsResponse = await this.fetchPostsWithCache(
        1,
        this.config.postsPerPage * 3
      );

      // Process posts and extract categories/tags from them
      this.processPostsData(postsResponse);

      // Try to fetch categories and tags from API as fallback
      const [categoriesResponse, tagsResponse] = await Promise.all([
        this.fetchCategoriesWithCache(),
        this.fetchTagsWithCache(),
      ]);

      // Populate filters using extracted data from posts
      this.populateFiltersFromPosts(categoriesResponse, tagsResponse);

      this.endPerformanceTimer("dataLoad");
    } catch (error) {
      this.endPerformanceTimer("dataLoad");
      throw error;
    }
  }

  /**
   * Enhanced post fetching with intelligent caching
   */
  async fetchPostsWithCache(page = 1, pageSize = 20, forceRefresh = false) {
    const cacheKey = `posts_${page}_${pageSize}`;

    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 15 * 60 * 1000) {
        // 15 min cache
        return cached.data;
      }
    }

    try {
      const response = await window.BlogAPI.fetchPosts(
        page,
        pageSize,
        !forceRefresh
      );

      // Cache the response
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });

      // Manage cache size
      if (this.cache.size > this.config.cacheSize) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }

      return response;
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  }

  /**
   * Fetch categories with caching
   */
  async fetchCategoriesWithCache() {
    const cacheKey = "categories";

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30 * 60 * 1000) {
        // 30 min cache
        return cached.data;
      }
    }

    try {
      const response = await window.BlogAPI.fetchCategories();
      this.cache.set(cacheKey, { data: response, timestamp: Date.now() });
      return response;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return { data: [] };
    }
  }

  /**
   * Fetch tags with caching
   */
  async fetchTagsWithCache() {
    const cacheKey = "tags";

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30 * 60 * 1000) {
        // 30 min cache
        return cached.data;
      }
    }

    try {
      const response = await window.BlogAPI.fetchTags();
      this.cache.set(cacheKey, { data: response, timestamp: Date.now() });
      return response;
    } catch (error) {
      console.error("Error fetching tags:", error);
      return { data: [] };
    }
  }

  /**
   * Process posts data and build efficient data structures - UPDATED
   */
  processPostsData(response) {
    if (!response.data) return;

    const transformedPosts = response.data
      .map(window.BlogAPI.transformPostData)
      .filter((post) => post !== null);

    console.log("Transformed posts:", transformedPosts);

    // Store in Map for O(1) lookup
    transformedPosts.forEach((post) => {
      this.state.allPosts.set(post.id, post);
    });

    // Extract categories and tags from all posts
    this.extractCategoriesAndTagsFromPosts();

    this.state.filteredPosts = Array.from(this.state.allPosts.values());
    this.state.totalPages = Math.ceil(
      this.state.filteredPosts.length / this.config.postsPerPage
    );

    this.updatePostCount();
    this.renderPosts();
  }

  /**
   * Extract unique categories and tags from all posts - NEW METHOD
   */
  extractCategoriesAndTagsFromPosts() {
    const allPosts = Array.from(this.state.allPosts.values());

    // Extract categories
    this.state.availableCategories =
      window.BlogAPI.extractCategoriesFromPosts(allPosts);

    // Extract tags
    this.state.availableTags = window.BlogAPI.extractTagsFromPosts(allPosts);

    console.log(
      "Extracted categories from posts:",
      this.state.availableCategories
    );
    console.log("Extracted tags from posts:", this.state.availableTags);
  }

  /**
   * Populate filter dropdowns using extracted data from posts - UPDATED
   */
  populateFiltersFromPosts(categoriesResponse, tagsResponse) {
    // Populate categories - prioritize extracted from posts
    if (this.elements.categoryFilter) {
      this.elements.categoryFilter.innerHTML =
        '<option value="">All Categories</option>';

      // Use categories from posts first, fallback to API response
      const categoriesToUse =
        this.state.availableCategories.length > 0
          ? this.state.availableCategories
          : (categoriesResponse.data || [])
              .map((cat) => cat.attributes?.name || cat.name)
              .filter(Boolean);

      categoriesToUse.forEach((categoryName) => {
        if (categoryName && categoryName.trim()) {
          const option = document.createElement("option");
          option.value = categoryName.trim();
          option.textContent = categoryName.trim();
          this.elements.categoryFilter.appendChild(option);
        }
      });

      console.log("Populated categories in dropdown:", categoriesToUse);
    }

    // Populate tags - prioritize extracted from posts
    if (this.elements.tagFilter) {
      this.elements.tagFilter.innerHTML = '<option value="">All Tags</option>';

      // Use tags from posts first, fallback to API response
      const tagsToUse =
        this.state.availableTags.length > 0
          ? this.state.availableTags
          : (tagsResponse.data || [])
              .map((tag) => tag.attributes?.name || tag.name)
              .filter(Boolean);

      tagsToUse.forEach((tagName) => {
        if (tagName && tagName.trim()) {
          const option = document.createElement("option");
          option.value = tagName.trim();
          option.textContent = `#${tagName.trim()}`;
          this.elements.tagFilter.appendChild(option);
        }
      });

      console.log("Populated tags in dropdown:", tagsToUse);
    }
  }

  /**
   * Setup event listeners with debouncing - NO HAMBURGER MENU CONFLICTS
   */
  setupEventListeners() {
    // Search with debouncing
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener("input", (e) => {
        this.debounce(
          "search",
          () => {
            this.handleSearch(e.target.value);
          },
          this.config.debounceDelay
        );
      });
    }

    // Filter listeners
    if (this.elements.categoryFilter) {
      this.elements.categoryFilter.addEventListener("change", (e) => {
        this.handleCategoryFilter(e.target.value);
      });
    }

    if (this.elements.tagFilter) {
      this.elements.tagFilter.addEventListener("change", (e) => {
        this.handleTagFilter(e.target.value);
      });
    }

    // Refresh button
    if (this.elements.refreshBtn) {
      this.elements.refreshBtn.addEventListener("click", () => {
        this.handleRefresh();
      });
    }

    // Load more button
    if (this.elements.loadMoreBtn) {
      this.elements.loadMoreBtn.addEventListener("click", () => {
        this.loadMorePosts();
      });
    }

    // Keyboard navigation - NO HAMBURGER MENU CONFLICTS
    this.setupKeyboardNavigation();

    // Window resize for virtual scrolling
    window.addEventListener(
      "resize",
      this.debounce(
        "resize",
        () => {
          this.updateVirtualScrollDimensions();
        },
        100
      )
    );
  }

  /**
   * Setup keyboard navigation for accessibility - NO HAMBURGER MENU CONFLICTS
   */
  setupKeyboardNavigation() {
    document.addEventListener("keydown", (e) => {
      // Search shortcut (Ctrl/Cmd + K)
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        this.elements.searchInput?.focus();
      }
    });
  }

  /**
   * Setup intersection observers for performance
   */
  setupIntersectionObservers() {
    // Lazy loading observer
    this.observers.set(
      "lazyLoad",
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              this.loadOptimizedImage(img);
              this.observers.get("lazyLoad").unobserve(img);
            }
          });
        },
        { rootMargin: "50px" }
      )
    );

    // Infinite scroll observer
    if (this.elements.scrollTrigger) {
      this.observers.set(
        "infiniteScroll",
        new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (
                entry.isIntersecting &&
                !this.state.isLoading &&
                this.state.hasMorePosts
              ) {
                this.loadMorePosts();
              }
            });
          },
          { rootMargin: "100px" }
        )
      );

      this.observers.get("infiniteScroll").observe(this.elements.scrollTrigger);
    }
  }

  /**
   * Setup virtual scrolling for large datasets
   */
  setupVirtualScrolling() {
    if (this.state.filteredPosts.length < this.config.virtualScrollThreshold) {
      return; // Use regular rendering for smaller datasets
    }

    this.updateVirtualScrollDimensions();

    // Setup scroll listener
    this.elements.postsGrid.addEventListener(
      "scroll",
      this.debounce(
        "virtualScroll",
        () => {
          this.updateVirtualScroll();
        },
        16
      )
    ); // ~60fps
  }

  /**
   * Update virtual scroll dimensions
   */
  updateVirtualScrollDimensions() {
    if (!this.elements.virtualContainer) return;

    const containerRect = this.elements.postsGrid.getBoundingClientRect();
    this.state.virtualScroll.containerHeight = containerRect.height;

    const itemsPerRow = Math.floor(containerRect.width / 350) || 1;
    const totalRows = Math.ceil(this.state.filteredPosts.length / itemsPerRow);

    this.elements.virtualContainer.style.height = `${
      totalRows * this.state.virtualScroll.itemHeight
    }px`;
  }

  /**
   * Update virtual scroll viewport
   */
  updateVirtualScroll() {
    const scrollTop = this.elements.postsGrid.scrollTop;
    const containerHeight = this.state.virtualScroll.containerHeight;
    const itemHeight = this.state.virtualScroll.itemHeight;

    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 2,
      this.state.filteredPosts.length
    );

    if (
      startIndex !== this.state.virtualScroll.startIndex ||
      endIndex !== this.state.virtualScroll.endIndex
    ) {
      this.state.virtualScroll.startIndex = startIndex;
      this.state.virtualScroll.endIndex = endIndex;

      this.renderVirtualizedPosts();
    }
  }

  /**
   * Render virtualized posts for performance
   */
  renderVirtualizedPosts() {
    const { startIndex, endIndex, itemHeight } = this.state.virtualScroll;
    const visiblePosts = this.state.filteredPosts.slice(startIndex, endIndex);

    const postsHTML = visiblePosts
      .map((post, index) => {
        const actualIndex = startIndex + index;
        return this.createPostCard(post, actualIndex * itemHeight);
      })
      .join("");

    this.elements.viewport.innerHTML = postsHTML;
    this.setupLazyLoading();
  }

  /**
   * Handle search with advanced filtering
   */
  handleSearch(query) {
    this.startPerformanceTimer("search");

    this.state.searchQuery = query.toLowerCase().trim();
    this.applyFilters();

    this.endPerformanceTimer("search");
    this.announceToScreenReader(
      `Found ${this.state.filteredPosts.length} posts matching "${query}"`
    );
  }

  /**
   * Handle category filtering - IMPROVED WITH TRIM AND CASE HANDLING
   */
  handleCategoryFilter(category) {
    this.state.activeFilters.category = category;
    this.applyFilters();
    this.updateUrl({ category });

    const message = category
      ? `Filtered to ${this.state.filteredPosts.length} posts in ${category} category`
      : `Showing all ${this.state.filteredPosts.length} posts`;

    this.announceToScreenReader(message);
  }

  /**
   * Handle tag filtering - IMPROVED WITH TRIM AND CASE HANDLING
   */
  handleTagFilter(tag) {
    this.state.activeFilters.tag = tag;
    this.applyFilters();
    this.updateUrl({ tag });

    const message = tag
      ? `Filtered to ${this.state.filteredPosts.length} posts with #${tag} tag`
      : `Showing all ${this.state.filteredPosts.length} posts`;

    this.announceToScreenReader(message);
  }

  /**
   * Apply all active filters efficiently - IMPROVED WITH BETTER MATCHING
   */
  applyFilters() {
    this.startPerformanceTimer("filtering");

    let filtered = Array.from(this.state.allPosts.values());

    console.log("Starting with posts:", filtered.length);
    console.log("Active filters:", this.state.activeFilters);

    // Apply search filter
    if (this.state.searchQuery) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(this.state.searchQuery) ||
          post.excerpt.toLowerCase().includes(this.state.searchQuery) ||
          post.content.toLowerCase().includes(this.state.searchQuery) ||
          post.tags.some((tag) =>
            tag.toLowerCase().includes(this.state.searchQuery)
          ) ||
          post.categories.some((cat) =>
            cat.toLowerCase().includes(this.state.searchQuery)
          )
      );
      console.log("After search filter:", filtered.length);
    }

    // Apply category filter - IMPROVED with trim and case handling
    if (this.state.activeFilters.category) {
      const filterCategory = this.state.activeFilters.category
        .toLowerCase()
        .trim();
      filtered = filtered.filter((post) =>
        post.categories.some(
          (cat) => cat.toLowerCase().trim() === filterCategory
        )
      );
      console.log(
        "After category filter:",
        filtered.length,
        "for category:",
        filterCategory
      );
    }

    // Apply tag filter - IMPROVED with trim and case handling
    if (this.state.activeFilters.tag) {
      const filterTag = this.state.activeFilters.tag.toLowerCase().trim();
      filtered = filtered.filter((post) =>
        post.tags.some((tag) => tag.toLowerCase().trim() === filterTag)
      );
      console.log("After tag filter:", filtered.length, "for tag:", filterTag);
    }

    this.state.filteredPosts = filtered;
    this.state.currentPage = 1;
    this.state.totalPages = Math.ceil(
      filtered.length / this.config.postsPerPage
    );

    this.updatePostCount();
    this.renderPosts();

    this.endPerformanceTimer("filtering");
  }

  /**
   * Render posts with performance optimization
   */
  renderPosts(append = false) {
    if (!this.elements.postsGrid) return;

    this.startPerformanceTimer("rendering");

    // Use virtual scrolling for large datasets
    if (this.state.filteredPosts.length >= this.config.virtualScrollThreshold) {
      this.setupVirtualScrolling();
      this.renderVirtualizedPosts();
      this.endPerformanceTimer("rendering");
      return;
    }

    // Regular rendering for smaller datasets
    const startIndex = append
      ? (this.state.currentPage - 1) * this.config.postsPerPage
      : 0;
    const endIndex = this.state.currentPage * this.config.postsPerPage;
    const postsToShow = this.state.filteredPosts.slice(startIndex, endIndex);

    if (!append) {
      this.elements.postsGrid.innerHTML = "";
      this.state.displayedPosts = [];
    }

    if (postsToShow.length === 0 && !append) {
      this.showNoPosts();
      this.endPerformanceTimer("rendering");
      return;
    }

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    postsToShow.forEach((post) => {
      const postElement = this.createPostElement(post);
      fragment.appendChild(postElement);
    });

    if (append) {
      this.elements.postsGrid.appendChild(fragment);
    } else {
      this.elements.postsGrid.appendChild(fragment);
    }

    this.state.displayedPosts = append
      ? [...this.state.displayedPosts, ...postsToShow]
      : postsToShow;

    this.updateLoadMoreButton();
    this.setupLazyLoading();

    this.endPerformanceTimer("rendering");
  }

  /**
   * Create post element (DOM node instead of HTML string)
   */
  createPostElement(post) {
    const article = document.createElement("article");
    article.className = "blog-post-card";
    article.dataset.postId = post.id;

    const link = document.createElement("a");
    link.href = `blog-post.html?slug=${post.slug}`;
    link.className = "post-card-link";

    // Image container
    const imageContainer = document.createElement("div");
    imageContainer.className = "post-card-image";

    const img = document.createElement("img");
    // Use direct src for immediate loading, with optimized URL if available
    img.src = post.featuredImage;
    img.alt = post.title;
    img.loading = "lazy";
    img.onerror = () => {
      img.src = "/placeholder.svg?height=300&width=400&text=Blog+Post";
    };

    imageContainer.appendChild(img);

    // Category badge
    if (post.categories.length > 0) {
      const badge = document.createElement("span");
      badge.className = "post-category-badge";
      badge.textContent = post.categories[0];
      imageContainer.appendChild(badge);
    }

    // Content container
    const contentContainer = document.createElement("div");
    contentContainer.className = "post-card-content";

    // Header
    const header = document.createElement("header");
    header.className = "post-card-header";

    const title = document.createElement("h2");
    title.className = "post-card-title";
    title.textContent = post.title;

    const meta = document.createElement("div");
    meta.className = "post-card-meta";

    const time = document.createElement("time");
    time.dateTime = post.publishDate;
    time.textContent = window.BlogAPI.formatDate(post.publishDate);

    const readingTime = document.createElement("span");
    readingTime.className = "reading-time";
    readingTime.textContent = post.readingTime;

    meta.appendChild(time);
    meta.appendChild(readingTime);
    header.appendChild(title);
    header.appendChild(meta);

    // Excerpt
    const excerpt = document.createElement("p");
    excerpt.className = "post-card-excerpt";
    excerpt.textContent = post.excerpt;

    // Tags
    const tagsContainer = document.createElement("div");
    tagsContainer.className = "post-card-tags";
    post.tags.slice(0, 3).forEach((tag) => {
      const tagSpan = document.createElement("span");
      tagSpan.className = "tag";
      tagSpan.textContent = `#${tag}`;
      tagsContainer.appendChild(tagSpan);
    });

    // Footer
    const footer = document.createElement("div");
    footer.className = "post-card-footer";
    const readMore = document.createElement("span");
    readMore.className = "read-more";
    readMore.textContent = "Read more →";
    footer.appendChild(readMore);

    // Assemble the card
    contentContainer.appendChild(header);
    contentContainer.appendChild(excerpt);
    if (post.tags.length > 0) {
      contentContainer.appendChild(tagsContainer);
    }
    contentContainer.appendChild(footer);

    link.appendChild(imageContainer);
    link.appendChild(contentContainer);
    article.appendChild(link);

    return article;
  }

  /**
   * Load optimized image with intersection observer
   */
  loadOptimizedImage(img) {
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    }
  }

  /**
   * Setup lazy loading for current images (simplified)
   */
  setupLazyLoading() {
    // Modern browsers handle loading="lazy" natively
    // Just ensure images have proper error handling
    const images = this.elements.postsGrid.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.onerror) {
        img.onerror = () => {
          img.src = "/placeholder.svg?height=300&width=400&text=Blog+Post";
        };
      }
    });
  }

  /**
   * Handle refresh with cache clearing - UPDATED
   */
  async handleRefresh() {
    try {
      this.elements.refreshBtn?.classList.add("refreshing");

      // Clear all caches
      this.cache.clear();
      window.BlogAPI.clearCache();

      // Reset state
      this.state.allPosts.clear();
      this.state.currentPage = 1;
      this.state.searchQuery = "";
      this.state.activeFilters = { category: "", tag: "", dateRange: null };
      this.state.availableCategories = [];
      this.state.availableTags = [];

      // Reset UI
      if (this.elements.searchInput) this.elements.searchInput.value = "";
      if (this.elements.categoryFilter)
        this.elements.categoryFilter.selectedIndex = 0;
      if (this.elements.tagFilter) this.elements.tagFilter.selectedIndex = 0;

      // Reload data
      await this.loadInitialData();

      this.updateUrl({});
      this.announceToScreenReader("Blog posts refreshed");
    } catch (error) {
      console.error("Refresh error:", error);
      this.showError("Failed to refresh posts. Please try again.");
    } finally {
      setTimeout(() => {
        this.elements.refreshBtn?.classList.remove("refreshing");
      }, 800);
    }
  }

  /**
   * Load more posts with pagination
   */
  async loadMorePosts() {
    if (this.state.isLoading || !this.state.hasMorePosts) return;

    this.state.isLoading = true;

    try {
      const nextPage =
        Math.floor(
          this.state.displayedPosts.length / this.config.postsPerPage
        ) + 1;
      const response = await this.fetchPostsWithCache(
        nextPage,
        this.config.postsPerPage
      );

      if (response.data && response.data.length > 0) {
        const newPosts = response.data
          .map(window.BlogAPI.transformPostData)
          .filter((post) => post !== null);

        newPosts.forEach((post) => {
          this.state.allPosts.set(post.id, post);
        });

        // Re-extract categories and tags with new posts
        this.extractCategoriesAndTagsFromPosts();

        this.state.currentPage++;
        this.renderPosts(true);
      } else {
        this.state.hasMorePosts = false;
        this.updateLoadMoreButton();
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Update load more button visibility
   */
  updateLoadMoreButton() {
    const hasMore =
      this.state.displayedPosts.length < this.state.filteredPosts.length;

    if (this.elements.loadMoreBtn) {
      this.elements.loadMoreBtn.style.display = hasMore ? "block" : "none";
    }

    if (this.elements.scrollTrigger) {
      this.elements.scrollTrigger.style.display = hasMore ? "block" : "none";
    }
  }

  /**
   * Update post count display
   */
  updatePostCount() {
    if (this.elements.postCount) {
      const showing = Math.min(
        this.state.displayedPosts.length,
        this.state.filteredPosts.length
      );
      const total = this.state.filteredPosts.length;
      this.elements.postCount.textContent = `Showing ${showing} of ${total} posts`;
    }
  }

  /**
   * Handle URL parameters - IMPROVED
   */
  handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get("category");
    const tag = urlParams.get("tag");
    const search = urlParams.get("search");

    if (category && this.elements.categoryFilter) {
      // Find the exact match in the dropdown options
      const options = Array.from(this.elements.categoryFilter.options);
      const matchingOption = options.find(
        (option) =>
          option.value.toLowerCase().trim() === category.toLowerCase().trim()
      );

      if (matchingOption) {
        this.elements.categoryFilter.value = matchingOption.value;
        this.handleCategoryFilter(matchingOption.value);
      }
    }

    if (tag && this.elements.tagFilter) {
      // Find the exact match in the dropdown options
      const options = Array.from(this.elements.tagFilter.options);
      const matchingOption = options.find(
        (option) =>
          option.value.toLowerCase().trim() === tag.toLowerCase().trim()
      );

      if (matchingOption) {
        this.elements.tagFilter.value = matchingOption.value;
        this.handleTagFilter(matchingOption.value);
      }
    }

    if (search && this.elements.searchInput) {
      this.elements.searchInput.value = search;
      this.handleSearch(search);
    }
  }

  /**
   * Update URL without page reload
   */
  updateUrl(params) {
    const url = new URL(window.location);

    // Clear existing params
    url.searchParams.delete("category");
    url.searchParams.delete("tag");
    url.searchParams.delete("search");

    // Add new params
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });

    window.history.replaceState({}, "", url);
  }

  /**
   * Show error state
   */
  showError(message) {
    if (this.elements.postsGrid) {
      this.elements.postsGrid.innerHTML = `
        <div class="error-state">
          <h2>Oops! Something went wrong</h2>
          <p>${message}</p>
          <button onclick="window.location.reload()" class="btn btn-primary">Try Again</button>
        </div>
      `;
    }
  }

  /**
   * Show no posts state
   */
  showNoPosts() {
    if (this.elements.postsGrid) {
      this.elements.postsGrid.innerHTML = `
        <div class="no-posts-state">
          <h2>No posts found</h2>
          <p>Try adjusting your search or filter criteria.</p>
          <button onclick="location.href='blog.html'" class="btn btn-secondary">View All Posts</button>
        </div>
      `;
    }
  }

  /**
   * Announce to screen readers
   */
  announceToScreenReader(message) {
    if (this.elements.liveRegion) {
      this.elements.liveRegion.textContent = message;
      setTimeout(() => {
        this.elements.liveRegion.textContent = "";
      }, 1000);
    }
  }

  /**
   * Debounce utility function
   */
  debounce(key, func, delay) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(func, delay);
    this.debounceTimers.set(key, timer);
  }

  /**
   * Performance monitoring utilities
   */
  startPerformanceTimer(operation) {
    if (this.config.performance.enableMetrics) {
      this.performanceMetrics.set(operation, performance.now());
    }
  }

  endPerformanceTimer(operation) {
    if (
      this.config.performance.enableMetrics &&
      this.performanceMetrics.has(operation)
    ) {
      const duration =
        performance.now() - this.performanceMetrics.get(operation);

      if (duration > this.config.performance.logThreshold) {
        console.warn(
          `Performance warning: ${operation} took ${duration.toFixed(2)}ms`
        );
      }

      this.performanceMetrics.delete(operation);
    }
  }

  /**
   * Cleanup method for proper resource management
   */
  destroy() {
    // Clear all timers
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();

    // Disconnect observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();

    // Clear caches
    this.cache.clear();
    this.performanceMetrics.clear();

    console.log("Advanced Blog System destroyed");
  }

  /**
   * Create post card HTML (fallback for smaller datasets)
   */
  createPostCard(post) {
    const formattedDate = window.BlogAPI.formatDate(post.publishDate);
    const categoryBadge =
      post.categories.length > 0
        ? `<span class="post-category-badge">${post.categories[0]}</span>`
        : "";

    const imageUrl = post.featuredImage;

    return `
  <article class="blog-post-card" data-post-id="${post.id}">
    <a href="blog-post.html?slug=${post.slug}" class="post-card-link">
      <div class="post-card-image">
        <img src="${imageUrl}" 
             alt="${post.title}" 
             loading="lazy"
             onerror="this.src='/placeholder.svg?height=300&width=400&text=Blog+Post'">
        ${categoryBadge}
      </div>
      
      <div class="post-card-content">
        <header class="post-card-header">
          <h2 class="post-card-title">${post.title}</h2>
          <div class="post-card-meta">
            <time datetime="${post.publishDate}">${formattedDate}</time>
            <span class="reading-time">${post.readingTime}</span>
          </div>
        </header>
        
        <p class="post-card-excerpt">${post.excerpt}</p>
        
        ${
          post.tags.length > 0
            ? `
          <div class="post-card-tags">
            ${post.tags
              .slice(0, 3)
              .map((tag) => `<span class="tag">#${tag}</span>`)
              .join("")}
          </div>
        `
            : ""
        }
        
        <div class="post-card-footer">
          <span class="read-more">Read more →</span>
        </div>
      </div>
    </a>
  </article>
`;
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Check if we're on the blog listing page
  if (document.getElementById("blog-posts-grid")) {
    window.advancedBlogSystem = new AdvancedBlogSystem();
  }
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (window.advancedBlogSystem) {
    window.advancedBlogSystem.destroy();
  }
});
