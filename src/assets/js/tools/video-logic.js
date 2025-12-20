// Video Tool Logic
document.addEventListener('DOMContentLoaded', () => {
    const interfaceContainer = document.getElementById('tool-interface');
    if (!interfaceContainer) return;

    interfaceContainer.innerHTML = `
        <div style="width:100%; max-width:500px; text-align:center;">
            <input type="text" id="url-input" placeholder="Paste video URL here (e.g. youtube.com/watch?v=...)" />
            <button id="fetch-btn" class="btn" style="width:100%;">Download Now</button>
            
            <div id="loader" style="display:none; margin-top:20px;">
                <div style="width:40px; height:40px; border:4px solid rgba(255,255,255,0.1); border-top-color:var(--primary); border-radius:50%; animation: spin 1s linear infinite; margin:0 auto;"></div>
                <p style="margin-top:10px;">Analyzing Video...</p>
            </div>

            <div id="result-area" style="display:none; margin-top:20px; background:rgba(255,50,50,0.1); padding:20px; border-radius:10px; border:1px solid rgba(255,50,50,0.3);">
                <h3>Technical Limitation</h3>
                <p style="font-size:0.9rem; margin-top:10px;">
                    This is a <strong>static, client-side only</strong> demonstration. 
                    Browsers cannot directly download YouTube videos without a backend intermediary (server) due to CORS policies and encryption.
                </p>
                <p style="font-size:0.9rem; margin-top:10px;">
                    In a real production environment, this form would send the URL to a backend API (like node-ytdl-core), which processes the stream and returns a download link.
                    Since Fluxora is hosted statically without a server, this action cannot be completed here.
                </p>
            </div>
        </div>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
        </style>
    `;

    const fetchBtn = document.getElementById('fetch-btn');
    const resultArea = document.getElementById('result-area');
    const loader = document.getElementById('loader');

    fetchBtn.addEventListener('click', () => {
        const url = document.getElementById('url-input').value;
        if (!url) {
            alert('Please enter a URL');
            return;
        }

        // Simulate fetching
        fetchBtn.style.display = 'none';
        loader.style.display = 'block';
        resultArea.style.display = 'none';

        setTimeout(() => {
            loader.style.display = 'none';
            resultArea.style.display = 'block';
            fetchBtn.style.display = 'block';
            fetchBtn.innerText = 'Try Another';
        }, 1500);
    });
});
