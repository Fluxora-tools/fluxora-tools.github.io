// Video Tool Logic
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

    if (toolId.includes('youtube')) {
        placeholderText = "Paste YouTube URL";
    } else if (toolId.includes('pinterest')) {
        placeholderText = "Paste Pinterest URL";
    }

    container.innerHTML = `
        <div style="width:100%; max-width:600px; text-align:center;">
            <div class="input-group" style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="text" id="url-input" placeholder="${placeholderText}" style="flex:1; background:rgba(255,255,255,0.05); border:1px solid var(--border); color:white; padding:12px; border-radius:8px;" />
                <button id="fetch-btn" class="btn" style="width:auto; padding:0 30px;">Fetch</button>
            </div>
            
            <div id="loader" style="display:none; margin:30px 0;">
                <div class="spinner"></div>
                <p id="loader-text" style="margin-top:15px; color:var(--text-muted); font-size: 0.9rem;">Connecting to global download network...</p>
            </div>

            <div id="result-area" style="display:none; margin-top:30px; background:rgba(255,255,255,0.03); padding:30px; border-radius:15px; border:1px solid var(--border); text-align:left;">
                <div id="video-meta" style="display:flex; gap:20px; align-items:flex-start; margin-bottom:25px;">
                    <img id="video-thumb" src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=200&h=110" style="width:180px; height:100px; object-fit:cover; border-radius:10px; background:#1e293b;" />
                    <div>
                        <h1 id="video-title" style="margin:0; font-size:1.1rem; color:white; font-weight:600;">Link Extracted</h1>
                        <p id="video-info" style="margin:8px 0 0; font-size:0.85rem; color:var(--text-muted);">Please use the download button below.</p>
                    </div>
                </div>
                <div id="download-actions" style="display:flex; flex-direction:column; gap:12px;">
                    <!-- Actions will be injected here -->
                </div>
                <button id="reset-btn" class="btn btn-secondary" style="width:100%; margin-top:15px; border-top: 1px solid var(--border); padding-top: 15px;">New Search</button>
            </div>

            <div id="error-box" style="display:none; margin-top:30px; padding:20px; border-radius:12px; background:rgba(255, 100, 100, 0.1); border:1px solid rgba(255, 100, 100, 0.2); text-align:left;">
                <p id="error-msg" style="color:#ff8888; font-size:0.9rem; margin-bottom:0; font-weight:bold;"></p>
                <p style="color:var(--text-muted); font-size:0.8rem; margin-top:10px;">Common causes: Shared private link, restricted video, or server downtime. Try another link.</p>
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

    async function handleFetch() {
        const url = urlInput.value.trim();
        if (!url) return;

        loader.style.display = 'block';
        resultArea.style.display = 'none';
        errorBox.style.display = 'none';
        fetchBtn.disabled = true;

        try {
            if (url.includes('youtube') || url.includes('youtu.be')) {
                const vid = extractVideoId(url);
                if (!vid) throw new Error("Invalid YouTube URL");

                videoThumb.src = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
                const isMp3 = toolId.includes('mp3');

                // YouTube: Use direct button and secondary iframes for resilience
                downloadActions.innerHTML = `
                    <a href="https://api.vevioz.com/@api/button/${isMp3 ? 'mp3' : 'videos'}/${vid}" target="_blank" class="btn" style="width:100%; text-align:center; text-decoration:none; background:var(--primary); color:white;">Click to Prepare Download</a>
                    <p style="font-size:0.75rem; color:var(--text-muted); text-align:center;">This will open a secure converter window.</p>
                `;
                resultArea.style.display = 'block';
            } else if (url.includes('pinterest') || url.includes('pin.it')) {
                const scraped = await scrapePinterest(url);
                if (scraped && scraped.url) {
                    videoThumb.src = scraped.thumb || videoThumb.src;
                    downloadActions.innerHTML = `
                        <a href="${scraped.url}" target="_blank" download="pinterest_video.mp4" class="btn" style="width:100%; text-align:center; text-decoration:none; background:var(--primary); color:white;">Download Pinterest Video</a>
                        <p style="font-size:0.75rem; color:var(--text-muted); text-align:center; margin:0;">If it plays in browser, right-click and 'Save Video As'.</p>
                    `;
                    resultArea.style.display = 'block';
                } else {
                    // Try Cobalt Fallback for Pinterest
                    const cobaltRes = await fetchFromCobalt('https://api.v0l.me/api/json', url, toolId);
                    if (cobaltRes) {
                        downloadActions.innerHTML = `<a href="${cobaltRes.url}" target="_blank" class="btn" style="width:100%; text-align:center; text-decoration:none; background:var(--primary); color:white;">Download Now</a>`;
                        resultArea.style.display = 'block';
                    } else {
                        throw new Error("Could not extract media from this Pinterest link.");
                    }
                }
            } else {
                throw new Error("Unsupported URL format.");
            }

            if (resultArea.style.display === 'block') {
                document.getElementById('reset-btn').onclick = () => {
                    resultArea.style.display = 'none';
                    urlInput.value = '';
                    urlInput.focus();
                };
            }

        } catch (e) {
            errorBox.style.display = 'block';
            errorMsg.innerText = "Error: " + e.message;
        }

        loader.style.display = 'none';
        fetchBtn.disabled = false;
    }

    async function scrapePinterest(pUrl) {
        try {
            // Updated Scraper via multiple proxies
            const proxies = [`https://corsproxy.io/?${encodeURIComponent(pUrl)}`, `https://api.allorigins.win/raw?url=${encodeURIComponent(pUrl)}`];
            for (const proxy of proxies) {
                try {
                    const res = await fetch(proxy);
                    const html = await res.text();
                    let videoUrl = html.match(/property="og:video" content="(.*?)"/)?.[1] ||
                        html.match(/"v720P":\{"url":"(.*?)"/)?.[1] ||
                        html.match(/"V_720P":\{"url":"(.*?)"/)?.[1];
                    const thumbUrl = html.match(/property="og:image" content="(.*?)"/)?.[1];
                    if (videoUrl) return { url: videoUrl.replace(/\\u002F/g, '/'), thumb: thumbUrl };
                } catch (pe) { }
            }
        } catch (err) { }
        return null;
    }

    async function fetchFromCobalt(apiUrl, contentUrl, tid) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: contentUrl, videoQuality: "1080", isAudioOnly: tid.includes('mp3') })
            });
            if (!response.ok) return null;
            const data = await response.json();
            return (data.url || data.picker?.[0]?.url) ? data : null;
        } catch (e) { return null; }
    }

    fetchBtn.addEventListener('click', handleFetch);
    urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleFetch(); });
}

