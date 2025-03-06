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
                <div id="networkSpeedChart"></div>
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

    // ************** Network Speed Chart with ApexCharts
    const networkSpeedOptions = {
        chart: {
            type: 'area',
            height: 300,
            foreColor: '#f0f0f0',
            toolbar: { show: false }, // Hide toolbar for simplicity
            zoom: { enabled: false }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 1 },
        series: [
            { name: 'WiFi Download (Mbps)', data: [] },
            { name: 'WiFi Upload (Mbps)', data: [] }
            // Uncomment for Ethernet if needed
            // { name: 'Ethernet Download (Mbps)', data: [] },
            // { name: 'Ethernet Upload (Mbps)', data: [] }
        ],
        colors: ['#ff6384', '#36a2eb'], // Red for download, blue for upload
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.3
            }
        },
        xaxis: {
            categories: Array.from({ length: 60 }, (_, i) => `${-60 + i}`),
            title: { text: 'Time (seconds)', style: { color: '#f0f0f0' } },
            labels: { style: { colors: '#94a3b8' } }
        },
        yaxis: {
            title: { text: 'Speed (Mbps)', style: { color: '#f0f0f0' } },
            labels: { style: { colors: '#94a3b8' } },
            min: 0
        },
        grid: { borderColor: '#475569' },
        tooltip: {
            theme: 'dark',
            x: { show: true },
            y: { formatter: val => `${val.toFixed(2)} Mbps` }
        }
    };

    const networkSpeedChart = new ApexCharts(document.querySelector('#networkSpeedChart'), networkSpeedOptions);
    networkSpeedChart.render();

    function updateDeviceStatus() {
        fetch('/api/network-status').then(res => res.json()).then(data => {
            document.getElementById('ethernetData').textContent = data.isEthernetConnected
                ? `Ethernet Connected. IP: ${data.ipAddress}`
                : 'Ethernet Not Connected!';
        }).catch(err => console.error(err));

        fetch('/api/network_speed_stats')
            .then(response => response.json())
            .then(data => {
                if (!data.wifi) {
                    console.error("Invalid data format");
                    return;
                }

                const wifiDownload = data.wifi.download || [];
                const wifiUpload = data.wifi.upload || [];
                // const ethernetDownload = data.ethernet?.download || [];
                // const ethernetUpload = data.ethernet?.upload || [];

                networkSpeedChart.updateSeries([
                    { name: 'WiFi Download (Mbps)', data: wifiDownload.slice(-60) },
                    { name: 'WiFi Upload (Mbps)', data: wifiUpload.slice(-60) }
                    // { name: 'Ethernet Download (Mbps)', data: ethernetDownload.slice(-60) },
                    // { name: 'Ethernet Upload (Mbps)', data: ethernetUpload.slice(-60) }
                ]);
            })
            .catch(error => console.error('Error fetching network_speed_stats:', error));

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
                <li>CPU Temperature: ${parseInt(data.cpuTemperature) / 1000} °C</li>`;
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