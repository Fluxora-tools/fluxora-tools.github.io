// Video Logic Tool - Ultra High Performance & Robust Version
document.addEventListener('DOMContentLoaded', () => {
    const interfaceContainer = document.getElementById('tool-interface');
    if (!interfaceContainer) return;

    const toolPage = document.querySelector('.tool-page');
    const toolId = toolPage ? toolPage.dataset.toolId : '';

    renderVideoTool(interfaceContainer, toolId);
});

function renderVideoTool(container, toolId) {
    const isToGif = toolId === 'mp4-to-gif';
    const isFromGif = toolId === 'gif-to-mp4';
    const isMute = toolId === 'video-mute';
    const isToMp3 = toolId === 'video-to-mp3';

    let acceptType = "video/mp4,video/webm";
    let icon = "fa-file-video";
    let title = "Video Seçin";

    if (isFromGif) {
        acceptType = "image/gif";
        icon = "fa-file-image";
        title = "GIF Seçin";
    }

    container.innerHTML = `
        <div class="converter-box" id="drop-zone" style="border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.02); transition: all 0.3s ease;">
            <i class="fas ${icon}" id="main-icon" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
            <h3 id="main-title">${title}</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Dosyayı sürükleyin veya seçmek için tıklayın</p>
            <input type="file" id="file-input" style="display:none;" accept="${acceptType}" />
        </div>
        
        <div id="loader" style="display:none; margin:40px 0; text-align:center;">
            <div class="spinner"></div>
            <p id="progress-text" style="margin-top:15px; color:var(--text-white); font-weight: bold; font-size: 1.2rem; text-shadow: 0 0 10px var(--primary-glow);">Başlatılıyor... %0</p>
        </div>

        <div id="result-area" style="display:none; margin:40px 0; text-align:center;">
             <div id="preview-container" style="margin-bottom: 25px; border-radius: 12px; overflow: hidden; border: 1px solid var(--border);"></div>
             <a id="download-btn" href="#" class="btn" style="padding:15px 50px; font-weight: bold; background: var(--primary); box-shadow: 0 0 20px var(--primary-glow);">Sonucu İndir</a>
             <button onclick="location.reload()" class="btn btn-secondary" style="margin-top:20px; display:block; margin-left:auto; margin-right:auto; opacity: 0.6;">Yeni İşlem</button>
        </div>
        <canvas id="proc-canvas" style="display:none;"></canvas>
    `;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const loader = document.getElementById('loader');
    const resultArea = document.getElementById('result-area');
    const downloadBtn = document.getElementById('download-btn');
    const progressText = document.getElementById('progress-text');

    // Drag and Drop Effects
    dropZone.onclick = () => fileInput.click();
    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary)';
        dropZone.style.background = 'rgba(99, 102, 241, 0.05)';
    };
    dropZone.ondragleave = () => {
        dropZone.style.borderColor = 'var(--border)';
        dropZone.style.background = 'rgba(255,255,255,0.02)';
    };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border)';
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    };

    fileInput.onchange = (e) => { if (e.target.files.length) handleFile(e.target.files[0]); };

    async function handleFile(file) {
        if (!file) return;
        dropZone.style.display = 'none';
        loader.style.display = 'block';

        try {
            if (isToGif) await convertMp4ToGif(file);
            else if (isFromGif) await convertGifToMp4(file);
            else if (isMute) await muteVideo(file);
            else if (isToMp3) await extractAudio(file);
        } catch (e) {
            console.error(e);
            alert("İşlem sırasında hata oluştu. Lütfen dosya tipini veya boyutunu kontrol edin.");
            location.reload();
        }
    }

    async function convertMp4ToGif(file) {
        progressText.innerText = "Kütüphaneler yükleniyor...";
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.js');

        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;

        // Ensure metadata is loaded before starting
        await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;
            video.onerror = reject;
            setTimeout(() => reject(new Error("Video yükleme zaman aşımı")), 10000);
        });

        const canvas = document.getElementById('proc-canvas');
        const ctx = canvas.getContext('2d');
        const scale = 320; // High speed resolution
        canvas.width = scale;
        canvas.height = (video.videoHeight / video.videoWidth) * scale;

        const gif = new GIF({
            workers: 4,
            quality: 30,
            width: canvas.width,
            height: canvas.height,
            workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.worker.js'
        });

        const maxDuration = Math.min(video.duration, 8); // Max 8 sec for stability
        const framesToCapture = 15;
        const step = maxDuration / framesToCapture;

        for (let i = 0; i < framesToCapture; i++) {
            const time = i * step;
            video.currentTime = time;

            // Wait for seeked with fallback
            await new Promise(r => {
                const timeout = setTimeout(r, 2000);
                video.onseeked = () => { clearTimeout(timeout); r(); };
            });

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            gif.addFrame(ctx, { copy: true, delay: (maxDuration * 1000) / framesToCapture });

            const pct = Math.round((i / framesToCapture) * 100);
            progressText.innerText = `Kareler Yakalanıyor: %${pct}`;
        }

        gif.on('progress', (p) => {
            progressText.innerText = `Dosya Oluşturuluyor: %${Math.round(p * 100)}`;
        });

        gif.on('finished', (blob) => {
            showResult(blob, "fluxora.gif", "image");
        });

        gif.render();
    }

    async function convertGifToMp4(file) {
        progressText.innerText = "Dosya analiz ediliyor...";
        const canvas = document.getElementById('proc-canvas');
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(r => img.onload = r);

        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);

        const chunks = [];
        const recorder = new MediaRecorder(canvas.captureStream(25));
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => showResult(new Blob(chunks, { type: 'video/mp4' }), "fluxora.mp4", "video");

        recorder.start();
        setTimeout(() => recorder.stop(), 2500);
        progressText.innerText = "Video oluşturuluyor...";
    }

    async function muteVideo(file) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        await video.play();

        const chunks = [];
        const stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
        stream.getAudioTracks().forEach(t => stream.removeTrack(t));

        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => showResult(new Blob(chunks, { type: 'video/mp4' }), "sessiz-video.mp4", "video");

        recorder.start();
        video.onended = () => recorder.stop();
        progressText.innerText = "SES SİLİNİYOR: %50";
    }

    async function extractAudio(file) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        await video.play();

        const chunks = [];
        const stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
        stream.getVideoTracks().forEach(t => stream.removeTrack(t));

        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => showResult(new Blob(chunks, { type: 'audio/mp3' }), "audio.mp3", "audio");

        recorder.start();
        video.onended = () => recorder.stop();
        progressText.innerText = "SES AYRIŞTIRILIYOR...";
    }

    function showResult(blob, filename, type) {
        const url = URL.createObjectURL(blob);
        downloadBtn.href = url;
        downloadBtn.download = filename;
        const pc = document.getElementById('preview-container');
        if (type === 'image') pc.innerHTML = `<img src="${url}" style="max-width:100%;" />`;
        else if (type === 'video') pc.innerHTML = `<video src="${url}" controls style="max-width:100%;"></video>`;
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
