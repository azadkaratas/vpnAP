const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
var DBus = require('dbus');
const multer = require('multer');
const util = require('util');
const execPromise = util.promisify(exec);
const fsp = require('fs').promises;
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Framebuffer parametreleri
const WIDTH = 480;
const HEIGHT = 320;
const BYTES_PER_PIXEL = 4; // 32-bit (varsayılan: BGR)

// Framebuffer'dan piksel verilerini okuma
function captureFramebuffer() {
    return new Promise((resolve, reject) => {
        fs.open('/dev/fb0', 'r', (err, fd) => {
            if (err) return reject(err);

            const buffer = Buffer.alloc(WIDTH * HEIGHT * BYTES_PER_PIXEL);
            fs.read(fd, buffer, 0, buffer.length, 0, (err) => {
                fs.close(fd, () => {});
                if (err) return reject(err);

                // Piksel verilerini sıkıştırılmış bir formatta hazırla
                const pixels = new Uint8Array(WIDTH * HEIGHT * 3); // RGB için 3 bayt/piksel
                for (let y = 0; y < HEIGHT; y++) {
                    for (let x = 0; x < WIDTH; x++) {
                        const idx = (y * WIDTH + x) * BYTES_PER_PIXEL;
                        // BGR sırası varsayımı: mavi (B), yeşil (G), kırmızı (R)
                        const b = buffer[idx];     // Mavi
                        const g = buffer[idx + 1]; // Yeşil
                        const r = buffer[idx + 2]; // Kırmızı
                        // Alfa kanalı yok sayılır (idx + 3)
                        const outIdx = (y * WIDTH + x) * 3;
                        pixels[outIdx] = r;     // Tarayıcı için RGB sırasına çevir
                        pixels[outIdx + 1] = g;
                        pixels[outIdx + 2] = b;
                    }
                }
                // Base64'e dönüştürerek sıkıştır
                const base64Data = Buffer.from(pixels).toString('base64');
                resolve(base64Data);
            });
        });
    });
}

