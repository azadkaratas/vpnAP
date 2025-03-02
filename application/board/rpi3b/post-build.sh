#!/bin/sh

cp package/busybox/S10mdev ${TARGET_DIR}/etc/init.d/S10mdev
chmod 755 ${TARGET_DIR}/etc/init.d/S10mdev
cp package/busybox/mdev.conf ${TARGET_DIR}/etc/mdev.conf
cp ${BR2_EXTERNAL_APPLICATION_PATH}/board/rpi3b/cmdline.txt ${TARGET_DIR}/../images/rpi-firmware/cmdline.txt
cp ${BR2_EXTERNAL_APPLICATION_PATH}/board/rpi3b/config.txt ${TARGET_DIR}/../images/rpi-firmware/config.txt 

cp -a ${BR2_EXTERNAL_APPLICATION_PATH}/system/* ${TARGET_DIR}/

cp -a ${BR2_EXTERNAL_APPLICATION_PATH}/package/webctl/webpage/* ${TARGET_DIR}/usr/html/
cp ${BR2_EXTERNAL_APPLICATION_PATH}/package/webctl/nginx.conf ${TARGET_DIR}/etc/nginx/nginx.conf
cp ${BR2_EXTERNAL_APPLICATION_PATH}/package/webctl/S99webctl ${TARGET_DIR}/etc/init.d/S99webctl
cp ${BR2_EXTERNAL_APPLICATION_PATH}/package/openvpn/S95vpnmgr ${TARGET_DIR}/etc/init.d/S95vpnmgr
cp ${BR2_EXTERNAL_APPLICATION_PATH}/package/network_monitor/S99netmon ${TARGET_DIR}/etc/init.d/S99netmon

cp ${BR2_EXTERNAL_APPLICATION_PATH}/com.embedlinux.messenger.conf ${TARGET_DIR}/usr/share/dbus-1/system.d/com.embedlinux.messenger.conf

mkdir -p ${TARGET_DIR}/etc/openvpn/
cp ${BR2_EXTERNAL_APPLICATION_PATH}/package/openvpn/auth.txt ${TARGET_DIR}/etc/openvpn/
cp -a ${BR2_EXTERNAL_APPLICATION_PATH}/package/openvpn/nordvpn_ovpn/* ${TARGET_DIR}/data/openvpn/

rm -f ${TARGET_DIR}/etc/init.d/S49ntp
rm -f ${TARGET_DIR}/etc/init.d/S60openvpn
