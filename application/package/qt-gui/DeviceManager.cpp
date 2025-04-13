#include "DeviceManager.h"
#include <QDebug>
#include <fstream>
#include <string>
#include <QProcess>
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QDateTime>
#include <QSet>

DeviceManager::DeviceManager(QObject *parent) : QObject(parent) {
    updateSystemInfo();
    QTimer *timer = new QTimer(this);
    connect(timer, &QTimer::timeout, this, &DeviceManager::updateSystemInfo);
    timer->start(1000); // Update every second
}

void DeviceManager::updateSystemInfo() {
    updateEthernetStatus();
    updateUptime();
    updateWifiSettings();
    updateConnectedDevices();
    updateFirmwareVersion();
    updateTemperature();
    checkVPNStatus();
}

void DeviceManager::updateUptime() {
    std::ifstream uptime_file("/proc/uptime");
    double uptime_seconds;
    
    if (uptime_file.is_open()) {
        uptime_file >> uptime_seconds;
        uptime_file.close();
        
        int hours = static_cast<int>(uptime_seconds) / 3600;
        int minutes = (static_cast<int>(uptime_seconds) % 3600) / 60;
        int seconds = static_cast<int>(uptime_seconds) % 60;
        
        QString newUptime = QString("%1:%2:%3")
            .arg(hours, 2, 10, QLatin1Char('0'))
            .arg(minutes, 2, 10, QLatin1Char('0'))
            .arg(seconds, 2, 10, QLatin1Char('0'));
        
        if (m_uptime != newUptime) {
            m_uptime = newUptime;
            emit uptimeChanged();
        }
    } else {
        qWarning() << "Failed to read /proc/uptime";
    }
}

void DeviceManager::toggleVpn() {
    if(m_vpnStatus){
        QProcess process;
        process.start("/etc/init.d/S95vpnmgr stop &");
        process.waitForFinished();
        m_vpnStatus = false;
    }
    else{
        QProcess process;
        process.start("/etc/init.d/S95vpnmgr start &");
        process.waitForFinished();
        m_vpnStatus = true;
    }
    emit vpnStatusChanged();
    updateSystemInfo();
}

void DeviceManager::restartDevice() {
    qDebug() << "Device restarting...";
    QProcess process;
    process.start("reboot");
    process.waitForFinished();
}

void DeviceManager::updateWifiSettings() {
    QFile configFile("/data/config.json");
    if (configFile.open(QIODevice::ReadOnly | QIODevice::Text)) {
        QJsonDocument doc = QJsonDocument::fromJson(configFile.readAll());
        QJsonObject config = doc.object();
        
        if (config.contains("wifi")) {
            QJsonObject wifi = config["wifi"].toObject();
            m_wifiSSID = wifi["name"].toString();
            m_wifiPassword = wifi["password"].toString();
            emit wifiSSIDChanged();
            emit wifiPasswordChanged();
        }
        configFile.close();
    }
}

void DeviceManager::updateConnectedDevices() {
    QFile dhcpFile("/var/lib/dhcp/dhcpd.leases");
    if (!dhcpFile.open(QIODevice::ReadOnly | QIODevice::Text)) {
        qWarning() << "Could not open DHCP leases file";
        return;
    }

    QVariantList devices;
    QMap<QString, QVariantMap> latestLeases;
    QString content = dhcpFile.readAll();
    dhcpFile.close();

    for (const QString &block : content.split("lease ")) {
        if (!block.contains("binding state active")) {
            continue;
        }

        QString ip = block.section(' ', 0, 0).trimmed();
        if (ip.isEmpty()) continue;

        QString endTime;
        QRegularExpression endsRegex("ends \\d+ ([^;]+);");
        auto match = endsRegex.match(block);
        if (match.hasMatch()) {
            endTime = match.captured(1);
        }

        QString hostname = "Unknown";
        QRegularExpression hostnameRegex("client-hostname \"([^\"]+)\"");
        match = hostnameRegex.match(block);
        if (match.hasMatch()) {
            hostname = match.captured(1);
        }

        if (!latestLeases.contains(ip) || 
            endTime > latestLeases[ip]["ends"].toString()) {
            latestLeases[ip] = {
                {"hostname", hostname},
                {"ends", endTime}
            };
        }
    }

    for (auto it = latestLeases.constBegin(); it != latestLeases.constEnd(); ++it) {
        devices.append(QVariantMap{
            {"ip", it.key()},
            {"hostname", it.value()["hostname"].toString()}
        });
    }

    if (m_connectedDevices != devices) {
        m_connectedDevices = devices;
        emit connectedDevicesChanged();
        qDebug() << "Active devices found:" << devices.size() 
                 << "Devices:" << devices;
    }
}

void DeviceManager::updateFirmwareVersion() {
    QFile versionFile("/etc/version");
    if (versionFile.open(QIODevice::ReadOnly | QIODevice::Text)) {
        m_firmwareVersion = QString(versionFile.readAll()).trimmed();
        emit firmwareVersionChanged();
        versionFile.close();
    }
}

void DeviceManager::updateEthernetStatus() {
    QProcess process;

    process.start("cat", QStringList() << "/sys/class/net/eth0/carrier");
    process.waitForFinished();
    bool isEthernetConnected = (process.readAllStandardOutput().trimmed() == "1");
    
    if (isEthernetConnected) {
        process.start("ip", QStringList() << "-4" << "addr" << "show" << "eth0");
        process.waitForFinished();
        QString output = process.readAllStandardOutput();
        
        QRegularExpression ipRegex("inet (\\d+\\.\\d+\\.\\d+\\.\\d+)");
        QRegularExpressionMatch match = ipRegex.match(output);
        
        if (match.hasMatch()) {
            QString ipAddress = match.captured(1);
            m_ethernetStatus = QString("Connected. IP: %1").arg(ipAddress);
        } else {
            m_ethernetStatus = "Waiting for IP address...";
        }
    } else {
        m_ethernetStatus = "Not Connected";
    }
    
    emit ethernetStatusChanged();
}

void DeviceManager::updateTemperature(){
    
    std::ifstream temp_file("/sys/class/thermal/thermal_zone0/temp");
    double temperature;
    
    if (temp_file.is_open()) {
        temp_file >> temperature;
        temp_file.close();
        
        m_temperature = QString::number(static_cast<int>(temperature/1000)) + "°C";
        emit temperatureChanged();
    }
}

bool DeviceManager::checkVPNStatus() {
    m_vpnIpAddress = "N/A";
    m_vpnCountry = "N/A";

    QFile statusFile("/tmp/openvpn/status");
    if (!statusFile.exists()) {
        return false;
    }

    QFile tunInterface("/sys/class/net/tun0");
    if (!tunInterface.exists()) {
        return false;
    }

    QProcess process;
    process.start("ip", QStringList() << "addr" << "show" << "tun0");
    process.waitForFinished();
    QString output = process.readAllStandardOutput();
    if (!output.contains("inet ")) {
        return false;
    }
    
    // VPN status update remains the same for now
    m_vpnIpAddress = m_vpnStatus ? "192.168.1.100" : "N/A";
    m_vpnCountry = m_vpnStatus ? "United States" : "N/A";
    emit vpnIpAddressChanged();
    return true;
}