// Statik HTML sayfası
app.get('/framebuffer', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Framebuffer Ekranı</title>
            <style>
                canvas {
                    image-rendering: pixelated; /* Keskin pikseller */
                    border: 1px solid #ccc;
                }
                #screen {
                    width: ${WIDTH * 2}px; /* Netlik için 2x ölçek */
                    height: ${HEIGHT * 2}px;
                }
            </style>
        </head>
        <body>
            <h1>Framebuffer Ekranı</h1>
            <canvas id="screen" width="${WIDTH}" height="${HEIGHT}"></canvas>
            <script>
                const canvas = document.getElementById('screen');
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false; // Yumuşatmayı kapat

                function refreshScreen() {
                    fetch('/screenshot')
                        .then(response => response.json())
                        .then(data => {
                            const pixels = new Uint8Array(atob(data.pixels).split('').map(c => c.charCodeAt(0)));
                            const imageData = ctx.createImageData(${WIDTH}, ${HEIGHT});
                            for (let i = 0; i < pixels.length; i += 3) {
                                const idx = (i / 3) * 4;
                                imageData.data[idx] = pixels[i];     // Kırmızı
                                imageData.data[idx + 1] = pixels[i + 1]; // Yeşil
                                imageData.data[idx + 2] = pixels[i + 2]; // Mavi
                                imageData.data[idx + 3] = 255;       // Alfa
                            }
                            ctx.putImageData(imageData, 0, 0);
                            setTimeout(refreshScreen, 100); // 10 FPS
                        })
                        .catch(err => console.error('Hata:', err));
                }
                refreshScreen();
            </script>
        </body>
        </html>
    `);
});

// Framebuffer verisini JSON olarak gönder
app.get('/screenshot', async (req, res) => {
    try {
        const base64Data = await captureFramebuffer();
        res.json({ pixels: base64Data });
    } catch (err) {
        console.error('Hata:', err);
        res.status(500).send('Framebuffer okunamadı');
    }
});






// Define paths
const configPath = '/data/config.json';

app.get('/api/version', (req, res) => {
    fs.readFile('/etc/version', 'utf8', (err, version) => {
        if (err) {
            return res.status(500).send("Couldn't read version file");
        }
        res.json({ version: version.trim() });
    });
});

app.get('/api/overview', (req, res) => {
    let connectedDeviceCount, ethStatus, internetStatus;

    fs.readFile(configPath, 'utf8', (configErr, configData) => {
        if (configErr) {
            console.error("Error reading config file!", configErr);
            return res.status(500).json({ message: 'Error reading config file' });
        }
        const config = JSON.parse(configData);
        internetStatus = config.wifi.internetStatus === 'enabled' ? 'Enabled' : 'Disabled!';



        fs.readFile('/var/lib/dhcp/dhcpd.leases', 'utf8', (err, data) => {
            if (err) {
                console.error("Couldn't read DHCP file:", err);
                return res.status(500).json({ message: "Couldn't read DHCP file" });
            }

            const leases = [];
            const registeredIPs = new Map();
            const leaseBlocks = data.split('lease ').slice(1);
            const now = new Date(); // Current time for duration calculation

            leaseBlocks.forEach(block => {
                const lines = block.trim().split('\n');
                const lease = {};

                lease.ip = lines[0].trim().split(' ')[0]; // IP from "lease <IP> {"
                lines.forEach(line => {
                    if (line.includes('client-hostname')) {
                        lease.hostname = line.split('"')[1] || 'Unknown';
                    } else if (line.includes('binding state active')) {
                        lease.active = true;
                    } else if (line.includes('starts')) {
                        // Parse "starts 3 2025/03/05 21:40:46;"
                        const startStr = line.split('starts ')[1]?.replace(';', '').trim();
                        if (startStr) {
                            const parts = startStr.split(' '); // ["3", "2025/03/05", "21:40:46"]
                            if (parts.length >= 2) {
                                const dateTime = `${parts[1]} ${parts[2]}`; // "2025/03/05 21:40:46"
                                // Replace slashes with dashes and ensure UTC
                                lease.start = new Date(dateTime.replace(/\//g, '-') + ' UTC');
                                if (!isNaN(lease.start)) {
                                    const durationMs = now - lease.start;
                                    lease.connectedMinutes = Math.floor(durationMs / 60000); // Convert ms to minutes
                                } else {
                                    console.error(`Invalid start time for ${lease.ip}: ${dateTime}`);
                                    lease.connectedMinutes = 0; // Fallback
                                }
                            }
                        }
                    }
                });
                if (lease.active) {
                    registeredIPs.set(lease.ip, lease);
                }
            });

            registeredIPs.forEach(value => leases.push(value));
            connectedDeviceCount = registeredIPs.size;

            exec("cat /sys/class/net/eth0/carrier", (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    ethStatus = 'Error fetching status';
                    return res.json({
                        connectedDeviceCount: connectedDeviceCount,
                        ethStatus: ethStatus,
                        intSharing: internetStatus
                    });
                }

                const isEthernetConnected = stdout.trim() === '1';
                let ipAddress;

                if (isEthernetConnected) {
                    exec("ifconfig eth0 | grep 'inet ' | awk '{print $2}'", (error, stdout) => {
                        if (error) {
                            console.log(`Error fetching network info: ${error.message}`);
                            ethStatus = 'Error fetching network info';
                        } else {
                            ipAddress = stdout.trim().replace('addr:', '');
                            ethStatus = `Connected. IP: ${ipAddress}`;
                        }
                        res.json({
                            connectedDeviceCount: connectedDeviceCount,
                            ethStatus: ethStatus,
                            intSharing: internetStatus
                        });
                    });
                } else {
                    ethStatus = 'Not Connected!';
                    res.json({
                        connectedDeviceCount: connectedDeviceCount,
                        ethStatus: ethStatus,
                        intSharing: internetStatus
                    });
                }
            });
        });

    });
});

// API endpoint to get current configuration
app.get('/api/wifi-config', (req, res) => {
    fs.readFile(configPath, 'utf8', (configErr, configData) => {
        if (configErr) {
            console.error("Error reading config file!", configErr);
            return res.status(500).json({ message: 'Error reading config file' });
        }
        const config = JSON.parse(configData);
        res.json({
            WifiName: config.wifi.name,
            WifiPassword: config.wifi.password
        });
    });
});

app.post('/api/wifi-config', (req, res) => {
    const { WifiName, WifiPassword, InternetStatus} = req.body;
    const hostapdPath = '/etc/hostapd_custom.conf';

    // Read the current configuration
    fs.readFile(configPath, 'utf8', (configErr, configData) => {
        if (configErr) {
            console.error("Error reading config file!", configErr);
            return res.status(500).json({ message: 'Error reading config file' });
        }

        const config = JSON.parse(configData);

        // Update only the wifi configuration
        config.wifi = {
            name: WifiName,
            password: WifiPassword,
            internetStatus: InternetStatus
        };

        // Write the updated config back to the config file
        fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8', (err) => {
            if (err) {
                console.error("Error writing config file!", err);
                return res.status(500).json({ message: 'Error saving the config file' });
            }

            fs.readFile(hostapdPath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error at reading file: ${err}`);
                    return;
                }
                let updatedData = data.replace(/(ssid=).*/g, `ssid=${WifiName}`)
                                      .replace(/(wpa_passphrase=).*/g, `wpa_passphrase=${WifiPassword}`);
                fs.writeFile(hostapdPath, updatedData, 'utf8', (err) => {
                    if (err) {
                        console.error(`Error at file write: ${err}`);
                    } else {
                        console.log('hostapd file updated successfully.');
                    }
                });
            });
    
            if(InternetStatus == "enabled"){
                exec("echo 1 > /proc/sys/net/ipv4/ip_forward", (error, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        return;
                    }
                });
            }
            else{
                exec("echo 0 > /proc/sys/net/ipv4/ip_forward", (error, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        return;
                    }
                });
            }
    
            console.log("Wi-Fi Configuration updated successfully.");
            res.json({ message: 'Wi-Fi Configuration updated successfully' });
        });
    });
});

