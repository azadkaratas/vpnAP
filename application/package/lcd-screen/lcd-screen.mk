################################################################################

# lcd-screen

################################################################################

LCD_SCREEN_VERSION = 1.0
LCD_SCREEN_LICENSE = GPL-2.0
LCD_SCREEN_SITE_METHOD = local
LCD_SCREEN_SITE = $(LCD_SCREEN_PKGDIR)
LCD_SCREEN_SOURCE = lcd-screen.c
LCD_SCREEN_DEPENDENCIES = linux

MODULE=lcd-screen

define LCD_SCREEN_BUILD_CMDS
	$(MAKE) -C $(LINUX_DIR) M=$(@D) ARCH=arm64 CROSS_COMPILE=$(TARGET_CROSS) modules
	dtc -@ -I dts -O dtb -o $(@D)/$(MODULE).dtbo $(@D)/$(MODULE).dts
endef

$(eval $(generic-package))