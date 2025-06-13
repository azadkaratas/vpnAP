#include <stdio.h>
#include "device_mon.h"

// Read temperature from /sys/class/thermal/thermal_zone0/temp
double read_temperature() {
    FILE *fp = fopen("/sys/class/thermal/thermal_zone0/temp", "r");
    if (!fp) return -1.0;
    int temp;
    if (fscanf(fp, "%d", &temp) != 1) {
        fclose(fp);
        return -1.0;
    }
    fclose(fp);
    return temp / 1000.0; // Convert from millidegrees to °C
}

// Calculate CPU usage from /proc/stat
double read_cpu_usage() {
    static unsigned long long prev_total = 0, prev_idle = 0;
    FILE *fp = fopen("/proc/stat", "r");
    if (!fp) return -1.0;
    unsigned long long user, nice, system, idle, iowait, irq, softirq;
    if (fscanf(fp, "cpu %llu %llu %llu %llu %llu %llu %llu", &user, &nice, &system, &idle, &iowait, &irq, &softirq) != 7) {
        fclose(fp);
        return -1.0;
    }
    fclose(fp);
    unsigned long long total = user + nice + system + idle + iowait + irq + softirq;
    unsigned long long idle_total = idle + iowait;
    double usage = 0.0;
    if (prev_total > 0) {
        usage = 100.0 * (1.0 - ((double)(idle_total - prev_idle) / (total - prev_total)));
    }
    prev_total = total;
    prev_idle = idle_total;
    return usage;
}