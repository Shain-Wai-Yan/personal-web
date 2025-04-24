const fs = require("fs");
const path = require("path");

// Your website URL - CHANGE THIS to your actual domain
const baseUrl = "https://shainwaiyan.com";

// Get all HTML files
const htmlFiles = fs.readdirSync("./").filter((file) => file.endsWith(".html"));
console.log(`Found ${htmlFiles.length} HTML files`);

// Function to extract image information from HTML files
function extractImagesFromHtml(htmlFile) {
  try {
    const content = fs.readFileSync(htmlFile, "utf8");

    // Simple regex to find image tags
    // Note: This is a basic implementation - a proper HTML parser would be more robust
    const imgRegex =
      /<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']+)["'][^>]*>/g;

    const images = [];
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      const src = match[1];
      const alt = match[2] || "";

      // Only include local images, not external ones
      if (!src.startsWith("http") && !src.startsWith("//")) {
        images.push({
          loc: src.startsWith("/") ? src : `/${src}`,
          title: alt,
          caption: alt,
        });
      }
    }

    console.log(`  - Found ${images.length} images in ${htmlFile}`);
    return images;
  } catch (error) {
    console.error(`Error processing ${htmlFile}:`, error.message);
    return [];
  }
}

// Create a map of pages to their images
const pageImages = {};
htmlFiles.forEach((file) => {
  const images = extractImagesFromHtml(file);
  if (images.length > 0) {
    pageImages[file] = images;
  }
});

// Create sitemap XML content with image extensions
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${htmlFiles
  .map((file) => {
    // Set priority based on importance
    let priority = 0.7;
    if (file === "index.html") priority = 1.0;
    if (
      [
        "about.html",
        "portfolio.html",
        "contact.html",
        "certificate.html",
      ].includes(file)
    ) {
      priority = 0.8;
    }

    const url = file === "index.html" ? baseUrl : `${baseUrl}/${file}`;

    // Check if this page has images
    const images = pageImages[file] || [];
    const imageXml =
      images.length > 0
        ? images
            .map(
              (img) => `
    <image:image>
      <image:loc>${baseUrl}${img.loc}</image:loc>
      <image:title>${img.title}</image:title>
      <image:caption>${img.caption}</image:caption>
    </image:image>`
            )
            .join("")
        : "";

    return `  <url>
    <loc>${url}</loc>
    <priority>${priority}</priority>${imageXml}
  </url>`;
  })
  .join("\n")}
</urlset>`;

// Write sitemap to file
fs.writeFileSync("sitemap.xml", sitemapContent);
console.log("Sitemap with image extensions generated successfully!");

// Also create a robots.txt file if it doesn't exist
if (!fs.existsSync("robots.txt")) {
  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

  fs.writeFileSync("robots.txt", robotsContent);
  console.log("robots.txt file created successfully!");
}
