const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://doong-jo.github.io';
const POSTS_DIR = path.join(__dirname, '../posts');
const OUTPUT_FILE = path.join(__dirname, '../feed.xml');

const FEED_CONFIG = {
  title: 'doong-jo',
  description: 'Sungdong Jo의 기술 블로그',
  language: 'ko-KR',
  author: 'Sungdong Jo',
  email: 'doong-jo@github.io',
};

function extractMetadata(content, filePath) {
  // Extract title from og:title or <title>
  const ogTitleMatch = content.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
  const titleMatch = content.match(/<title>([^|<]+)/);
  const title = ogTitleMatch ? ogTitleMatch[1] : titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.html');

  // Extract description from meta description
  const descMatch = content.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  const description = descMatch ? descMatch[1] : '';

  // Extract date from article:published_time or <time> tag
  const publishedTimeMatch = content.match(/<meta\s+property="article:published_time"\s+content="([^"]+)"/);
  const timeMatch = content.match(/<time[^>]*>(\d{4}-\d{2}-\d{2})<\/time>/);

  let postDate;
  if (publishedTimeMatch) {
    postDate = publishedTimeMatch[1];
  } else if (timeMatch) {
    postDate = timeMatch[1];
  } else {
    const stats = fs.statSync(filePath);
    postDate = stats.mtime.toISOString().split('T')[0];
  }

  return { title, description, postDate };
}

function formatRFC822Date(dateStr) {
  const date = new Date(dateStr + 'T00:00:00+09:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year} 00:00:00 +0900`;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getPostFiles() {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith('.html') && !file.startsWith('_'))
    .map((file) => {
      const filePath = path.join(POSTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { title, description, postDate } = extractMetadata(content, filePath);

      return {
        title,
        description,
        url: `${SITE_URL}/posts/${encodeURIComponent(file)}`,
        pubDate: postDate,
      };
    })
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}

function generateFeed() {
  const posts = getPostFiles();
  const now = new Date();
  const buildDate = formatRFC822Date(now.toISOString().split('T')[0]);

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${post.url}</link>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${formatRFC822Date(post.pubDate)}</pubDate>
      <guid isPermaLink="true">${post.url}</guid>
      <author>${FEED_CONFIG.email} (${FEED_CONFIG.author})</author>
    </item>`
    )
    .join('\n\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${FEED_CONFIG.title}</title>
    <description>${FEED_CONFIG.description}</description>
    <link>${SITE_URL}/</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <language>${FEED_CONFIG.language}</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <managingEditor>${FEED_CONFIG.email} (${FEED_CONFIG.author})</managingEditor>
    <webMaster>${FEED_CONFIG.email} (${FEED_CONFIG.author})</webMaster>

${items}

  </channel>
</rss>
`;

  fs.writeFileSync(OUTPUT_FILE, xml, 'utf8');
  console.log(`Feed generated: ${OUTPUT_FILE}`);
  console.log(`Total items: ${posts.length}`);
}

generateFeed();
