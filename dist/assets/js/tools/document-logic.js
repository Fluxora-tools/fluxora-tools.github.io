// Document Tool Logic
document.addEventListener('DOMContentLoaded', () => {
    const interfaceContainer = document.getElementById('tool-interface');
    if (!interfaceContainer) return;

    const toolPage = document.querySelector('.tool-page');
    const toolId = toolPage ? toolPage.dataset.toolId : '';

    interfaceContainer.innerHTML = `
        <div class="drop-zone" id="drop-zone" style="border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.02); transition: 0.3s;">
            <i class="fas fa-file-alt" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
            <h3 id="drop-title">Select Document File</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Drag & Drop or Click to Select</p>
            <input type="file" id="file-input" style="display:none">
        </div>
        <div id="loader" style="display:none; margin:40px 0; text-align:center;">
            <div class="spinner"></div>
            <p id="progress-text" style="margin-top:15px; color:#fff; font-weight:bold;">Processing... %0</p>
        </div>
        <div id="result-area" style="display:none; margin:20px 0; text-align:center;">
            <textarea id="text-output" style="width:100%; height:300px; background:rgba(0,0,0,0.3); color:#fff; border:1px solid var(--border); padding:15px; border-radius:8px; font-family:monospace; margin-bottom: 20px;" readonly></textarea>
            <div id="download-controls">
                <button id="download-btn" class="btn">Download Result</button>
            </div>
            <button onclick="location.reload()" class="btn btn-secondary" style="margin-top:20px;">New Task</button>
        </div>
    `;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const loader = document.getElementById('loader');
    const resultArea = document.getElementById('result-area');
    const textOutput = document.getElementById('text-output');
    const downloadBtn = document.getElementById('download-btn');
    const progressText = document.getElementById('progress-text');

    // Tool specific config
    if (toolId.includes('pdf')) fileInput.accept = '.pdf';
    else if (toolId.includes('word') || toolId.includes('docx')) fileInput.accept = '.docx';
    else if (toolId.includes('txt')) fileInput.accept = '.txt';

    dropZone.onclick = () => fileInput.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary)'; };
    dropZone.ondragleave = () => { dropZone.style.borderColor = 'var(--border)'; };
    dropZone.ondrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };
    fileInput.onchange = (e) => handleFile(e.target.files[0]);

    async function handleFile(file) {
        if (!file) return;
        dropZone.style.display = 'none';
        loader.style.display = 'block';

        try {
            if (toolId === 'pdf-to-txt') await extractPdfText(file);
            else if (toolId === 'word-to-txt') await extractDocxText(file);
            else if (toolId === 'txt-to-pdf') await convertTxtToPdf(file);
            else if (toolId === 'txt-to-docx') await convertTxtToDocx(file);
        } catch (e) {
            console.error(e);
            alert("Error processing document.");
            location.reload();
        }
    }

    async function extractPdfText(file) {
        progressText.innerText = "Loading PDF library...";
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(s => s.str).join(' ') + '\n';
            progressText.innerText = `Extracting: %${Math.round((i / pdf.numPages) * 100)}`;
        }
        showTextResult(fullText, 'extracted.txt');
    }

    async function extractDocxText(file) {
        progressText.innerText = "Loading Word library...";
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        showTextResult(result.value, 'extracted.txt');
    }

    async function convertTxtToPdf(file) {
        progressText.innerText = "Loading PDF generator...";
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        const text = await file.text();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Handle basic text wrapping
        const splitText = doc.splitTextToSize(text, 180);
        doc.text(splitText, 10, 10);

        const blob = doc.output('blob');
        showBinaryResult(blob, 'fluxora.pdf');
    }

    async function convertTxtToDocx(file) {
        progressText.innerText = "Processing Word file...";
        const text = await file.text();
        // Since docx.js is heavy, we'll use a standard HTML-to-Docx blob hack for TXT
        // which works in almost all Word versions. Modern docx is a zip, but Word
        // opens basic HTML/Text/RTF with .doc extension perfectly.
        const blob = new Blob([text], { type: 'application/msword' });
        showBinaryResult(blob, 'fluxora.doc');
    }

    function showTextResult(text, filename) {
        loader.style.display = 'none';
        resultArea.style.display = 'block';
        textOutput.value = text;
        downloadBtn.onclick = () => {
            const blob = new Blob([text], { type: 'text/plain' });
            triggerDownload(blob, filename);
        };
    }

    function showBinaryResult(blob, filename) {
        loader.style.display = 'none';
        resultArea.style.display = 'block';
        textOutput.value = "Document generated successfully. Click below to download.";
        downloadBtn.onclick = () => triggerDownload(blob, filename);
    }

    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    }
});

function loadScript(src) {
    return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script'); script.src = src;
        script.onload = resolve; document.head.appendChild(script);
    });
}
