function loadUpdatePage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="sub-content-area">
            <div class="sub-content-area-header">Update Firmware</div>     
            <label id="versionNo"></label><br>
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

    fetch('/api/version')
    .then(response => response.json())
    .then(data => {
        document.getElementById('versionNo').textContent = `Current Version: ${data.version}`;
    })
    .catch(error => console.error('Error fetching network-status:', error));
    
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
            exec('sh /usr/bin/updatefw.sh &', (error, stdout, stderr) => {
                if (error) {
                    console.log(`Error updating firmware: ${error.message}`);
                    return res.json({ message: 'Error updating firmware' });
                }
                if (stderr) {
                    console.log(`Command stderr: ${stderr}`);
                    return res.json({ message: 'Command error' });
                }
            });
        })
        .catch(error => {
            alert('Error uploading file.');
            console.error('Error uploading file.');
        });
    });
}

loadUpdatePage();
