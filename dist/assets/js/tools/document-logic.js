// Document Tool Logic
document.addEventListener('DOMContentLoaded', () => {
    const interfaceContainer = document.getElementById('tool-interface');
    if (!interfaceContainer) return;

    interfaceContainer.innerHTML = `
        <div class="drop-zone" id="drop-zone">
            <p style="margin-bottom:15px; font-size:1.2rem;">Drag & Drop Document Here</p>
            <p class="text-muted">Supports PDF, DOCX</p>
            <input type="file" id="file-input" accept=".pdf,.doc,.docx" style="display:none">
            <button class="btn" onclick="document.getElementById('file-input').click()">Select File</button>
        </div>
        <div id="result-area" style="margin-top:20px; text-align:center; display:none;">
            <div id="loader" style="display:none;">
                <div style="width:30px; height:30px; border:3px solid rgba(255,255,255,0.1); border-top-color:var(--primary); border-radius:50%; animation: spin 1s linear infinite; margin:0 auto 15px;"></div>
                <p>Extracting Text...</p>
            </div>
            <div id="output-box" style="display:none; text-align:left;">
                <textarea id="text-output" style="width:100%; height:200px; background:rgba(0,0,0,0.3); color:#fff; border:1px solid var(--border); padding:10px; border-radius:8px;" readonly></textarea>
                <button id="download-btn" class="btn" style="margin-top:15px;">Download TXT</button>
            </div>
            <div id="limit-msg" style="display:none; margin-top:20px; background:rgba(255,165,0,0.1); padding:15px; border-radius:8px; border:1px solid rgba(255,165,0,0.3);">
                <h4>Browser Limitation</h4>
                <p style="font-size:0.9rem; margin-top:5px;">
                    Complex document parsing (PDF/DOCX) purely in JavaScript without external APIs requires heavy WASM libraries (like pdf.js). 
                    For this static demo, we are simulating the extraction flow.
                    Real extraction would happen here.
                </p>
            </div>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const resultArea = document.getElementById('result-area');
    const loader = document.getElementById('loader');
    const outputBox = document.getElementById('output-box');
    const limitMsg = document.getElementById('limit-msg');
    const textOutput = document.getElementById('text-output');
    const downloadBtn = document.getElementById('download-btn');

    const handleFile = (file) => {
        resultArea.style.display = 'block';
        limitMsg.style.display = 'none';
        outputBox.style.display = 'none';
        loader.style.display = 'block';
        dropZone.style.display = 'none';

        // Simulate processing
        setTimeout(() => {
            loader.style.display = 'none';

            // For demo: Show limitation message + dummy text
            limitMsg.style.display = 'block';
            outputBox.style.display = 'block';
            textOutput.value = `[Extracted Text Demo]\n\nfilename: ${file.name}\nsize: ${file.size} bytes\n\n(Content would appear here)`;

        }, 1500);
    };

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    downloadBtn.addEventListener('click', () => {
        const blob = new Blob([textOutput.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'extracted.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});
