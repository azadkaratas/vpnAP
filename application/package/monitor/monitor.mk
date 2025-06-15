################################################################################
#
# monitor
#
################################################################################

MONITOR_VERSION = 1.0
MONITOR_SITE = $(MONITOR_PKGDIR)/src
MONITOR_SITE_METHOD = local
MONITOR_DEPENDENCIES = cjson dbus
MONITOR_LICENSE = MIT
MONITOR_LICENSE_FILES = LICENSE

MONITOR_CFLAGS = $(TARGET_CFLAGS)
MONITOR_CFLAGS += -I$(STAGING_DIR)/usr/include/dbus-1.0
MONITOR_CFLAGS += -I$(STAGING_DIR)/usr/lib/dbus-1.0/include
MONITOR_CFLAGS += -I$(BR2_EXTERNAL_APPLICATION_PATH)/tools/generic-dbus

MONITOR_LDFLAGS = $(TARGET_LDFLAGS)
MONITOR_LDFLAGS += -L$(STAGING_DIR)/usr/lib -ldbus-1  -lcjson -lpthread

define MONITOR_BUILD_CMDS 
	$(MAKE) CC="$(TARGET_CC)" -o $(@D)/monitor \
		$(@D)/monitor.c $(@D)/device_mon.c $(@D)/network_mon.c $(BR2_EXTERNAL_APPLICATION_PATH)/tools/generic-dbus/dbus_common.c \
		CFLAGS="$(MONITOR_CFLAGS)" LDFLAGS="$(MONITOR_LDFLAGS)"
endef

define MONITOR_INSTALL_TARGET_CMDS
	$(INSTALL) -D -m 0755 $(@D)/monitor $(TARGET_DIR)/usr/bin/monitor
	$(INSTALL) -D -m 0644 $(BR2_EXTERNAL_APPLICATION_PATH)/package/monitor/monitor_params.json $(TARGET_DIR)/etc/monitor_params.json
endef

$(eval $(generic-package))