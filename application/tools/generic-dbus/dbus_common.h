#ifndef DBUS_COMMON_H
#define DBUS_COMMON_H
#include <dbus/dbus.h>

DBusConnection *dbus_init(const char *service_name, DBusError *err);
void dbus_send_signal(DBusConnection *conn, const char *object_path, const char *interface,
                      const char *signal_name, const char *arg1, const char *arg2);
void dbus_call_method(DBusConnection *conn, const char *dest, const char *object_path,
                      const char *interface, const char *method, const char *arg1,
                      const char *arg2, const char *arg3, dbus_bool_t *success, DBusError *err);
DBusHandlerResult dbus_handle_introspect(DBusConnection *conn, DBusMessage *msg, const char *introspect_xml);
DBusConnection *dbus_connection_get(void);

// Initialize DBus service
#define DBUS_INIT_SERVICE(service_name) \
    do { \
        DBusError err; \
        dbus_error_init(&err); \
        DBusConnection *conn = dbus_init(service_name, &err); \
        if (dbus_error_is_set(&err)) { \
            fprintf(stderr, "DBus init failed: %s\n", err.message); \
            dbus_error_free(&err); \
            exit(1); \
        } \
    } while (0)

// Add message handler
#define DBUS_ADD_HANDLER(filter_func) \
    do { \
        if (!dbus_connection_add_filter(dbus_connection_get(), filter_func, NULL, NULL)) { \
            fprintf(stderr, "Failed to add handler\n"); \
            exit(1); \
        } \
    } while (0)

// Subscribe to signals
#define DBUS_SUBSCRIBE_SIGNAL(interface) \
    do { \
        DBusError err; \
        dbus_error_init(&err); \
        char rule[256]; \
        snprintf(rule, sizeof(rule), "type='signal',interface='%s'", interface); \
        dbus_bus_add_match(dbus_connection_get(), rule, &err); \
        if (dbus_error_is_set(&err)) { \
            fprintf(stderr, "Match rule error: %s\n", err.message); \
            dbus_error_free(&err); \
            exit(1); \
        } \
    } while (0)

#endif /* DBUS_COMMON_H */