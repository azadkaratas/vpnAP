.PHONY: all clean

BUILDROOT_DIR = $(shell pwd)/buildroot

vpn:
	$(MAKE) -C $(BUILDROOT_DIR) custom_raspberrypi3b_64_defconfig
	$(MAKE) -C $(BUILDROOT_DIR) BR2_EXTERNAL=../application BOARD_NAME=rpi3b

menuconfig:
	$(MAKE) -C $(BUILDROOT_DIR) menuconfig

list-defconfigs:
	$(MAKE) -C $(BUILDROOT_DIR) list-defconfigs

clean:
	$(MAKE) -C $(BUILDROOT_DIR) clean	