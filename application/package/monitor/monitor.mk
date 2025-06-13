################################################################################
#
# monitor
#
################################################################################

MONITOR_VERSION = 1.0
MONITOR_SITE = $(MONITOR_PKGDIR)/src
MONITOR_SITE_METHOD = local
MONITOR_DEPENDENCIES = cjson
MONITOR_LICENSE = MIT
MONITOR_LICENSE_FILES = LICENSE

define MONITOR_BUILD_CMDS
	$(TARGET_CC) $(TARGET_CFLAGS) -o $(@D)/monitor $(@D)/monitor.c $(@D)/device_mon.c $(@D)/network_mon.c -lcjson -lpthread
endef

define MONITOR_INSTALL_TARGET_CMDS
	$(INSTALL) -D -m 0755 $(@D)/monitor $(TARGET_DIR)/usr/bin/monitor
	$(INSTALL) -D -m 0644 $(BR2_EXTERNAL_APPLICATION_PATH)/package/monitor/monitor_params.json $(TARGET_DIR)/etc/monitor_params.json
endef

$(eval $(generic-package))

