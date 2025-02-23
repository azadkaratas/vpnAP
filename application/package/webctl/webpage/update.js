function loadUpdatePage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="sub-content-area">
            <div class="sub-content-area-header">Update Firmware</div>            
            <form id="uploadForm" enctype="multipart/form-data">
                <input type="file" name="file" id="fileInput" accept=".ext4">
                <button type="submit">Upload</button>
            </form>
            
            <!-- Hidden Popup -->
            <div id="popup" class="popup">
                <div class="popup-content">
                    <p id="popup-text">Processing...</p>
                </div>
            </div>

        </div>
    `;

    
    document.getElementById('uploadForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData();
        const fileInput = document.getElementById('fileInput');
        formData.append('file', fileInput.files[0]);

        fetch('/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
        })
        .catch(error => {
            alert('Error uploading file.');
            console.error('Error uploading file.');
        });
    });
}

loadUpdatePage();
