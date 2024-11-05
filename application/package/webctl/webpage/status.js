function loadStatusPage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        
        <div id="networkInfo" class="sub-content-area">
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
        </div>

        <div id="vpnInfo" class="sub-content-area">
            <div class="sub-content-area-header">VPN Status</div>
            <label id="VPNData">Loading VPN data...</label>
            <div id="vpnStatusLed" class="status-led"></div>
        </div>
        <div id="statsInfo" class="sub-content-area">
            <div class="sub-content-area-header">Device Statistics</div>
            <ul id="statsData">Loading statistics...</ul>
            <div class="chart-container">
                <canvas id="cpuUsageChart"></canvas>
            </div>
        </div>

        <button id="restartButton" type="button" class="btn btn-primary mt-4">Restart Device</button>
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
                fill: true,
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
            .catch(error => console.error('Error fetching device status:', error));


        fetch('/api/connected-devices')
            .then(response => response.json())
            .then(devices => {
                document.getElementById('wifiData').textContent = `Number of connected devices: ${devices.length}`;
        })
        .catch(error => console.error("Couldn't get the device list:", error));

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

                const cpuUsage = data.cpuUsage;
                cpuUsageData.push(cpuUsage);
                cpuusagelabels.push(new Date().toLocaleTimeString());

                if (cpuUsageData.length > 50) {
                    cpuUsageData.shift();
                    cpuusagelabels.shift();
                }

                cpuUsageChart.update();
            })
            .catch(error => console.error('Error fetching device status:', error));
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
        .catch(error => console.error('Error fetching configuration:', error));

    updateDeviceStatus();
    window.intervalID_cpu = setInterval(updateDeviceStatus, 1000);


    fetch('/api/vpn-status')  // API'den VPN durumu bilgisi almak
        .then(response => response.json())
        .then(data => {
            updateVPNStatus(data.isConnected);  // Bağlantı durumu true/false
        })
        .catch(error => console.error('Cannot get VPN status:', error));


    // ************** VPN
    function updateVPNStatus(isConnected) {
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
        fetch('/api/vpn-status')  // API'den VPN durumu bilgisi almak
            .then(response => response.json())
            .then(data => {
                updateVPNStatus(data.isConnected);  // Bağlantı durumu true/false
            })
            .catch(error => console.error('Cannot get VPN status:', error));
    }
    window.intervalID_vpn = setInterval(checkVPNStatus, 1000); // Her 5 saniyede bir VPN durumunu kontrol et
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