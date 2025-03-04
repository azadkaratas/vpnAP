function loadUpdatePage() {
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
                    <p id="popup-text">Processing...</p>
                    <button id="popupCancelBtn" class="btn btn-secondary mt-2">Cancel</button>
                </div>
            </div>
        </div>
    `;

    fetch('/api/version')
        .then(response => response.json())
        .then(data => {
            document.getElementById('versionNo').textContent = `Current Version: ${data.version}`;
        })
        .catch(error => console.error('Error fetching version:', error));

    document.getElementById('uploadForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData();
        const fileInput = document.getElementById('fileInput');
        const message = document.getElementById('message');
        const popup = document.getElementById('popup');
        const popupText = document.getElementById('popup-text');

        if (!fileInput.files[0]) {
            message.style.display = 'block';
            message.className = 'message error';
            message.textContent = 'Please select a file to upload.';
            return;
        }

        formData.append('file', fileInput.files[0]);
        popup.style.display = 'flex';
        popupText.textContent = 'Uploading file...';

        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            message.style.display = 'block';
            message.className = `message ${data.message.includes('success') ? 'success' : 'error'}`;
            message.textContent = data.message;

            if (data.message.includes('success')) {
                popupText.textContent = 'Updating firmware...';
                setTimeout(() => {
                    popup.style.display = 'none';
                    alert('Firmware update initiated. Device will restart.');
                }, 2000);
            } else {
                popup.style.display = 'none';
            }
        })
        .catch(error => {
            message.style.display = 'block';
            message.className = 'message error';
            message.textContent = 'Error uploading file.';
            popup.style.display = 'none';
            console.error('Error uploading file:', error);
        });
    });

    document.getElementById('popupCancelBtn').addEventListener('click', () => {
        document.getElementById('popup').style.display = 'none';
    });
}

loadUpdatePage();