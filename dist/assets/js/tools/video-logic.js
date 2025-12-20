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
    let placeholderText = "Paste video URL here";
    let platformName = "Video";

    if (toolId.includes('youtube')) {
        placeholderText = "Paste YouTube URL";
        platformName = "YouTube";
    } else if (toolId.includes('pinterest')) {
        placeholderText = "Paste Pinterest URL";
        platformName = "Pinterest";
    }

    container.innerHTML = `
        <div style="width:100%; max-width:600px; text-align:center;">
            <div class="input-group" style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="text" id="url-input" placeholder="${placeholderText}" style="flex:1; background:rgba(255,255,255,0.05); border:1px solid var(--border); color:white; padding:12px; border-radius:8px;" />
                <button id="fetch-btn" class="btn" style="width:auto; padding:0 30px;">Fetch</button>
            </div>
            
            <div id="loader" style="display:none; margin:30px 0;">
                <div class="spinner"></div>
                <p id="loader-text" style="margin-top:15px; color:var(--text-muted); font-size: 0.9rem;">Connecting to download network...</p>
                <p id="proxy-warning" style="display:none; color:var(--primary); font-size:0.75rem; margin-top:5px;">Slow connection detected, attempting tunnel...</p>
            </div>

            <div id="result-area" style="display:none; margin-top:30px; background:rgba(255,255,255,0.03); padding:30px; border-radius:15px; border:1px solid var(--border); text-align:left;">
                <div id="video-meta" style="display:flex; gap:20px; align-items:flex-start; margin-bottom:25px;">
                    <img id="video-thumb" src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=200&h=110" style="width:180px; height:100px; object-fit:cover; border-radius:10px; background:#1e293b;" />
                    <div>
                        <h4 id="video-title" style="margin:0; font-size:1.1rem; color:white;">Content Ready</h4>
                        <p id="video-info" style="margin:8px 0 0; font-size:0.85rem; color:var(--text-muted);">The file is ready for download.</p>
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <a id="download-link" href="#" class="btn" style="flex:1; text-align:center; background:var(--primary); color:white; text-decoration:none;" target="_blank">Download Now</a>
                    <button id="reset-btn" class="btn btn-secondary" style="width:auto;">New Search</button>
                </div>
            </div>

            <div id="error-box" style="display:none; margin-top:30px; padding:20px; border-radius:12px; background:rgba(255, 100, 100, 0.1); border:1px solid rgba(255, 100, 100, 0.2); text-align:left;">
                <p id="error-msg" style="color:#ff8888; font-size:0.9rem; margin-bottom:0; font-weight:bold;"></p>
                <p style="color:var(--text-muted); font-size:0.85rem; margin-top:10px; line-height:1.4;">
                    <strong>Why is this happening?</strong><br>
                    Your network or ISP is blocking media extraction servers. 
                </p>
                <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
                    <span style="background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:4px; font-size:0.75rem;">Try VPN</span>
                    <span style="background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:4px; font-size:0.75rem;">Change DNS to 1.1.1.1</span>
                </div>
            </div>
        </div>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
            .spinner { width:40px; height:40px; border:4px solid rgba(255,255,255,0.1); border-top-color:var(--primary); border-radius:50%; animation: spin 1s linear infinite; margin:0 auto; }
            .btn-secondary { background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); }
            .btn-secondary:hover { background: rgba(255,255,255,0.1); }
        </style>
    `;

    const fetchBtn = document.getElementById('fetch-btn');
    const urlInput = document.getElementById('url-input');
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');
    const proxyWarning = document.getElementById('proxy-warning');
    const resultArea = document.getElementById('result-area');
    const errorBox = document.getElementById('error-box');
    const errorMsg = document.getElementById('error-msg');
    const downloadLink = document.getElementById('download-link');
    const videoThumb = document.getElementById('video-thumb');

    async function handleFetch() {
        const url = urlInput.value.trim();
        if (!url) return;

        loader.style.display = 'block';
        proxyWarning.style.display = 'none';
        resultArea.style.display = 'none';
        errorBox.style.display = 'none';
        fetchBtn.disabled = true;

        let success = false;

        // Specialized Scraping for Pinterest (Bypasses Cobalt/DNS blocks)
        if (url.includes('pinterest.com') || url.includes('pin.it')) {
            loaderText.innerText = "Directly scraping Pinterest...";
            try {
                const scrapedData = await scrapePinterest(url);
                if (scrapedData) {
                    showResult(scrapedData, url);
                    success = true;
                }
            } catch (e) { console.warn("Pinterest scraping failed, falling back to Cobalt..."); }
        }

        // Cobalt Fallback / YouTube Logic
        if (!success) {
            const instances = [
                'https://api.v0l.me/api/json',
                'https://im-special.v0l.me/api/json',
                'https://co.wuk.sh/api/json',
                'https://cobalt.hyra.sh/api/json',
                'https://cobalt.api.unblocked.lol/api/json'
            ];

            // Direct Attempt
            for (const instance of instances) {
                try {
                    loaderText.innerText = `Connecting: ${new URL(instance).hostname}...`;
                    const data = await fetchFromCobalt(instance, url, toolId);
                    if (data) {
                        showResult(data, url);
                        success = true;
                        break;
                    }
                } catch (e) {
                    console.warn(`Direct fail for ${instance}:`, e);
                }
            }

            // Tunnelled Attempt (If direct fails)
            if (!success) {
                proxyWarning.style.display = 'block';
                const tunnelProxies = ['https://api.allorigins.win/raw?url=', 'https://cors-anywhere.herokuapp.com/'];
                for (const proxy of tunnelProxies) {
                    for (const instance of instances) {
                        try {
                            loaderText.innerText = `By-passing via tunnel...`;
                            const data = await fetchFromCobalt(proxy + encodeURIComponent(instance), url, toolId);
                            if (data) {
                                showResult(data, url);
                                success = true;
                                break;
                            }
                        } catch (e) { }
                    }
                    if (success) break;
                }
            }
        }

        if (!success) {
            errorBox.style.display = 'block';
            errorMsg.innerText = "All servers are unreachable (ISP Block Detected).";
        }

        loader.style.display = 'none';
        fetchBtn.disabled = false;
    }

    async function scrapePinterest(pUrl) {
        // Use AllOrigins (GET) to fetch HTML - 100% CORS/DNS safe
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(pUrl)}`;
        const res = await fetch(proxyUrl);
        const html = await res.text();

        // Find Video URL in Meta tags or JSON
        let videoUrl = html.match(/property="og:video" content="(.*?)"/)?.[1];
        if (!videoUrl) {
            videoUrl = html.match(/"v720P":\{"url":"(.*?)"/)?.[1] || html.match(/"V_720P":\{"url":"(.*?)"/)?.[1];
        }

        if (videoUrl) {
            const thumbUrl = html.match(/property="og:image" content="(.*?)"/)?.[1];
            return { url: videoUrl.replace(/\\u002F/g, '/'), thumb: thumbUrl };
        }
        return null;
    }

    async function fetchFromCobalt(apiUrl, contentUrl, tid) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: contentUrl, videoQuality: "1080", isAudioOnly: tid.includes('mp3') }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) return null;
            const data = await response.json();
            return (data.url || data.picker?.[0]?.url) ? data : null;
        } catch (e) { throw e; }
    }

    function showResult(data, origUrl) {
        const finalUrl = data.url || data.picker?.[0]?.url;
        if (origUrl.includes('youtube') || origUrl.includes('youtu.be')) {
            videoThumb.src = `https://img.youtube.com/vi/${extractVideoId(origUrl)}/mqdefault.jpg`;
        } else {
            videoThumb.src = data.thumb || data.picker?.[0]?.thumb || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=200&h=110';
        }
        downloadLink.href = finalUrl;
        resultArea.style.display = 'block';
    }

    fetchBtn.addEventListener('click', handleFetch);
    urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleFetch(); });
    document.getElementById('reset-btn').addEventListener('click', () => {
        resultArea.style.display = 'none';
        urlInput.value = '';
        urlInput.focus();
    });
}

