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
        const objUrl = URL.createObjectURL(file);
        img.src = objUrl;

        // MUST attach to DOM for some browsers to animate GIFs properly
        img.style.position = 'fixed';
        img.style.left = '-10000px';
        img.style.top = '-10000px';
        img.style.width = '1px';
        img.style.height = '1px';
        document.body.appendChild(img);

        await new Promise((r, j) => {
            img.onload = r;
            img.onerror = () => j(new Error("GIF Load Error"));
        });

        const canvas = document.getElementById('proc-canvas');
        canvas.width = img.naturalWidth || 500;
        canvas.height = img.naturalHeight || 500;
        const ctx = canvas.getContext('2d');

        const chunks = [];
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 8000000
        });

        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

        return new Promise((resolve) => {
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/mp4' });
                showResult(blob, "fluxora.mp4", "video");
                URL.revokeObjectURL(objUrl);
                document.body.removeChild(img);
                resolve();
            };

            recorder.start();

            let start = Date.now();
            const duration = 5000; // 5s recording for GIFs

            const interval = setInterval(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const elapsed = Date.now() - start;
                const pct = Math.min(Math.round((elapsed / duration) * 100), 99);
                progressText.innerText = (isTR ? "Dönüştürülüyor" : "Converting") + ` %${pct}`;

                if (elapsed >= duration) {
                    clearInterval(interval);
                    recorder.stop();
                }
            }, 33); // ~30 FPS
        });
    }

    async function processStream(file) {
        if (isToMp3) {
            await convertToMp3Fast(file);
        } else if (isMute) {
            await muteVideoInstant(file);
        } else {
            await processVideoSlow(file); // Default/fallback
        }
    }

    async function muteVideoInstant(file) {
        progressText.innerText = isTR ? "Anlık Sessize Alınıyor..." : "Muting (Instant)...";

        try {
            const depth = window.location.pathname.split('/').length - 2;
            const navUp = depth > 0 ? '../'.repeat(depth) : '';
            const mp4boxSrc = `${navUp}assets/js/libs/mp4box.all.min.js`;
            // Try local first, then stable CDN
            await loadScript(mp4boxSrc).catch(() => loadScript('https://unpkg.com/mp4box@0.5.2/dist/mp4box.all.min.js'));
        } catch (e) {
            console.warn("MP4Box load fail, falling back to slow mute");
            return await processVideoSlow(file);
        }

        if (typeof MP4Box === 'undefined') {
            return await processVideoSlow(file);
        }

        const mp4box = MP4Box.createFile();
        const reader = new FileReader();

        reader.onload = function (e) {
            const arrayBuffer = e.target.result;
            arrayBuffer.fileStart = 0;

            mp4box.onReady = function (info) {
                const outMp4 = MP4Box.createFile();
                let videoTrack = info.tracks.find(t => t.type === 'video');

                if (!videoTrack) {
                    alert(isTR ? "Hata: Video kanalı bulunamadı." : "Error: No video track found.");
                    location.reload();
                    return;
                }

                // Verify extraction capability
                if (typeof mp4box.setExtractionConfig !== 'function') {
                    console.warn("setExtractionConfig missing, falling back to slow mute");
                    processVideoSlow(file);
                    return;
                }

                const trackOptions = {
                    id: videoTrack.id,
                    type: videoTrack.type,
                    timescale: videoTrack.timescale,
                    duration: videoTrack.duration,
                    width: videoTrack.video.width,
                    height: videoTrack.video.height,
                    nb_samples: videoTrack.nb_samples,
                    codec: videoTrack.codec,
                    avcConfig: videoTrack.avcConfig,
                    hevcConfig: videoTrack.hevcConfig
                };

                outMp4.addTrack(trackOptions);
                mp4box.setExtractionConfig(videoTrack.id, null, { nb_samples: videoTrack.nb_samples });

                let samplesCount = 0;
                mp4box.onSamples = function (id, user, samples) {
                    samples.forEach(sample => {
                        outMp4.addSample(id, sample.data, {
                            dts: sample.dts,
                            pts: sample.pts,
                            duration: sample.duration,
                            description: sample.description,
                            is_sync: sample.is_sync
                        });
                        samplesCount++;
                    });

                    if (samplesCount >= videoTrack.nb_samples) {
                        const blob = new Blob([outMp4.getBuffer()], { type: 'video/mp4' });
                        showResult(blob, "fluxora_muted.mp4", "video");
                    }
                };
                mp4box.extract();
            };

            mp4box.onError = function (e) {
                console.error("MP4Box Error:", e);
                processVideoSlow(file);
            };
            mp4box.appendBuffer(arrayBuffer);
            mp4box.flush();
        };
        reader.readAsArrayBuffer(file);
    }

    async function processVideoSlow(file) {
        progressText.innerText = isTR ? "İşleniyor (Yavaş)..." : "Processing (Slow)...";
        video.src = URL.createObjectURL(file);
        video.muted = true;

        await new Promise(r => {
            video.onloadeddata = r;
            setTimeout(r, 2000);
        });

        const stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
        stream.getAudioTracks().forEach(t => t.stop());

        const chunks = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => showResult(new Blob(chunks), "fluxora.mp4", "video");

        video.play();
        recorder.start();

        const checkEnd = setInterval(() => {
            const pct = Math.min(99, Math.round((video.currentTime / video.duration) * 100));
            progressText.innerText = (isTR ? "İşleniyor" : "Processing") + ` %${pct}`;
            if (video.ended) {
                clearInterval(checkEnd);
                recorder.stop();
            }
        }, 500);
    }

    async function convertToMp3Fast(file) {
        progressText.innerText = isTR ? "Ses Ayrıştırılıyor (Hızlı)..." : "Extracting Audio (Fast)...";

        try {
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

        const mp3encoder = new lamejs.Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, 128);
        const samplesLeft = audioBuffer.getChannelData(0);
        const samplesRight = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : samplesLeft;

        const mp3Data = [];
        let offset = 0;

        const processChunk = () => {
            if (offset >= samplesLeft.length) {
                const mp3buf = mp3encoder.flush();
                if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf));
                showResult(new Blob(mp3Data, { type: 'audio/mp3' }), "fluxora.mp3", "audio");
                return;
            }

            const end = Math.min(offset + 44100, samplesLeft.length);
            const leftChunk = new Int16Array(end - offset);
            const rightChunk = new Int16Array(end - offset);

            for (let i = offset; i < end; i++) {
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
            setTimeout(processChunk, 0);
        };

        processChunk();
    }

    function showResult(blob, filename, type) {
        loader.style.display = 'none';
        resultArea.style.display = 'block';
        downloadBtn.href = URL.createObjectURL(blob);
        downloadBtn.download = filename;

        const previewContainer = document.getElementById('preview-container');
        previewContainer.innerHTML = '';

        if (type === 'image') {
            const previewImg = new Image();
            previewImg.src = downloadBtn.href;
            previewImg.style.maxWidth = '100%';
            previewImg.style.borderRadius = '8px';
            previewContainer.appendChild(previewImg);
        } else if (type === 'video') {
            const previewVideo = document.createElement('video');
            previewVideo.src = downloadBtn.href;
            previewVideo.controls = true;
            previewVideo.style.maxWidth = '100%';
            previewVideo.style.borderRadius = '8px';
            previewContainer.appendChild(previewVideo);
        } else if (type === 'audio') {
            const previewAudio = document.createElement('audio');
            previewAudio.src = downloadBtn.href;
            previewAudio.controls = true;
            previewAudio.style.width = '100%';
            previewContainer.appendChild(previewAudio);
        }
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
