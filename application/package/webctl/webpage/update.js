async function loadUpdatePage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="sub-content-area">
            <div class="sub-content-area-header">Update Firmware</div>
            <p id="versionNo" class="mb-3">Loading version...</p>
            <form id="uploadForm" enctype="multipart/form-data" class="mt-3">
                <div class="mb-3">
                    <label for="fileInput" class="form-label">Select Firmware File (.ext4)</label>
                    <input type="file" name="file" id="fileInput" accept=".ext4" class="form-control">
                </div>
                <button type="submit" class="btn btn-primary">Upload</button>
            </form>
            <div id="message" class="message mt-3" style="display: none;"></div>
            <div id="popup" class="popup">
                <div class="popup-content">
                    <div class="progress mt-2">
                        <div id="progressBar" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <p id="progressText" class="mt-2">Uploading: 0% (0 bytes remaining, 0 KB/s)</p>
                    <button id="popupCancelBtn" class="btn btn-secondary mt-2">Cancel</button>
                </div>
            </div>
        </div>
    `;

    // Fetch current version
    try {
        const response = await fetch('/api/version');
        const data = await response.json();
        document.getElementById('versionNo').textContent = `Current Version: ${data.version}`;
    } catch (error) {
        console.error('Error fetching version:', error);
        document.getElementById('versionNo').textContent = 'Error loading version';
    }

    // Handle form submission
    document.getElementById('uploadForm').addEventListener('submit', async function (event) {
        event.preventDefault();

        const fileInput = document.getElementById('fileInput');
        const message = document.getElementById('message');
        const popup = document.getElementById('popup');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const cancelBtn = document.getElementById('popupCancelBtn');

        // Client-side validation
        const file = fileInput.files[0];
        if (!file) {
            message.style.display = 'block';
            message.className = 'message error';
            message.textContent = 'Please select a file to upload.';
            return;
        }

        if (!file.name.endsWith('.ext4')) {
            message.style.display = 'block';
            message.className = 'message error';
            message.textContent = 'Only .ext4 files are allowed.';
            return;
        }

        if (file.size > 400 * 1024 * 1024) {
            message.style.display = 'block';
            message.className = 'message error';
            message.textContent = 'File size exceeds 400MB limit.';
            return;
        }

        // Prepare FormData
        const formData = new FormData();
        formData.append('file', file);

        // Show popup with progress
        popup.style.display = 'flex';
        message.style.display = 'none';

        try {
            // Use XMLHttpRequest for progress tracking and cancellation
            const xhr = new XMLHttpRequest();
            let startTime = null;

            // Progress event listener
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    if (!startTime) startTime = Date.now();
                    const elapsedTime = (Date.now() - startTime) / 1000;
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    const mbytesRemaining = Math.round((event.total - event.loaded) / 1024 / 1024);
                    const speed = event.loaded / elapsedTime / 1024;
                    progressBar.style.width = `${percentComplete}%`;
                    progressBar.setAttribute('aria-valuenow', percentComplete);
                    progressText.textContent = `Uploading: ${percentComplete}% (${mbytesRemaining} MB remaining, ${speed.toFixed(2)} KB/s)`;
                }
            });

            // Completion handler
            xhr.addEventListener('load', async () => {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    if (data.message.includes('success')) {
                        progressText.textContent = 'File uploaded. Updating firmware...';
                        // Wait for server to confirm firmware update initiation
                        try {
                            const updateResponse = await fetch('/api/update-firmware', { method: 'POST' });
                            const updateData = await updateResponse.json();
                            message.style.display = 'block';
                            message.className = `message ${updateData.success ? 'success' : 'error'}`;
                            message.textContent = updateData.message;
                            popup.style.display = 'none';
                            if (updateData.success) {
                                setTimeout(() => {
                                    alert('Firmware update completed. Device is now restarting.');
                                }, 2000);
                            }
                        } catch (updateError) {
                            message.style.display = 'block';
                            message.className = 'message error';
                            message.textContent = 'Error initiating firmware update: ' + updateError.message;
                            popup.style.display = 'none';
                        }
                    } else {
                        message.style.display = 'block';
                        message.className = 'message error';
                        message.textContent = data.message;
                        popup.style.display = 'none';
                    }
                } else {
                    message.style.display = 'block';
                    message.className = 'message error';
                    message.textContent = `Server responded with status ${xhr.status}`;
                    popup.style.display = 'none';
                }
            });

            // Error handler
            xhr.addEventListener('error', () => {
                message.style.display = 'block';
                message.className = 'message error';
                message.textContent = 'Error uploading file. Network issue occurred.';
                popup.style.display = 'none';
            });

            // Abort handler
            xhr.addEventListener('abort', () => {
                message.style.display = 'block';
                message.className = 'message error';
                message.textContent = 'Upload cancelled by user.';
                popup.style.display = 'none';
            });

            // Send request
            xhr.open('POST', '/api/upload', true);
            xhr.send(formData);

            // Cancel button functionality
            cancelBtn.onclick = () => {
                xhr.abort(); // Cancel the upload
            };

        } catch (error) {
            message.style.display = 'block';
            message.className = 'message error';
            message.textContent = `Error uploading file: ${error.message}`;
            popup.style.display = 'none';
        }
    });
}

loadUpdatePage();