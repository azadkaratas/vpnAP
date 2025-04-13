#ifndef DEVICEMANAGER_H
#define DEVICEMANAGER_H

#include <QObject>
#include <QTimer>
#include <QNetworkInterface>
#include <QProcess>
#include <QVariantList>

class DeviceManager : public QObject {
    Q_OBJECT

    Q_PROPERTY(QString ethernetStatus READ ethernetStatus NOTIFY ethernetStatusChanged)
    Q_PROPERTY(int connectedDeviceCount READ connectedDeviceCount NOTIFY connectedDeviceCountChanged)
    Q_PROPERTY(QString vpnIpAddress READ vpnIpAddress NOTIFY vpnIpAddressChanged)
    Q_PROPERTY(QString vpnCountry READ vpnCountry NOTIFY vpnCountryChanged)
    Q_PROPERTY(bool vpnStatus READ vpnStatus NOTIFY vpnStatusChanged)
    Q_PROPERTY(QString uptime READ uptime NOTIFY uptimeChanged)
    Q_PROPERTY(QString wifiSSID READ wifiSSID NOTIFY wifiSSIDChanged)
    Q_PROPERTY(QString wifiPassword READ wifiPassword NOTIFY wifiPasswordChanged)
    Q_PROPERTY(QVariantList connectedDevices READ connectedDevices NOTIFY connectedDevicesChanged)
    Q_PROPERTY(QString firmwareVersion READ firmwareVersion NOTIFY firmwareVersionChanged)
    Q_PROPERTY(QString temperature READ temperature NOTIFY temperatureChanged)

public:
    explicit DeviceManager(QObject *parent = nullptr);

    // Getter
    QString ethernetStatus() const { return m_ethernetStatus; }
    int connectedDeviceCount() const { return m_connectedDeviceCount; }
    QString vpnIpAddress() const { return m_vpnIpAddress; }
    QString vpnCountry() const { return m_vpnCountry; }
    bool vpnStatus() const { return m_vpnStatus; }
    QString uptime() const { return m_uptime; }
    QString wifiSSID() const { return m_wifiSSID; }
    QString wifiPassword() const { return m_wifiPassword; }
    QVariantList connectedDevices() const { return m_connectedDevices; }
    QString firmwareVersion() const { return m_firmwareVersion; }
    QString temperature() const { return m_temperature; }

public slots:
    void updateSystemInfo();
    void toggleVpn();
    void restartDevice();
    void updateUptime();
    void updateWifiSettings();
    void updateConnectedDevices();
    void updateFirmwareVersion();
    void updateEthernetStatus();
    void updateTemperature();
    void checkVPNStatus();
    void initializeVPNStatus();

signals:
    void ethernetStatusChanged();
    void connectedDeviceCountChanged();
    void vpnIpAddressChanged();
    void vpnCountryChanged();
    void vpnStatusChanged();
    void uptimeChanged();
    void wifiSSIDChanged();
    void wifiPasswordChanged();
    void connectedDevicesChanged();
    void firmwareVersionChanged();
    void temperatureChanged();

private:
    QString m_ethernetStatus;
    int m_connectedDeviceCount;
    QString m_vpnIpAddress;
    QString m_vpnCountry;
    bool m_vpnStatus = false;
    QString m_uptime;
    QString m_wifiSSID;
    QString m_wifiPassword;
    QVariantList m_connectedDevices;
    QString m_firmwareVersion;
    QString m_temperature;
};

#endif // DEVICEMANAGER_H