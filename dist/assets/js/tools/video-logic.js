// Video Logic Tool - Bulletproof Version
document.addEventListener('DOMContentLoaded', () => {
    const interfaceContainer = document.getElementById('tool-interface');
    if (!interfaceContainer) return;

    const toolPage = document.querySelector('.tool-page');
    const toolId = toolPage ? toolPage.dataset.toolId : '';

    // UI Localization (Fixed undefined issue)
    const isTR = window.location.pathname.includes('/tr/');
    const s = {
        preparing: isTR ? "Hazırlanıyor..." : "Preparing...",
        capturing: isTR ? "Kareler Yakalanıyor:" : "Capturing Frames:",
        rendering: isTR ? "GIF Oluşturuluyor:" : "Rendering GIF:",
        error: isTR ? "Hata: Video açılamadı veya desteklenmiyor." : "Error: Cannot open video.",
        processing: isTR ? "İşleniyor..." : "Processing..."
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
            <i class="fas fa-file-video" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
            <h3>${isFromGif ? 'GIF' : 'Video'} Seçin</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Tıklayın veya sürükleyin</p>
            <input type="file" id="file-input" style="display:none;" accept="${acceptType}" />
        </div>
        
        <div id="loader" style="display:none; margin:40px 0; text-align:center;">
            <div class="spinner"></div>
            <p id="progress-text" style="margin-top:15px; color:#fff; font-weight:bold; font-size:1.1rem;">${s.preparing} %0</p>
        </div>

        <div id="result-area" style="display:none; margin:40px 0; text-align:center;">
             <div id="preview-container" style="margin-bottom: 20px;"></div>
             <a id="download-btn" href="#" class="btn" style="padding:15px 40px;">İndir</a>
             <button onclick="location.reload()" class="btn btn-secondary" style="margin-top:20px; display:block; margin-left:auto; margin-right:auto;">Yeni İşlem</button>
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

    // Drag support
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary)'; };
    dropZone.ondragleave = () => { dropZone.style.borderColor = 'var(--border)'; };
    dropZone.ondrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

    async function handleFile(file) {
        if (!file) return;
        dropZone.style.display = 'none';
        loader.style.display = 'block';

        try {
            if (isToGif) await convertMp4ToGif(file, s);
            else if (isFromGif) await convertGifToMp4(file, s);
            else if (isMute) await muteVideo(file, s);
            else if (isToMp3) await extractAudio(file, s);
        } catch (e) {
            console.error(e);
            alert(s.error);
            location.reload();
        }
    }

    async function convertMp4ToGif(file, s) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.js');
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.setAttribute('playsinline', '');

        // Wait for enough data instead of full metadata
        await new Promise((resolve) => {
            video.onloadeddata = resolve;
            setTimeout(resolve, 3000); // Fail-safe
        });

        const canvas = document.getElementById('proc-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = (video.videoHeight / video.videoWidth) * 300;

        const gif = new GIF({
            workers: 2,
            quality: 20,
            width: canvas.width,
            height: canvas.height,
            workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.worker.js'
        });

        const duration = Math.min(video.duration || 5, 8);
        const frames = 15;
        const interval = duration / frames;

        // NEW: Sequential Seek & Capture (More robust than parallel)
        for (let i = 0; i < frames; i++) {
            video.currentTime = i * interval;
            await new Promise(r => {
                const onSeek = () => { resolveSeek(); };
                const resolveSeek = () => {
                    video.removeEventListener('seeked', onSeek);
                    r();
                };
                video.addEventListener('seeked', onSeek);
                setTimeout(resolveSeek, 1500); // Force skip if stuck
            });
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            gif.addFrame(ctx, { copy: true, delay: (duration * 1000) / frames });
            progressText.innerText = `${s.capturing} %${Math.round((i / frames) * 100)}`;
        }

        gif.on('progress', (p) => {
            progressText.innerText = `${s.rendering} %${Math.round(p * 100)}`;
        });

        gif.on('finished', (blob) => showResult(blob, "fluxora.gif", "image"));
        gif.render();
    }

    async function convertGifToMp4(file, s) {
        const canvas = document.getElementById('proc-canvas');
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(r => img.onload = r);
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);

        const chunks = [];
        const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: 'video/webm' });
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => showResult(new Blob(chunks), "fluxora.mp4", "video");
        recorder.start();
        setTimeout(() => recorder.stop(), 3000);
        progressText.innerText = s.processing;
    }

    async function muteVideo(file, s) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        await video.play();
        const chunks = [];
        const stream = video.captureStream();
        stream.getAudioTracks().forEach(t => stream.removeTrack(t));
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => showResult(new Blob(chunks), "muted.mp4", "video");
        recorder.start();
        video.onended = () => recorder.stop();
        progressText.innerText = s.processing;
    }

    async function extractAudio(file, s) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        await video.play();
        const chunks = [];
        const stream = video.captureStream();
        stream.getVideoTracks().forEach(t => stream.removeTrack(t));
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => showResult(new Blob(chunks), "audio.mp3", "audio");
        recorder.start();
        video.onended = () => recorder.stop();
        progressText.innerText = s.processing;
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
