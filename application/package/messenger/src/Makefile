CC = gcc

.PHONY: clean

CFLAGS = $(MESSENGER_CFLAGS)
LDFLAGS = $(MESSENGER_LDFLAGS)

SRCS = messenger.c $(GENERIC_DBUS_DIR)/dbus_common.c
OBJS = $(SRCS:.c=.o)

messenger: $(OBJS)
	$(CC) -o $@ $(OBJS) $(LDFLAGS)

%.o: %.c
	$(CC) -c $< -o $@ $(CFLAGS)

clean:
	rm messenger