app.get('/api/wifi-channel', (req, res) => {
    const hostapdPath = '/etc/hostapd_custom.conf';
    let intSharing = 0;
    fs.readFile(hostapdPath, 'utf8', (err, data) => {
        const lines = data.split('\n');
        let hwMode = '';
        let channel = '';
        for (const line of lines) {
            if (line.startsWith('hw_mode=')) {
                hwMode = line.split('=')[1].trim();
            } else if (line.startsWith('channel=')) {
                channel = parseInt(line.split('=')[1].trim(), 10);
            }
        }
        console.log(hwMode, channel);
        let band = '';
        if (hwMode === 'g' || (hwMode === 'b' && channel >= 1 && channel <= 13)) {
            band = 'twog';
        } else if (hwMode === 'a' && channel >= 36) {
            band = 'fiveg';
        } else {
            return res.status(400).json({ message: 'Unknown Wi-Fi band' });
        }

        exec("cat /proc/sys/net/ipv4/ip_forward", (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            intSharing = stdout.trim() === '1';
            res.json({ WifiFreq: band, WifiInternetSharing: intSharing});
        });
    });
});

app.post('/api/wifi-channel', async (req, res) => {
    const { WifiFreq, WifiInternetSharing } = req.body;
    const hostapdPath = '/etc/hostapd_custom.conf';
  
    // Input doğrulama
    if (!WifiFreq || (WifiFreq !== 'twog' && WifiFreq !== 'fiveg')) {
      return res.status(400).json({ message: 'Geçersiz WifiFreq: "twog" veya "fiveg" olmalı' });
    }
    if (typeof WifiInternetSharing !== 'boolean') {
      return res.status(400).json({ message: 'WifiInternetSharing true veya false olmalı' });
    }
  
    try {
      const data = await fsp.readFile(hostapdPath, 'utf8');
      const newSettings = {
        'twog': { hwMode: 'g', channel: 6 },  // 2.4 GHz
        'fiveg': { hwMode: 'a', channel: 36 } // 5 GHz
      };
  
      const { hwMode, channel } = newSettings[WifiFreq];
  
      const updatedData = data
        .replace(/(hw_mode=).*/g, `hw_mode=${hwMode}`)
        .replace(/(channel=).*/g, `channel=${channel}`);
  
      await fsp.writeFile(hostapdPath, updatedData, 'utf8');
      console.log('hostapd file updated successfully.');
  
      const ipForwardValue = WifiInternetSharing ? '1' : '0';
      await execPromise(`echo ${ipForwardValue} > /proc/sys/net/ipv4/ip_forward`);
      console.log(`Internet sharing set to: ${WifiInternetSharing}`);
  
      await execPromise('/etc/init.d/S90hostapd restart');
      console.log('hostapd restarted successfully.');

      res.json({
        message: 'Wi-Fi settings updated successfully.',
        WifiFreq,
        WifiInternetSharing
      });
    } catch (error) {
      console.error(`Error: ${error.message}`);
      res.status(500).json({ message: `Error: ${error.message}` });
    }
  });

