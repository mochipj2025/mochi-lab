const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '../articles');
const OUTPUT_FILE = path.join(__dirname, '../search-index.json');

/**
 * Simple HTML content extractor using Regex.
 * This avoids dependency on external libraries like htmlparser2.
 */
function extractContent(html) {
    // Extract title
    const titleMatch = html.match(/<h1 class="article-title">(.*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract excerpt
    const excerptMatch = html.match(/<p class="article-excerpt">(.*?)<\/p>/);
    const excerpt = excerptMatch ? excerptMatch[1].trim() : '';

    // Extract tags
    const tags = [];
    const tagRegex = /<span class="tag">(.*?)<\/span>/g;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(html)) !== null) {
        tags.push(tagMatch[1].trim());
    }

    // Extract main content (inside div class="content")
    // Note: This is a bit simplified but effective for our needs
    const contentMatch = html.match(/<div class="content">([\s\S]*?)<\/article>/);
    let content = contentMatch ? contentMatch[1] : '';

    // Remove scripts and other tags from content
    content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
    content = content.replace(/<[^>]+>/g, ' '); // Strip HTML tags
    content = content.replace(/\s+/g, ' ').trim();

    return { title, excerpt, tags, content };
}

console.log(`Scanning directory: ${ARTICLES_DIR}`);

if (!fs.existsSync(ARTICLES_DIR)) {
    console.error(`Error: Articles directory not found at ${ARTICLES_DIR}`);
    process.exit(1);
}

const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.html') && !f.endsWith('.backup'));
const index = [];

files.forEach(file => {
    try {
        const filePath = path.join(ARTICLES_DIR, file);
        const html = fs.readFileSync(filePath, 'utf8');
        const { title, excerpt, tags, content } = extractContent(html);

        // Fallback title if h1 is not found
        const finalTitle = title || file.replace(/-/g, ' ').replace('.html', '');

        index.push({
            title: finalTitle,
            excerpt: excerpt || content.substring(0, 150) + '...',
            tags,
            url: `articles/${file}`,
            // Keep searchable content
            searchContent: (finalTitle + ' ' + excerpt + ' ' + tags.join(' ') + ' ' + content).toLowerCase()
        });
        console.log(`Indexed: ${file}`);
    } catch (err) {
        console.error(`Error indexing ${file}:`, err.message);
    }
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
console.log(`\nSuccess: Search index generated at ${OUTPUT_FILE} (${index.length} articles)`);
