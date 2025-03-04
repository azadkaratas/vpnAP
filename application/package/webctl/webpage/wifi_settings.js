function loadWifiSettingsPage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="sub-content-area">
            <div class="sub-content-area-header">Wi-Fi Configuration</div>
            <form id="wifiSettingsForm" class="mt-3">
                <div class="mb-3">
                    <label for="wifiName" class="form-label">Wi-Fi Name (SSID)</label>
                    <input type="text" id="wifiName" name="wifiName" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label for="wifiPassword" class="form-label">Wi-Fi Password</label>
                    <input type="password" id="wifiPassword" name="wifiPassword" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label for="internetStatus" class="form-label">Internet Sharing</label>
                    <select id="internetStatus" name="internetStatus" class="form-select">
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Save Configuration</button>
            </form>
            <div id="message" class="message mt-3" style="display: none;"></div>
        </div>
        <div class="sub-content-area">
            <div class="sub-content-area-header">Connected Devices</div>
            <ul id="deviceList" class="list-unstyled"></ul>
        </div>
    `;

    fetch('/api/wifiConfig')
        .then(response => response.json())
        .then(data => {
            document.getElementById('wifiName').value = data.WifiName;
            document.getElementById('wifiPassword').value = data.WifiPassword;
            document.getElementById('internetStatus').value = data.InternetStatus;
        })
        .catch(error => console.error('Error fetching configuration:', error));

    document.getElementById('wifiSettingsForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const WifiConfigData = {
            WifiName: document.getElementById('wifiName').value,
            WifiPassword: document.getElementById('wifiPassword').value,
            InternetStatus: document.getElementById('internetStatus').value
        };

        const message = document.getElementById('message');
        if (WifiConfigData.WifiPassword.length < 8 || WifiConfigData.WifiPassword.length > 63) {
            message.style.display = 'block';
            message.className = 'message error';
            message.textContent = 'Wi-Fi password length should be between 8 and 63 characters.';
            return;
        }
        if (WifiConfigData.WifiName.length < 1 || WifiConfigData.WifiName.length > 32) {
            message.style.display = 'block';
            message.className = 'message error';
            message.textContent = 'Wi-Fi name length should be between 1 and 32 characters.';
            return;
        }
        if (!['enabled', 'disabled'].includes(WifiConfigData.InternetStatus)) {
            message.style.display = 'block';
            message.className = 'message error';
            message.textContent = 'Invalid Internet Sharing value!';
            return;
        }

        fetch('/api/wifiConfig', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(WifiConfigData)
        })
        .then(response => response.json())
        .then(data => {
            message.style.display = 'block';
            message.className = 'message success';
            message.textContent = data.message;
            setTimeout(() => { message.style.display = 'none'; }, 3000);
        })
        .catch(error => console.error('Error updating configuration:', error));
    });

    function loadConnectedDevices() {
        fetch('/api/connected-devices')
            .then(response => response.json())
            .then(devices => {
                const deviceList = document.getElementById('deviceList');
                deviceList.innerHTML = devices.length
                    ? devices.map(device => `<li>IP: ${device.ip}, Hostname: ${device.hostname || 'Unknown'}</li>`).join('')
                    : '<li>No devices connected.</li>';
            })
            .catch(error => console.error("Error fetching connected devices:", error));
    }
    loadConnectedDevices();
}

loadWifiSettingsPage();