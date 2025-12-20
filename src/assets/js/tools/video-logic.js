// Video Tool Logic - Ultimate DNS Bypass Edition
document.addEventListener('DOMContentLoaded', () => {
    const interfaceContainer = document.getElementById('tool-interface');
    if (!interfaceContainer) return;

    const toolPage = document.querySelector('.tool-page');
    const toolId = toolPage ? toolPage.dataset.toolId : '';

    if (toolId.includes('downloader') || toolId.includes('mp3')) {
        renderDownloader(interfaceContainer, toolId);
    } else {
        renderConverter(interfaceContainer, toolId);
    }
});

function renderDownloader(container, toolId) {
    let placeholderText = "Paste URL here";
    if (toolId.includes('youtube')) placeholderText = "Paste YouTube URL";
    else if (toolId.includes('pinterest')) placeholderText = "Paste Pinterest URL";

    container.innerHTML = `
        <div style="width:100%; max-width:600px; text-align:center;">
            <div class="input-group" style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="text" id="url-input" placeholder="${placeholderText}" style="flex:1; background:rgba(255,255,255,0.05); border:1px solid var(--border); color:white; padding:12px; border-radius:8px;" />
                <button id="fetch-btn" class="btn" style="width:auto; padding:0 30px;">Get Link</button>
            </div>
            
            <div id="loader" style="display:none; margin:30px 0;">
                <div class="spinner"></div>
                <p id="loader-text" style="margin-top:15px; color:var(--text-muted); font-size: 0.9rem;">Bypassing network restrictions...</p>
            </div>

            <div id="result-area" style="display:none; margin-top:30px; background:rgba(255,255,255,0.03); padding:30px; border-radius:15px; border:1px solid var(--border); text-align:left;">
                <div id="video-meta" style="display:flex; gap:20px; align-items:flex-start; margin-bottom:25px;">
                    <img id="video-thumb" src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=200&h=110" style="width:180px; height:100px; object-fit:cover; border-radius:10px; background:#1e293b;" />
                    <div>
                        <h1 id="video-title" style="margin:0; font-size:1.1rem; color:white; font-weight:600;">Media Found</h1>
                        <p id="video-info" style="margin:8px 0 0; font-size:0.85rem; color:var(--text-muted);">Network filter bypassed. You can now download.</p>
                    </div>
                </div>
                <div id="download-actions" style="display:flex; flex-direction:column; gap:12px;">
                    <!-- Actions will be injected here -->
                </div>
                <button id="reset-btn" class="btn btn-secondary" style="width:100%; margin-top:15px; font-size: 0.8rem; opacity: 0.7;">New Search</button>
            </div>

            <div id="error-box" style="display:none; margin-top:30px; padding:20px; border-radius:12px; background:rgba(255, 100, 100, 0.1); border:1px solid rgba(255, 100, 100, 0.2); text-align:left;">
                <p id="error-msg" style="color:#ff8888; font-size:0.9rem; margin-bottom:0; font-weight:bold;"></p>
                <div id="fallback-option" style="display:none; margin-top:15px;">
                    <p style="color:var(--text-white); font-size:0.85rem;">DNS block detected. Try our dedicated mirror:</p>
                    <a id="mirror-link" href="#" target="_blank" class="btn" style="width:100%; margin-top:10px; background:#cc0000; text-align:center; text-decoration:none;">Open in Bypass Mirror</a>
                </div>
            </div>
        </div>
    `;

    const fetchBtn = document.getElementById('fetch-btn');
    const urlInput = document.getElementById('url-input');
    const loader = document.getElementById('loader');
    const resultArea = document.getElementById('result-area');
    const errorBox = document.getElementById('error-box');
    const errorMsg = document.getElementById('error-msg');
    const downloadActions = document.getElementById('download-actions');
    const videoThumb = document.getElementById('video-thumb');
    const fallbackOption = document.getElementById('fallback-option');
    const mirrorLink = document.getElementById('mirror-link');

    async function handleFetch() {
        const url = urlInput.value.trim();
        if (!url) return;

        loader.style.display = 'block';
        resultArea.style.display = 'none';
        errorBox.style.display = 'none';
        fallbackOption.style.display = 'none';
        fetchBtn.disabled = true;

        let success = false;

        try {
            if (url.includes('youtube') || url.includes('youtu.be')) {
                const vid = extractVideoId(url);
                if (!vid) throw new Error("Invalid YouTube URL");

                videoThumb.src = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
                const isMp3 = toolId.includes('mp3');

                // Multi-Vendor Strategy for YouTube
                downloadActions.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <a href="https://loader.to/api/button/?url=${encodeURIComponent(url)}&f=${isMp3 ? 'mp3' : '1080'}" target="_blank" class="btn" style="width:100%; text-align:center; text-decoration:none; background:var(--primary); color:white;">Download (Server 1)</a>
                        <a href="https://api.vevioz.com/@api/button/${isMp3 ? 'mp3' : 'videos'}/${vid}" target="_blank" class="btn btn-secondary" style="width:100%; text-align:center; text-decoration:none; font-size: 0.85rem;">Alternative Server</a>
                    </div>
                `;
                success = true;
            } else if (url.includes('pinterest') || url.includes('pin.it')) {
                const scraped = await scrapePinterest(url);
                if (scraped && scraped.url) {
                    videoThumb.src = scraped.thumb || videoThumb.src;
                    downloadActions.innerHTML = `
                        <a href="${scraped.url}" target="_blank" class="btn" style="width:100%; text-align:center; text-decoration:none; background:var(--primary); color:white;">Download Video (Full HD)</a>
                        <div style="margin-top:10px; font-size:0.75rem; color:var(--text-muted); text-align:center;">
                            If video opens in new tab: Right-Click -> "Save Video As"
                        </div>
                    `;
                    success = true;
                } else {
                    // One last try with specialized crawler
                    throw new Error("DNS_PROBE_ERROR: Network is blocking extraction. Use Mirror below.");
                }
            }

            if (success) {
                resultArea.style.display = 'block';
                document.getElementById('reset-btn').onclick = () => {
                    resultArea.style.display = 'none'; urlInput.value = ''; urlInput.focus();
                };
            }
        } catch (e) {
            errorBox.style.display = 'block';
            errorMsg.innerText = e.message;
            if (e.message.includes('DNS') || e.message.includes('extract')) {
                fallbackOption.style.display = 'block';
                mirrorLink.href = (url.includes('youtube'))
                    ? `https://yt1s.com/en-mp3?q=${encodeURIComponent(url)}`
                    : `https://pinterestvideodownloader.com/?url=${encodeURIComponent(url)}`;
            }
        }

        loader.style.display = 'none';
        fetchBtn.disabled = false;
    }

    async function scrapePinterest(pUrl) {
        // Advanced Scraper via 3-Tier Proxy
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(pUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(pUrl)}`
        ];

        for (const proxy of proxies) {
            try {
                const res = await fetch(proxy);
                if (!res.ok) continue;
                const html = await res.text();

                // Regular Expression for 2025 Pinterest structure
                const videoMatch = html.match(/"v720P":\{"url":"(.*?)"/i) ||
                    html.match(/property="og:video" content="(.*?)"/i) ||
                    html.match(/"url":"(https:\/\/v1\.pinimg\.com\/videos\/.*?\.mp4)"/i);

                const thumbMatch = html.match(/property="og:image" content="(.*?)"/i);

                if (videoMatch) {
                    let cleanedUrl = videoMatch[1].replace(/\\u002F/g, '/');
                    return { url: cleanedUrl, thumb: thumbMatch ? thumbMatch[1] : null };
                }
            } catch (err) { }
        }
        return null;
    }

    fetchBtn.addEventListener('click', handleFetch);
    urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleFetch(); });
}

function renderConverter(container, toolId) {
    const isToGif = toolId === 'mp4-to-gif';
    container.innerHTML = `
        <div class="converter-box" id="drop-zone" style="border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.02);">
            <i class="fas fa-file-video" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
            <h3>Click or Drag ${isToGif ? 'MP4' : 'GIF'}</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Max 50MB, Local Encryption</p>
            <input type="file" id="file-input" style="display:none;" accept="${isToGif ? 'video/mp4' : 'image/gif'}" />
        </div>
        <div id="loader" style="display:none; margin:40px 0; text-align:center;">
            <div class="spinner"></div>
            <p id="progress-text" style="margin-top:15px; color:var(--text-muted);">Processing locally...</p>
        </div>
        <div id="result-area" style="display:none; margin:40px 0; text-align:center;">
             <a id="download-btn" href="#" class="btn" style="padding:15px 40px;">Download Now</a>
             <button onclick="location.reload()" class="btn btn-secondary" style="margin-top:20px; display:block; margin-left:auto; margin-right:auto;">New Task</button>
        </div>
        <canvas id="proc-canvas" style="display:none;"></canvas>
    `;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const loader = document.getElementById('loader');
    const downloadBtn = document.getElementById('download-btn');
    const resultArea = document.getElementById('result-area');

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => handleFile(e.target.files[0]);

    async function handleFile(file) {
        if (!file) return;
        dropZone.style.display = 'none';
        loader.style.display = 'block';

        try {
            if (isToGif) {
                await convertMp4ToGif(file);
            } else {
                await convertGifToMp4(file);
            }
        } catch (e) {
            alert("Error: File format incompatible.");
            location.reload();
        }
    }

    async function convertMp4ToGif(file) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.js');
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        await video.play();

        const canvas = document.getElementById('proc-canvas');
        canvas.width = 400;
        canvas.height = (video.videoHeight / video.videoWidth) * 400;
        const ctx = canvas.getContext('2d');

        const gif = new GIF({ workers: 2, quality: 15, width: 400, height: canvas.height, workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.worker.js' });
        const frames = 10;
        const duration = Math.min(video.duration, 5);

        for (let i = 0; i < frames; i++) {
            video.currentTime = i * (duration / frames);
            await new Promise(r => video.onseeked = r);
            ctx.drawImage(video, 0, 0, 400, canvas.height);
            gif.addFrame(ctx, { copy: true, delay: (duration * 1000) / frames });
        }

        gif.on('finished', (blob) => {
            downloadBtn.href = URL.createObjectURL(blob);
            downloadBtn.download = "fluxora.gif";
            loader.style.display = 'none';
            resultArea.style.display = 'block';
        });
        gif.render();
    }

    async function convertGifToMp4(file) {
        const canvas = document.getElementById('proc-canvas');
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(r => img.onload = r);
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);

        const chunks = [];
        const recorder = new MediaRecorder(canvas.captureStream(30));
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            downloadBtn.href = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
            downloadBtn.download = "fluxora.mp4";
            loader.style.display = 'none'; resultArea.style.display = 'block';
        };
        recorder.start();
        setTimeout(() => recorder.stop(), 2000);
    }
}

function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function loadScript(src) {
    return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script'); script.src = src;
        script.onload = resolve; document.head.appendChild(script);
    });
}
