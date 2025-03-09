function loadVPNSettingsPage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="sub-content-area">
            <div class="sub-content-area-header">VPN Configuration</div>
            <form id="vpnSettingsForm" class="mt-3">
                <div class="mb-3">
                    <label for="vpnUsername" class="form-label">Username</label>
                    <input type="text" id="vpnUsername" name="vpnUsername" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label for="vpnPassword" class="form-label">Password</label>
                    <input type="password" id="vpnPassword" name="vpnPassword" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label for="vpnCountry" class="form-label">Select Country</label>
                    <select id="vpnCountry" name="vpnCountry" class="form-select">
                        <option value="us">United States</option>
                        <option value="uk">United Kingdom</option>
                        <option value="de">Germany</option>
                        <option value="fr">France</option>
                        <option value="tr">Turkey</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Save Configuration</button>
            </form>
            <div id="message" class="message mt-3" style="display: none;"></div>

            <hr class="my-4">
            <div class="d-flex align-items-center">
                <button id="toggleVPNButton" class="btn btn-primary me-3">Toggle VPN</button>
                <span id="vpnStatus">Status: Fetching...</span>
                <div id="vpnStatusLed" class="status-led ms-2"></div>
            </div>

            <div id="popup" class="popup">
                <div class="popup-content">
                    <p id="popup-text">Processing...</p>
                    <button id="popupCancelBtn" class="btn btn-secondary mt-2">Cancel</button>
                </div>
            </div>
        </div>
    `;

    fetch('/api/get-vpn-auth-credentials')
        .then(response => response.json())
        .then(data => {
            document.getElementById('vpnUsername').value = data.nordvpnUsername;
            document.getElementById('vpnPassword').value = data.nordvpnPassword;
            document.getElementById('vpnCountry').value = data.nordvpnCountry;
        })
        .catch(error => console.error('Error loading credentials:', error));

    let isVpnConnected = false;
    function updateVPNStatus() {
        fetch('/api/vpn-status')
            .then(response => response.json())
            .then(data => {
                const vpnStatus = document.getElementById('vpnStatus');
                const toggleButton = document.getElementById('toggleVPNButton');
                const led = document.getElementById('vpnStatusLed');
                isVpnConnected = data.isConnected;

                vpnStatus.textContent = `Status: ${data.isConnected ? 'Connected' : 'Not Connected!'}`;
                toggleButton.textContent = data.isConnected ? 'Disconnect' : 'Connect';
                led.className = `status-led ${data.isConnected ? 'led-green' : 'led-red'}`;
            })
            .catch(error => {
                console.error('Error fetching VPN status:', error);
                document.getElementById('vpnStatus').textContent = 'Status: Error fetching status';
            });
    }
    updateVPNStatus();

    document.getElementById('toggleVPNButton').addEventListener('click', () => {
        const popup = document.getElementById('popup');
        const popupText = document.getElementById('popup-text');
        popup.style.display = 'flex';
        popupText.textContent = isVpnConnected ? 'Disconnecting VPN...' : 'Connecting VPN...';

        fetch('/api/toggle-vpn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ConnectOrDisconnect: !isVpnConnected })
        })
        .then(response => response.json())
        .then(data => {
            updateVPNStatus();
            popup.style.display = 'none';
        })
        .catch(error => {
            console.error('Error toggling VPN:', error);
            popup.style.display = 'none';
        });
    });

    document.getElementById('vpnSettingsForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const VPNConfigData = {
            vpnUsername: document.getElementById('vpnUsername').value,
            vpnPassword: document.getElementById('vpnPassword').value,
            vpnCountry: document.getElementById('vpnCountry').value
        };

        const message = document.getElementById('message');
        if (VPNConfigData.vpnUsername.length < 1 || VPNConfigData.vpnUsername.length > 32) {
            message.style.display = 'block';
            message.className = 'message error';
            message.textContent = 'VPN username length should be between 1 and 32 characters.';
            return;
        }
        if (VPNConfigData.vpnPassword.length < 8 || VPNConfigData.vpnPassword.length > 63) {
            message.style.display = 'block';
            message.className = 'message error';
            message.textContent = 'VPN password length should be between 8 and 63 characters.';
            return;
        }

        fetch('/api/set-vpn-auth-credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(VPNConfigData)
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

    document.getElementById('popupCancelBtn').addEventListener('click', () => {
        document.getElementById('popup').style.display = 'none';
    });
}

loadVPNSettingsPage();