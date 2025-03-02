function loadStatusPage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        
        <div id="networkInfo" class="sub-content-area" style="display:flow-root;">
            <div class="sub-content-area-header">Network Information</div>
            
            <label class="icon-label">
                <img src="images/ethernet-icon.png" alt="Icon" />
                <label id="ethernetData">Loading network data...</label>
            </label>

            <label class="icon-label">
                <img src="images/wi-fi-icon.png" alt="Icon" />
                <label id="wifiData"></label>
            </label>

            <label class="icon-label">
                <img src="images/internet-sharing.svg" alt="Icon" />
                <label id="internetSharing"></label>
            </label>

            <button id="checkInternetConnectionButton" type="button" class="btn btn-primary mt-4" style="margin-top:20px;">Check Internet Connection</button>
            <div id="messageArea" class="message mt-3" style="display: none;"></div>
        </div>

        <div id="vpnInfo" class="sub-content-area">
            <div class="sub-content-area-header">VPN Status</div>
            <label id="vpnIpInfo" class="icon-label">
                <img src="images/ip.png" alt="Icon" />
                <label>IP Address:&nbsp;</label><label id="currentIP" ></label>
            </label>

            <label class="icon-label">
                <img src="images/shield.png" alt="Icon" />
                <label>Status:&nbsp;</label><label id="vpnConnectionStatus"></label> 
                &nbsp;<div id="vpnStatusLed" class="status-led"></div
            </label>
        </div>

        <div id="statsInfo" class="sub-content-area">
            <div class="sub-content-area-header">Device Statistics</div>
            <ul id="statsData">Loading statistics...</ul>
            <div class="chart-container">
                <canvas id="cpuUsageChart"></canvas>
            </div>
            <br>
            <div class="chart-container">
                <canvas id="networkSpeedChart"></canvas>
            </div>
        </div>

        <button id="restartButton" type="button" class="btn btn-primary mt-4">Restart Device</button>


        <!-- Hidden Popup -->
        <div id="popup" class="popup">
            <div class="popup-content">
                <p id="popup-text"></p>
                <button id="popupCancelBtn">Cancel</button>
            </div>
        </div>
    `;

    // ************** CPU Usage Chart
    let cpuUsageData = [];
    let cpuusagelabels = [];
    let cpuUsageChart;
    const ctx = document.getElementById('cpuUsageChart').getContext('2d');

    cpuUsageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: cpuusagelabels,
            datasets: [{
                label: 'CPU Usage (%)',
                data: cpuUsageData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 1,
                fill: false,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    const ctx2 = document.getElementById('networkSpeedChart').getContext('2d');
    const networkSpeedChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: Array.from({ length: 60 }, (_, i) => `${-60 + i}`),
            datasets: [
                {
                    label: 'WiFi Download (Mbps)',
                    data: [],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    fill: false,
                },
                {
                    label: 'WiFi Upload (Mbps)',
                    data: [],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    fill: false,
                }/*,
                {
                    label: 'Ethernet Download (Mbps)',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: false,
                },
                {
                    label: 'Ethernet Upload (Mbps)',
                    data: [],
                    borderColor: 'rgba(153, 102, 255, 1)',
                    fill: false,
                },*/
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Speed (Mbps)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time (seconds)'
                    }
                }
            }
        }
    });
    

    // ************** Device and Network Status
    function updateDeviceStatus() {
        fetch('/api/network-status')
            .then(response => response.json())
            .then(data => {
                if(data.isEthernetConnected){
                    document.getElementById('ethernetData').textContent = `Ethernet Connected. IP Address: ${data.ipAddress}`;
                }
                else{
                    document.getElementById('ethernetData').textContent = `Ethernet Not Connected!`;
                }
            })
            .catch(error => console.error('Error fetching network-status:', error));

        fetch('/api/network_speed_stats')
            .then(response => response.json())
            .then(data => {
                if (!data.ethernet || !data.wifi) {
                    console.error("Invalid data format");
                    return;
                }
        
                //const ethernetDownload = data.ethernet.download;
                //const ethernetUpload = data.ethernet.upload;
                const wifiDownload = data.wifi.download;
                const wifiUpload = data.wifi.upload;
        
                networkSpeedChart.data.datasets[0].label = "WiFi Download";
                networkSpeedChart.data.datasets[0].data = wifiDownload;
                networkSpeedChart.data.datasets[1].label = "WiFi Upload";
                networkSpeedChart.data.datasets[1].data = wifiUpload;
                /*networkSpeedChart.data.datasets[2].label = "Ethernet Download";
                networkSpeedChart.data.datasets[2].data = ethernetDownload;
                networkSpeedChart.data.datasets[3].label = "Ethernet Upload";
                networkSpeedChart.data.datasets[3].data = ethernetUpload;*/
        
                networkSpeedChart.update();
            })
            .catch(error => console.error('Error fetching network_speed_stats:', error));

        fetch('/api/connected-devices')
            .then(response => response.json())
            .then(devices => {
                document.getElementById('wifiData').textContent = `Number of connected devices: ${devices.length}`;
            })
            .catch(error => console.error("Error fetching connected-devices:", error));

        fetch('/api/device-status')
            .then(response => response.json())
            .then(data => {
                const statsData = document.getElementById("statsData");
                statsData.innerHTML = '';

                const listItem = document.createElement("li");
                listItem.textContent = `Uptime: ${data.uptime} minutes`;                
                statsData.appendChild(listItem);
                const listItem2 = document.createElement("li");
                listItem2.textContent = `Memory Usage: ${data.memoryUsage}`;                
                statsData.appendChild(listItem2);
                const listItem3 = document.createElement("li");
                listItem3.textContent = `Disk Usage: ${data.diskFreeSpace} (${data.diskUsagePercentage}%)`;                
                statsData.appendChild(listItem3);
                const listItem4 = document.createElement("li");
                listItem4.textContent = `CPU Usage: ${data.cpuUsage}%`;                
                statsData.appendChild(listItem4);
                const listItem5 = document.createElement("li");
                listItem5.textContent = `CPU Temperature: ${parseInt(data.cpuTemperature)/1000} °C`;                
                statsData.appendChild(listItem5);

                const cpuUsage = data.cpuUsage;
                cpuUsageData.push(cpuUsage);
                cpuusagelabels.push(new Date().toLocaleTimeString());

                if (cpuUsageData.length > 50) {
                    cpuUsageData.shift();
                    cpuusagelabels.shift();
                }

                cpuUsageChart.update();
            })
            .catch(error => console.error('Error fetching device-status:', error));
    }

    fetch('/api/wifiConfig')
        .then(response => response.json())
        .then(data => {
            if(data.InternetStatus == "enabled"){
                document.getElementById('internetSharing').textContent = `Internet Sharing Enabled.`;
            }
            else {
                document.getElementById('internetSharing').textContent = `Internet Sharing Disabled!`;
            }
        })
        .catch(error => console.error('Error fetching wifiConfig:', error));

    updateDeviceStatus();
    window.timerUpdateDeviceStatus = setInterval(updateDeviceStatus, 1000);

    // ************** checkInternetConnectionButton
    document.getElementById('checkInternetConnectionButton').addEventListener('click', function () {
        const popup = document.getElementById("popup");
        const popup_text = document.getElementById("popup-text");
        
        popup.style.display = "flex";
        popup_text.textContent = "Pinging 8.8.8.8";

        fetch('/api/checkInternet')
            .then(response => response.json())
            .then(data => {
                document.getElementById('messageArea').style.display = 'inherit';
                document.getElementById('messageArea').textContent = data.message;
                setTimeout(() => {
                    document.getElementById('messageArea').textContent = ''; 
                    document.getElementById('messageArea').style.display = 'none';
                    }, 5000);
                popup.style.display = "none";
            })
            .catch(error => console.error('Error fetching checkInternet:', error));
        setTimeout(function() {
            popup.style.display = "none";
        }, 5000); 
    });

    // ************** VPN
    function updateVPNLedStatus(isConnected) {
        const vpnStatus = document.getElementById("vpnStatusLed");
        if (isConnected) {
            vpnStatus.classList.remove("led-red");
            vpnStatus.classList.add("led-green");
        } else {
            vpnStatus.classList.remove("led-green");
            vpnStatus.classList.add("led-red");
        }
    }

    function checkVPNStatus() {
        fetch('/api/vpn-status')
            .then(response => response.json())
            .then(data => {
                updateVPNLedStatus(data.isConnected);
                if(data.isConnected){
                    document.getElementById('vpnIpInfo').style.display = 'inherit';
                    document.getElementById('currentIP').innerText = data.ip;
                    document.getElementById('vpnConnectionStatus').innerText = 'Connected to ' + data.city + '/' + data.country ;
                }
                else{
                    document.getElementById('vpnIpInfo').style.display = 'none';
                    document.getElementById('currentIP').innerText = '';
                    document.getElementById('vpnConnectionStatus').innerText = 'Not connected!';
                }
            })
            .catch(error => console.error('Cannot get VPN status:', error));
    }
    checkVPNStatus();

    // ************** Restart Button
    // Restart button click handler with confirmation
    document.getElementById('restartButton').addEventListener('click', function () {
        if (confirm('Are you sure you want to restart the device?')) {
            fetch('/api/restart', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    document.getElementById('message').textContent = 'Device restarting...';
                    setTimeout(() => { document.getElementById('message').textContent = ''; }, 3000);
                })
                .catch(error => console.error('Error restarting device:', error));
        }
    });
}

loadStatusPage();