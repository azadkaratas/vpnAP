#!/bin/sh

# Configuration
UPDATE_FILE="/tmp/rootfs.ext4"          # Source firmware file
BOOT_PARTITION="/dev/mmcblk0p1"         # Boot partition
LOG_FILE="/var/log/updatefw.log"        # Log file for debugging
MIN_SPACE_MB=220                        # Minimum free space required (in MB)

# Function to log messages (to both stdout and log file)
log_message() {
    echo "$1" | tee -a "$LOG_FILE" 2>/dev/null || echo "$1"
}

# Function to exit with error
exit_with_error() {
    log_message "ERROR: $1"
    exit 1
}

# Function to check disk space (in MB)
check_disk_space() {
    local dir="$1"
    local free_space=$(df -m "$dir" | tail -1 | awk '{print $4}')
    if [ -z "$free_space" ] || [ "$free_space" -lt "$MIN_SPACE_MB" ]; then
        exit_with_error "Insufficient disk space on $dir. Required: $MIN_SPACE_MB MB, Available: $free_space MB"
    fi
}

# Initialize log
log_message "Starting firmware update process at $(date)"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    exit_with_error "This script must run as root"
fi

# Check if source file exists
if [ ! -f "$UPDATE_FILE" ]; then
    exit_with_error "Firmware file $UPDATE_FILE doesn't exist"
fi

# Determine current and next rootfs partition
PART_STATUS=$(grep -o "root=/dev/mmcblk0p[2-3]" /proc/cmdline)
if [ "$PART_STATUS" = "root=/dev/mmcblk0p2" ]; then
    NEXT_ROOTFS="/dev/mmcblk0p3"
else
    NEXT_ROOTFS="/dev/mmcblk0p2"
fi

if [ -z "$NEXT_ROOTFS" ]; then
    exit_with_error "Could not determine next rootfs partition from /proc/cmdline"
fi

log_message "Current rootfs: $PART_STATUS, Next rootfs: $NEXT_ROOTFS"

# Check disk space on boot partition (for mounting tmpboot)
check_disk_space "/tmp"

# Install firmware file to next rootfs
log_message "Installing $UPDATE_FILE to $NEXT_ROOTFS..."
dd if="$UPDATE_FILE" of="$NEXT_ROOTFS" bs=4M conv=fsync >/dev/null 2>&1 || exit_with_error "Failed to write firmware to $NEXT_ROOTFS"

# Mount boot partition and update cmdline.txt
log_message "Mounting $BOOT_PARTITION to update boot configuration"
mkdir -p /tmp/tmpboot || exit_with_error "Failed to create /tmp/tmpboot directory"
mount "$BOOT_PARTITION" /tmp/tmpboot || exit_with_error "Failed to mount $BOOT_PARTITION on /tmp/tmpboot"

if [ "$PART_STATUS" = "root=/dev/mmcblk0p2" ]; then
    sed -i "s|root=/dev/mmcblk0p[2-3]|root=/dev/mmcblk0p3|" "/tmp/tmpboot/cmdline.txt" || exit_with_error "Failed to update cmdline.txt for p3"
else
    sed -i "s|root=/dev/mmcblk0p[2-3]|root=/dev/mmcblk0p2|" "/tmp/tmpboot/cmdline.txt" || exit_with_error "Failed to update cmdline.txt for p2"
fi

# Unmount and sync
log_message "Unmounting $BOOT_PARTITION and syncing changes"
umount /tmp/tmpboot || log_message "WARNING: Failed to unmount /tmp/tmpboot, proceeding anyway"
sync || exit_with_error "Failed to sync filesystem changes"

# Reboot device
log_message "Firmware update completed. Rebooting device..."
( sleep 5 ; reboot ) & 
exit 0