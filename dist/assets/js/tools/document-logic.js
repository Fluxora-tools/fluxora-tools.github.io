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

    const handleFile = async (file) => {
        resultArea.style.display = 'block';
        limitMsg.style.display = 'none';
        outputBox.style.display = 'none';
        loader.style.display = 'block';
        dropZone.style.display = 'none';

        try {
            let text = '';
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                text = await extractPdfText(file);
            } else if (
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.name.endsWith('.docx')
            ) {
                text = await extractDocxText(file);
            } else {
                throw new Error('Unsupported file type.');
            }

            loader.style.display = 'none';
            outputBox.style.display = 'block';
            textOutput.value = text || 'No text content found in document.';

        } catch (err) {
            console.error(err);
            loader.style.display = 'none';
            limitMsg.style.display = 'block';
            limitMsg.querySelector('h4').textContent = 'Error / Limitation';
            limitMsg.querySelector('p').innerHTML = `Could not extract text. Reason: ${err.message}<br>Ensure complex formatting is minimized.`;
        }
    };

    // Helper: Load Script dynamically
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

    // Real PDF Extraction
    async function extractPdfText(file) {
        // Load PDF.js
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
        // Set worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }
        return fullText;
    }

    // Real DOCX Extraction
    async function extractDocxText(file) {
        // Load Mammoth.js
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');

        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
    }

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
