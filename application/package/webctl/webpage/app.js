const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
var DBus = require('dbus');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '')));
// API endpoint to get current configuration
app.get('/api/wifiConfig', (req, res) => {
    fs.readFile('/usr/html/config.json', 'utf8', (configErr, configData) => {
        if (configErr) {
            console.error("Error reading config file!", configErr);
            return res.status(500).json({ message: 'Error reading config file' });
        }
        const config = JSON.parse(configData);
        res.json({
            WifiName: config.WifiName,
            WifiPassword: "secretPassword",
            InternetStatus: config.InternetStatus
        });
    });
});

app.post('/api/wifiConfig', (req, res) => {
    const { WifiName, WifiPassword, InternetStatus} = req.body;

    // Define paths
    const configPath = '/usr/html/config.json';
    const hostapdPath = '/etc/hostapd.conf';

    // Prepare config.json data
    const newConfig = {
        WifiName: WifiName,
        WifiPassword: WifiPassword,
        InternetStatus: InternetStatus
    };

    // Write to config.json
    fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf8', (err) => {
        if (err) {
            console.error("Error writing config.json:", err);
            return res.status(500).json({ message: 'Error writing config file' });
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

app.post('/api/restart', (req, res) => {
    exec('reboot -f', (error, stdout, stderr) => {
        if (error) {
            console.log(`Error restarting device: ${error.message}`);
            return res.json({ message: 'Error restarting device' });
        }
        if (stderr) {
            console.log(`Command stderr: ${stderr}`);
            return res.json({ message: 'Command error' });
        }
    });
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

            const uptime = `${Math.floor(parseInt(stdout.trim()) / 60)}`;

            exec("top -bn1 | grep 'CPU:' | awk '{print $2}' | head -n 1 | sed 's/%//'", (error, stdout) => {
                const cpuUsage = stdout.trim();

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
                            const cpuTemperature = stdout.trim();
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
    const authFilePath = '/etc/openvpn/auth.txt';
    fs.readFile(authFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading auth.txt:', err);
            return res.status(500).json({ error: 'Failed to read credentials' });
        }
        const [username, password] = data.split('\n');
        res.json({ username: username.trim(), password: "secretPassword" });
    });
});

app.post('/api/set-vpn-auth-credentials', (req, res) => {
    const { vpnUsername, vpnPassword} = req.body;
    const authFilePath = '/etc/openvpn/auth.txt';

    try {
        // Create the directory if it doesn't exist
        const authDir = path.dirname(authFilePath);
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }

        // Write credentials to the file
        const credentials = `${vpnUsername}\n${vpnPassword}\n`; // Username and password, each on a new line
        fs.writeFileSync(authFilePath, credentials, { mode: 0o600 }); // Secure file with 600 permissions

        res.json({ message: 'VPN configuration updated successfully' });
    } catch (error) {
        console.error('Error writing to auth file:', error);
        res.status(500).json({ error: 'Failed to update VPN configuration.' });
    }
});

app.get('/api/vpn-status', async (req, res) => {
    const statusFilePath = '/tmp/openvpn/status';
    try {
        const response = await fetch('http://ip-api.com/json/');
        const data = await response.json();
        var isConnectedReadFromFile;

        if (data.status === "success") {
            try {
                if (!fs.existsSync(statusFilePath)) {
                    isConnectedReadFromFile = false;
                }

                const data = fs.readFileSync(statusFilePath, 'utf8').trim();
                if (data === '1') {
                    isConnectedReadFromFile = true;
                } else {
                    isConnectedReadFromFile = false;
                }
            } catch (error) {
                isConnectedReadFromFile = false;
            }
            
            res.json({
                isConnected: isConnectedReadFromFile,
                ip: data.query,
                country: data.country,
                city: data.city
            });
        } else {
            res.status(500).json({ error: "Failed to fetch geolocation data." });
        }
    } catch (error) {
        res.status(500).json({ error: "Error fetching geolocation data." });
    }
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
        if (ConnectOrDisconnect) {
            console.log('Starting VPN...');
            const result = await runCommand('/etc/init.d/S95vpnmgr start &');
            console.log('VPN started successfully:', result);
        } else {
            console.log('Stopping VPN...');
            const result = await runCommand('/etc/init.d/S95vpnmgr stop &');
            console.log('VPN stopped successfully:', result);
        }

        const statusFilePath = '/tmp/openvpn/status';

        if (!fs.existsSync(statusFilePath)) {
            console.error('Status file does not exist.');
            throw new Error('Status file not found.');
        }

        const data = fs.readFileSync(statusFilePath, 'utf8').trim();
        return data === '1';
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

        leaseBlocks.forEach(block => {
            const lines = block.trim().split('\n');
            const lease = {};

            lease.ip = lines[0].trim().split(' ')[0];
            lines.forEach(line => {
                if (line.includes('client-hostname')) {
                    lease.hostname = line.split('"')[1];
                } else if (line.includes('binding state active')) {
                    lease.active = true;
                }
            });
            if (lease.active) {
                registeredIPs.set(lease.ip, lease);
            }
        });

        registeredIPs.forEach(value => leases.push(value));
        res.json(leases);
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

app.get('/network_speed_stats', (req, res) => {
    fs.readFile('/tmp/network_speed_stats.txt', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send("Couldn't read network_speed_stats file");
        }
        
        const lines = data.trim().split('\n');
        const stats = lines.map(line => {
            const [download, upload] = line.split(',');
            return { download: parseFloat(download), upload: parseFloat(upload) };
        });
        
        res.json({ stats });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
