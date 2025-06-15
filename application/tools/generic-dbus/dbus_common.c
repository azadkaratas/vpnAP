#include "dbus_common.h"
#include <stdio.h>

static DBusConnection *global_conn = NULL;

DBusConnection *dbus_init(const char *service_name, DBusError *err) {
    DBusConnection *conn = dbus_bus_get(DBUS_BUS_SYSTEM, err);
    if (dbus_error_is_set(err)) {
        fprintf(stderr, "Connection Error: %s\n", err->message);
        return NULL;
    }
    int ret = dbus_bus_request_name(conn, service_name, DBUS_NAME_FLAG_DO_NOT_QUEUE, err);
    if (dbus_error_is_set(err)) {
        fprintf(stderr, "Name Error: %s\n", err->message);
        return NULL;
    }
    if (ret != DBUS_REQUEST_NAME_REPLY_PRIMARY_OWNER) {
        fprintf(stderr, "Not primary owner\n");
        dbus_set_error(err, "com.example.Error", "Failed to own name");
        return NULL;
    }
    global_conn = conn;
    return conn;
}

DBusConnection *dbus_connection_get(void) {
    return global_conn;
}

void dbus_send_signal(DBusConnection *conn, const char *object_path, const char *interface,
                      const char *signal_name, const char *arg1, const char *arg2) {
    DBusMessage *msg = dbus_message_new_signal(object_path, interface, signal_name);
    if (!msg) {
        fprintf(stderr, "Failed to create signal message\n");
        return;
    }
    dbus_message_append_args(msg, DBUS_TYPE_STRING, &arg1, DBUS_TYPE_STRING, &arg2, DBUS_TYPE_INVALID);
    if (!dbus_connection_send(conn, msg, NULL)) {
        fprintf(stderr, "Failed to send signal\n");
    }
    dbus_connection_flush(conn);
    dbus_message_unref(msg);
}

void dbus_call_method(DBusConnection *conn, const char *dest, const char *object_path,
                      const char *interface, const char *method, const char *arg1,
                      const char *arg2, const char *arg3, dbus_bool_t *success, DBusError *err) {
    DBusMessage *msg = dbus_message_new_method_call(dest, object_path, interface, method);
    if (!msg) {
        dbus_set_error(err, "com.example.Error", "Failed to create method call");
        return;
    }
    dbus_message_append_args(msg, DBUS_TYPE_STRING, &arg1, DBUS_TYPE_STRING, &arg2,
                             DBUS_TYPE_STRING, &arg3, DBUS_TYPE_INVALID);
    DBusMessage *reply = dbus_connection_send_with_reply_and_block(conn, msg, -1, err);
    dbus_message_unref(msg);
    if (dbus_error_is_set(err)) {
        fprintf(stderr, "Method call error: %s\n", err->message);
        return;
    }
    if (!dbus_message_get_args(reply, err, DBUS_TYPE_BOOLEAN, success, DBUS_TYPE_INVALID)) {
        fprintf(stderr, "Failed to parse reply: %s\n", err->message);
    }
    dbus_message_unref(reply);
}

DBusHandlerResult dbus_handle_introspect(DBusConnection *conn, DBusMessage *msg, const char *introspect_xml) {
    if (dbus_message_is_method_call(msg, "org.freedesktop.DBus.Introspectable", "Introspect")) {
        DBusMessage *reply = dbus_message_new_method_return(msg);
        DBusMessageIter args;
        dbus_message_iter_init_append(reply, &args);
        dbus_message_iter_append_basic(&args, DBUS_TYPE_STRING, &introspect_xml);
        dbus_connection_send(conn, reply, NULL);
        dbus_connection_flush(conn);
        dbus_message_unref(reply);
        return DBUS_HANDLER_RESULT_HANDLED;
    }
    return DBUS_HANDLER_RESULT_NOT_YET_HANDLED;
}