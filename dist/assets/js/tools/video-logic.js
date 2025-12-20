// Video Logic Tool - FFmpeg-Style Playback Engine (Zero Freeze)
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('tool-interface');
    if (!container) return;

    const toolId = document.querySelector('.tool-page')?.dataset.toolId || '';
    const isTR = window.location.pathname.includes('/tr/');

    const s = {
        preparing: isTR ? "Video Hazırlanıyor..." : "Preparing Video...",
        capturing: isTR ? "Kareler Yakalanıyor:" : "Capturing Frames:",
        rendering: isTR ? "GIF Tamamlanıyor:" : "Finalizing GIF:",
        error: isTR ? "Hata: Video desteklenmiyor veya çok büyük." : "Error: Video not supported.",
        done: isTR ? "İndirmeye Hazır!" : "Ready to Download!"
    };

    renderVideoTool(container, toolId, s);
});

function renderVideoTool(container, toolId, s) {
    const isToGif = toolId === 'mp4-to-gif';
    const isFromGif = toolId === 'gif-to-mp4';
    const isMute = toolId === 'video-mute';
    const isToMp3 = toolId === 'video-to-mp3';

    container.innerHTML = `
        <div class="converter-box" id="drop-zone" style="border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.02);">
            <i class="fas fa-play-circle" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
            <h3>${isFromGif ? 'GIF' : 'Video'} Seçin</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Dosyayı sürükleyin veya tıklayın</p>
            <input type="file" id="file-input" style="display:none;" accept="${isFromGif ? 'image/gif' : 'video/*'}" />
        </div>
        
        <div id="loader" style="display:none; margin:40px 0; text-align:center;">
            <div class="spinner"></div>
            <p id="progress-text" style="margin-top:15px; color:#fff; font-weight:bold; font-size:1.1rem;">%0</p>
        </div>

        <div id="result-area" style="display:none; margin:40px 0; text-align:center;">
             <div id="preview-container" style="margin-bottom: 20px;"></div>
             <a id="download-btn" href="#" class="btn" style="padding:15px 40px; background:var(--primary); color:#fff; text-decoration:none; border-radius:8px; font-weight:bold;">İndir</a>
             <button onclick="location.reload()" class="btn btn-secondary" style="margin-top:20px; display:block; margin-left:auto; margin-right:auto;">Yeni Dosya</button>
        </div>
        <video id="worker-video" style="display:none;" muted playsinline></video>
        <canvas id="proc-canvas" style="display:none;"></canvas>
    `;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const loader = document.getElementById('loader');
    const resultArea = document.getElementById('result-area');
    const downloadBtn = document.getElementById('download-btn');
    const progressText = document.getElementById('progress-text');
    const video = document.getElementById('worker-video');

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => handleFile(e.target.files[0]);

    async function handleFile(file) {
        if (!file) return;
        dropZone.style.display = 'none';
        loader.style.display = 'block';

        try {
            if (isToGif) await convertToGif(file);
            else if (isFromGif) await convertToMp4(file);
            else await processStream(file);
        } catch (e) {
            console.error(e);
            alert(s.error);
            location.reload();
        }
    }

    async function convertToGif(file) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.js');
        const objUrl = URL.createObjectURL(file);
        video.src = objUrl;

        await new Promise(r => {
            video.onloadeddata = r;
            setTimeout(r, 2000); // Fail-safe
        });

        const canvas = document.getElementById('proc-canvas');
        const ctx = canvas.getContext('2d');
        const scale = 320;
        canvas.width = scale;
        canvas.height = (video.videoHeight / video.videoWidth) * scale || 180;

        const gif = new GIF({
            workers: 2,
            quality: 30,
            width: canvas.width,
            height: canvas.height,
            workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.worker.js'
        });

        // The "Nuclear" Playback Method (As fast as FFmpeg)
        video.playbackRate = 4.0; // Process 4x faster
        video.play();

        const captureTimer = setInterval(() => {
            if (video.ended || video.currentTime >= 10) { // Max 10s for browser safety
                clearInterval(captureTimer);
                video.pause();
                progressText.innerText = s.rendering + " %95";
                gif.render();
                return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            gif.addFrame(ctx, { copy: true, delay: 100 });

            const pct = Math.min(Math.round((video.currentTime / Math.min(video.duration, 10)) * 100), 99);
            progressText.innerText = `${s.capturing} %${pct}`;
        }, 120);

        gif.on('finished', (blob) => {
            URL.revokeObjectURL(objUrl);
            showResult(blob, "fluxora.gif", "image");
        });
    }

    async function convertToMp4(file) {
        progressText.innerText = "İşleniyor...";
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(r => img.onload = r);
        const canvas = document.getElementById('proc-canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);

        const chunks = [];
        const stream = canvas.captureStream(25);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => showResult(new Blob(chunks), "fluxora.mp4", "video");
        recorder.start();
        setTimeout(() => recorder.stop(), 3000);
    }

    async function processStream(file) {
        progressText.innerText = "İşleniyor...";
        video.src = URL.createObjectURL(file);
        await video.play();
        const stream = video.captureStream();
        if (isMute) stream.getAudioTracks().forEach(t => stream.removeTrack(t));
        if (isToMp3) stream.getVideoTracks().forEach(t => stream.removeTrack(t));

        const chunks = [];
        const recorder = new MediaRecorder(stream, { mimeType: isToMp3 ? 'audio/webm' : 'video/webm' });
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => showResult(new Blob(chunks), isToMp3 ? "audio.mp3" : "muted.mp4", isToMp3 ? "audio" : "video");
        recorder.start();
        video.onended = () => recorder.stop();
    }

    function showResult(blob, filename, type) {
        loader.style.display = 'none';
        resultArea.style.display = 'block';
        const url = URL.createObjectURL(blob);
        downloadBtn.href = url;
        downloadBtn.download = filename;
        const pc = document.getElementById('preview-container');
        if (type === 'image') pc.innerHTML = `<img src="${url}" style="max-width:100%; border-radius:10px;" />`;
        else if (type === 'video') pc.innerHTML = `<video src="${url}" controls style="max-width:100%; border-radius:10px;"></video>`;
        else pc.innerHTML = `<audio src="${url}" controls style="width:100%"></audio>`;
    }
}

function loadScript(src) {
    return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script'); script.src = src;
        script.onload = resolve; document.head.appendChild(script);
    });
}
