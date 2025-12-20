// Video Tool Logic - Nuclear Reliability Edition
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
    let placeholderText = "URL Yapıştırın";
    if (toolId.includes('youtube')) placeholderText = "YouTube Linki Yapıştırın";
    else if (toolId.includes('pinterest')) placeholderText = "Pinterest Linki Yapıştırın";

    container.innerHTML = `
        <div style="width:100%; max-width:600px; text-align:center;">
            <div class="input-group" style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="text" id="url-input" placeholder="${placeholderText}" style="flex:1; background:rgba(255,255,255,0.05); border:1px solid var(--border); color:white; padding:12px; border-radius:8px;" />
                <button id="fetch-btn" class="btn" style="width:auto; padding:0 30px; background: var(--primary);">İndir</button>
            </div>
            
            <div id="loader" style="display:none; margin:30px 0;">
                <div class="spinner"></div>
                <p style="margin-top:15px; color:var(--text-muted); font-size: 0.9rem;">Sunucuya bağlanılıyor (Engeller aşılıyor)...</p>
            </div>

            <div id="result-area" style="display:none; margin-top:30px; background:rgba(255,255,255,0.03); padding:30px; border-radius:15px; border:1px solid var(--border); text-align:center;">
                <div id="video-meta" style="margin-bottom:25px;">
                    <img id="video-thumb" src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=200&h=110" style="width:100%; max-width:300px; height:160px; object-fit:cover; border-radius:12px; border:1px solid var(--border); margin: 0 auto 15px;" />
                    <h2 id="video-title" style="font-size:1.1rem; color:white; margin-bottom:5px;">İçerik Hazır</h2>
                    <p style="font-size:0.85rem; color:var(--text-muted);">Aşağıdaki butonları kullanarak indirin.</p>
                </div>
                <div id="download-actions" style="display:grid; grid-template-columns: 1fr; gap:12px;">
                    <!-- Dinamik Butonlar -->
                </div>
                <button id="reset-btn" class="btn btn-secondary" style="width:100%; margin-top:15px; font-size: 0.8rem; height: 40px;">Yeni Arama</button>
            </div>

            <div id="error-box" style="display:none; margin-top:30px; padding:20px; border-radius:12px; background:rgba(255, 100, 100, 0.1); border:1px solid rgba(255, 100, 100, 0.2); text-align:left;">
                <p id="error-msg" style="color:#ff8888; font-size:0.9rem; margin-bottom:10px; font-weight:bold;"></p>
                <div id="force-redirect" style="display:block;">
                    <p style="color:white; font-size:0.85rem; margin-bottom:12px;">Tarayıcınız indirme sunucularına ulaşamıyor. <b>"Hızlı Çözüm"</b> butonu ile engeli aşın:</p>
                    <a id="bypass-btn" href="#" target="_blank" class="btn" style="width:100%; background:#ff0000; text-align:center; text-decoration:none; padding:15px 0;">HIZLI ÇÖZÜM (ENGELİ AŞ)</a>
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
    const bypassBtn = document.getElementById('bypass-btn');

    async function handleFetch() {
        const url = urlInput.value.trim();
        if (!url) return;

        loader.style.display = 'block';
        resultArea.style.display = 'none';
        errorBox.style.display = 'none';
        fetchBtn.disabled = true;

        // Bypass Link Hazırla (Eğer her şey çökerse)
        if (url.includes('youtube')) {
            bypassBtn.href = `https://yt1s.com/en-mp3?q=${encodeURIComponent(url)}`;
        } else if (url.includes('pinterest')) {
            bypassBtn.href = `https://pinterestvideodownloader.com/?url=${encodeURIComponent(url)}`;
        } else {
            bypassBtn.href = `https://cobalt.tools`;
        }

        try {
            let success = false;
            const isMp3 = toolId.includes('mp3');

            if (url.includes('youtube') || url.includes('youtu.be')) {
                const vid = extractVideoId(url);
                if (vid) {
                    videoThumb.src = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
                    downloadActions.innerHTML = `
                        <a href="https://loader.to/api/button/?url=${encodeURIComponent(url)}&f=${isMp3 ? 'mp3' : '1080'}" target="_blank" class="btn" style="background:#cc0000; color:white; text-decoration:none; text-align:center; padding:15px 0;">Sunucu 1 (MP3/MP4)</a>
                        <a href="https://api.vevioz.com/@api/button/${isMp3 ? 'mp3' : 'videos'}/${vid}" target="_blank" class="btn btn-secondary" style="font-size:0.85rem; text-decoration:none; text-align:center;">Sunucu 2 (Hızlı)</a>
                    `;
                    success = true;
                }
            } else if (url.includes('pinterest') || url.includes('pin.it')) {
                const scraped = await scrapePinterest(url);
                if (scraped && scraped.url) {
                    videoThumb.src = scraped.thumb || videoThumb.src;
                    downloadActions.innerHTML = `
                        <a href="${scraped.url}" target="_blank" class="btn" style="background:#E60023; color:white; text-decoration:none; text-align:center; padding:15px 0;">Videonun URL'sini Aç</a>
                        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:5px;">Video açılınca sağ tıklayıp "Farklı Kaydet" yapın.</p>
                    `;
                    success = true;
                }
            }

            if (success) {
                resultArea.style.display = 'block';
                document.getElementById('reset-btn').onclick = () => {
                    resultArea.style.display = 'none'; urlInput.value = ''; urlInput.focus();
                };
            } else {
                throw new Error("Sistem bu linki şu an işleyemiyor.");
            }

        } catch (e) {
            errorBox.style.display = 'block';
            errorMsg.innerText = "Hata: " + e.message;
        }

        loader.style.display = 'none';
        fetchBtn.disabled = false;
    }

    async function scrapePinterest(pUrl) {
        // En güçlü 2 proxy ile deneme
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(pUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(pUrl)}`
        ];
        for (const proxy of proxies) {
            try {
                const res = await fetch(proxy);
                const html = await res.text();
                const v = html.match(/"v720P":\{"url":"(.*?)"/i) || html.match(/property="og:video" content="(.*?)"/i);
                const t = html.match(/property="og:image" content="(.*?)"/i);
                if (v) return { url: v[1].replace(/\\u002F/g, '/'), thumb: t ? t[1] : null };
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
            <h3>${isToGif ? 'MP4 Seçin' : 'GIF Seçin'}</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Tamamen cihazınızda işlenir (Hızlı)</p>
            <input type="file" id="file-input" style="display:none;" accept="${isToGif ? 'video/mp4' : 'image/gif'}" />
        </div>
        <div id="loader" style="display:none; margin:40px 0; text-align:center;">
            <div class="spinner"></div>
            <p id="progress-text" style="margin-top:15px; color:var(--text-muted);">İşleniyor...</p>
        </div>
        <div id="result-area" style="display:none; margin:40px 0; text-align:center;">
             <a id="download-btn" href="#" class="btn" style="padding:15px 40px;">Hemen İndir</a>
             <button onclick="location.reload()" class="btn btn-secondary" style="margin-top:20px; display:block; margin: 0 auto;">Yeni İşlem</button>
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
            if (isToGif) await convertMp4ToGif(file);
            else await convertGifToMp4(file);
        } catch (e) {
            alert("Hata oluştu, lütfen dosyayı kontrol edin.");
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
        canvas.width = 300; // Daha hızlı işlem için düşük çözünürlük
        canvas.height = (video.videoHeight / video.videoWidth) * 300;
        const ctx = canvas.getContext('2d');
        const gif = new GIF({ workers: 2, quality: 20, width: 300, height: canvas.height, workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.worker.js' });
        const frames = 8; // Max hız için düşük frame
        const duration = Math.min(video.duration, 4);
        for (let i = 0; i < frames; i++) {
            video.currentTime = i * (duration / frames);
            await new Promise(r => video.onseeked = r);
            ctx.drawImage(video, 0, 0, 300, canvas.height);
            gif.addFrame(ctx, { copy: true, delay: 200 });
        }
        gif.on('finished', (blob) => {
            downloadBtn.href = URL.createObjectURL(blob);
            downloadBtn.download = "fluxora.gif";
            loader.style.display = 'none'; resultArea.style.display = 'block';
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
        setTimeout(() => recorder.stop(), 1500);
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
