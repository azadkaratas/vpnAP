import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

ApplicationWindow {
    visible: true
    width: 480
    height: 320
    minimumWidth: 400
    minimumHeight: 300
    title: "VPN Access Point"
    color: "#121212"

    // Solid color background with subtle pattern
    Rectangle {
        anchors.fill: parent
        color: "#1a1a2e"
    }

    SwipeView {
        id: swipeView
        anchors.fill: parent
        interactive: true
        clip: true

        // --- Overview Page ---
        Item {
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 16
                spacing: 10

                // Network Status Card
                Card {
                    id: networkCard
                    Layout.fillWidth: true
                    height: 170
                    cardTitle: "Network Status"

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.topMargin: 40  // Added top margin for title
                        anchors.margins: 12
                        spacing: 8

                        StatusItem {
                            labelText: "Ethernet:"
                            valueText: deviceManager.ethernetStatus
                            iconColor: "#FF9800"
                        }

                        StatusItem {
                            labelText: "VPN Status:"
                            valueText: deviceManager.vpnStatus ? "Connected" : "Disconnected"
                            statusColor: deviceManager.vpnStatus ? "#4CAF50" : "#F44336"
                        }

                        StatusItem {
                            labelText: "Wi-Fi SSID:"
                            valueText: deviceManager.wifiSSID
                            iconColor: "#2196F3"
                        }

                        StatusItem {
                            labelText: "Wi-Fi Password:"
                            valueText: deviceManager.wifiPassword
                            iconColor: "#9C27B0"
                        }
                    }
                }

                // Quick Actions Card
                Card {
                    id: actionsCard
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    cardTitle: "Actions"

                    RowLayout {
                        anchors.fill: parent
                        anchors.topMargin: 40  // Added top margin for title
                        anchors.margins: 12
                        spacing: 16

                        ActionButton {
                            buttonText: "Restart"
                            iconText: "↻"
                            onClicked: deviceManager.restartDevice()
                        }

                        ActionButton {
                            buttonText: deviceManager.vpnStatus ? "VPN Off" : "VPN On"
                            iconText: deviceManager.vpnStatus ? "🔒" : "🔓"
                            accentColor: deviceManager.vpnStatus ? "#F44336" : "#4CAF50"
                            onClicked: deviceManager.toggleVpn()
                        }
                    }
                }
            }
        }

        // --- VPN Settings Page ---
        Item {
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 16
                spacing: 10

                // VPN Status Card
                Card {
                    id: vpnStatusCard
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    cardTitle: "VPN Configuration"

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.topMargin: 40  // Added top margin for title
                        anchors.margins: 12
                        spacing: 8

                        StatusItem {
                            labelText: "Current Location:"
                            valueText: deviceManager.vpnCountry || "Not connected"
                            iconColor: "#9C27B0"
                        }

                        StatusItem {
                            labelText: "VPN IP:"
                            valueText: deviceManager.vpnIpAddress || "N/A"
                            iconColor: "#00BCD4"
                        }

                        StatusItem {
                            labelText: "Status:"
                            valueText: deviceManager.vpnStatus ? "Secured" : "Unsecured"
                            statusColor: deviceManager.vpnStatus ? "#4CAF50" : "#F44336"
                        }
                    }
                }

                // Country Selector Card
                Card {
                    id: countryCard
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    cardTitle: "Select VPN Location"

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.topMargin: 40  // Added top margin for title
                        anchors.margins: 12
                        spacing: 8

                        ComboBox {
                            id: vpnCountrySelector
                            Layout.fillWidth: true
                            model: ["United States", "Germany", "France", "Netherlands", "Japan"]
                            currentIndex: Math.max(0, model.indexOf(deviceManager.vpnCountry))
                            
                            background: Rectangle {
                                color: "#252538"
                                radius: 8
                                border.color: "#444"
                            }
                            
                            contentItem: Text {
                                text: vpnCountrySelector.displayText
                                color: "white"
                                font.pixelSize: 16
                                verticalAlignment: Text.AlignVCenter
                                leftPadding: 15
                            }
                            
                            popup: Popup {
                                y: vpnCountrySelector.height
                                width: vpnCountrySelector.width
                                implicitHeight: Math.min(200, contentItem.implicitHeight)
                                padding: 1
                                
                                contentItem: ListView {
                                    clip: true
                                    implicitHeight: contentHeight
                                    model: vpnCountrySelector.popup.visible ? vpnCountrySelector.delegateModel : null
                                    currentIndex: vpnCountrySelector.highlightedIndex
                                    
                                    delegate: ItemDelegate {
                                        width: vpnCountrySelector.width
                                        text: modelData
                                        font.pixelSize: 14
                                        highlighted: vpnCountrySelector.highlightedIndex === index
                                    }
                                }
                            }
                        }

                        Button {
                            text: "Connect to " + vpnCountrySelector.currentText
                            Layout.fillWidth: true
                            font.pixelSize: 14
                            font.bold: true
                            
                            background: Rectangle {
                                color: "#4CAF50"
                                radius: 8
                                opacity: parent.down ? 0.8 : 1.0
                            }
                            
                            contentItem: Text {
                                text: parent.text
                                color: "white"
                                horizontalAlignment: Text.AlignHCenter
                                verticalAlignment: Text.AlignVCenter
                            }
                        }
                    }
                }
            }
        }

        // --- Connected Devices Page ---
        Item {
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 16
                spacing: 10

                // Device Statistics Card
                Card {
                    id: statsCard
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    cardTitle: "Device Statistics"

                    GridLayout {
                        anchors.fill: parent
                        anchors.topMargin: 40  // Added top margin for title
                        anchors.margins: 12
                        columns: 2
                        columnSpacing: 16
                        rowSpacing: 8

                        StatItem {
                            itemLabel: "Uptime"
                            itemValue: deviceManager.uptime || "00:00:00"
                            itemIcon: "qrc:/icons/clock.svg"
                        }
                        
                        StatItem {
                            itemLabel: "Temperature"
                            itemValue: deviceManager.temperature
                            itemIcon: "qrc:/icons/temperature.png"
                        }
                    }
                }
                // Connected Devices Card
                Card {
                    id: devicesCard
                    Layout.fillWidth: true
                    height: 190
                    cardTitle: "Connected Devices (" + deviceManager.connectedDevices.length + ")"

                    ListView {
                        id: devicesList
                        anchors.fill: parent
                        anchors.topMargin: 40  // Added top margin for title
                        anchors.margins: 12
                        clip: true
                        model: deviceManager.connectedDevices
                        spacing: 6
                        delegate: DeviceItem {
                            width: devicesList.width
                            deviceHostname: modelData.hostname
                            deviceIp: modelData.ip
                        }

                        ScrollBar.vertical: ScrollBar {
                            policy: ScrollBar.AsNeeded
                            width: 6
                            background: Rectangle { color: "transparent" }
                            contentItem: Rectangle {
                                radius: 3
                                color: "#66ffffff"
                            }
                        }
                    }
                }
            }
        }
    }

    // Modern page indicator
    PageIndicator {
        id: indicator
        count: swipeView.count
        currentIndex: swipeView.currentIndex
        anchors.bottom: parent.bottom
        anchors.topMargin: 10
        anchors.horizontalCenter: parent.horizontalCenter

        delegate: Rectangle {
            implicitWidth: 8
            implicitHeight: 8
            radius: width / 2
            color: index === indicator.currentIndex ? "#4CAF50" : "#666"
            
            Behavior on color {
                ColorAnimation { duration: 200 }
            }
        }
    }

    // FPS Counter
    property int frameCount: 0
    property int fps: 0
    property var lastTime: new Date()

    Timer {
        id: fpsTimer
        interval: 1000
        repeat: true
        running: true
        onTriggered: {
            var currentTime = new Date();
            fps = frameCount;
            frameCount = 0;
            lastTime = currentTime;
        }
    }

    onAfterRendering: {
        frameCount++;
    }

    Rectangle {
        id: fpsDisplay
        width: 80
        height: 30
        color: "#80000000"
        radius: 4
        anchors.top: parent.top
        anchors.right: parent.right
        anchors.margins: 10
        border.color: "#444"
        border.width: 1

        Text {
            anchors.centerIn: parent
            text: "FPS: " + fps
            color: "white"
            font.pixelSize: 14
            font.bold: true
        }
    }

    // Version text in bottom-right corner
    Text {
        text: deviceManager.firmwareVersion
        anchors.bottom: parent.bottom
        anchors.right: parent.right
        anchors.rightMargin: 20
        color: "#a0a0a0"  // Light gray color
        font.pixelSize: 12  // Small size
    }

    component Card: Rectangle {
        property alias cardTitle: titleText.text
        
        color: "#252538"
        radius: 12
        
        // Title bar
        Rectangle {
            width: parent.width
            height: 32
            color: "#303040"
            radius: 12
            border.width: 0
            Rectangle {
                width: parent.width
                height: parent.radius
                anchors {
                    bottom: parent.bottom
                }
                color: parent.color
            }
            
            Text {
                id: titleText
                anchors.left: parent.left
                anchors.leftMargin: 12
                anchors.verticalCenter: parent.verticalCenter
                color: "white"
                font.pixelSize: 14
                font.bold: true
            }
        }
    }

    component StatusItem: RowLayout {
        property alias labelText: label.text
        property alias valueText: value.text
        property color statusColor: "white"
        property color iconColor: "#666"
        
        spacing: 8

        Rectangle {
            width: 24
            height: 24
            radius: 12
            color: "#303040"
            
            Text {
                anchors.centerIn: parent
                text: "•"
                color: iconColor
                font.pixelSize: 18
                font.bold: true
            }
        }

        Text {
            id: label
            font.pixelSize: 14
            color: "#a0a0a0"
        }

        Text {
            id: value
            font.pixelSize: 14
            color: statusColor
            Layout.fillWidth: true
        }
    }

    component StatItem: ColumnLayout {
        property alias itemLabel: label.text
        property alias itemValue: value.text
        property url itemIcon
        
        spacing: 2

        RowLayout {
            spacing: 6
            Image {
                id: icon
                source: parent.parent.itemIcon
                sourceSize.width: 16
                sourceSize.height: 16
            }
            Text {
                id: label
                font.pixelSize: 12
                color: "#a0a0a0"
            }
        }

        Text {
            id: value
            font.pixelSize: 16
            font.bold: true
            color: "white"
        }
    }

    component ActionButton: Button {
        property alias buttonText: btnText.text
        property alias iconText: icon.text
        property color accentColor: "#2196F3"
        
        Layout.fillWidth: true
        Layout.fillHeight: true
        font.pixelSize: 12
        
        background: Rectangle {
            color: accentColor
            radius: 8
            opacity: parent.down ? 0.8 : 1.0
        }

        contentItem: ColumnLayout {
            spacing: 4
            Text {
                id: icon
                font.pixelSize: 20
                color: "white"
                Layout.alignment: Qt.AlignHCenter
            }
            Text {
                id: btnText
                color: "white"
                font.pixelSize: 12
                Layout.alignment: Qt.AlignHCenter
            }
        }
    }

    component DeviceItem: Rectangle {
        property alias deviceHostname: hostname.text
        property alias deviceIp: ip.text
        
        height: 42
        color: "#303040"
        radius: 8

        RowLayout {
            anchors.fill: parent
            anchors.leftMargin: 12
            anchors.rightMargin: 12
            spacing: 12

            // Device icon
            Image {
                id: icon
                source: "qrc:/icons/device.png"
                sourceSize.width: 25
                sourceSize.height: 25
            }

            // Text content
            ColumnLayout {
                spacing: 4
                Layout.fillWidth: true
                Layout.alignment: Qt.AlignVCenter
                Layout.leftMargin: 4
                
                // Hostname
                Text {
                    id: hostname
                    font.pixelSize: 14
                    color: "white"
                    elide: Text.ElideRight
                    horizontalAlignment: Text.AlignLeft
                    verticalAlignment: Text.AlignVCenter
                    Layout.fillWidth: true
                    leftPadding: 4
                }
                
                // IP and MAC row
                Row {
                    spacing: 8
                    layoutDirection: Qt.LeftToRight
                    leftPadding: 4
                    
                    Text {
                        id: ip
                        font.pixelSize: 11
                        color: "#a0a0a0"
                        horizontalAlignment: Text.AlignLeft
                    }
                    
                    Text {
                        text: "•"
                        font.pixelSize: 11
                        color: "#a0a0a0"
                    }
                    
                    Text {
                        id: mac
                        font.pixelSize: 11
                        color: "#a0a0a0"
                        horizontalAlignment: Text.AlignLeft
                    }
                }
            }
        }
    }
}