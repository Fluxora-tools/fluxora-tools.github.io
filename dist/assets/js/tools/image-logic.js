// Image Converter Logic
document.addEventListener('DOMContentLoaded', () => {
    const interfaceContainer = document.getElementById('tool-interface');
    if (!interfaceContainer) return;

    // Detect Tool Type from URL or Data Attribute
    const toolPage = document.querySelector('.tool-page');
    const toolId = toolPage ? toolPage.dataset.toolId : '';

    // Render UI (if not already SSR'd, strictly client-side for now for interactivity)
    interfaceContainer.innerHTML = `
        <div class="drop-zone" id="drop-zone">
            <p style="margin-bottom:15px; font-size:1.2rem;">Drag & Drop Image Here</p>
            <p class="text-muted">or</p>
            <input type="file" id="file-input" accept="image/png, image/jpeg, image/webp" style="display:none">
            <button class="btn" onclick="document.getElementById('file-input').click()">Select File</button>
        </div>
        <div id="preview-area" style="margin-top:20px; text-align:center; display:none;">
            <img id="preview-img" style="max-width:100%; max-height:300px; border-radius:10px; margin-bottom:20px;">
            <div id="controls">
                <button id="convert-btn" class="btn">Convert & Download</button>
            </div>
            <p id="status-msg" style="margin-top:10px;"></p>
        </div>
    `;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewArea = document.getElementById('preview-area');
    const previewImg = document.getElementById('preview-img');
    const convertBtn = document.getElementById('convert-btn');
    const statusMsg = document.getElementById('status-msg');

    let currentFile = null;

    // Drag & Drop Events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file.');
            return;
        }
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

        statusMsg.textContent = 'Converting...';
        convertBtn.disabled = true;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // Draw image on white background (handle transparency for JPG)
            if (toolId.includes('to-jpg')) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            // Determine generic output format based on tool ID logic
            let format = 'image/jpeg';
            let ext = 'jpg';
            if (toolId.includes('to-png')) { format = 'image/png'; ext = 'png'; }
            else if (toolId.includes('to-webp')) { format = 'image/webp'; ext = 'webp'; }


            canvas.toBlob((blob) => {
                if (!blob) {
                    statusMsg.textContent = 'Conversion failed.';
                    return;
                }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `fluxora-converted.${ext}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                statusMsg.textContent = 'Downloaded!';
                convertBtn.disabled = false;
            }, format, 0.9);
        };
        img.src = previewImg.src;
    });
});
