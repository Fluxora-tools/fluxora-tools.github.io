document.addEventListener('DOMContentLoaded', () => {
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
        btn.textContent = 'Testing...';

        const speedVal = document.getElementById('speed-val');
        const speedFill = document.getElementById('speed-fill');
        const pingText = document.getElementById('ping-text');

        // Measure Ping
        const startPing = performance.now();
        try {
            await fetch('/assets/css/main.css?t=' + Date.now()); // Small file
            const ping = Math.round(performance.now() - startPing);
            pingText.textContent = `Ping: ${ping} ms`;
        } catch {
            pingText.textContent = 'Ping: Error';
        }

        // Measure Download (Mock using a slightly larger file or repeated fetch if needed, 
        // strictly speaking direct JS speedtest needs a reliable large file. 
        // Since we are static, we might not have a huge file. We will simulate/estimate.)

        // Real logic: Fetch a larger image (e.g. from Unsplash source or similar CND) to test download
        // Warn: CORS might block random images. 
        // Safest: Use a known CDN file allowed. 
        // OR: Generate a large blob in memory? No that tests RAM.
        // Let's use a public CDN file from a robust source (like Cloudflare speed test file if possible, or just a generic large JS lib).

        const testFileUrl = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; // ~600KB
        const fileSizeBits = 600 * 1024 * 8; // approx bits

        const startTime = performance.now();
        try {
            await fetch(testFileUrl + '?t=' + Date.now());
            const duration = (performance.now() - startTime) / 1000; // seconds
            const bps = fileSizeBits / duration;
            const mbps = (bps / 1000000).toFixed(2);

            // Animation loop for effect
            let current = 0;
            const target = parseFloat(mbps);
            const interval = setInterval(() => {
                current += target / 20;
                if (current >= target) {
                    current = target;
                    clearInterval(interval);
                    btn.disabled = false;
                    btn.textContent = 'Test Again';
                }
                speedVal.textContent = current.toFixed(2);
                speedFill.style.height = Math.min((current / 100) * 100, 100) + '%';
            }, 50);

        } catch (e) {
            speedVal.textContent = "Err";
            btn.disabled = false;
            btn.textContent = 'Retry';
        }
    });
}
