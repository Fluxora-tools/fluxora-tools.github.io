// Video Logic Tool - Optimized for Speed
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
    let title = "Select Video File";

    if (isFromGif) {
        acceptType = "image/gif";
        icon = "fa-file-image";
        title = "Select GIF File";
    }

    container.innerHTML = `
        <div class="converter-box" id="drop-zone" style="border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.02); transition: 0.3s;">
            <i class="fas ${icon}" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
            <h3>${title}</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Drag & Drop or Click to Select</p>
            <input type="file" id="file-input" style="display:none;" accept="${acceptType}" />
        </div>
        
        <div id="loader" style="display:none; margin:40px 0; text-align:center;">
            <div class="spinner"></div>
            <p id="progress-text" style="margin-top:15px; color:var(--text-muted); font-weight: bold; font-size: 1.1rem;">İşleniyor: %0</p>
        </div>

        <div id="result-area" style="display:none; margin:40px 0; text-align:center;">
             <div id="preview-container" style="margin-bottom: 20px;"></div>
             <a id="download-btn" href="#" class="btn" style="padding:15px 40px;">Download Result</a>
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

    // Drag and Drop Logic
    dropZone.onclick = () => fileInput.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary)'; };
    dropZone.ondragleave = () => { dropZone.style.borderColor = 'var(--border)'; };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border)';
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    };

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
            alert("Processing error. Try a shorter file.");
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
        canvas.width = 320; // Lower resolution for extreme speed
        canvas.height = (video.videoHeight / video.videoWidth) * 320;

        const gif = new GIF({
            workers: 4,
            quality: 30, // Lower quality for extreme speed
            width: canvas.width,
            height: canvas.height,
            workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js_fixed/0.2.0/gif.worker.js'
        });

        const duration = Math.min(video.duration, 10); // Capture up to 10s
        const frames = 15; // Balanced frame count
        const interval = duration / frames;

        for (let i = 0; i < frames; i++) {
            video.currentTime = i * interval;
            await new Promise(r => video.onseeked = r);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            gif.addFrame(ctx, { copy: true, delay: (duration * 1000) / frames });
            progressText.innerText = `Kareler Yakalanıyor: %${Math.round((i / frames) * 100)}`;
        }

        gif.on('progress', (p) => {
            progressText.innerText = `GIF Oluşturuluyor: %${Math.round(p * 100)}`;
        });

        gif.on('finished', (blob) => {
            showResult(blob, "fluxora.gif", "image");
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

        const chunks = [];
        const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: 'video/webm' });

        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            showResult(new Blob(chunks), "fluxora.mp4", "video");
        };

        recorder.start();
        setTimeout(() => recorder.stop(), 3000);
        progressText.innerText = "Video Kodlanıyor...";
    }

    async function muteVideo(file) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        await video.play();

        const chunks = [];
        const stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
        stream.getAudioTracks().forEach(track => stream.removeTrack(track));

        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            showResult(new Blob(chunks), "muted.mp4", "video");
        };
        recorder.start();
        video.onended = () => recorder.stop();
        progressText.innerText = "SES SİLİNİYOR: %50...";
    }

    async function extractAudio(file) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        await video.play();

        const chunks = [];
        const stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
        stream.getVideoTracks().forEach(track => stream.removeTrack(track));

        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            showResult(new Blob(chunks), "audio.mp3", "audio");
        };
        recorder.start();
        video.onended = () => recorder.stop();
        progressText.innerText = "SES AYRIŞTIRILIYOR...";
    }

    function showResult(blob, filename, type) {
        const url = URL.createObjectURL(blob);
        downloadBtn.href = url;
        downloadBtn.download = filename;
        const previewContainer = document.getElementById('preview-container');
        if (type === 'image') previewContainer.innerHTML = `<img src="${url}" style="max-width:100%; border-radius:10px; border:1px solid var(--border);" />`;
        else if (type === 'video') previewContainer.innerHTML = `<video src="${url}" controls style="max-width:100%; border-radius:10px; border:1px solid var(--border);"></video>`;
        else previewContainer.innerHTML = `<audio src="${url}" controls style="width:100%"></audio>`;
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