app.post('/api/restart', (req, res) => {
    exec('( sleep 1 ; reboot ) & ', (error, stdout, stderr) => {
        if (error) {
            console.log(`Error restarting device: ${error.message}`);
            return res.json({ message: 'Error restarting device' });
        }
        if (stderr) {
            console.log(`Command stderr: ${stderr}`);
            return res.json({ message: 'Command error' });
        }
    });
    res.json({ success: true, message: 'Device restart initiated successfully.' });
});

app.get('/api/network-status', (req, res) => {
    exec("cat /sys/class/net/eth0/carrier", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }

        const isEthernetConnected = stdout.trim() === '1';
        
        if (isEthernetConnected) {
            exec("ifconfig eth0 | grep 'inet ' | awk '{print $2}'", (error, stdout) => {
                if (error) {
                    console.log(`Error fetching network info: ${error.message}`);
                    return res.json({ message: 'Error fetching network info' });
                }
            
                const ipAddress = stdout.trim().replace('addr:', '');
                res.json({
                    ipAddress,
                    isEthernetConnected
                });
            });
        }
        else {
            res.json({
                ipAddress: null,
                isEthernetConnected
            });
        }
    });
});

app.get('/api/device-status', (req, res) => {
    exec("ifconfig wlan0 | grep 'inet ' | awk '{print $2}'", (error, stdout) => {
        if (error) {
            console.log(`Error fetching network info: ${error.message}`);
            return res.json({ message: 'Error fetching network info' });
        }

        const ipAddress = stdout.trim().replace('addr:', '');

        exec("awk '{print $1}' /proc/uptime", (error, stdout) => {
            if (error) {
                console.error(`Error fetching uptime: ${error.message}`);
                return res.json({ message: 'Error fetching uptime' });
            }

            const uptime = `${Math.floor(parseInt(stdout.trim()) / 3600)}h ${(Math.floor(parseInt(stdout.trim()) / 60) % 60)}m`;

            exec("top -bn1 | grep 'CPU:' | awk '{print $2}' | head -n 1 | sed 's/%//'", (error, stdout) => {
                const cpuUsage = stdout.trim() + '%';

                exec("free -m | grep Mem | awk '{print ($3/$2) * 100.0}'", (error, stdout) => {
                    const memoryUsage = `${parseFloat(stdout.trim()).toFixed(2)}%`;

                    exec('df -h / | tail -n 1', (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error fetching disk usage: ${error.message}`);
                            return res.status(500).json({ message: 'Error fetching disk usage' });
                        }
                        if (stderr) {
                            console.error(`Command stderr: ${stderr}`);
                            return res.status(500).json({ message: 'Command error', details: stderr });
                        }
                        const outputLines = stdout.trim().split(/\s+/);
                        const diskUsagePercentage = outputLines[4].replace('%', '');
                        const diskFreeSpace = outputLines[2];

                        exec("cat /sys/class/thermal/thermal_zone0/temp", (error, stdout) => {
                            const cpuTemperature = stdout.trim()/1000 + ' °C';
                            res.json({
                                ipAddress,
                                uptime,
                                cpuUsage,
                                memoryUsage,
                                diskUsagePercentage,
                                diskFreeSpace,
                                cpuTemperature
                            });
                        });
                    });
                });
            });
        });
    });
});

// VPN
app.get('/api/get-vpn-auth-credentials', (req, res) => {
    fs.readFile(configPath, 'utf8', (configErr, configData) => {
        if (configErr) {
            console.error("Error reading config file!", configErr);
            return res.status(500).json({ message: 'Error reading config file' });
        }
        const config = JSON.parse(configData);
        res.json({
            vpnUsername: config.vpn.nordvpn.username,
            vpnPassword: config.vpn.nordvpn.vpnPassword,
            vpnCountry: config.vpn.nordvpn.country
        });
    });
});

app.post('/api/set-vpn-auth-credentials', (req, res) => {
    const {vpnUsername, vpnPassword, vpnCountry} = req.body;
    const authFilePath = '/etc/openvpn/auth.txt';

    // Read the current configuration
    fs.readFile(configPath, 'utf8', (configErr, configData) => {
        if (configErr) {
            console.error("Error reading config file!", configErr);
            return res.status(500).json({ message: 'Error reading config file' });
        }

        const config = JSON.parse(configData);

        // Update only the VPN configuration
        config.vpn.nordvpn = {
            username: vpnUsername,
            vpnPassword: vpnPassword,
            country: vpnCountry
        };

        // Write the updated config back to the config file
        fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8', (err) => {
            if (err) {
                console.error("Error writing config file!", err);
                return res.status(500).json({ message: 'Error saving the config file' });
            }

            try {
                // Create the directory if it doesn't exist
                const authDir = path.dirname(authFilePath);
                if (!fs.existsSync(authDir)) {
                    fs.mkdirSync(authDir, { recursive: true });
                }
        
                // Write credentials to the file
                const credentials = `${vpnUsername}\n${vpnPassword}\n`; // Username and password, each on a new line
                fs.writeFileSync(authFilePath, credentials, { mode: 0o600 }); // Secure file with 600 permissions        
            } catch (error) {
                console.error('Error writing to auth file:', error);
                res.status(500).json({ error: 'Failed to update VPN configuration.' });
            }
        });
    });

    console.log("VPN configuration updated successfully.");
    res.json({ message: 'VPN configuration updated successfully' });
});

app.get('/api/vpn-status', async (req, res) => {
    const statusFilePath = '/tmp/openvpn/status';

    const timeout = (ms) => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), ms);
    });

    let isConnectedReadFromFile = false;
    let vpnIpAddress = 'No content available';
    let vpnCountry = 'No content available';

    try {
        const controller = new AbortController();
        const timeoutMs = 5000;

        const response = await Promise.race([
            fetch('http://ip-api.com/json/', { signal: controller.signal }),
            timeout(timeoutMs)
        ]);

        const data = await response.json();

        if (data.status === 'success') {
            vpnIpAddress = data.query;
            vpnCountry = `${data.country}/${data.city}`;

            try {
                if (fs.existsSync(statusFilePath)) {
                    const fileData = fs.readFileSync(statusFilePath, 'utf8').trim();
                    isConnectedReadFromFile = fileData === '1';
                }
            } catch (error) {
                isConnectedReadFromFile = false;
            }
        }
    } catch (error) {
        isConnectedReadFromFile = false;
        vpnIpAddress = 'No content available';
        vpnCountry = 'No content available';
    }

    res.json({
        vpnStatus: isConnectedReadFromFile,
        vpnIpAddress,
        vpnCountry
    });
});

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error executing command: ${error.message}`);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

async function toggleVPN(ConnectOrDisconnect) {
    try {
        const statusFilePath = '/tmp/openvpn/status';

        if (!fs.existsSync(statusFilePath)) {
            console.error('Status file does not exist.');
            throw new Error('Status file not found.');
        }

        const data = fs.readFileSync(statusFilePath, 'utf8').trim();

        if (data === '0') {
            console.log('Starting VPN...');
            const result = await runCommand('/etc/init.d/S95vpnmgr start &');
            console.log('VPN started successfully:', result);
        } else {
            console.log('Stopping VPN...');
            const result = await runCommand('/etc/init.d/S95vpnmgr stop &');
            console.log('VPN stopped successfully:', result);
        }

    } catch (error) {
        console.error('Error toggling VPN:', error.message);
        throw error;
    }
}

app.post('/api/toggle-vpn', async (req, res) => {
    const { ConnectOrDisconnect } = req.body;

    try {
        const connectionStatus = await toggleVPN(ConnectOrDisconnect);
        return res.json({ connectionStatus });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.get('/api/connected-devices', (req, res) => {
    fs.readFile('/var/lib/dhcp/dhcpd.leases', 'utf8', (err, data) => {
        if (err) {
            console.error("Couldn't read DHCP file:", err);
            return res.status(500).json({ message: "Couldn't read DHCP file" });
        }

        const leases = [];
        const registeredIPs = new Map();
        const leaseBlocks = data.split('lease ').slice(1);
        const now = new Date(); // Current time for duration calculation

        leaseBlocks.forEach(block => {
            const lines = block.trim().split('\n');
            const lease = {};

            lease.ip = lines[0].trim().split(' ')[0]; // IP from "lease <IP> {"
            lines.forEach(line => {
                if (line.includes('client-hostname')) {
                    lease.hostname = line.split('"')[1] || 'Unknown';
                } else if (line.includes('binding state active')) {
                    lease.active = true;
                } else if (line.includes('starts')) {
                    // Parse "starts 3 2025/03/05 21:40:46;"
                    const startStr = line.split('starts ')[1]?.replace(';', '').trim();
                    if (startStr) {
                        const parts = startStr.split(' '); // ["3", "2025/03/05", "21:40:46"]
                        if (parts.length >= 2) {
                            const dateTime = `${parts[1]} ${parts[2]}`; // "2025/03/05 21:40:46"
                            // Replace slashes with dashes and ensure UTC
                            lease.start = new Date(dateTime.replace(/\//g, '-') + ' UTC');
                            if (!isNaN(lease.start)) {
                                const durationMs = now - lease.start;
                                lease.connectedMinutes = Math.floor(durationMs / 60000); // Convert ms to minutes
                            } else {
                                console.error(`Invalid start time for ${lease.ip}: ${dateTime}`);
                                lease.connectedMinutes = 0; // Fallback
                            }
                        }
                    }
                }
            });
            if (lease.active) {
                registeredIPs.set(lease.ip, lease);
            }
        });

        registeredIPs.forEach(value => leases.push(value));
        res.json({connectedDevices:leases});
    });
});

app.get('/api/checkInternet', (req, res) => {
    exec('ping -c 1 8.8.8.8', (error, stdout, stderr) => {
        if (error) {
            return res.json({ message: 'No internet connection found!' });
        } else {
            return res.json({ message: 'Internet connection found.' });
        }
    });
});

app.get('/api/network_speed_stats', (req, res) => {
    fs.readFile('/tmp/netmon.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send("Couldn't read netmon file");
        }
        try {
            const jsonData = JSON.parse(data);
            const ethernet = jsonData.interfaces.ethernet;
            const wifi = jsonData.interfaces.wifi;
            
            const stats = {
                ethernet: {
                    enabled: ethernet.enabled,
                    upload: ethernet.speed.upload,
                    download: ethernet.speed.download
                },
                wifi: {
                    enabled: wifi.enabled,
                    upload: wifi.speed.upload,
                    download: wifi.speed.download
                }
            };
            
            res.json(stats);
        } catch (parseError) {
            res.status(500).send("Error parsing JSON data");
        }
    });
});

// Set up multer for file uploads
const upload = multer({
    dest: '/tmp/', // Destination folder for uploaded files
    limits: { fileSize: 400 * 1024 * 1024 } // Limit file size to 400MB
});

app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    if (fileName === "rootfs.ext4") {
        const targetPath = path.join('/tmp/', fileName);

        if (fs.existsSync(targetPath)) {
            fs.unlink(targetPath, () => {}); // Clean up previous file
            console.log(`Cleaning previous fwupdate file`);
        }
        fs.rename(filePath, targetPath, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error moving file', error: err.message });
            }
            res.json({ message: 'File uploaded successfully. Ready to update firmware.', file: targetPath });
        });
    } else {
        fs.unlink(filePath, () => {}); // Clean up invalid file
        return res.status(400).json({ message: 'Invalid file uploaded. Only rootfs.ext4 is allowed.' });
    }
});

app.post('/api/update-firmware', (req, res) => {
    exec('sh /usr/bin/updatefw.sh', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing updatefw.sh: ${error.message}`);
            return res.status(500).json({ success: false, message: `Firmware update failed: ${error.message}` });
        }
        if (stderr) {
            console.error(`Update command stderr: ${stderr}`);
            return res.status(500).json({ success: false, message: `Firmware update error: ${stderr}` });
        }
        console.log(`Firmware update stdout: ${stdout}`);
        res.json({ success: true, message: 'Firmware updated successfully.' });
    });
});
const fs_asenkron = require('fs').promises;
app.get('/api/readfile/var/log/messages', async (req, res) => {
    const filePath = '/var/log/messages';
    try {
        const content = await fs_asenkron.readFile(filePath, { encoding: 'utf8' });
        res.send(content);
    } catch (error) {
        res.status(500).send(`Error at file reading - ${error.message}`);
    }
  });