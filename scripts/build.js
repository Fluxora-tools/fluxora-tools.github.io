const fs = require('fs-extra');
const path = require('path');

// Configuration
const CONFIG = {
    languages: ['en', 'tr'],
    defaultLang: 'en',
    distDir: path.join(__dirname, '../dist'),
    srcDir: path.join(__dirname, '../src'),
    baseUrl: 'https://fluxora-tools.vercel.app'
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
    // New Tools Added for Content Expansion
    { id: 'bmp-to-png', slug: { en: 'bmp-to-png', tr: 'bmp-png-cevirme' }, template: 'converter', type: 'image' },
    { id: 'png-to-bmp', slug: { en: 'png-to-bmp', tr: 'png-bmp-cevirme' }, template: 'converter', type: 'image' },
    { id: 'ico-to-png', slug: { en: 'ico-to-png', tr: 'ico-png-cevirme' }, template: 'converter', type: 'image' },
    { id: 'webp-to-avif', slug: { en: 'webp-to-avif', tr: 'webp-avif-cevirme' }, template: 'converter', type: 'image' },
    { id: 'avif-to-webp', slug: { en: 'avif-to-webp', tr: 'avif-webp-cevirme' }, template: 'converter', type: 'image' },
    
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
    { id: 'internet-speed-test', slug: { en: 'internet-speed-test', tr: 'internet-hiz-testi' }, template: 'converter', type: 'utility' },
    { id: 'txt-to-docx', slug: { en: 'txt-to-docx', tr: 'txt-docx-cevirme' }, template: 'converter', type: 'document' },
    { id: 'txt-to-pdf', slug: { en: 'txt-to-pdf', tr: 'txt-pdf-cevirme' }, template: 'converter', type: 'document' },
    { id: 'png-to-ico', slug: { en: 'png-to-ico', tr: 'png-ico-cevirme' }, template: 'converter', type: 'image' }
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
        const homeCanonical = `${CONFIG.baseUrl}/${lang}/`;
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
            keywords: locale.home.keywords || '',
            canonical_url: homeCanonical,
            total_operations_label: locale.total_operations,
            faq_title: locale.faq_title || '',
            content: homeContent,
            hreflang_tags: generateHreflang('home', lang),
            switch_lang_url: getSwitchUrl('home', lang),
            switch_lang_label: lang === 'en' ? 'TR' : 'EN',
            json_ld: generateJsonLd('home', lang)
        });
        fs.writeFileSync(path.join(langDir, 'index.html'), homeHtml);

        // 2. Tools
        console.log(`Processing tools for ${lang}... Keys: ${Object.keys(locale)}`);
        
        if (!locale.tools) {
            console.error(`CRITICAL: 'tools' property missing in ${lang}.json`);
            continue;
        }

        for (const tool of TOOLS) {
            try {
                console.log(`Processing tool ${tool.id} for ${lang}`);
                const toolLocale = locale.tools[tool.id];
                // Skip tool if no locale defined (prevent crash on new tools before translation)
                if (!toolLocale) {
                    console.warn(`Warning: No locale found for tool ${tool.id} in ${lang}`);
                    continue;
                }

                const toolDir = path.join(langDir, tool.slug[lang]);
                ensureDir(toolDir);

                const toolCanonical = `${CONFIG.baseUrl}/${lang}/${tool.slug[lang]}/`;
                const toolHtml = renderPage(layoutTemplate, {
                    lang,
                    title: toolLocale.title,
                    description: toolLocale.description,
                    keywords: toolLocale.keywords || '',
                    canonical_url: toolCanonical,
                    total_operations_label: locale.total_operations,
                    faq_title: toolLocale.faq_title || locale.faq_title || '',
                    faq_q1: toolLocale.faq_q1 || '',
                    faq_a1: toolLocale.faq_a1 || '',
                    faq_q2: toolLocale.faq_q2 || '',
                    faq_a2: toolLocale.faq_a2 || '',
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
                    json_ld: generateJsonLd('tool', lang, tool, toolLocale),
                    extra_scripts: `<script src="/assets/js/tools/${tool.type}-logic.js"></script>`
                });
                fs.writeFileSync(path.join(toolDir, 'index.html'), toolHtml);
                console.log(`Success: ${tool.id}`);
            } catch (err) {
                const msg = `FATAL ERROR processing tool ${tool.id}: ${err.message}\nStack: ${err.stack}`;
                console.error(msg);
                fs.writeFileSync('error.log', msg);
                throw err;
            }
        }

        // 3. About & Privacy
        ['about', 'privacy'].forEach(page => {
            const pageDir = path.join(langDir, page);
            ensureDir(pageDir);
            const pageCanonical = `${CONFIG.baseUrl}/${lang}/${page}/`;
            const html = renderPage(layoutTemplate, {
                lang,
                title: locale[page].title,
                description: locale[page].description,
                keywords: locale[page].keywords || '',
                canonical_url: pageCanonical,
                total_operations_label: locale.total_operations,
                faq_title: locale.faq_title || '',
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
    const rootIndexHtml = `<!DOCTYPE html><html><head><title>Fluxora</title>
        <meta name="msvalidate.01" content="1EF443F57933E45D9492EFEF952589CA" />
        <script>
        var userLang = navigator.language || navigator.userLanguage; 
        window.location.href = userLang.toLowerCase().includes('tr') ? "/tr/" : "/en/";
    </script><meta http-equiv="refresh" content="0;url=/en/"></head><body></body></html>`;
    fs.writeFileSync(path.join(CONFIG.distDir, 'index.html'), rootIndexHtml);

    generateSitemap(TOOLS, CONFIG.languages);

    // 5. Google Verification
    const googleFile = 'googlef2aefc909b2bfb5a.html';
    if (fs.existsSync(path.join(CONFIG.srcDir, '../', googleFile))) {
        fs.copySync(path.join(CONFIG.srcDir, '../', googleFile), path.join(CONFIG.distDir, googleFile));
        console.log('Google verification file copied.');
    } else if (fs.existsSync(path.join(CONFIG.srcDir, googleFile))) {
        fs.copySync(path.join(CONFIG.srcDir, googleFile), path.join(CONFIG.distDir, googleFile));
        console.log('Google verification file copied from src.');
    }

    console.log('Build Complete.');
}

function getIcon(type) {
    const icons = { image: 'fa-image', video: 'fa-video', document: 'fa-file-pdf', dev: 'fa-code', utility: 'fa-tools' };
    return icons[type] || 'fa-cog';
}

function generateJsonLd(type, lang, tool = null, toolLocale = null) {
    const baseUrl = CONFIG.baseUrl;
    if (type === 'home') {
        return JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Fluxora",
            "url": `${baseUrl}/${lang}/`,
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${baseUrl}/${lang}/?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            }
        });
    }
    if (!tool) return '{}';
    
    // Create rich HowTo schema for tools to boost content quality
    const parts = tool.id.split('-');
    const fromFormat = parts[0] ? parts[0].toUpperCase() : 'FILE';
    const toFormat = parts.length > 2 ? parts[2].toUpperCase() : 'FILE';
    
    const howToSteps = [
        {
            "@type": "HowToStep",
            "name": "Upload",
            "text": `Select or drag and drop your ${fromFormat} file into the box.`
        },
        {
            "@type": "HowToStep",
            "name": "Convert",
            "text": "The tool automatically processes your file securely in your browser."
        },
        {
            "@type": "HowToStep",
            "name": "Download",
            "text": `Download your converted ${toFormat} file instantly.`
        }
    ];

    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": ["SoftwareApplication", "HowTo"],
        "name": toolLocale?.title || tool.id,
        "operatingSystem": "Any (Web Browser)",
        "applicationCategory": "UtilitiesApplication",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "url": `${baseUrl}/${lang}/${tool.slug[lang]}/`,
        "step": howToSteps,
        "description": toolLocale?.description || `Free online tool to convert ${tool.id}.`
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
    // Ensure all tools including new ones are in sitemap
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
        let url = `${CONFIG.baseUrl}/${l}/`;
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
    if (pageId === 'home') return `${CONFIG.baseUrl}/${targetLang}/`;
    if (pageId === 'about' || pageId === 'privacy') return `${CONFIG.baseUrl}/${targetLang}/${pageId}/`;
    const tool = TOOLS.find(t => t.id === pageId);
    return tool ? `${CONFIG.baseUrl}/${targetLang}/${tool.slug[targetLang]}/` : `${CONFIG.baseUrl}/${targetLang}/`;
}

build();
