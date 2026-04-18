document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('extract-form');
    const urlInput = document.getElementById('youtube-url');
    const extractBtn = document.getElementById('extract-btn');
    const btnText = extractBtn.querySelector('.btn-text');
    const spinner = extractBtn.querySelector('.spinner');
    const statusMsg = document.getElementById('status-message');

    // Make backend URL configurable, fallback to localhost for development
    // In production (Vercel), you would set this to your Render URL.
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
        ? 'http://127.0.0.1:8000' 
        : 'https://ytconvforrealgs.onrender.com'; 

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = urlInput.value.trim();
        if (!url) return;

        // UI Loading State
        extractBtn.disabled = true;
        btnText.textContent = 'EXTRACTING...';
        spinner.style.display = 'block';
        statusMsg.textContent = 'Downloading from YouTube... This may take a minute.';
        statusMsg.className = '';

        try {
            const response = await fetch(`${API_BASE_URL}/convert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'Failed to extract audio. Check if backend is running.');
            }

            // Get the filename from the Content-Disposition header if available
            let filename = 'audio.mp3';
            const disposition = response.headers.get('Content-Disposition');
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) { 
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // Process the downloaded blob
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            // Create a temporary link element to trigger the download
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            // Success State
            statusMsg.textContent = 'Extraction complete. Downloading file...';
            statusMsg.className = 'success-text';
            urlInput.value = '';

        } catch (error) {
            console.error('Error:', error);
            statusMsg.textContent = error.message;
            statusMsg.className = 'error-text';
        } finally {
            // Reset UI
            extractBtn.disabled = false;
            btnText.textContent = 'EXTRACT AUDIO';
            spinner.style.display = 'none';
        }
    });
});
