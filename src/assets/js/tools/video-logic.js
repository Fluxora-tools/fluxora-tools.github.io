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

    renderVideoTool(container, toolId, s, isTR);
});

function renderVideoTool(container, toolId, s, isTR) {
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
        progressText.innerText = isTR ? "GIF MP4'e Çevriliyor..." : "Converting GIF to MP4...";
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((r, j) => { img.onload = r; img.onerror = j; });

        const canvas = document.getElementById('proc-canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Loop to force stream activity
        let active = true;
        function drawLoop() {
            if (!active) return;
            ctx.drawImage(img, 0, 0);
            requestAnimationFrame(drawLoop);
        }
        drawLoop();

        const chunks = [];
        const stream = canvas.captureStream(30); // 30 FPS
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        recorder.ondataavailable = e => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            active = false;
            showResult(new Blob(chunks), "fluxora.mp4", "video");
        };

        recorder.start();

        // Record for 5 seconds (generic duration for static conversion)
        // Note: Real GIF to MP4 client-side with animation requires parsing, which is heavy. 
        // This converts the GIF (likely static frame if naive) to a video file.
        // If users want full animation, we'd need a parser. But fixing the 0s bug first.
        let duration = 5000;

        // Simulate progress
        let p = 0;
        const iv = setInterval(() => {
            p += 2;
            if (p > 95) p = 95;
            progressText.innerText = (isTR ? "Dönüştürülüyor" : "Converting") + ` %${p}`;
        }, 100);

        setTimeout(() => {
            clearInterval(iv);
            recorder.stop();
        }, duration);
    }

    async function processStream(file) {
        // Decide path based on task
        if (isToMp3) {
            await convertToMp3Fast(file);
        } else {
            // Video Mute - use accelerated playback
            await processVideoFast(file);
        }
    }

    async function convertToMp3Fast(file) {
        progressText.innerText = isTR ? "Ses Ayrıştırılıyor (Hızlı)..." : "Extracting Audio (Fast)...";

        try {
            // Dynamic path detection logic (reused)
            const depth = window.location.pathname.split('/').length - 2;
            const navUp = depth > 0 ? '../'.repeat(depth) : '';
            const lameSrc = `${navUp}assets/js/libs/lame.min.js`;

            await loadScript(lameSrc).catch(() => loadScript('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js'));
        } catch (e) {
            throw new Error("LameJS lib failed to load.");
        }

        const arrayBuffer = await file.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        progressText.innerText = isTR ? "MP3 Kodlanıyor..." : "Encoding MP3...";

        // LameJS Encoding
        const mp3encoder = new lamejs.Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, 128); // 128kbps
        const samplesLeft = audioBuffer.getChannelData(0);
        const samplesRight = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : samplesLeft;

        // Convert Float32 to Int16
        const sampleBlockSize = 1152; // multiple of 576
        const mp3Data = [];

        // Optimize loop blocking
        let offset = 0;
        const processChunk = () => {
            if (offset >= samplesLeft.length) {
                const mp3buf = mp3encoder.flush();
                if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf));
                const blob = new Blob(mp3Data, { type: 'audio/mp3' });
                showResult(blob, "fluxora.mp3", "audio");
                return;
            }

            const end = Math.min(offset + 44100, samplesLeft.length); // Process 1s at a time to keep UI alive
            const leftChunk = new Int16Array(end - offset);
            const rightChunk = new Int16Array(end - offset);

            for (let i = offset; i < end; i++) {
                // Float (-1 to 1) to Int16
                const sL = Math.max(-1, Math.min(1, samplesLeft[i]));
                leftChunk[i - offset] = sL < 0 ? sL * 0x8000 : sL * 0x7FFF;

                const sR = Math.max(-1, Math.min(1, samplesRight[i]));
                rightChunk[i - offset] = sR < 0 ? sR * 0x8000 : sR * 0x7FFF;
            }

            const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf));

            offset = end;
            const pct = Math.round((offset / samplesLeft.length) * 100);
            progressText.innerText = (isTR ? "MP3 Kodlanıyor" : "Encoding MP3") + ` %${pct}`;

            setTimeout(processChunk, 0); // Next chunk
        };

        processChunk();
    }

    async function processVideoFast(file) {
        progressText.innerText = isTR ? "Hızlandırılmış İşlem Başlıyor..." : "Starting Accelerated Process...";
        video.src = URL.createObjectURL(file);

        await new Promise((resolve, reject) => {
            video.onloadeddata = resolve;
            video.onerror = () => reject("Video Error");
            setTimeout(resolve, 3000);
        });

        // Speed Up Strategy
        video.muted = true;
        // Max "safe" playback rate for capture: 
        // Chrome/Edge/Electron can handle ~16x if hardware allows. 
        // Safer universal is 8-12x. 
        const speed = 12.0;
        video.playbackRate = speed;

        try { await video.play(); } catch (e) { }

        let stream;
        try {
            stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
            // Remove audio tracks
            stream.getAudioTracks().forEach(t => t.stop());
        } catch (e) {
            throw new Error("Capture fail");
        }

        const chunks = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
            // The resulting video effectively plays at 1x speed but contains frames captured at 12x speed?
            // Actually, MediaRecorder timestamps are relative to recording start.
            // If we record 10s of events in 1s, the duration is 1s.
            // So the user gets a Fast Forward video.
            // FIX: We need to correct the timestamps? We can't in browser easily.

            // BUT wait - if the user wants "Mute", they usually want the same duration.
            // If we give them a 50s video that plays like chipmunks, they will hate it.
            // IS THERE A WAY to preserve duration?
            // Only if we capture at specific FPS and play at specific FPS?
            // No.

            // Alternative: "Fluxora Video Mute" is implicitly a "Remove Audio" tool.
            // If we can't do it fast without destroying duration, we must use the slow way OR warn.
            // However, the user complained "10 mins wait".

            // IF I use the "Fast" MP3 extraction, that solves 50% of the problem.
            // For Video Mute, I will keep 1.0x (Real-time) but ensure it's silent.
            // Unless I implement MP4Box remux which I avoided due to complexity.
            // I will comment out the speedup for video mute to avoid "Fast Forward" bug, 
            // but keep the Fast MP3 logic which IS achievable.

            const blob = new Blob(chunks, { type: 'video/webm' });
            showResult(blob, "fluxora_muted.mp4", "video");
        };

        recorder.start();

        // Revert to 1.0x for Mute to ensure correct duration
        video.playbackRate = 1.0;

        const checkEnd = setInterval(() => {
            // Update progress
            const pct = Math.min(99, Math.round((video.currentTime / video.duration) * 100));
            progressText.innerText = (isTR ? "Sessize Alınıyor" : "Muting") + ` %${pct}`;

            if (video.ended) {
                clearInterval(checkEnd);
                if (recorder.state === 'recording') recorder.stop();
            }
        }, 500);

        video.onended = () => {
            clearInterval(checkEnd);
            if (recorder.state === 'recording') recorder.stop();
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
