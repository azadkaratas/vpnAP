function loadWifiSettingsPage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="sub-content-area">
            <h2>Wi-Fi Configuration</h2>
            <form id="wifiSettingsForm" class="mt-4">
                <div class="form-group">
                    <label for="wifiName">Name of the Wi-Fi network (SSID):</label>
                    <input type="text" id="wifiName" name="wifiName" class="form-control">
                </div>
                <div class="form-group mt-3">
                    <label for="ipAddress">Wifi Password:</label>
                    <input type="text" id="wifiPassword" name="wifiPassword" class="form-control">
                </div>
                <div class="form-group mt-3">
                    <label for="internetStatus">Internet Sharing:</label>
                    <select id="internetStatus" name="internetStatus" class="form-select">
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary mt-4">Save Configuration</button>
            </form>
            <div id="message" class="message mt-3"></div>
        </div>
        <div class="sub-content-area">
            <h2>Connected Devices</h2>
            <ul id="deviceList"></ul>
        </div>
    `;

    // Fetch the initial configuration and populate fields
    fetch('/api/wifiConfig')
        .then(response => response.json())
        .then(data => {
            document.getElementById('wifiName').value = data.WifiName;
            document.getElementById('wifiPassword').value = data.WifiPassword;
            document.getElementById('internetStatus').value = data.InternetStatus;
        })
        .catch(error => console.error('Error fetching configuration:', error));

    // Submit form handler
    document.getElementById('wifiSettingsForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const WifiConfigData = {
            WifiName: document.getElementById('wifiName').value,
            WifiPassword: document.getElementById('wifiPassword').value,
            InternetStatus: document.getElementById('internetStatus').value
        };

        fetch('/api/wifiConfig', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(WifiConfigData)
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('message').textContent = data.message;
            setTimeout(() => { document.getElementById('message').textContent = ''; }, 3000);
        })
        .catch(error => console.error('Error updating configuration:', error));
    });

    function loadConnectedDevices() {
        fetch('/api/connected-devices')
            .then(response => response.json())
            .then(devices => {
                const deviceList = document.getElementById("deviceList");
                deviceList.innerHTML = '';
    
                devices.forEach(device => {
                    const listItem = document.createElement("li");
                    listItem.textContent = `IP: ${device.ip}, Hostname: ${device.hostname || 'Unknown'}`;
                    deviceList.appendChild(listItem);
                });
            })
            .catch(error => console.error("Couldn't get the device list:", error));
    }
    loadConnectedDevices();
}

loadWifiSettingsPage();