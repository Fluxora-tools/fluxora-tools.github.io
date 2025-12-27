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
});
