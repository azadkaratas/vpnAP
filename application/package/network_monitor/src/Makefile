CC = gcc

.PHONY: clean

CFLAGS = $(NETWORK_MONITOR_CFLAGS) -Wunused-result
LDFLAGS = $(NETWORK_MONITOR_LDFLAGS)

SRCS = network_monitor.c
OBJS = $(SRCS:.c=.o)

network_monitor: $(OBJS)
	$(CC) -o $@ $(OBJS) $(LDFLAGS)

%.o: %.c
	$(CC) -c $< -o $@ $(CFLAGS)

clean:
	rm network_monitor