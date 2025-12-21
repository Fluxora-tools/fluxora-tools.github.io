+document.addEventListener('DOMContentLoaded', () => {
    const interfaceContainer = document.getElementById('tool-interface');
    if (!interfaceContainer) return;

    const toolPage = document.querySelector('.tool-page');
    const toolId = toolPage ? toolPage.dataset.toolId : '';

    if (toolId === 'qr-generator') {
        renderQrGenerator(interfaceContainer);
    } else if (toolId === 'password-generator') {
        renderPasswordGenerator(interfaceContainer);
    } else if (toolId === 'word-counter') {
        renderWordCounter(interfaceContainer);
    } else if (toolId === 'internet-speed-test') {
        renderSpeedTest(interfaceContainer);
    }
});

// Helper: Load Script dynamically (reused)
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

async function renderQrGenerator(container) {
    container.innerHTML = `
        <div style="width:100%; max-width:500px; text-align:center;">
            <input type="text" id="qr-text" placeholder="Enter URL or Text..." style="width:100%; padding:15px; border-radius:8px; border:1px solid var(--border); background:rgba(255,255,255,0.05); color:#fff; margin-bottom:20px;">
            <div id="qr-code" style="background:#fff; padding:20px; border-radius:10px; display:inline-block; margin-bottom:20px; min-width:200px; min-height:200px;"></div>
            <br>
            <button id="download-qr" class="btn">Download QR</button>
        </div>
    `;

    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');

    const qrContainer = document.getElementById('qr-code');
    const input = document.getElementById('qr-text');
    let qrcode = new QRCode(qrContainer, {
        text: "https://fluxora.com",
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    input.addEventListener('input', () => {
        const text = input.value || "https://fluxora.com";
        qrContainer.innerHTML = ""; // Clear previous
        qrcode = new QRCode(qrContainer, {
            text: text,
            width: 200,
            height: 200,
        });
    });

    document.getElementById('download-qr').addEventListener('click', () => {
        const img = qrContainer.querySelector('img');
        if (img && img.src) {
            const link = document.createElement('a');
            link.href = img.src;
            link.download = 'qrcode.png';
            link.click();
        }
    });
}

function renderPasswordGenerator(container) {
    container.innerHTML = `
        <div style="width:100%; max-width:500px; text-align:center;">
            <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:8px; margin-bottom:20px; border:1px solid var(--border);">
                <span id="pw-display" style="font-family:monospace; font-size:1.5rem; word-break:break-all; color:var(--primary);">Generating...</span>
            </div>
            
            <div style="display:flex; justify-content:space-between; margin-bottom:20px; color:var(--text-muted);">
                <label><input type="checkbox" id="chk-upper" checked> ABC</label>
                <label><input type="checkbox" id="chk-lower" checked> abc</label>
                <label><input type="checkbox" id="chk-num" checked> 123</label>
                <label><input type="checkbox" id="chk-sym" checked> !@#</label>
            </div>
            <div style="margin-bottom:20px;">
                <label>Length: <span id="len-val">16</span></label>
                <input type="range" id="pw-length" min="4" max="64" value="16" style="width:100%;">
            </div>

            <button id="gen-pw" class="btn" style="width:100%;">Generate New</button>
            <button id="copy-pw" class="btn-sm" style="margin-top:10px; background:transparent; border:1px solid var(--border);">Copy</button>
        </div>
    `;

    const display = document.getElementById('pw-display');
    const lengthRange = document.getElementById('pw-length');
    const lenVal = document.getElementById('len-val');

    const chars = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        num: '0123456789',
        sym: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    function generate() {
        const len = parseInt(lengthRange.value);
        lenVal.textContent = len;

        let validChars = '';
        if (document.getElementById('chk-upper').checked) validChars += chars.upper;
        if (document.getElementById('chk-lower').checked) validChars += chars.lower;
        if (document.getElementById('chk-num').checked) validChars += chars.num;
        if (document.getElementById('chk-sym').checked) validChars += chars.sym;

        if (!validChars) {
            display.textContent = 'Select at least 1 option';
            return;
        }

        let password = '';
        const array = new Uint32Array(len);
        window.crypto.getRandomValues(array);

        for (let i = 0; i < len; i++) {
            password += validChars[array[i] % validChars.length];
        }
        display.textContent = password;
    }

    lengthRange.addEventListener('input', generate);
    document.getElementById('gen-pw').addEventListener('click', generate);
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.addEventListener('change', generate));

    document.getElementById('copy-pw').addEventListener('click', () => {
        navigator.clipboard.writeText(display.textContent);
        const originalText = document.getElementById('copy-pw').textContent;
        document.getElementById('copy-pw').textContent = 'Copied!';
        setTimeout(() => document.getElementById('copy-pw').textContent = originalText, 1500);
    });

    generate();
}

function renderWordCounter(container) {
    container.innerHTML = `
        <div style="width:100%; max-width:800px; display:flex; flex-direction:column; gap:20px;">
             <div style="display:flex; justify-content:space-around; background:rgba(0,0,0,0.3); padding:15px; border-radius:8px; border:1px solid var(--border);">
                <div style="text-align:center;">
                    <span id="count-words" style="display:block; font-size:2rem; font-weight:bold; color:var(--primary);">0</span>
                    <span style="font-size:0.9rem; color:var(--text-muted);">Words</span>
                </div>
                <div style="text-align:center;">
                    <span id="count-chars" style="display:block; font-size:2rem; font-weight:bold; color:#fff;">0</span>
                    <span style="font-size:0.9rem; color:var(--text-muted);">Characters</span>
                </div>
                <div style="text-align:center;">
                    <span id="count-para" style="display:block; font-size:2rem; font-weight:bold; color:#fff;">0</span>
                    <span style="font-size:0.9rem; color:var(--text-muted);">Paragraphs</span>
                </div>
            </div>
            <textarea id="word-input" placeholder="Type or paste your text here..." style="width:100%; height:400px; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:#fff; padding:20px; border-radius:8px; font-size:1.1rem; line-height:1.6;"></textarea>
        </div>
    `;

    const input = document.getElementById('word-input');
    input.addEventListener('input', () => {
        const text = input.value;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        const chars = text.length;
        const paras = text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter(x => x.trim()).length;

        document.getElementById('count-words').textContent = words;
        document.getElementById('count-chars').textContent = chars;
        document.getElementById('count-para').textContent = paras;
    });
}

function renderSpeedTest(container) {
    container.innerHTML = `
        <div style="width:100%; max-width:500px; text-align:center;">
            <div id="speed-meter" style="width:200px; height:200px; border-radius:50%; border:10px solid rgba(255,255,255,0.1); margin:0 auto 30px; display:flex; align-items:center; justify-content:center; flex-direction:column; position:relative; overflow:hidden;">
                 <div id="speed-fill" style="position:absolute; bottom:0; left:0; width:100%; height:0%; background:var(--primary); transition:height 0.2s; opacity:0.5;"></div>
                 <span id="speed-val" style="font-size:3rem; font-weight:bold; z-index:2;">0.0</span>
                 <span style="font-size:1rem; color:var(--text-muted); z-index:2;">Mbps</span>
            </div>
            <p id="ping-text" style="color:var(--text-muted); margin-bottom:20px;">Ping: -- ms</p>
            <button id="start-test" class="btn" style="width:100%;">Start Speed Test</button>
        </div>
    `;

    document.getElementById('start-test').addEventListener('click', async () => {
        const btn = document.getElementById('start-test');
        btn.disabled = true;
        const speedVal = document.getElementById('speed-val');
        const speedFill = document.getElementById('speed-fill');
        const pingText = document.getElementById('ping-text');

        speedVal.textContent = '0.0';
        speedFill.style.height = '0%';

        try {
            // 1. Measure Ping
            const pings = [];
            for (let i = 0; i < 4; i++) {
                const start = performance.now();
                await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
                pings.push(performance.now() - start);
            }
            const avgPing = Math.round(pings.reduce((a, b) => a + b) / pings.length);
            pingText.textContent = `Ping: ${avgPing} ms`;

            // 2. High-Performance Speed Test (Gigabit-Ready)
            const targets = [
                'https://speed.cloudflare.com/__down?bytes=50000000',
                'https://speed.cloudflare.com/__down?bytes=25000000',
                'https://speed.cloudflare.com/__down?bytes=10000000'
            ];

            const concurrency = 32;
            const duration = 8000;
            const startTime = performance.now();
            let totalLoaded = 0;

            const downloadWorker = async () => {
                while (performance.now() - startTime < duration) {
                    const target = targets[Math.floor(Math.random() * targets.length)];
                    try {
                        const controller = new AbortController();
                        const res = await fetch(target + '&cb=' + Math.random(), {
                            cache: 'no-store',
                            signal: controller.signal
                        });
                        const reader = res.body.getReader();

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            totalLoaded += value.length;
                            if (performance.now() - startTime > duration) {
                                controller.abort();
                                break;
                            }
                        }
                    } catch (err) { }
                }
            };

            const workers = Array(concurrency).fill(0).map(() => downloadWorker());

            const uiInterval = setInterval(() => {
                const elapsed = (performance.now() - startTime) / 1000;
                if (elapsed > 0) {
                    const mbps = ((totalLoaded * 8) / elapsed / 1000000).toFixed(1);
                    speedVal.textContent = mbps;
                    const pct = Math.min((parseFloat(mbps) / 1000) * 100, 100);
                    speedFill.style.height = pct + '%';
                }
            }, 100);

            await Promise.all(workers);
            clearInterval(uiInterval);

            const finalElapsed = (performance.now() - startTime) / 1000;
            const finalMbps = ((totalLoaded * 8) / finalElapsed / 1000000).toFixed(1);

            speedVal.textContent = finalMbps;
            speedFill.style.height = Math.min((parseFloat(finalMbps) / 1000) * 100, 100) + '%';
            btn.textContent = 'Test Again';
        } catch (e) {
            console.error(e);
            speedVal.textContent = "Err";
            btn.textContent = 'Retry';
        } finally {
            btn.disabled = false;
        }
    });
}
