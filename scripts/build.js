const fs = require('fs-extra');
const path = require('path');

// Configuration
const CONFIG = {
    languages: ['en', 'tr'],
    defaultLang: 'en',
    distDir: path.join(__dirname, '../dist'),
    srcDir: path.join(__dirname, '../src'),
    baseUrl: 'https://fluxora-tools.github.io'
};

// Tool Definitions (The core routes)
const TOOLS = [
    {
        id: 'png-to-jpg',
        slug: { en: 'png-to-jpg', tr: 'png-jpg-cevirme' },
        template: 'converter',
        type: 'image'
    },
    {
        id: 'jpg-to-png',
        slug: { en: 'jpg-to-png', tr: 'jpg-png-cevirme' },
        template: 'converter',
        type: 'image'
    },
    {
        id: 'youtube-mp3',
        slug: { en: 'youtube-mp3-downloader', tr: 'youtube-mp3-indir' },
        template: 'downloader',
        type: 'video'
    },
    {
        id: 'pdf-to-txt',
        slug: { en: 'pdf-to-txt', tr: 'pdf-txt-cevirme' },
        template: 'converter',
        type: 'document'
    },
    {
        id: 'word-to-txt',
        slug: { en: 'word-to-txt', tr: 'word-txt-cevirme' },
        template: 'converter',
        type: 'document'
    },
    // New Images
    { id: 'png-to-avif', slug: { en: 'png-to-avif', tr: 'png-avif-cevirme' }, template: 'converter', type: 'image' },
    { id: 'avif-to-png', slug: { en: 'avif-to-png', tr: 'avif-png-cevirme' }, template: 'converter', type: 'image' },
    { id: 'jpg-to-webp', slug: { en: 'jpg-to-webp', tr: 'jpg-webp-cevirme' }, template: 'converter', type: 'image' },
    { id: 'webp-to-jpg', slug: { en: 'webp-to-jpg', tr: 'webp-jpg-cevirme' }, template: 'converter', type: 'image' },
    // New Video/Downloader
    { id: 'pinterest-downloader', slug: { en: 'pinterest-downloader', tr: 'pinterest-video-indir' }, template: 'downloader', type: 'video' },
    { id: 'gif-to-mp4', slug: { en: 'gif-to-mp4', tr: 'gif-mp4-cevirme' }, template: 'converter', type: 'video' },
    { id: 'mp4-to-gif', slug: { en: 'mp4-to-gif', tr: 'mp4-gif-cevirme' }, template: 'converter', type: 'video' },
    // Developer Tools (Real & Easy)
    { id: 'json-formatter', slug: { en: 'json-formatter', tr: 'json-duzenleyici' }, template: 'converter', type: 'dev' },
    { id: 'lorem-ipsum', slug: { en: 'lorem-ipsum-generator', tr: 'lorem-ipsum-olusturucu' }, template: 'converter', type: 'dev' },
    { id: 'slug-generator', slug: { en: 'slug-generator', tr: 'slug-olusturucu' }, template: 'converter', type: 'dev' },
    { id: 'markdown-to-html', slug: { en: 'markdown-to-html', tr: 'markdown-html-cevirici' }, template: 'converter', type: 'dev' },
    // High Volume Utilities
    { id: 'qr-generator', slug: { en: 'qr-code-generator', tr: 'karekod-olusturucu' }, template: 'converter', type: 'utility' },
    { id: 'password-generator', slug: { en: 'password-generator', tr: 'sifre-olusturucu' }, template: 'converter', type: 'utility' },
    { id: 'word-counter', slug: { en: 'word-counter', tr: 'kelime-sayaci' }, template: 'converter', type: 'utility' },
    { id: 'internet-speed-test', slug: { en: 'internet-speed-test', tr: 'internet-hiz-testi' }, template: 'converter', type: 'utility' }
    // Add more tools as we implement them
];

// Helper: Load JSON
const loadLocale = (lang) => {
    try {
        return JSON.parse(fs.readFileSync(path.join(CONFIG.srcDir, `locales/${lang}.json`), 'utf8'));
    } catch (e) {
        console.error(`Error loading locale ${lang}:`, e);
        return {};
    }
};

// Helper: Ensure Directory
const ensureDir = (dir) => fs.ensureDirSync(dir);

