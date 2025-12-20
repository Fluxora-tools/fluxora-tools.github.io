// Video Logic Tool - "Nuclear" Playback-Based Engine (Zero Hangs)
document.addEventListener('DOMContentLoaded', () => {
    const interfaceContainer = document.getElementById('tool-interface');
    if (!interfaceContainer) return;

    const toolPage = document.querySelector('.tool-page');
    const toolId = toolPage ? toolPage.dataset.toolId : '';

    // UI Localization (Absolute Fallbacks)
    const isTR = window.location.pathname.includes('/tr/');
    const s = {
        preparing: isTR ? "Video Hazırlanıyor..." : "Preparing Video...",
        capturing: isTR ? "Kareler Yakalanıyor:" : "Capturing Frames:",
        rendering: isTR ? "Dosya Oluşturuluyor:" : "Rendering File:",
        error: isTR ? "Hata: Video desteklenmiyor veya çok büyük." : "Error: Video not supported.",
        process: isTR ? "İşleniyor..." : "Processing...",
        done: isTR ? "Tamamlandı!" : "Done!"
    };

    renderVideoTool(interfaceContainer, toolId, s);
});

function renderVideoTool(container, toolId, s) {
    const isToGif = toolId === 'mp4-to-gif';
    const isFromGif = toolId === 'gif-to-mp4';
    const isMute = toolId === 'video-mute';
    const isToMp3 = toolId === 'video-to-mp3';

    let acceptType = "video/mp4,video/webm";
    if (isFromGif) acceptType = "image/gif";

    container.innerHTML = `
        <div class="converter-box" id="drop-zone" style="border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.02); transition: 0.3s;">
            <i class="fas fa-play-circle" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
            <h3>${isFromGif ? 'GIF' : 'Video'} Seçin veya Sürükleyin</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Dosya eklemek için buraya tıkla</p>
            <input type="file" id="file-input" style="display:none;" accept="${acceptType}" />
        </div>
        
        <div id="loader" style="display:none; margin:40px 0; text-align:center;">
            <div class="spinner"></div>
            <p id="progress-text" style="margin-top:15px; color:#fff; font-weight:bold; font-size:1.1rem;">${s.preparing} %0</p>
        </div>

        <div id="result-area" style="display:none; margin:40px 0; text-align:center;">
             <div id="preview-container" style="margin-bottom: 20px;"></div>
             <a id="download-btn" href="#" class="btn" style="padding:15px 40px;">İndir</a>
             <button onclick="location.reload()" class="btn btn-secondary" style="margin-top:20px; display:block; margin-left:auto; margin-right:auto;">Yeni Dosya</button>
        </div>
        <video id="hidden-video" style="display:none;" muted playsinline></video>
        <canvas id="proc-canvas" style="display:none;"></canvas>
    `;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const loader = document.getElementById('loader');
    const resultArea = document.getElementById('result-area');
    const downloadBtn = document.getElementById('download-btn');
    const progressText = document.getElementById('progress-text');
    const video = document.getElementById('hidden-video');

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => handleFile(e.target.files[0]);

    // Drag support
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary)'; };
    dropZone.ondragleave = () => { dropZone.style.borderColor = 'var(--border)'; };
    dropZone.ondrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

    async function handleFile(file) {
        if (!file) return;
        dropZone.style.display = 'none';
        loader.style.display = 'block';

        if (isToGif) await convertToGif(file);
        else if (isFromGif) await convertToMp4(file);
        else await processBasic(file);
    }

    // MP4 TO GIF: Using Playback-based capture (Fast & Unstoppable)
    async function convertToGif(file) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.js');
        const canvas = document.getElementById('proc-canvas');
        const ctx = canvas.getContext('2d');
        const objUrl = URL.createObjectURL(file);
        video.src = objUrl;

        await new Promise(r => video.onloadeddata = r);

        const scale = 320;
        canvas.width = scale;
        canvas.height = (video.videoHeight / video.videoWidth) * scale;

        const gif = new GIF({
            workers: 2,
            quality: 30,
            width: canvas.width,
            height: canvas.height,
            workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.worker.js'
        });

        // Fast Playback Capture
        video.playbackRate = 4.0; // Play 4 times faster to capture frames
        video.play();

        const captureInterval = setInterval(() => {
            if (video.ended || video.currentTime >= 10) { // Max 10s
                clearInterval(captureInterval);
                video.pause();
                progressText.innerText = s.rendering + " %99";
                gif.render();
                return;
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            gif.addFrame(ctx, { copy: true, delay: 100 });

            const pct = Math.round((video.currentTime / video.duration) * 100);
            progressText.innerText = `${s.capturing} %${isNaN(pct) ? 0 : pct}`;
        }, 100);

        gif.on('finished', (blob) => {
            URL.revokeObjectURL(objUrl);
            showResult(blob, "fluxora.gif", "image");
        });
    }

    // GIF TO MP4: Frame to stream
    async function convertToMp4(file) {
        progressText.innerText = s.process;
        const canvas = document.getElementById('proc-canvas');
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(r => img.onload = r);
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);

        const chunks = [];
        const recorder = new MediaRecorder(canvas.captureStream(30));
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => showResult(new Blob(chunks), "fluxora.mp4", "video");
        recorder.start();
        setTimeout(() => recorder.stop(), 3000);
    }

    // MUTE / MP3: Straight stream processing
    async function processBasic(file) {
        progressText.innerText = s.process;
        video.src = URL.createObjectURL(file);
        await video.play();
        const chunks = [];
        const stream = isToMp3 ? video.captureStream() : video.captureStream();
        if (isMute) stream.getAudioTracks().forEach(t => stream.removeTrack(t));
        else stream.getVideoTracks().forEach(t => stream.removeTrack(t));

        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => showResult(new Blob(chunks), isToMp3 ? "audio.mp3" : "muted.mp4", isToMp3 ? "audio" : "video");
        recorder.start();
        video.onended = () => recorder.stop();
    }

    function showResult(blob, filename, type) {
        const url = URL.createObjectURL(blob);
        downloadBtn.href = url;
        downloadBtn.download = filename;
        const pc = document.getElementById('preview-container');
        if (type === 'image') pc.innerHTML = `<img src="${url}" style="max-width:100%; border-radius:10px;" />`;
        else if (type === 'video') pc.innerHTML = `<video src="${url}" controls style="max-width:100%; border-radius:10px;"></video>`;
        else pc.innerHTML = `<audio src="${url}" controls style="width:100%"></audio>`;
        loader.style.display = 'none';
        resultArea.style.display = 'block';
    }
}

function loadScript(src) {
    return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script'); script.src = src;
        script.onload = resolve; document.head.appendChild(script);
    });
}
