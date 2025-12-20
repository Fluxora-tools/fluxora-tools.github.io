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

// Tool Definitions
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
    { id: 'png-to-avif', slug: { en: 'png-to-avif', tr: 'png-avif-cevirme' }, template: 'converter', type: 'image' },
    { id: 'avif-to-png', slug: { en: 'avif-to-png', tr: 'avif-png-cevirme' }, template: 'converter', type: 'image' },
    { id: 'jpg-to-webp', slug: { en: 'jpg-to-webp', tr: 'jpg-webp-cevirme' }, template: 'converter', type: 'image' },
    { id: 'webp-to-jpg', slug: { en: 'webp-to-jpg', tr: 'webp-jpg-cevirme' }, template: 'converter', type: 'image' },
    { id: 'webp-to-png', slug: { en: 'webp-to-png', tr: 'webp-png-cevirme' }, template: 'converter', type: 'image' },
    { id: 'png-to-webp', slug: { en: 'png-to-webp', tr: 'png-webp-cevirme' }, template: 'converter', type: 'image' },
    { id: 'jpg-to-bmp', slug: { en: 'jpg-to-bmp', tr: 'jpg-bmp-cevirme' }, template: 'converter', type: 'image' },
    { id: 'bmp-to-jpg', slug: { en: 'bmp-to-jpg', tr: 'bmp-jpg-cevirme' }, template: 'converter', type: 'image' },
    { id: 'gif-to-mp4', slug: { en: 'gif-to-mp4', tr: 'gif-mp4-cevirme' }, template: 'converter', type: 'video' },
    { id: 'mp4-to-gif', slug: { en: 'mp4-to-gif', tr: 'mp4-gif-cevirme' }, template: 'converter', type: 'video' },
    { id: 'video-to-mp3', slug: { en: 'video-to-mp3-converter', tr: 'videodan-mp3-yapma' }, template: 'converter', type: 'video' },
    { id: 'video-mute', slug: { en: 'mute-video', tr: 'video-sesi-silme' }, template: 'converter', type: 'video' },
    { id: 'json-formatter', slug: { en: 'json-formatter', tr: 'json-duzenleyici' }, template: 'converter', type: 'dev' },
    { id: 'lorem-ipsum', slug: { en: 'lorem-ipsum-generator', tr: 'lorem-ipsum-olusturucu' }, template: 'converter', type: 'dev' },
    { id: 'slug-generator', slug: { en: 'slug-generator', tr: 'slug-olusturucu' }, template: 'converter', type: 'dev' },
    { id: 'markdown-to-html', slug: { en: 'markdown-to-html', tr: 'markdown-html-cevirici' }, template: 'converter', type: 'dev' },
    { id: 'qr-generator', slug: { en: 'qr-code-generator', tr: 'karekod-olusturucu' }, template: 'converter', type: 'utility' },
    { id: 'password-generator', slug: { en: 'password-generator', tr: 'sifre-olusturucu' }, template: 'converter', type: 'utility' },
    { id: 'word-counter', slug: { en: 'word-counter', tr: 'kelime-sayaci' }, template: 'converter', type: 'utility' },
    { id: 'internet-speed-test', slug: { en: 'internet-speed-test', tr: 'internet-hiz-testi' }, template: 'converter', type: 'utility' }
];

const loadLocale = (lang) => {
    try {
        return JSON.parse(fs.readFileSync(path.join(CONFIG.srcDir, `locales/${lang}.json`), 'utf8'));
    } catch (e) {
        console.error(`Error loading locale ${lang}:`, e);
        return {};
    }
};

const ensureDir = (dir) => fs.ensureDirSync(dir);

