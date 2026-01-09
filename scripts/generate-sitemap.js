const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://doong-jo.github.io';
const POSTS_DIR = path.join(__dirname, '../posts');
const OUTPUT_FILE = path.join(__dirname, '../sitemap.xml');

const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/about.html', priority: '0.8', changefreq: 'monthly' },
];

function getPostFiles() {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith('.html') && !file.startsWith('_'))
    .map((file) => {
      const filePath = path.join(POSTS_DIR, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');

      // Extract date from <time> tag if present
      const timeMatch = content.match(/<time[^>]*>(\d{4}-\d{2}-\d{2})<\/time>/);
      const postDate = timeMatch ? timeMatch[1] : stats.mtime.toISOString().split('T')[0];

      return {
        url: `/posts/${encodeURIComponent(file)}`,
        lastmod: postDate,
        priority: '0.6',
        changefreq: 'yearly',
      };
    });
}

function generateSitemap() {
  const posts = getPostFiles();
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    ...staticPages.map((p) => ({
      ...p,
      lastmod: today,
      fullUrl: `${SITE_URL}${p.url}`,
    })),
    ...posts.map((p) => ({
      ...p,
      fullUrl: `${SITE_URL}${p.url}`,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.fullUrl}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  fs.writeFileSync(OUTPUT_FILE, xml, 'utf8');
  console.log(`Sitemap generated: ${OUTPUT_FILE}`);
  console.log(`Total URLs: ${urls.length}`);
}

generateSitemap();
