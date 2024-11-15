CC = gcc

.PHONY: clean

CFLAGS = $(NETWORK_SPEEDTEST_CFLAGS) -Wunused-result
LDFLAGS = $(NETWORK_SPEEDTEST_LDFLAGS)

SRCS = network_speedtest.c
OBJS = $(SRCS:.c=.o)

network_speedtest: $(OBJS)
	$(CC) -o $@ $(OBJS) $(LDFLAGS)

%.o: %.c
	$(CC) -c $< -o $@ $(CFLAGS)

clean:
	rm network_speedtest