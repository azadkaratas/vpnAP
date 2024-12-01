function loadVPNSettingsPage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="sub-content-area">
            <div class="sub-content-area-header">VPN Configuration</div>
            <form id="vpnSettingsForm" class="mt-4">
                <div class="form-group">
                    <label for="vpnUsername">Username:</label>
                    <input type="text" id="vpnUsername" name="vpnUsername" class="form-control">
                </div>
                
                <div class="form-group mt-3">
                    <label for="vpnPassword">Password:</label>
                    <input type="password" id="vpnPassword" name="vpnPassword" class="form-control">
                </div>

                <div class="form-group mt-3">
                    <label for="vpnCountry">Select Country:</label>
                    <select id="vpnCountry" name="vpnCountry" class="form-control">
                        <option value="us">United States</option>
                        <option value="uk">United Kingdom</option>
                        <option value="de">Germany</option>
                        <option value="fr">France</option>
                        <option value="tr">Turkey</option>
                        <option value="custom">Custom (Specify below)</option>
                    </select>
                </div>

                <button type="submit" class="btn btn-primary mt-4">Save Configuration</button>
            </form>
            <div id="message" class="message mt-3" style="display: none;"></div>

            <hr>
            <div class="mt-4">
                <button id="toggleVPNButton" class="btn btn-secondary">Toggle VPN</button>
                <p id="vpnStatus" class="mt-3">Status: Fetching...</p>
            </div>
            
            <!-- Hidden Popup -->
            <div id="popup" class="popup">
                <div class="popup-content">
                    <p id="popup-text">Processing...</p>
                </div>
            </div>

        </div>
    `;

    // Fetch VPN credentials
    fetch('/api/get-vpn-auth-credentials')
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch credentials');
            return response.json();
        })
        .then(data => {
            document.getElementById('vpnUsername').value = data.username || '';
            document.getElementById('vpnPassword').value = data.password || '';
        })
        .catch(error => console.error('Error loading credentials:', error));

    // Update VPN status on load
    updateVPNStatus();

    // Attach toggle VPN button event
    const toggleVPNButton = document.getElementById('toggleVPNButton');
    toggleVPNButton.addEventListener('click', toggleVPN);

    // Submit form handler
    document.getElementById('vpnSettingsForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const VPNConfigData = {
            vpnUsername: document.getElementById('vpnUsername').value,
            vpnPassword: document.getElementById('vpnPassword').value
        };

        if(document.getElementById('vpnUsername').value.length < 1 || document.getElementById('vpnUsername').value.length > 32){
            document.getElementById('message').textContent = 'VPN username length should be between [1, 32].'; 
            return;
        }
        if(document.getElementById('vpnPassword').value.length < 8 || document.getElementById('vpnPassword').value.length > 63){
            document.getElementById('message').textContent = 'VPN password length should be between [8, 63].'; 
            return;
        }
        fetch('/api/set-vpn-auth-credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(VPNConfigData)
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('message').style.display = 'inherit';
            document.getElementById('message').textContent = data.message;
            setTimeout(() => {
                document.getElementById('message').textContent = ''; 
                document.getElementById('message').style.display = 'none';
                }, 3000);
        })
        .catch(error => console.error('Error updating configuration:', error));
    });
}

var isVpnConnected = false;

// Fetch and update the VPN status
function updateVPNStatus() {
    fetch('/api/vpn-status')
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch VPN status');
            return response.json();
        })
        .then(data => {
            const vpnStatusElement = document.getElementById('vpnStatus');
            if(data.isConnected){
                vpnStatusElement.textContent = "Connected";
                document.getElementById('toggleVPNButton').textContent = 'Disconnect';
            }
            else{
                vpnStatusElement.textContent = "Not Connected!";
                document.getElementById('toggleVPNButton').textContent = 'Connect';
            }
            isVpnConnected = data.isConnected;
        })
        .catch(error => {
            console.error('Error fetching VPN status:', error);
            document.getElementById('vpnStatus').textContent = 'Status: Error fetching status';
        });
}

// Toggle VPN on or off
function toggleVPN() {
    const popup = document.getElementById("popup");    
    popup.style.display = "flex";
    
    fetch('/api/toggle-vpn', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ConnectOrDisconnect: !isVpnConnected, // VPN'in ters durumu gönderiliyor
        }),
    })
        .then(response => response.json())
        .then(data => {
            const vpnStatusElement = document.getElementById('vpnStatus');
            if(data.connectionStatus){
                document.getElementById('toggleVPNButton').textContent = 'Disconnect';
                vpnStatusElement.textContent = "Connected";
                isVpnConnected = true;
            }
            else{
                document.getElementById('toggleVPNButton').textContent = 'Connect';
                vpnStatusElement.textContent = "Not Connected!";
                isVpnConnected = false;
            }
        })
        .catch(error => console.error('Error toggling VPN:', error));
    
    popup.style.display = "none";
}

loadVPNSettingsPage();
