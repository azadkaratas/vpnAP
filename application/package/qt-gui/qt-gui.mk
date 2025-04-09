QT_GUI_SITE = $(BR2_EXTERNAL_APPLICATION_PATH)/package/qt-gui
QT_GUI_SITE_METHOD = local

QT_GUI_DEPENDENCIES = qt5base qt5declarative

QT5_QMAKE = $(HOST_DIR)/bin/qmake

define QT_GUI_CONFIGURE_CMDS
	(cd $(@D); $(QT5_QMAKE))
endef

define QT_GUI_BUILD_CMDS
	$(TARGET_MAKE_ENV) $(MAKE) -C $(@D)
endef

define QT_GUI_INSTALL_TARGET_CMDS
	$(INSTALL) -D -m 0755 $(@D)/qt-gui $(TARGET_DIR)/usr/bin/qt-gui
endef

$(eval $(generic-package))