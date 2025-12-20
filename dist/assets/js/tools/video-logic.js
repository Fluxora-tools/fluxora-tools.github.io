// Video Logic Tool - Final Robust Execution Engine
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
    let title = "Dosya Seçin";

    if (isFromGif) {
        acceptType = "image/gif";
        icon = "fa-file-image";
        title = "GIF Seçin";
    }

    container.innerHTML = `
        <div class="converter-box" id="drop-zone" style="border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.02); transition: 0.3s;">
            <i class="fas ${icon}" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
            <h3>${title}</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Videonuzu buraya sürükleyin</p>
            <input type="file" id="file-input" style="display:none;" accept="${acceptType}" />
        </div>
        
        <div id="loader" style="display:none; margin:40px 0; text-align:center;">
            <div class="spinner"></div>
            <p id="progress-text" style="margin-top:15px; color:#fff; font-weight:bold;">Hazırlanıyor... %0</p>
        </div>

        <div id="result-area" style="display:none; margin:40px 0; text-align:center;">
             <div id="preview-container" style="margin-bottom: 20px;"></div>
             <a id="download-btn" href="#" class="btn" style="padding:15px 40px;">Sonucu İndir</a>
             <button onclick="location.reload()" class="btn btn-secondary" style="margin-top:20px; display:block; margin-left:auto; margin-right:auto;">Yeni Dosya</button>
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
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary)'; };
    dropZone.ondragleave = () => { dropZone.style.borderColor = 'var(--border)'; };
    dropZone.ondrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

    fileInput.onchange = (e) => handleFile(e.target.files[0]);

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
            alert("Hata: Video işlenemedi. Lütfen başka bir dosya deneyin.");
            location.reload();
        }
    }

    async function convertMp4ToGif(file) {
        progressText.innerText = "Sistem hazırlanıyor...";
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.js');

        const video = document.createElement('video');
        video.style.display = 'none';
        document.body.appendChild(video); // Dom'a ekle (Kritik)

        const objectUrl = URL.createObjectURL(file);
        video.src = objectUrl;
        video.muted = true;
        video.setAttribute('playsinline', '');

        // Güçlendirilmiş Yükleme Kontrolü
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Video yükleme zaman aşımı")), 15000);
            video.onloadeddata = () => { clearTimeout(timeout); resolve(); };
            video.onerror = () => reject(new Error("Video formatı desteklenmiyor"));
            video.load();
        });

        // "Wake up" dekoder
        await video.play();
        video.pause();

        const canvas = document.getElementById('proc-canvas');
        const ctx = canvas.getContext('2d');
        const scale = 320;
        canvas.width = scale;
        canvas.height = (video.videoHeight / video.videoWidth) * scale;

        const gif = new GIF({
            workers: 2,
            quality: 20,
            width: canvas.width,
            height: canvas.height,
            workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.worker.js'
        });

        const duration = Math.min(video.duration, 8);
        const frames = 15;
        const interval = duration / frames;

        for (let i = 0; i < frames; i++) {
            video.currentTime = i * interval;

            // Bekleme Fallback
            await new Promise(r => {
                const t = setTimeout(r, 1500);
                video.onseeked = () => { clearTimeout(t); r(); };
            });

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            gif.addFrame(ctx, { copy: true, delay: (duration * 1000) / frames });
            progressText.innerText = `İşleniyor: %${Math.round((i / frames) * 100)}`;
        }

        gif.on('progress', (p) => {
            progressText.innerText = `Oluşturuluyor: %${Math.round(p * 100)}`;
        });

        gif.on('finished', (blob) => {
            document.body.removeChild(video);
            URL.revokeObjectURL(objectUrl);
            showResult(blob, "fluxora.gif", "image");
        });

        gif.render();
    }

    async function convertGifToMp4(file) {
        progressText.innerText = "Video hazırlanıyor...";
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
        recorder.onstop = () => showResult(new Blob(chunks), "muted.mp4", "video");
        recorder.start();
        video.onended = () => recorder.stop();
        progressText.innerText = "Ses kaldırılıyor...";
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
        recorder.onstop = () => showResult(new Blob(chunks), "audio.mp3", "audio");
        recorder.start();
        video.onended = () => recorder.stop();
        progressText.innerText = "Ses alınıyor...";
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