// Main Build Function
async function build() {
    console.log('Starting Build...');

    // Clean Dist
    fs.emptyDirSync(CONFIG.distDir);

    // Copy Assets
    fs.copySync(path.join(CONFIG.srcDir, 'assets'), path.join(CONFIG.distDir, 'assets'));
    console.log('Assets copied.');

    // Load Layout
    const layoutTemplate = fs.readFileSync(path.join(CONFIG.srcDir, 'templates/layout.html'), 'utf8');

    // Build Pages for each language
    for (const lang of CONFIG.languages) {
        const locale = loadLocale(lang);
        const langDir = path.join(CONFIG.distDir, lang);
        ensureDir(langDir);

        // 1. Homepage
        const homeHtml = renderPage(layoutTemplate, {
            lang,
            title: locale.home.title,
            description: locale.home.description,
            content: `<h1>${locale.home.h1}</h1><div class="tool-grid">${renderToolGrid(lang, TOOLS)}</div>`,
            hreflang_tags: generateHreflang('home', lang),
            switch_lang_url: getSwitchUrl('home', lang),
            switch_lang_label: lang === 'en' ? 'TR' : 'EN',
            json_ld: generateJsonLd('home', lang)
        });
        fs.writeFileSync(path.join(langDir, 'index.html'), homeHtml);

        // 2. Tool Pages
        for (const tool of TOOLS) {
            const toolSlug = tool.slug[lang];
            const toolData = locale.tools[tool.id];

            // Fallback content if missing in locale
            const pageTitle = toolData ? toolData.title : `Tool ${tool.id}`;
            const pageDesc = toolData ? toolData.description : `Description for ${tool.id}`;
            const pageH1 = toolData ? toolData.h1 : `Convert ${tool.id}`;

            const toolHtml = renderPage(layoutTemplate, {
                lang,
                title: pageTitle,
                description: pageDesc,
                content: `<div class="tool-page" data-tool-id="${tool.id}">
                            <h1>${pageH1}</h1>
                            <div id="tool-interface">Loading Tool...</div>
                            <article>${toolData ? toolData.content_long : ''}</article>
                          </div>`,

                // SEO Content Injection
                faq_title: lang === 'en' ? 'Frequently Asked Questions' : 'Sıkça Sorulan Sorular',
                faq_q1: lang === 'en' ? `Is ${pageH1} free?` : `${pageH1} ücretsiz mi?`,
                faq_a1: lang === 'en' ? "Yes, this tool is 100% free and works entirely in your browser." : "Evet, bu araç tamamen ücretsizdir ve tarayıcınızda çalışır.",
                faq_q2: lang === 'en' ? "Is it safe to use?" : "Kullanımı güvenli mi?",
                faq_a2: lang === 'en' ? "Absolutely. Fluxora processes files locally on your device for maximum privacy." : "Kesinlikle. Fluxora dosyaları cihazınızda yerel olarak işler, maksimum gizlilik sağlar.",

                hreflang_tags: generateHreflang(tool.id, lang),
                switch_lang_url: getSwitchUrl(tool.id, lang),
                switch_lang_label: lang === 'en' ? 'TR' : 'EN',
                extra_scripts: `<script src="/assets/js/tools/${tool.type}-logic.js"></script>`,
                json_ld: generateJsonLd('software', lang, tool, locale)
            });

            const toolDir = path.join(langDir, toolSlug);
            ensureDir(toolDir);
            fs.writeFileSync(path.join(toolDir, 'index.html'), toolHtml);
        }

        // 3. About Page
        const aboutHtml = renderPage(layoutTemplate, {
            lang,
            title: locale.about ? locale.about.title : 'About Fluxora',
            description: locale.about ? locale.about.description : 'About Fluxora',
            content: locale.about ? locale.about.content : '<h1>About Us</h1>',
            hreflang_tags: generateHreflang('about', lang),
            switch_lang_url: getSwitchUrl('about', lang),
            switch_lang_label: lang === 'en' ? 'TR' : 'EN',
            json_ld: generateJsonLd('about', lang)
        });
        ensureDir(path.join(langDir, 'about'));
        fs.writeFileSync(path.join(langDir, 'about/index.html'), aboutHtml);

        // 4. Privacy Page
        const privacyHtml = renderPage(layoutTemplate, {
            lang,
            title: locale.privacy ? locale.privacy.title : 'Privacy Policy',
            description: locale.privacy ? locale.privacy.description : 'Privacy Policy',
            content: locale.privacy ? locale.privacy.content : '<h1>Privacy Policy</h1>',
            hreflang_tags: generateHreflang('privacy', lang),
            switch_lang_url: getSwitchUrl('privacy', lang),
            switch_lang_label: lang === 'en' ? 'TR' : 'EN',
            json_ld: generateJsonLd('privacy', lang)
        });
        ensureDir(path.join(langDir, 'privacy'));
        fs.writeFileSync(path.join(langDir, 'privacy/index.html'), privacyHtml);
    }

    // 3. About Page

    // Generate    // 4. Root Redirect Page (Client-side language detection)
    const rootIndexHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Fluxora - Redirecting...</title>
    <script>
        var userLang = navigator.language || navigator.userLanguage; 
        if (userLang.toLowerCase().includes('tr')) {
            window.location.href = "/tr/";
        } else {
            window.location.href = "/en/";
        }
    </script>
    <meta http-equiv="refresh" content="0;url=/en/">
</head>
<body style="background:#0f172a; color:white; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;">
    <p>Redirecting to your language...</p>
</body>
</html>`;
    fs.writeFileSync(path.join(CONFIG.distDir, 'index.html'), rootIndexHtml);

    // Generate Global Sitemap
    generateSitemap(TOOLS, CONFIG.languages);

    console.log('Build Complete.');
}

// Helper: Generate JSON-LD with Rich Snippets
function generateJsonLd(type, lang, tool = null) {
    const baseUrl = CONFIG.baseUrl;

    if (type === 'home') {
        return JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Fluxora",
            "url": `${baseUrl}/${lang}/`
        });
    }

    if (!tool) return '{}';

    const toolUrl = `${baseUrl}/${lang}/${tool.slug[lang]}`;
    // Base SoftwareApp Schema
    const schema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": tool.id,
        "operatingSystem": "Any",
        "applicationCategory": "UtilitiesApplication",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "url": toolUrl
    };

    return JSON.stringify(schema);
}
// Sitemap Generator
function generateSitemap(tools, languages) {
    const baseUrl = CONFIG.baseUrl;
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

    // 1. Homepages
    languages.forEach(lang => {
        xml += `
    <url>
        <loc>${baseUrl}/${lang}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
        ${languages.map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${baseUrl}/${l}/"/>`).join('')}
    </url>`;
    });

    // 2. Tools
    tools.forEach(tool => {
        languages.forEach(lang => {
            const slug = tool.slug[lang];
            xml += `
    <url>
        <loc>${baseUrl}/${lang}/${slug}/</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
        ${languages.map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${baseUrl}/${l}/${tool.slug[l]}/"/>`).join('')}
    </url>`;
        });
    });

    // 3. About & Privacy
    languages.forEach(lang => {
        ['about', 'privacy'].forEach(page => {
            xml += `
    <url>
        <loc>${baseUrl}/${lang}/${page}/</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
        ${languages.map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${baseUrl}/${l}/${page}/"/>`).join('')}
    </url>`;
        });
    });

    xml += `
</urlset>`;

    fs.writeFileSync(path.join(CONFIG.distDir, 'sitemap.xml'), xml);
    console.log('Sitemap generated.');
}

// Render Helper (Handles optional spaces: {{ key }} or {{key}})
function renderPage(template, data) {
    let html = template;
    const allKeys = ['lang', 'title', 'description', 'content', 'hreflang_tags', 'switch_lang_url', 'switch_lang_label', 'json_ld', 'extra_scripts', 'faq_title', 'faq_q1', 'faq_a1', 'faq_q2', 'faq_a2'];

    // Merge provided data with defaults to avoid literal tags appearing
    const finalData = {};
    allKeys.forEach(k => finalData[k] = data[k] || '');

    for (const key in finalData) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        html = html.replace(regex, finalData[key]);
    }
    return html;
}

// Grid Helper
function renderToolGrid(currentLang, tools) {
    return tools.map(t => {
        const slug = t.slug[currentLang];
        // In a real app, title comes from locale
        return `<a href="/${currentLang}/${slug}/" class="tool-card">
                    <h3>${t.id}</h3> <!-- Replace with localized name -->
                </a>`;
    }).join('');
}

// Hreflang Helper
function generateHreflang(pageId, currentLang) {
    return CONFIG.languages.map(l => {
        let url = `/${l}/`; // Default home
        if (pageId === 'about' || pageId === 'privacy') {
            url += `${pageId}/`;
        } else if (pageId !== 'home') {
            const tool = TOOLS.find(t => t.id === pageId);
            if (tool) url += `${tool.slug[l]}/`;
        }
        return `<link rel="alternate" hreflang="${l}" href="${url}" />`;
    }).join('\n    ');
}

// Switch URL Helper
function getSwitchUrl(pageId, currentLang) {
    const targetLang = currentLang === 'en' ? 'tr' : 'en';
    if (pageId === 'home') return `/${targetLang}/`;
    if (pageId === 'about' || pageId === 'privacy') return `/${targetLang}/${pageId}/`;
    const tool = TOOLS.find(t => t.id === pageId);
    return tool ? `/${targetLang}/${tool.slug[targetLang]}/` : `/${targetLang}/`;
}


build();
