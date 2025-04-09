#include "DeviceManager.h"
#include <QDebug>
#include <fstream>
#include <string>

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

DeviceManager::DeviceManager(QObject *parent) : QObject(parent) {
    updateSystemInfo();
    QTimer *timer = new QTimer(this);
    connect(timer, &QTimer::timeout, this, &DeviceManager::updateSystemInfo);
    timer->start(1000); // Update every second
}

void DeviceManager::updateSystemInfo() {
    m_ethernetStatus = "192.168.1.100";
    emit ethernetStatusChanged();

    m_connectedDeviceCount = 3;
    emit connectedDeviceCountChanged();

    m_vpnIpAddress = m_vpnStatus ? "192.168.1.100" : "N/A";
    m_vpnCountry = m_vpnStatus ? "United States" : "N/A";
    emit vpnIpAddressChanged();

    updateUptime();
    emit uptimeChanged();

    m_memoryUsage = "512 MB / 1 GB";
    emit memoryUsageChanged();

    m_wifiSSID = "MyVPNNetwork";
    m_wifiPassword = "password123";
    emit wifiSSIDChanged();
    emit wifiPasswordChanged();

    m_connectedDevices = {
        QVariantMap{{"hostname", "Device1"}, {"ip", "192.168.1.10"}, {"mac", "01:23:45:67"}, {"active", true}},
        QVariantMap{{"hostname", "Device2"}, {"ip", "192.168.1.11"}, {"mac", "AB:CD:EF:FF"}, {"active", false}},
        QVariantMap{{"hostname", "Device3"}, {"ip", "192.168.1.12"}, {"mac", "AA:BB:CC:DD"}, {"active", true}}
    };
    emit connectedDevicesChanged();

    m_firmwareVersion = "v1.2.3";
    emit firmwareVersionChanged();
}

void DeviceManager::toggleVpn() {
    m_vpnStatus = !m_vpnStatus;
    emit vpnStatusChanged();
    updateSystemInfo();
}

void DeviceManager::restartDevice() {
    qDebug() << "Device restarting...";
}
