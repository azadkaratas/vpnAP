#include <stdio.h>
#include <stdlib.h>
#include <generic-dbus/dbus_common.h>
#include "messenger.h"

// Method implementations
dbus_int32_t add_numbers(dbus_int32_t num1, dbus_int32_t num2) {
    printf("Adding %d + %d\n", num1, num2);
    return num1 + num2;
}

double read_temperature(void) {
    printf("Reading temperature\n");
    return 25.5; // Dummy value
}

// Handle add_numbers method
static void handle_add_numbers(DBusMessage *msg) {
    DBusMessageIter args;
    dbus_int32_t num1, num2;

    if (!dbus_message_iter_init(msg, &args) || 
        dbus_message_iter_get_arg_type(&args) != DBUS_TYPE_INT32) {
        fprintf(stderr, "Invalid arguments for add_numbers\n");
        return;
    }
    dbus_message_iter_get_basic(&args, &num1);
    dbus_message_iter_next(&args);
    if (dbus_message_iter_get_arg_type(&args) != DBUS_TYPE_INT32) {
        fprintf(stderr, "Invalid second argument for add_numbers\n");
        return;
    }
    dbus_message_iter_get_basic(&args, &num2);

    dbus_int32_t result = add_numbers(num1, num2);

    DBusMessage *reply = dbus_message_new_method_return(msg);
    if (!reply) {
        fprintf(stderr, "Failed to create reply for add_numbers\n");
        return;
    }

    dbus_message_iter_init_append(reply, &args);
    dbus_message_iter_append_basic(&args, DBUS_TYPE_INT32, &result);

    if (!dbus_connection_send(dbus_connection_get(), reply, NULL)) {
        fprintf(stderr, "Failed to send reply for add_numbers\n");
    }
    dbus_connection_flush(dbus_connection_get());
    dbus_message_unref(reply);
}

// Handle read_temperature method
static void handle_read_temperature(DBusMessage *msg) {
    double result = read_temperature();

    DBusMessage *reply = dbus_message_new_method_return(msg);
    if (!reply) {
        fprintf(stderr, "Failed to create reply for read_temperature\n");
        return;
    }

    DBusMessageIter args;
    dbus_message_iter_init_append(reply, &args);
    dbus_message_iter_append_basic(&args, DBUS_TYPE_DOUBLE, &result);

    if (!dbus_connection_send(dbus_connection_get(), reply, NULL)) {
        fprintf(stderr, "Failed to send reply for read_temperature\n");
    }
    dbus_connection_flush(dbus_connection_get());
    dbus_message_unref(reply);
}

// Message Handler
static DBusHandlerResult message_handler(DBusConnection *conn, DBusMessage *msg, void *user_data) {
    // Handle introspection
    DBusHandlerResult result = dbus_handle_introspect(conn, msg, MESSENGER_INTROSPECT_XML);
    if (result == DBUS_HANDLER_RESULT_HANDLED) {
        return result;
    }

    // Handle add_numbers
    if (dbus_message_is_method_call(msg, MESSENGER_INTERFACE, "add_numbers")) {
        handle_add_numbers(msg);
        return DBUS_HANDLER_RESULT_HANDLED;
    }

    // Handle read_temperature
    if (dbus_message_is_method_call(msg, MESSENGER_INTERFACE, "read_temperature")) {
        handle_read_temperature(msg);
        return DBUS_HANDLER_RESULT_HANDLED;
    }

    return DBUS_HANDLER_RESULT_NOT_YET_HANDLED;
}

int main() {
    // Initialize DBus
    DBUS_INIT_SERVICE(MESSENGER_SERVICE_NAME);

    // Add message handler
    DBUS_ADD_HANDLER(message_handler);

    // Main loop
    while (dbus_connection_read_write_dispatch(dbus_connection_get(), -1));

    // Cleanup
    if (dbus_connection_get()) {
        dbus_connection_unref(dbus_connection_get());
    }
    return 0;
}