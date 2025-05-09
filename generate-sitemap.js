const fs = require("fs").promises;
const path = require("path");
const { XMLValidator } = require("fast-xml-parser");
const cheerio = require("cheerio");

// -------------------------------
// CONFIGURATION CONSTANTS
// -------------------------------
const CONFIG = {
  SITE: {
    PROTOCOL: "https",
    DOMAIN: "www.shainwaiyan.com",
    DIRECTORIES: {
      INPUT: "./", // Root directory
      OUTPUT: "./", // Root directory
    },
  },

  SEO: {
    PRIORITY_WEIGHTS: {
      CONTENT_LENGTH: 0.0002,
      HEADING_STRUCTURE: 0.05,
    },
    CONTENT: {
      MIN_WORDS: 300,
      QUALITY_BOOSTS: {
        GOOD: { threshold: 700, bonus: 0.05 },
        EXCELLENT: { threshold: 1200, bonus: 0.1 },
      },
    },
    // Added priority guide based on page type
    PRIORITIES: {
      HOMEPAGE: 1.0,
      KEY_PAGES: 0.8, // About, Portfolio, etc.
      STANDARD: 0.7,
      UTILITY: 0.6,
    },
    // Key pages that should have higher priority
    KEY_PAGE_PATTERNS: [
      "about",
      "portfolio",
      "projects",
      "services",
      "contact",
    ],
  },

  LOCALIZATION: {
    DEFAULT_LANG: "en",
    LANGUAGES: {
      zh: { path: "zh/", name: "简体中文" },
      my: { path: "my/", name: "မြန်မာ" },
    },
  },

  VALIDATION: {
    URL_PATTERN:
      /^(https:\/\/www\.shainwaiyan\.com)(\/[a-z]{2}\/)?(\/[a-z0-9-]+)+\.html$/,
    XML_OPTIONS: {
      allowBooleanAttributes: true,
      ignoreAttributes: false,
    },
  },
};

// -------------------------------
// CORE GENERATOR CLASS
// -------------------------------
class SitemapGenerator {
  constructor() {
    this.baseUrl = `${CONFIG.SITE.PROTOCOL}://${CONFIG.SITE.DOMAIN}`;
    this.pageRegistry = new Map();
  }

  // Main execution flow
  async generate() {
    try {
      console.time("Sitemap Generation");

      await this.validateEnvironment();
      const htmlFiles = await this.discoverHtmlFiles();
      await this.processFiles(htmlFiles);
      await this.generateSitemap();
      await this.generateRobotsTxt();

      console.timeEnd("Sitemap Generation");
      console.log("✅ Sitemap successfully generated with SEO enhancements");
    } catch (error) {
      console.error("❌ Critical generation error:", error);
      process.exit(1);
    }
  }

  // -------------------------------
  // PHASE 1: ENVIRONMENT SETUP
  // -------------------------------
  async validateEnvironment() {
    try {
      await fs.access(CONFIG.SITE.DIRECTORIES.INPUT);
      console.log("✓ Validated input directory");
    } catch {
      throw new Error("Input directory not found");
    }
  }

  // -------------------------------
  // PHASE 2: FILE PROCESSING
  // -------------------------------
  async discoverHtmlFiles() {
    try {
      const files = await fs.readdir(CONFIG.SITE.DIRECTORIES.INPUT);
      return files
        .filter((file) => path.extname(file) === ".html")
        .map((file) => path.join(CONFIG.SITE.DIRECTORIES.INPUT, file));
    } catch (error) {
      throw new Error(`File discovery failed: ${error.message}`);
    }
  }

  async processFiles(files) {
    for (const file of files) {
      try {
        const pageData = await this.analyzePage(file);
        this.pageRegistry.set(pageData.url, pageData);
      } catch (error) {
        console.warn(`⚠️ Skipping ${path.basename(file)}: ${error.message}`);
      }
    }
  }

  // -------------------------------
  // PHASE 3: CONTENT ANALYSIS
  // -------------------------------
  async analyzePage(filePath) {
    const html = await fs.readFile(filePath, "utf8");
    const $ = cheerio.load(html);
    const filename = path.basename(filePath);

    return {
      url: this.createCanonicalUrl(filename),
      lastmod: await this.getLastModified(filePath),
      metadata: this.extractMetadata($),
      content: this.analyzeContent($),
      alternates: this.createAlternateUrls(filename),
      filename: filename, // Store the filename for later use
    };
  }

  extractMetadata($) {
    return {
      title: $("title").text().trim(),
      description: $('meta[name="description"]').attr("content") || "",
      canonical: $('link[rel="canonical"]').attr("href") || "",
    };
  }

  analyzeContent($) {
    const textContent = $("body").text();
    const wordCount = textContent.split(/\s+/).length;
    const headings = $(":header").length;

    return {
      wordCount,
      headings,
      qualityRating: this.calculateContentQuality(wordCount, headings),
    };
  }

