// Developer Tools Logic
document.addEventListener('DOMContentLoaded', () => {
    const interfaceContainer = document.getElementById('tool-interface');
    if (!interfaceContainer) return;

    // Detect Tool Type
    const toolPage = document.querySelector('.tool-page');
    const toolId = toolPage ? toolPage.dataset.toolId : '';

    // Render Interface based on Tool ID
    if (toolId === 'json-formatter') {
        renderJsonFormatter(interfaceContainer);
    } else if (toolId === 'slug-generator') {
        renderSlugGenerator(interfaceContainer);
    } else if (toolId === 'lorem-ipsum') {
        renderLoremIpsum(interfaceContainer);
    } else if (toolId === 'markdown-to-html') {
        renderMarkdownToHtml(interfaceContainer);
    }
});

function renderJsonFormatter(container) {
    container.innerHTML = `
        <div style="display:flex; gap:20px; width:100%; height:400px;">
            <div style="flex:1; display:flex; flex-direction:column;">
                <label>Input JSON</label>
                <textarea id="json-input" style="flex:1; background:rgba(0,0,0,0.3); color:#fff; border:1px solid var(--border); padding:10px; border-radius:8px; font-family:monospace;"></textarea>
            </div>
            <div style="display:flex; flex-direction:column; justify-content:center; gap:10px;">
                <button id="format-btn" class="btn-sm">Format >></button>
                <button id="minify-btn" class="btn-sm">Minify >></button>
            </div>
            <div style="flex:1; display:flex; flex-direction:column;">
                <label>Output</label>
                <textarea id="json-output" readonly style="flex:1; background:rgba(0,0,0,0.3); color:#fff; border:1px solid var(--border); padding:10px; border-radius:8px; font-family:monospace;"></textarea>
            </div>
        </div>
    `;

    document.getElementById('format-btn').addEventListener('click', () => {
        try {
            const raw = document.getElementById('json-input').value;
            const obj = JSON.parse(raw);
            document.getElementById('json-output').value = JSON.stringify(obj, null, 4);
        } catch (e) {
            document.getElementById('json-output').value = "Invalid JSON: " + e.message;
        }
    });

    document.getElementById('minify-btn').addEventListener('click', () => {
        try {
            const raw = document.getElementById('json-input').value;
            const obj = JSON.parse(raw);
            document.getElementById('json-output').value = JSON.stringify(obj);
        } catch (e) {
            document.getElementById('json-output').value = "Invalid JSON: " + e.message;
        }
    });
}

function renderSlugGenerator(container) {
    container.innerHTML = `
        <div style="width:100%; max-width:600px;">
            <input type="text" id="slug-input" placeholder="Enter text to slugify..." style="width:100%; padding:15px; margin-bottom:20px;">
            <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:8px; border:1px solid var(--border);">
                <code id="slug-output" style="font-size:1.5rem; color:var(--primary);">result-will-appear-here</code>
            </div>
            <button id="copy-btn" class="btn" style="margin-top:20px;">Copy Slug</button>
        </div>
    `;

    const input = document.getElementById('slug-input');
    const output = document.getElementById('slug-output');

    input.addEventListener('input', () => {
        const text = input.value;
        const slug = text.toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        output.textContent = slug || 'result-will-appear-here';
    });

    document.getElementById('copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(output.textContent);
        document.getElementById('copy-btn').textContent = 'Copied!';
        setTimeout(() => document.getElementById('copy-btn').textContent = 'Copy Slug', 1500);
    });
}

function renderLoremIpsum(container) {
    container.innerHTML = `
        <div style="width:100%; max-width:600px; text-align:center;">
            <label>Paragraphs: <input type="number" id="lorem-count" value="3" min="1" max="100" style="width:60px;"></label>
            <button id="gen-lorem" class="btn" style="margin-left:10px;">Generate</button>
            <textarea id="lorem-output" readonly style="width:100%; height:300px; margin-top:20px; background:rgba(0,0,0,0.3); color:#fff; border:1px solid var(--border); padding:10px; border-radius:8px;"></textarea>
        </div>
    `;

    const loremText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

    document.getElementById('gen-lorem').addEventListener('click', () => {
        const count = parseInt(document.getElementById('lorem-count').value) || 1;
        let result = [];
        for (let i = 0; i < count; i++) result.push(loremText);
        document.getElementById('lorem-output').value = result.join('\n\n');
    });
}

function renderMarkdownToHtml(container) {
    container.innerHTML = `
        <div style="display:flex; gap:20px; width:100%; height:500px;">
            <textarea id="md-input" placeholder="# Markdown Input\n\nType here..." style="flex:1; background:rgba(0,0,0,0.3); color:#fff; border:1px solid var(--border); padding:10px; border-radius:8px; font-family:monospace;"></textarea>
            <div id="html-preview" style="flex:1; background:#fff; color:#000; padding:20px; border-radius:8px; overflow-y:auto;"></div>
        </div>
    `;

    document.getElementById('md-input').addEventListener('input', (e) => {
        const text = e.target.value;
        // Super simple parser for demo (real world needs marked.js)
        // This is Client-Side "Simple" implementation request
        const html = text
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
            .replace(/\*(.*)\*/gim, '<i>$1</i>')
            .replace(/\n/gim, '<br>');
        document.getElementById('html-preview').innerHTML = html;
    });
}
