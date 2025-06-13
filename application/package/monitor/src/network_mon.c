#include <stdio.h>
#include "network_mon.h"

// Read Ethernet status from /sys/class/net/eth0/operstate
const char *read_ethernet_status() {
    static char status[16];
    FILE *fp = fopen("/sys/class/net/eth0/operstate", "r");
    if (!fp) return "unknown";
    if (fscanf(fp, "%15s", status) != 1) {
        fclose(fp);
        return "unknown";
    }
    fclose(fp);
    return status;
}