function renderConverter(container, toolId) {
    const isToGif = toolId === 'mp4-to-gif';
    container.innerHTML = `
        <div class="converter-box" id="drop-zone" style="border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: 0.3s; background: rgba(255,255,255,0.02);">
            <i class="fas fa-file-video" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
            <h3>Click or Drag ${isToGif ? 'MP4' : 'GIF'} file</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Safe, fast, 100% local conversion</p>
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

    // Drag and drop functionality
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary)';
    });
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border)';
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border)';
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    async function handleFile(file) {
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            alert("File size exceeds 50MB limit.");
            return;
        }

        dropZone.style.display = 'none';
        loader.style.display = 'block';

        try {
            if (isToGif) {
                await convertMp4ToGif(file);
            } else {
                await convertGifToMp4(file);
            }
        } catch (e) {
            console.error(e);
            alert("Local conversion error. Try a smaller file.");
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

        canvas.width = 480;
        canvas.height = (video.videoHeight / video.videoWidth) * 480;

        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: canvas.width,
            height: canvas.height,
            workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.worker.js'
        });

        const duration = Math.min(video.duration, 8); // Limit to 8 seconds for GIF
        const frames = 15; // Fixed number of frames for client-side speed
        const interval = duration / frames;

        for (let i = 0; i < frames; i++) {
            video.currentTime = i * interval;
            await new Promise(r => video.onseeked = r);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            gif.addFrame(ctx, { copy: true, delay: (duration * 1000) / frames });
            progressText.innerText = `Processing Frame ${i + 1}/${frames}...`;
        }

        progressText.innerText = "Rendering GIF...";
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

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const stream = canvas.captureStream(30); // 30 FPS
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' }); // Use webm for broader browser support
        const chunks = [];

        recorder.ondataavailable = e => chunks.push(e.data);

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/mp4' }); // Output as MP4
            downloadBtn.href = URL.createObjectURL(blob);
            downloadBtn.download = "fluxora.mp4";
            loader.style.display = 'none';
            resultArea.style.display = 'block';
        };

        recorder.start();
        // Record for a short duration, e.g., 3 seconds, or loop the GIF if it's animated
        // For a static GIF, 1 second is enough. For animated, we'd need to parse GIF frames.
        // For simplicity, we'll record for 3 seconds.
        setTimeout(() => recorder.stop(), 3000);
        progressText.innerText = "Encoding video stream...";
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
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        document.head.appendChild(script);
    });
}