async function build() {
    console.log('Starting Build...');
    fs.emptyDirSync(CONFIG.distDir);
    fs.copySync(path.join(CONFIG.srcDir, 'assets'), path.join(CONFIG.distDir, 'assets'));
    console.log('Assets copied.');

    const layoutTemplate = fs.readFileSync(path.join(CONFIG.srcDir, 'templates/layout.html'), 'utf8');

    for (const lang of CONFIG.languages) {
        const locale = loadLocale(lang);
        const langDir = path.join(CONFIG.distDir, lang);
        ensureDir(langDir);

        // 1. Homepage
        const homeContent = `
            <h1>${locale.home.h1}</h1>
            <p>${locale.home.description}</p>
            <div class="tool-grid">
                ${TOOLS.map(t => `<a href="/${lang}/${t.slug[lang]}/" class="tool-card">
                    <i class="fas ${getIcon(t.type)}"></i>
                    <h3>${locale.tools[t.id]?.h1 || t.id}</h3>
                    <p>${locale.tools[t.id]?.description || ''}</p>
                </a>`).join('')}
            </div>
        `;
        const homeHtml = renderPage(layoutTemplate, {
            lang,
            title: locale.home.title,
            description: locale.home.description,
            content: homeContent,
            hreflang_tags: generateHreflang('home', lang),
            switch_lang_url: getSwitchUrl('home', lang),
            switch_lang_label: lang === 'en' ? 'TR' : 'EN',
            json_ld: generateJsonLd('home', lang)
        });
        fs.writeFileSync(path.join(langDir, 'index.html'), homeHtml);

        // 2. Tools
        for (const tool of TOOLS) {
            const toolLocale = locale.tools[tool.id];
            const toolDir = path.join(langDir, tool.slug[lang]);
            ensureDir(toolDir);

            const toolHtml = renderPage(layoutTemplate, {
                lang,
                title: toolLocale.title,
                description: toolLocale.description,
                content: `
                    <div class="tool-page" data-tool-id="${tool.id}">
                        <h1>${toolLocale.h1}</h1>
                        <div id="tool-interface"></div>
                        <div class="tool-content">${toolLocale.content}</div>
                    </div>
                `,
                hreflang_tags: generateHreflang(tool.id, lang),
                switch_lang_url: getSwitchUrl(tool.id, lang),
                switch_lang_label: lang === 'en' ? 'TR' : 'EN',
                json_ld: generateJsonLd('tool', lang, tool),
                extra_scripts: `<script src="/assets/js/tools/${tool.type}-logic.js"></script>`
            });
            fs.writeFileSync(path.join(toolDir, 'index.html'), toolHtml);
        }

        // 3. About & Privacy
        ['about', 'privacy'].forEach(page => {
            const pageDir = path.join(langDir, page);
            ensureDir(pageDir);
            const html = renderPage(layoutTemplate, {
                lang,
                title: locale[page].title,
                description: locale[page].description,
                content: locale[page].content,
                hreflang_tags: generateHreflang(page, lang),
                switch_lang_url: getSwitchUrl(page, lang),
                switch_lang_label: lang === 'en' ? 'TR' : 'EN',
                json_ld: generateJsonLd('home', lang)
            });
            fs.writeFileSync(path.join(pageDir, 'index.html'), html);
        });
    }

    // 4. Root Redirect Page
    const rootIndexHtml = `<!DOCTYPE html><html><head><title>Fluxora</title><script>
        var userLang = navigator.language || navigator.userLanguage; 
        window.location.href = userLang.toLowerCase().includes('tr') ? "/tr/" : "/en/";
    </script><meta http-equiv="refresh" content="0;url=/en/"></head><body></body></html>`;
    fs.writeFileSync(path.join(CONFIG.distDir, 'index.html'), rootIndexHtml);

    generateSitemap(TOOLS, CONFIG.languages);
    console.log('Build Complete.');
}

function getIcon(type) {
    const icons = { image: 'fa-image', video: 'fa-video', document: 'fa-file-pdf', dev: 'fa-code', utility: 'fa-tools' };
    return icons[type] || 'fa-cog';
}

function generateJsonLd(type, lang, tool = null) {
    const baseUrl = CONFIG.baseUrl;
    if (type === 'home') return JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", "name": "Fluxora", "url": `${baseUrl}/${lang}/` });
    if (!tool) return '{}';
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": tool.id,
        "operatingSystem": "Any",
        "applicationCategory": "UtilitiesApplication",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "url": `${baseUrl}/${lang}/${tool.slug[lang]}/`
    });
}

function generateSitemap(tools, languages) {
    const baseUrl = CONFIG.baseUrl;
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    languages.forEach(lang => {
        xml += `\n  <url>\n    <loc>${baseUrl}/${lang}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`;
        ['about', 'privacy'].forEach(p => {
            xml += `\n  <url>\n    <loc>${baseUrl}/${lang}/${p}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>`;
        });
    });
    tools.forEach(tool => {
        languages.forEach(lang => {
            xml += `\n  <url>\n    <loc>${baseUrl}/${lang}/${tool.slug[lang]}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
        });
    });
    xml += `\n</urlset>`;
    fs.writeFileSync(path.join(CONFIG.distDir, 'sitemap.xml'), xml);
}

function renderPage(template, data) {
    let html = template;
    for (const key in data) {
        html = html.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), data[key]);
    }
    // Clean remaining tags
    html = html.replace(/{{\s*.*?\s*}}/g, '');
    return html;
}

function generateHreflang(pageId, currentLang) {
    return CONFIG.languages.map(l => {
        let url = `/${l}/`;
        if (pageId === 'about' || pageId === 'privacy') url += `${pageId}/`;
        else if (pageId !== 'home') {
            const tool = TOOLS.find(t => t.id === pageId);
            if (tool) url += `${tool.slug[l]}/`;
        }
        return `<link rel="alternate" hreflang="${l}" href="${url}" />`;
    }).join('\n    ');
}

function getSwitchUrl(pageId, currentLang) {
    const targetLang = currentLang === 'en' ? 'tr' : 'en';
    if (pageId === 'home') return `/${targetLang}/`;
    if (pageId === 'about' || pageId === 'privacy') return `/${targetLang}/${pageId}/`;
    const tool = TOOLS.find(t => t.id === pageId);
    return tool ? `/${targetLang}/${tool.slug[targetLang]}/` : `/${targetLang}/`;
}

build();
