// Video Tool Logic
document.addEventListener('DOMContentLoaded', () => {
    const interfaceContainer = document.getElementById('tool-interface');
    if (!interfaceContainer) return;

    // Detect Tool Type
    const toolPage = document.querySelector('.tool-page');
    const toolId = toolPage ? toolPage.dataset.toolId : '';

    let placeholderText = "Paste video URL here";
    let platformName = "Platform";

    if (toolId.includes('youtube')) {
        placeholderText = "Paste YouTube URL (e.g. youtube.com/watch?v=...)";
        platformName = "YouTube";
    } else if (toolId.includes('pinterest')) {
        placeholderText = "Paste Pinterest URL (e.g. pinterest.com/pin/...)";
        platformName = "Pinterest";
    }

    interfaceContainer.innerHTML = `
        <div style="width:100%; max-width:600px; text-align:center;">
            <div class="input-group" style="display:flex; gap:10px; margin-bottom:20px;">
                <input type="text" id="url-input" placeholder="${placeholderText}" style="flex:1;" />
                <button id="fetch-btn" class="btn" style="width:auto; padding:0 30px;">Fetch</button>
            </div>
            
            <div id="loader" style="display:none; margin:30px 0;">
                <div class="spinner" style="width:40px; height:40px; border:4px solid rgba(255,255,255,0.1); border-top-color:var(--primary); border-radius:50%; animation: spin 1s linear infinite; margin:0 auto;"></div>
                <p style="margin-top:15px; color:var(--text-muted);">Fetching from ${platformName} servers...</p>
            </div>

            <div id="result-area" style="display:none; margin-top:30px; background:rgba(255,255,255,0.03); padding:30px; border-radius:15px; border:1px solid var(--border); text-align:left;">
                <div id="video-meta" style="display:flex; gap:20px; align-items:flex-start; margin-bottom:25px;">
                    <img id="video-thumb" src="" style="width:180px; height:100px; object-fit:cover; border-radius:10px; background:#1e293b;" />
                    <div>
                        <h4 id="video-title" style="margin:0; font-size:1.1rem; color:white;">Video Title</h4>
                        <p id="video-info" style="margin:8px 0 0; font-size:0.85rem; color:var(--text-muted);"></p>
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <a id="download-link" href="#" class="btn" style="flex:1; text-align:center; background:var(--primary); color:white; text-decoration:none;">Download MP3 / Video</a>
                    <button id="reset-btn" class="btn btn-secondary" style="width:auto;">New Search</button>
                </div>
            </div>

            <div id="error-area" style="display:none; margin-top:20px; background:rgba(255,50,50,0.1); padding:15px; border-radius:10px; border:1px solid rgba(255,50,50,0.3); color:#ff8888; font-size:0.9rem;">
                Failed to extract video. Please check the URL and try again.
            </div>
        </div>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
            .btn-secondary { background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); }
            .btn-secondary:hover { background: rgba(255,255,255,0.1); }
        </style>
    `;

    const fetchBtn = document.getElementById('fetch-btn');
    const resultArea = document.getElementById('result-area');
    const errorArea = document.getElementById('error-area');
    const loader = document.getElementById('loader');
    const urlInput = document.getElementById('url-input');
    const resetBtn = document.getElementById('reset-btn');

    const downloadLink = document.getElementById('download-link');
    const videoThumb = document.getElementById('video-thumb');
    const videoTitle = document.getElementById('video-title');
    const videoInfo = document.getElementById('video-info');

    async function handleFetch() {
        const url = urlInput.value.trim();
        if (!url) {
            alert('Please enter a URL');
            return;
        }

        // Setup UI
        loader.style.display = 'block';
        fetchBtn.disabled = true;
        resultArea.style.display = 'none';
        errorArea.style.display = 'none';

        try {
            // Using Cobalt API - Gold standard for clean extraction
            const response = await fetch('https://api.cobalt.tools/api/json', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    videoQuality: "1080",
                    isAudioOnly: toolId.includes('mp3'),
                    filenamePattern: "pretty"
                })
            });

            const data = await response.json();

            if (data.status === 'success' || data.url) {
                // Success
                const thumbUrl = toolId.includes('youtube')
                    ? `https://img.youtube.com/vi/${extractVideoId(url)}/mqdefault.jpg`
                    : '/assets/img/fluxora_logo.png'; // Fallback for Pinterest/Others

                videoThumb.src = thumbUrl;
                videoTitle.innerText = platformName + " Content Ready";
                videoInfo.innerText = "The link has been extracted. Click the button below to start your download.";

                downloadLink.href = data.url;
                // For Cobalt, they often return a direct stream download link
                downloadLink.innerText = toolId.includes('mp3') ? "Download MP3" : "Download Video";

                resultArea.style.display = 'block';
            } else if (data.status === 'redirect') {
                window.location.href = data.url; // Direct redirect for some providers
            } else {
                throw new Error('API Error');
            }
        } catch (err) {
            console.error(err);
            errorArea.style.display = 'block';
            errorArea.innerText = "Error: This provider might be rate-limited or the URL is invalid. Try another link.";
        } finally {
            loader.style.display = 'none';
            fetchBtn.disabled = false;
        }
    }

    function extractVideoId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    fetchBtn.addEventListener('click', handleFetch);
    urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleFetch(); });
    resetBtn.addEventListener('click', () => {
        resultArea.style.display = 'none';
        urlInput.value = '';
        urlInput.focus();
    });
});
