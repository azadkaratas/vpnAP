#ifndef MESSENGER_H
#define MESSENGER_H

#include <dbus/dbus.h>

#define MESSENGER_SERVICE_NAME "com.embedlinux.messenger"
#define MESSENGER_OBJECT_PATH "/com/embedlinux/messenger"
#define MESSENGER_INTERFACE "com.embedlinux.web"
#define MESSENGER_INTROSPECT_XML \
    "<node>\n" \
    "  <interface name=\"com.embedlinux.web\">\n" \
    "    <method name=\"add_numbers\">\n" \
    "      <arg name=\"num1\" type=\"i\" direction=\"in\"/>\n" \
    "      <arg name=\"num2\" type=\"i\" direction=\"in\"/>\n" \
    "      <arg name=\"result\" type=\"i\" direction=\"out\"/>\n" \
    "    </method>\n" \
    "    <method name=\"read_temperature\">\n" \
    "      <arg name=\"result\" type=\"d\" direction=\"out\"/>\n" \
    "    </method>\n" \
    "  </interface>\n" \
    "  <interface name=\"org.freedesktop.DBus.Introspectable\">\n" \
    "    <method name=\"Introspect\">\n" \
    "      <arg name=\"xml_data\" type=\"s\" direction=\"out\"/>\n" \
    "    </method>\n" \
    "  </interface>\n" \
    "</node>"

// Method prototypes
dbus_int32_t add_numbers(dbus_int32_t num1, dbus_int32_t num2);
double read_temperature(void);

#endif /* MESSENGER_H */