// Video Logic Tool - Final "Direct-Capture" Engine (Anti-Freeze)
document.addEventListener('DOMContentLoaded', () => {
    const interfaceContainer = document.getElementById('tool-interface');
    if (!interfaceContainer) return;

    const toolPage = document.querySelector('.tool-page');
    const toolId = toolPage ? toolPage.dataset.toolId : '';

    // UI Localization (Absolute fix for undefined)
    const isTR = window.location.pathname.includes('/tr/');
    const s = {
        preparing: isTR ? "Video Hazırlanıyor..." : "Preparing Video...",
        capturing: isTR ? "Kareler Yakalanıyor:" : "Capturing Frames:",
        rendering: isTR ? "GIF Oluşturuluyor:" : "Rendering GIF...",
        error: isTR ? "Hata: Video desteklenmiyor veya açılamadı." : "Error: Video not supported.",
        process: isTR ? "İşleniyor..." : "Processing...",
        select: isTR ? "Video Seçin" : "Select Video"
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
            <i class="fas fa-video" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
            <h3>${s.select}</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Tıklayın veya sürükleyin</p>
            <input type="file" id="file-input" style="display:none;" accept="${acceptType}" />
        </div>
        
        <div id="loader" style="display:none; margin:40px 0; text-align:center;">
            <div class="spinner"></div>
            <p id="progress-text" style="margin-top:15px; color:#fff; font-weight:bold; font-size:1.1rem;">%0</p>
        </div>

        <div id="result-area" style="display:none; margin:40px 0; text-align:center;">
             <div id="preview-container" style="margin-bottom: 20px;"></div>
             <a id="download-btn" href="#" class="btn" style="padding:15px 40px;">İndir</a>
             <button onclick="location.reload()" class="btn btn-secondary" style="margin-top:20px; display:block; margin-left:auto; margin-right:auto;">Yeni Dosya</button>
        </div>
        <!-- Hidden but active video to keep decoder awake -->
        <div style="position:fixed; bottom:0; left:0; width:1px; height:1px; overflow:hidden; opacity:0.1; z-index:-1;">
            <video id="worker-video" muted playsinline></video>
        </div>
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
        progressText.innerText = s.preparing + " %5";

        try {
            if (isToGif) await convertToGif(file, s);
            else if (isFromGif) await convertToMp4(file, s);
            else await processSimple(file, isMute, isToMp3, s);
        } catch (e) {
            console.error(e);
            alert(s.error);
            location.reload();
        }
    }

    async function convertToGif(file, s) {
        // Load libraries
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.js');
        const objUrl = URL.createObjectURL(file);
        video.src = objUrl;

        await new Promise(r => {
            video.onloadeddata = r;
            setTimeout(r, 3000); // Fail-safe
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

        const duration = Math.min(video.duration || 10, 8);
        const frames = 15;
        const interval = duration / frames;

        for (let i = 0; i < frames; i++) {
            video.currentTime = i * interval;
            // Immediate frame capture with seek fail-safe
            await new Promise(resolve => {
                const onSeek = () => { video.removeEventListener('seeked', onSeek); resolve(); };
                video.addEventListener('seeked', onSeek);
                setTimeout(onSeek, 800);
            });
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            gif.addFrame(ctx, { copy: true, delay: (duration * 1000) / frames });
            progressText.innerText = `${s.capturing} %${Math.round((i / frames) * 100)}`;
        }

        gif.on('progress', (p) => {
            progressText.innerText = `${s.rendering} %${Math.round(p * 100)}`;
        });

        gif.on('finished', (blob) => {
            URL.revokeObjectURL(objUrl);
            showResult(blob, "fluxora.gif", "image");
        });
        gif.render();
    }

    async function convertToMp4(file, s) {
        progressText.innerText = s.preparing + " %50";
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(r => img.onload = r);
        const canvas = document.getElementById('proc-canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);

        const chunks = [];
        const recorder = new MediaRecorder(canvas.captureStream(30));
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => showResult(new Blob(chunks), "fluxora.mp4", "video");
        recorder.start();
        setTimeout(() => recorder.stop(), 3000);
    }

    async function processSimple(file, mute, mp3, s) {
        progressText.innerText = s.process;
        video.src = URL.createObjectURL(file);
        await video.play();
        const stream = video.captureStream();
        if (mute) stream.getAudioTracks().forEach(t => stream.removeTrack(t));
        if (mp3) stream.getVideoTracks().forEach(t => stream.removeTrack(t));

        const chunks = [];
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => showResult(new Blob(chunks), mp3 ? "audio.mp3" : "muted.mp4", mp3 ? "audio" : "video");
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