  calculateContentQuality(wordCount, headings) {
    let quality = 0.5;

    if (wordCount >= CONFIG.SEO.CONTENT.MIN_WORDS) {
      quality +=
        CONFIG.SEO.PRIORITY_WEIGHTS.CONTENT_LENGTH *
        Math.min(
          wordCount,
          CONFIG.SEO.CONTENT.QUALITY_BOOSTS.EXCELLENT.threshold
        );
    }

    quality +=
      CONFIG.SEO.PRIORITY_WEIGHTS.HEADING_STRUCTURE * Math.min(headings / 5, 1);

    return Math.min(quality, 1);
  }

  // -------------------------------
  // PHASE 5: XML GENERATION
  // -------------------------------
  async generateSitemap() {
    const urlEntries = [];

    for (const [url, data] of this.pageRegistry) {
      urlEntries.push(this.createUrlEntry(url, data));
    }

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join("\n")}
</urlset>`;

    await this.validateXml(sitemapContent);
    await fs.writeFile(
      path.join(CONFIG.SITE.DIRECTORIES.OUTPUT, "sitemap.xml"),
      sitemapContent
    );
  }

  createUrlEntry(url, data) {
    return `<url>
  <loc>${url}</loc>
  <lastmod>${data.lastmod}</lastmod>
  <changefreq>${this.getChangeFrequency(data)}</changefreq>
  <priority>${this.calculatePriority(data)}</priority>
  ${this.generateAlternateLinks(data)}
</url>`;
  }

  // Generate alternate language links including x-default
  generateAlternateLinks(data) {
    // Start with x-default link
    const links = [
      `
  <xhtml:link 
    rel="alternate" 
    hreflang="x-default" 
    href="${data.url}" />`,
    ];

    // Add other language links
    data.alternates.forEach((alt) => {
      links.push(`
  <xhtml:link 
    rel="alternate" 
    hreflang="${alt.lang}" 
    href="${alt.url}" />`);
    });

    return links.join("");
  }

  // -------------------------------
  // SUPPORT FUNCTIONS
  // -------------------------------
  createCanonicalUrl(filename) {
    return filename === "index.html"
      ? this.baseUrl
      : `${this.baseUrl}/${filename}`;
  }

  async getLastModified(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.mtime.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    } catch {
      // Use current date instead of future date
      return new Date().toISOString().split("T")[0];
    }
  }

  // Updated priority calculation based on page type
  calculatePriority(data) {
    // Homepage gets highest priority
    if (data.url === this.baseUrl) {
      return CONFIG.SEO.PRIORITIES.HOMEPAGE.toFixed(1);
    }

    // Check if this is a key page
    const filename = data.filename.toLowerCase();
    for (const pattern of CONFIG.SEO.KEY_PAGE_PATTERNS) {
      if (filename.includes(pattern)) {
        return CONFIG.SEO.PRIORITIES.KEY_PAGES.toFixed(1);
      }
    }

    // Standard priority for other pages
    return CONFIG.SEO.PRIORITIES.STANDARD.toFixed(1);
  }

  getChangeFrequency({ url }) {
    return url === this.baseUrl ? "weekly" : "monthly";
  }

  // Updated to include x-default and standardize URLs
  createAlternateUrls(filename) {
    const alternates = [];

    // Add language alternates
    Object.entries(CONFIG.LOCALIZATION.LANGUAGES).forEach(([lang, cfg]) => {
      let altUrl;

      if (filename === "index.html") {
        // For homepage, use the directory path without index.html
        altUrl = `${this.baseUrl}/${cfg.path}`;
      } else {
        // For other pages, keep the filename
        altUrl = `${this.baseUrl}/${cfg.path}${filename}`;
      }

      alternates.push({
        lang,
        url: altUrl,
      });
    });

    return alternates;
  }

  sanitizeText(text, maxLength) {
    if (!text) return "";

    return text
      .slice(0, maxLength)
      .replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case "<":
            return "&lt;";
          case ">":
            return "&gt;";
          case "&":
            return "&amp;";
          case '"':
            return "&quot;";
          case "'":
            return "&apos;";
          default:
            return c;
        }
      })
      .trim();
  }

  async validateXml(content) {
    const result = XMLValidator.validate(
      content,
      CONFIG.VALIDATION.XML_OPTIONS
    );
    if (result !== true) {
      throw new Error(`Invalid XML: ${result.err.msg}`);
    }
  }

  async generateRobotsTxt() {
    const robotsPath = path.join(CONFIG.SITE.DIRECTORIES.OUTPUT, "robots.txt");
    const content = `User-agent: *
Allow: /
Disallow: /private/

Sitemap: ${this.baseUrl}/sitemap.xml`;

    try {
      await fs.writeFile(robotsPath, content, { flag: "wx" });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
}

// -------------------------------
// EXECUTION
// -------------------------------
new SitemapGenerator().generate();

// Test the script
console.log("Starting sitemap generation...");
