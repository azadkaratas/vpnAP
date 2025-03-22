.PHONY: all clean vpn menuconfig list-defconfigs distclean

# Default Buildroot directory (can be overridden with `make BUILDROOT_DIR=/path`)
BUILDROOT_DIR ?= $(shell pwd)/buildroot

# Default board name (can be overridden with `make BOARD_NAME=other_board`)
BOARD_NAME ?= rpi3b

# Default external directory for custom packages
BR2_EXTERNAL ?= $(shell pwd)/application

# Default target (build the VPN image)
all: vpn

# Build the VPN project for Raspberry Pi 3B+ (64-bit)
vpn:
	@echo "Configuring Buildroot with custom_raspberrypi3b_64_defconfig..."
	$(MAKE) -C $(BUILDROOT_DIR) custom_raspberrypi3b_64_defconfig
	@echo "Building with external directory $(BR2_EXTERNAL) for board $(BOARD_NAME)..."
	$(MAKE) -C $(BUILDROOT_DIR) BR2_EXTERNAL=$(BR2_EXTERNAL) BOARD_NAME=$(BOARD_NAME)
	@echo "Build completed. Output is in $(BUILDROOT_DIR)/output/images/"

# Open Buildroot menuconfig for customization
menuconfig:
	$(MAKE) -C $(BUILDROOT_DIR) menuconfig

# List available Buildroot defconfigs
list-defconfigs:
	$(MAKE) -C $(BUILDROOT_DIR) list-defconfigs

# Clean the Buildroot build directory
clean:
	$(MAKE) -C $(BUILDROOT_DIR) clean

# Completely reset Buildroot to a fresh state
distclean:
	$(MAKE) -C $(BUILDROOT_DIR) distclean
	@echo "Buildroot directory reset. You may need to reconfigure."