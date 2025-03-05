function loadStatusPage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="sub-content-area">
            <div class="sub-content-area-header">Network Information</div>
            <div class="icon-label">
                <i class="bi bi-ethernet"></i>
                <span id="ethernetData">Loading...</span>
            </div>
            <div class="icon-label">
                <i class="bi bi-wifi"></i>
                <span id="wifiData">Loading...</span>
            </div>
            <div class="icon-label">
                <i class="bi bi-share"></i>
                <span id="internetSharing">Loading...</span>
            </div>
            <button id="checkInternetConnectionButton" class="btn btn-primary mt-3">Check Internet</button>
            <div id="messageArea" class="message" style="display: none;"></div>
        </div>

        <div class="sub-content-area">
            <div class="sub-content-area-header">VPN Status</div>
            <div class="icon-label" id="vpnIpInfo">
                <i class="bi bi-globe"></i>
                <span>IP Address: <strong id="currentIP"></strong></span>
            </div>
            <div class="icon-label">
                <i class="bi bi-shield-lock"></i>
                <span>Status: <strong id="vpnConnectionStatus"></strong></span>
                <div id="vpnStatusLed" class="status-led"></div>
            </div>
        </div>

        <div class="sub-content-area">
            <div class="sub-content-area-header">Device Statistics</div>
            <ul id="statsData" class="list-unstyled"></ul>
            <div class="chart-container">
                <canvas id="cpuUsageChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="networkSpeedChart"></canvas>
            </div>
            <button id="restartButton" class="btn btn-primary mt-3">Restart Device</button>
        </div>

        <div id="popup" class="popup">
            <div class="popup-content">
                <p id="popup-text"></p>
                <button id="popupCancelBtn" class="btn btn-secondary mt-2">Cancel</button>
            </div>
        </div>
    `;

    // Chart setup remains unchanged
    const ctx = document.getElementById('cpuUsageChart').getContext('2d');
    let cpuUsageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CPU Usage (%)',
                data: [],
                borderColor: '#7c3aed', // Updated to violet
                backgroundColor: 'rgba(124, 58, 237, 0.2)',
                fill: false
            }]
        },
        options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });

    const ctx2 = document.getElementById('networkSpeedChart').getContext('2d');
    const networkSpeedChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: Array.from({ length: 60 }, (_, i) => `${-60 + i}`),
            datasets: [
                { label: 'WiFi Download (Mbps)', data: [], borderColor: '#d946ef', fill: false }, // Magenta
                { label: 'WiFi Upload (Mbps)', data: [], borderColor: '#22d3ee', fill: false } // Cyan
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Speed (Mbps)' } },
                x: { title: { display: true, text: 'Time (seconds)' } }
            }
        }
    });

    // Rest of the function remains unchanged
    function updateDeviceStatus() {
        fetch('/api/network-status').then(res => res.json()).then(data => {
            document.getElementById('ethernetData').textContent = data.isEthernetConnected
                ? `Ethernet Connected. IP: ${data.ipAddress}`
                : 'Ethernet Not Connected!';
        }).catch(err => console.error(err));

        fetch('/api/network_speed_stats').then(res => res.json()).then(data => {
            networkSpeedChart.data.datasets[0].data = data.wifi.download;
            networkSpeedChart.data.datasets[1].data = data.wifi.upload;
            networkSpeedChart.update();
        }).catch(err => console.error(err));

        fetch('/api/connected-devices').then(res => res.json()).then(devices => {
            document.getElementById('wifiData').textContent = `Connected Devices: ${devices.length}`;
        }).catch(err => console.error(err));

        fetch('/api/device-status').then(res => res.json()).then(data => {
            const statsData = document.getElementById('statsData');
            statsData.innerHTML = `
                <li>Uptime: ${data.uptime} minutes</li>
                <li>Memory Usage: ${data.memoryUsage}</li>
                <li>Disk Usage: ${data.diskFreeSpace} (${data.diskUsagePercentage}%)</li>
                <li>CPU Usage: ${data.cpuUsage}%</li>
                <li>CPU Temperature: ${parseInt(data.cpuTemperature) / 1000} °C</li>
            `;
            cpuUsageChart.data.labels.push(new Date().toLocaleTimeString());
            cpuUsageChart.data.datasets[0].data.push(data.cpuUsage);
            if (cpuUsageChart.data.labels.length > 50) {
                cpuUsageChart.data.labels.shift();
                cpuUsageChart.data.datasets[0].data.shift();
            }
            cpuUsageChart.update();
        }).catch(err => console.error(err));
    }

    fetch('/api/wifiConfig').then(res => res.json()).then(data => {
        document.getElementById('internetSharing').textContent = data.InternetStatus === 'enabled'
            ? 'Internet Sharing Enabled'
            : 'Internet Sharing Disabled!';
    }).catch(err => console.error(err));

    updateDeviceStatus();
    window.timerUpdateDeviceStatus = setInterval(updateDeviceStatus, 1000);

    document.getElementById('checkInternetConnectionButton').addEventListener('click', () => {
        const popup = document.getElementById('popup');
        const popupText = document.getElementById('popup-text');
        popup.style.display = 'flex';
        popupText.textContent = 'Pinging 8.8.8.8...';

        fetch('/api/checkInternet').then(res => res.json()).then(data => {
            const messageArea = document.getElementById('messageArea');
            messageArea.style.display = 'block';
            messageArea.className = `message ${data.message.includes('found') ? 'success' : 'error'}`;
            messageArea.textContent = data.message;
            setTimeout(() => { messageArea.style.display = 'none'; }, 5000);
            popup.style.display = 'none';
        }).catch(err => console.error(err));
    });

    function updateVPNLedStatus(isConnected) {
        const led = document.getElementById('vpnStatusLed');
        led.className = `status-led ${isConnected ? 'led-green' : 'led-red'}`;
    }

    function checkVPNStatus() {
        fetch('/api/vpn-status').then(res => res.json()).then(data => {
            updateVPNLedStatus(data.isConnected);
            document.getElementById('vpnIpInfo').style.display = data.isConnected ? 'flex' : 'none';
            document.getElementById('currentIP').textContent = data.isConnected ? data.ip : '';
            document.getElementById('vpnConnectionStatus').textContent = data.isConnected
                ? `Connected to ${data.city}/${data.country}`
                : 'Not Connected!';
        }).catch(err => console.error(err));
    }
    checkVPNStatus();

    // Check for existing restart popup on page load and close it
    const existingPopup = document.getElementById('restartPopup');
    if (existingPopup) {
        existingPopup.style.display = 'none';
    }

    document.getElementById('restartButton').addEventListener('click', () => {
        // Remove any existing popup to reset state
        let restartPopup = document.getElementById('restartPopup');
        if (restartPopup) {
            restartPopup.remove();
        }

        // Create fresh popup
        const popupHtml = `
            <div id="restartPopup" class="popup">
                <div class="popup-content">
                    <p>Are you sure you want to restart the device?</p>
                    <button id="restartYesBtn" class="btn btn-primary mt-2">Yes</button>
                    <button id="restartNoBtn" class="btn btn-secondary mt-2">No</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', popupHtml);
        restartPopup = document.getElementById('restartPopup');
        restartPopup.style.display = 'flex';

        // Add event listeners to buttons
        const yesBtn = document.getElementById('restartYesBtn');
        const noBtn = document.getElementById('restartNoBtn');

        yesBtn.addEventListener('click', () => {
            fetch('/api/restart', { method: 'POST' })
                .then(res => {
                    if (!res.ok) throw new Error('Restart request failed');
                    return res.json();
                })
                .then(data => {
                    if (data.success) {
                        restartPopup.innerHTML = `
                            <div class="popup-content">
                                <p>Device restarting...</p>
                            </div>
                        `;
                         // To make sure when device reboots, popup is gone automatically
                        setTimeout(() => { window.location.reload(); }, 30000);
                    } else {
                        throw new Error(data.message || 'Restart failed');
                    }
                })
                .catch(err => {
                    console.error('Error restarting device:', err);
                    restartPopup.innerHTML = `
                        <div class="popup-content">
                            <p>Error restarting device: ${err.message}</p>
                            <button id="restartCloseBtn" class="btn btn-secondary mt-2">Close</button>
                        </div>
                    `;
                    document.getElementById('restartCloseBtn').addEventListener('click', () => {
                        restartPopup.style.display = 'none';
                    });
                });
        }, { once: true }); // Ensure listener runs only once

        noBtn.addEventListener('click', () => {
            restartPopup.style.display = 'none';
        }, { once: true }); // Ensure listener runs only once
    });
}

loadStatusPage();