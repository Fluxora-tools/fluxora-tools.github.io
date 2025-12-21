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
        <video id="worker-video" style="position:fixed; bottom:0; right:0; width:1px; height:1px; opacity:0.01; pointer-events:none; z-index:-1;" muted playsinline></video>
        <canvas id="proc-canvas" style="display:none;"></canvas>
    `;
    /* 
     */
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const loader = document.getElementById('loader');
    const resultArea = document.getElementById('result-area');
    const downloadBtn = document.getElementById('download-btn');
    const progressText = document.getElementById('progress-text');
    const video = document.getElementById('worker-video');

    // Drag & Drop Handling
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false); // Prevent global drop
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropZone.addEventListener('dragenter', () => {
        dropZone.style.borderColor = 'var(--primary)';
        dropZone.style.background = 'rgba(255,255,255,0.05)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'var(--border)';
        dropZone.style.background = 'rgba(255,255,255,0.02)';
    });

    dropZone.addEventListener('drop', (e) => {
        dropZone.style.borderColor = 'var(--border)';
        dropZone.style.background = 'rgba(255,255,255,0.02)';
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFile(files[0]);
    });

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => handleFile(e.target.files[0]);

    async function handleFile(file) {
        if (!file) return;

        // Validation
        if (isToGif && !file.type.startsWith('video/')) {
            alert(isTR ? "Lütfen bir video dosyası seçin." : "Please select a video file.");
            return;
        }
        if (isFromGif && file.type !== 'image/gif') {
            alert(isTR ? "Lütfen bir GIF dosyası seçin." : "Please select a GIF file.");
            return;
        }

        dropZone.style.display = 'none';
        loader.style.display = 'block';
        progressText.innerText = s.preparing;

        try {
            if (isToGif) await convertToGif(file);
            else if (isFromGif) await convertToMp4(file);
            else await processStream(file);
        } catch (e) {
            console.error("Conversion Failed:", e);
            alert(s.error + "\nDetail: " + e.message);
            location.reload();
        }
    }

    async function convertToGif(file) {
        // Dynamic path detection for assets
        // Assume standard structure: /pages/tools/ -> ../../assets
        // Or root: / -> assets/
        // Simple heuristic: check if we are deep
        const depth = window.location.pathname.split('/').length - 2;
        const navUp = depth > 0 ? '../'.repeat(depth) : '';

        // Default to local/relative
        let workerSrc = `${navUp}assets/js/libs/gif.worker.js`;
        const localGifSrc = `${navUp}assets/js/libs/gif.js`;

        try {
            // Validate local existence first (HEAD request or try load)
            await loadScript(localGifSrc);
        } catch (e) {
            console.warn("Local GIF lib not found/failed, switching to CDN...", e);
            // FALLBACK TO CDN FOR BOTH
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js');
            workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js';
        }

        const objUrl = URL.createObjectURL(file);
        video.src = objUrl;

        await new Promise((resolve, reject) => {
            if (video.readyState >= 2) resolve();
            video.onloadeddata = resolve;
            video.onerror = () => reject("Video Load Error");
            setTimeout(() => {
                if (video.readyState >= 2) resolve();
                else reject("Video Timeout - Codec issue or file corrupt?");
            }, 5000);
        });

        const canvas = document.getElementById('proc-canvas');
        // Optimization: willReadFrequently
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const scale = 320;

        const aspect = (video.videoHeight > 0 && video.videoWidth > 0)
            ? (video.videoHeight / video.videoWidth)
            : 0.5625;

        canvas.width = scale;
        canvas.height = aspect * scale;

        const gif = new GIF({
            workers: 2,
            quality: 30,
            width: canvas.width,
            height: canvas.height,
            workerScript: workerSrc
        });

        // "Nuclear" Playback Method - Optimized
        video.playbackRate = 4.0;
        video.muted = true;

        await video.play();

        return new Promise((resolve, reject) => {
            const captureTimer = setInterval(() => {
                // Check if stuck
                if (video.currentTime === 0 && !video.paused) {
                    // Attempt escape
                    video.currentTime = 0.1;
                }

                if (video.ended || video.currentTime >= video.duration || video.currentTime >= 60) {
                    clearInterval(captureTimer);
                    video.pause();
                    progressText.innerText = s.rendering;
                    gif.render();
                    return;
                }

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                gif.addFrame(ctx, { copy: true, delay: 100 });

                const currentTime = video.currentTime || 0;
                const duration = video.duration || 10;
                const pct = Math.min(Math.round((currentTime / Math.min(duration, 60)) * 100), 99);
                progressText.innerText = `${s.capturing} %${pct}`;
            }, 120);

            gif.on('finished', (blob) => {
                URL.revokeObjectURL(objUrl);
                showResult(blob, "fluxora.gif", "image");
                resolve();
            });

            gif.on('abort', () => reject("GIF Render Aborted"));
        });
    }

    async function convertToMp4(file) {
        progressText.innerText = isTR ? "GIF Çözümleniyor..." : "Decoding GIF...";
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((r, j) => { img.onload = r; img.onerror = j; });

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
        progressText.innerText = isTR ? "Hazırlanıyor..." : "Preparing...";
        video.src = URL.createObjectURL(file);
        video.muted = false; // Important: Unmute source so we can capture audio

        await new Promise((resolve, reject) => {
            video.onloadeddata = resolve;
            video.onerror = () => reject("Video Load Error");
            setTimeout(resolve, 3000); // Failsafe
        });

        // Volume Hack: Set volume to 1.0 but mute the element via property to avoid hearing it, 
        // while still allowing captureStream to capture audio? 
        // Actually, for captureStream, the video MUST play.
        // We use the 1px hack, so it's fine.
        video.volume = 1.0;

        try {
            await video.play();
        } catch (e) {
            console.warn("Autoplay block?", e);
        }

        let stream;
        try {
            // MozCaptureStream for Firefox, captureStream for others
            stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
        } catch (e) {
            throw new Error("Screen capture not supported in this browser.");
        }

        // Feature Logic
        let mimeType = 'video/webm;codecs=vp9';

        if (isMute) {
            // Remove audio tracks from the stream
            const audioTracks = stream.getAudioTracks();
            audioTracks.forEach(track => {
                stream.removeTrack(track);
                track.stop(); // Stop the track
            });
            mimeType = 'video/webm;codecs=vp9';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
        }
        else if (isToMp3) {
            // Remove video tracks
            const videoTracks = stream.getVideoTracks();
            videoTracks.forEach(track => {
                stream.removeTrack(track);
                track.stop();
            });

            // Check if audio exists
            if (stream.getAudioTracks().length === 0) {
                video.pause();
                throw new Error(isTR ? "Videoda ses bulunamadı." : "No audio found in video.");
            }

            // Audio mime types
            if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
            else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
            else mimeType = ''; // Default
        }

        const chunks = [];
        let recorder;

        try {
            recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        } catch (e) {
            throw new Error("MediaRecorder Error: " + e.message);
        }

        recorder.ondataavailable = e => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
            // Determine extension
            let ext = "mp4";
            let type = "video";
            if (isToMp3) {
                ext = "mp3"; // It's actually WEBM audio, but we name it mp3 for user convenience
                type = "audio";
            } else if (isMute) {
                ext = "mp4";
                type = "video";
            }
            showResult(blob, `fluxora.${ext}`, type);
        };

        recorder.start();

        // Timeout watchdog for super long videos
        const checkEnd = setInterval(() => {
            if (video.ended) {
                clearInterval(checkEnd);
                recorder.stop();
            }
        }, 500);

        video.onended = () => {
            clearInterval(checkEnd);
            if (recorder.state !== 'inactive') recorder.stop();
        };
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
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script'); script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Script load failed: ${src}`));
        document.head.appendChild(script);
    });
}
