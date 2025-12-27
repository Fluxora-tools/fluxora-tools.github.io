// Image Converter Logic - Optimized with Drag & Drop
document.addEventListener('DOMContentLoaded', () => {
    const interfaceContainer = document.getElementById('tool-interface');
    if (!interfaceContainer) return;

    const toolPage = document.querySelector('.tool-page');
    const toolId = toolPage ? toolPage.dataset.toolId : '';

    interfaceContainer.innerHTML = `
        <div class="drop-zone" id="drop-zone" style="border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; background: rgba(255,255,255,0.02); transition: 0.3s;">
            <i class="fas fa-image" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
            <h3>Select Image File</h3>
            <p style="color: var(--text-muted); margin-top: 10px;">Drag & Drop or Click to Select</p>
            <input type="file" id="file-input" accept="image/*" style="display:none">
        </div>
        <div id="loader" style="display:none; margin:40px 0; text-align:center;">
            <div class="spinner"></div>
            <p id="progress-text" style="margin-top:15px; color:var(--text-muted); font-weight: bold;">Processing: %0</p>
        </div>
        <div id="preview-area" style="margin-top:20px; text-align:center; display:none;">
            <img id="preview-img" style="max-width:100%; max-height:300px; border-radius:10px; margin-bottom:20px; border:1px solid var(--border);">
            <div id="controls">
                <button id="convert-btn" class="btn">Convert & Download</button>
            </div>
            <p id="status-msg" style="margin-top:10px; color: var(--primary); font-weight: bold;"></p>
        </div>
    `;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewArea = document.getElementById('preview-area');
    const previewImg = document.getElementById('preview-img');
    const convertBtn = document.getElementById('convert-btn');
    const statusMsg = document.getElementById('status-msg');
    const loader = document.getElementById('loader');
    const progressText = document.getElementById('progress-text');

    let currentFile = null;

    dropZone.onclick = () => fileInput.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary)'; };
    dropZone.ondragleave = () => { dropZone.style.borderColor = 'var(--border)'; };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border)';
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    };

    fileInput.onchange = (e) => { if (e.target.files.length) handleFile(e.target.files[0]); };

    function handleFile(file) {
        if (!file.type.startsWith('image/')) { alert('Please upload a valid image.'); return; }
        currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewArea.style.display = 'block';
            dropZone.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    convertBtn.addEventListener('click', () => {
        if (!currentFile) return;

        previewArea.style.display = 'none';
        loader.style.display = 'block';
        progressText.textContent = "Processing: %10";

        const img = new Image();
        img.onload = () => {
            progressText.textContent = "Processing: %40";
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (toolId.includes('to-jpg')) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);
            progressText.textContent = "Processing: %80";

            let format = 'image/jpeg';
            let ext = 'jpg';
            if (toolId.includes('to-png')) { format = 'image/png'; ext = 'png'; }
            else if (toolId.includes('to-webp')) { format = 'image/webp'; ext = 'webp'; }
            else if (toolId.includes('to-avif')) { format = 'image/avif'; ext = 'avif'; }
            else if (toolId.includes('to-bmp')) { format = 'image/bmp'; ext = 'bmp'; }
            else if (toolId.includes('to-ico')) {
                // Special ICO handler
                canvas.toBlob(async (blob) => {
                    const pngBuffer = await blob.arrayBuffer();
                    const icoBuffer = createIcoFromPng(pngBuffer, img.width, img.height);
                    const icoBlob = new Blob([icoBuffer], { type: 'image/x-icon' });
                    downloadBlob(icoBlob, `fluxora-${Date.now()}.ico`);
                    finalizeConversion();
                }, 'image/png');
                return;
            }

            canvas.toBlob((blob) => {
                progressText.textContent = "Processing: %100";
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `fluxora-${Date.now()}.${ext}`;
                a.click();

                if (window.incrementProcessCount) window.incrementProcessCount();

                loader.style.display = 'none';
                previewArea.style.display = 'block';
                statusMsg.textContent = 'Success! Download started.';
            }, format, 0.9);
        };
        img.src = previewImg.src;
    });

    function createIcoFromPng(pngBuffer, width, height) {
        // ICO Header (6 bytes)
        const header = new Uint8Array(6);
        header.set([0, 0, 1, 0, 1, 0]); // Reserved, Type (1=ico), Count (1)

        // Directory Entry (16 bytes)
        const entry = new Uint8Array(16);
        entry[0] = width >= 256 ? 0 : width;
        entry[1] = height >= 256 ? 0 : height;
        entry[2] = 0; // Palettes
        entry[3] = 0; // Reserved
        entry[4] = 1; // Planes
        entry[5] = 1; // Reserved (actually bpp, but 1 plane / 0 bpp for PNG is often used or 32)
        // bpp = 32
        entry[6] = 32; entry[7] = 0;

        const size = pngBuffer.byteLength;
        // Data Size (4 bytes)
        entry[8] = size & 0xFF;
        entry[9] = (size >> 8) & 0xFF;
        entry[10] = (size >> 16) & 0xFF;
        entry[11] = (size >> 24) & 0xFF;

        const offset = 6 + 16;
        // Data Offset (4 bytes)
        entry[12] = offset & 0xFF;
        entry[13] = (offset >> 8) & 0xFF;
        entry[14] = (offset >> 16) & 0xFF;
        entry[15] = (offset >> 24) & 0xFF;

        const ico = new Uint8Array(6 + 16 + size);
        ico.set(header, 0);
        ico.set(entry, 6);
        ico.set(new Uint8Array(pngBuffer), 22);

        return ico;
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function finalizeConversion() {
        if (window.incrementProcessCount) window.incrementProcessCount();
        loader.style.display = 'none';
        previewArea.style.display = 'block';
        statusMsg.textContent = 'Success! Download started.';
        progressText.textContent = "Processing: %100";
    }
});
