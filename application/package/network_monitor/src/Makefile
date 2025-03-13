CC = gcc

.PHONY: clean

CFLAGS = $(NETWORK_MONITOR_CFLAGS) -Wall -Werror -Wunused-result
LDFLAGS = $(NETWORK_MONITOR_LDFLAGS) -ljson-c

SRCS = network_monitor.c
OBJS = $(SRCS:.c=.o)

network_monitor: $(OBJS)
	$(CC) -o $@ $(OBJS) $(LDFLAGS)

%.o: %.c
	$(CC) -c $< -o $@ $(CFLAGS)

clean:
	rm -f network_monitor $(OBJS)