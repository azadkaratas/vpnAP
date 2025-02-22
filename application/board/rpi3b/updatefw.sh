#!/bin/sh

UPDATE_FILE=/tmp/rootfs.ext4 
if ! test -f "$UPDATE_FILE"; then
    echo "$UPDATE_FILE doesn't exists."
	exit 1
fi

BOOT_PARTITION=/dev/mmcblk0p1

# Find next rootfs to be updated
PART_STATUS=$(cat /proc/cmdline | grep -o "root=/dev/mmcblk0p.")
if test "${PART_STATUS}" = "root=/dev/mmcblk0p2" ; then
	NEXT_ROOTFS=/dev/mmcblk0p3
else
	NEXT_ROOTFS=/dev/mmcblk0p2
fi

# Install file 
echo "Installing $UPDATE_FILE file..."
dd if=$UPDATE_FILE of=${NEXT_ROOTFS} bs=4M conv=fsync

# Change cmdline.txt so that it boots from new rootfs
mkdir -p /tmp/tmpboot
mount ${BOOT_PARTITION} /tmp/tmpboot
if test "${PART_STATUS}" = "root=/dev/mmcblk0p2" ; then
	sed -i "s|root=/dev/mmcblk0p.|root=/dev/mmcblk0p3|" /tmp/tmpboot/cmdline.txt
else
	sed -i "s|root=/dev/mmcblk0p.|root=/dev/mmcblk0p2|" /tmp/tmpboot/cmdline.txt
fi
umount /tmp/tmpboot
sync
echo "Rebooting device. Please wait ..."
reboot -f