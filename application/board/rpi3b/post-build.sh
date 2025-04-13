#!/bin/sh

cp package/busybox/S10mdev ${TARGET_DIR}/etc/init.d/S10mdev
chmod 755 ${TARGET_DIR}/etc/init.d/S10mdev
cp package/busybox/mdev.conf ${TARGET_DIR}/etc/mdev.conf
cp ${BR2_EXTERNAL_APPLICATION_PATH}/board/rpi3b/cmdline.txt ${TARGET_DIR}/../images/rpi-firmware/cmdline.txt
cp ${BR2_EXTERNAL_APPLICATION_PATH}/board/rpi3b/config.txt ${TARGET_DIR}/../images/rpi-firmware/config.txt 

cp -a ${BR2_EXTERNAL_APPLICATION_PATH}/system/* ${TARGET_DIR}/

cp -a ${BR2_EXTERNAL_APPLICATION_PATH}/package/json-web-gen/* ${TARGET_DIR}/usr/html/
cp ${BR2_EXTERNAL_APPLICATION_PATH}/package/webctl/webpage/* ${TARGET_DIR}/usr/html/
cp ${BR2_EXTERNAL_APPLICATION_PATH}/package/webctl/nginx.conf ${TARGET_DIR}/etc/nginx/nginx.conf
cp ${BR2_EXTERNAL_APPLICATION_PATH}/package/webctl/S99webctl ${TARGET_DIR}/etc/init.d/S99webctl
cp ${BR2_EXTERNAL_APPLICATION_PATH}/package/qt-gui/S99qtgui ${TARGET_DIR}/etc/init.d/S99qtgui
cp ${BR2_EXTERNAL_APPLICATION_PATH}/package/openvpn/S95vpnmgr ${TARGET_DIR}/etc/init.d/S95vpnmgr
cp ${BR2_EXTERNAL_APPLICATION_PATH}/package/network_monitor/S99netmon ${TARGET_DIR}/etc/init.d/S99netmon

cp ${BR2_EXTERNAL_APPLICATION_PATH}/com.embedlinux.messenger.conf ${TARGET_DIR}/usr/share/dbus-1/system.d/com.embedlinux.messenger.conf

mkdir -p ${TARGET_DIR}/etc/openvpn/
cp ${BR2_EXTERNAL_APPLICATION_PATH}/package/openvpn/auth.txt ${TARGET_DIR}/etc/openvpn/
cp -a ${BR2_EXTERNAL_APPLICATION_PATH}/package/openvpn/nordvpn_ovpn/* ${TARGET_DIR}/etc/openvpn/

rm -f ${TARGET_DIR}/etc/init.d/S49ntp
rm -f ${TARGET_DIR}/etc/init.d/S60openvpn
rm -f ${TARGET_DIR}/etc/hostapd.conf

rm -f ${TARGET_DIR}/etc/init.d/S41dhcpcd
rm -f ${TARGET_DIR}/etc/dhcpcd.conf

# Version info
BUILD_INFO_FILE=${BR2_EXTERNAL_APPLICATION_PATH}"/../version"
CURRENT_DATE=$(date +%Y-%m-%d)

# Create file if not exists
if [ ! -f "$BUILD_INFO_FILE" ]; then
    echo "$CURRENT_DATE:0" > "$BUILD_INFO_FILE"
fi

# Read last build date and number
LAST_BUILD_DATE=$(cut -d':' -f1 "$BUILD_INFO_FILE")
BUILD_NUMBER=$(cut -d':' -f2 "$BUILD_INFO_FILE")

# Zero build number if date changed
if [ "$LAST_BUILD_DATE" != "$CURRENT_DATE" ]; then
    BUILD_NUMBER=0
fi

# Increase build number
BUILD_NUMBER=$((BUILD_NUMBER + 1))
echo "$CURRENT_DATE:$BUILD_NUMBER" > "$BUILD_INFO_FILE"

VERSION="$CURRENT_DATE.$BUILD_NUMBER"
echo "$VERSION" > ${TARGET_DIR}/etc/version

echo "Generated Firmware Version: $VERSION"