function renderConverter(container, toolId) {
    const isToGif = toolId === 'mp4-to-gif';
    container.innerHTML = `
        <div class="converter-box" id="drop-zone" style="border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.02);">
            <i class="fas fa-file-video" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
            <h3>Click or Drag ${isToGif ? 'MP4' : 'GIF'} file</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Max 50MB, Local Processing</p>
            <input type="file" id="file-input" style="display:none;" accept="${isToGif ? 'video/mp4' : 'image/gif'}" />
        </div>
        
        <div id="loader" style="display:none; margin:40px 0; text-align:center;">
            <div class="spinner"></div>
            <p id="progress-text" style="margin-top:15px; color:var(--text-muted);">Converting in your browser...</p>
        </div>

        <div id="result-area" style="display:none; margin:40px 0; text-align:center;">
             <a id="download-btn" href="#" class="btn" style="padding:15px 40px;">Download File</a>
             <button onclick="location.reload()" class="btn btn-secondary" style="margin-top:20px; display:block; margin-left:auto; margin-right:auto;">New Task</button>
        </div>
        <canvas id="proc-canvas" style="display:none;"></canvas>
    `;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const loader = document.getElementById('loader');
    const resultArea = document.getElementById('result-area');
    const downloadBtn = document.getElementById('download-btn');
    const progressText = document.getElementById('progress-text');

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => handleFile(e.target.files[0]);

    async function handleFile(file) {
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) { alert("File too large (Max 50MB)"); return; }
        dropZone.style.display = 'none';
        loader.style.display = 'block';

        try {
            if (isToGif) await convertMp4ToGif(file);
            else await convertGifToMp4(file);
        } catch (e) {
            alert("Processing error. Try a different file.");
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
        const ctx = canvas.getContext('2d');
        canvas.width = 400; // Reduced for performance
        canvas.height = (video.videoHeight / video.videoWidth) * 400;

        const gif = new GIF({ workers: 2, quality: 15, width: canvas.width, height: canvas.height, workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.worker.js' });
        const duration = Math.min(video.duration, 5); // Max 5s for speed
        const frames = 10; // Reduced frames for 2x speed

        for (let i = 0; i < frames; i++) {
            video.currentTime = i * (duration / frames);
            await new Promise(r => video.onseeked = r);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(r => img.onload = r);
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const chunks = [];
        const recorder = new MediaRecorder(canvas.captureStream(30));
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            downloadBtn.href = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
            downloadBtn.download = "fluxora.mp4";
            loader.style.display = 'none'; resultArea.style.display = 'block';
        };
        recorder.start();
        setTimeout(() => recorder.stop(), 2000); // 2s is enough for local check
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
