#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <time.h>
#include <unistd.h>
#include <sys/stat.h>
#include <json-c/json.h>
#include <string.h>

#define BUFFER_SIZE 60
#define OUTPUT_FILE "/tmp/netmon.json"

typedef struct {
    int upload[BUFFER_SIZE];
    int download[BUFFER_SIZE];
} Speed;

typedef struct {
    bool enabled;
    Speed speed;
    unsigned long prev_rx_bytes;
    unsigned long prev_tx_bytes;
} Interface;

typedef struct {
    Interface ethernet;
    Interface wifi;
} NetworkInterfaces;

void add_to_buffer(Interface *ifc, int download_speed, int upload_speed) {
    for(int i = 0; i < BUFFER_SIZE - 1; i++){
        ifc->speed.download[i] = ifc->speed.download[i + 1];
        ifc->speed.upload[i] = ifc->speed.upload[i + 1];
    }
    ifc->speed.download[BUFFER_SIZE - 1] = download_speed;
    ifc->speed.upload[BUFFER_SIZE - 1] = upload_speed;
}

unsigned long get_ifc_speeds(const char *iface, unsigned long *rx_bytes, unsigned long *tx_bytes) {
    unsigned long bytes;
    char path[256];
    snprintf(path, sizeof(path), "/sys/class/net/%s/statistics/rx_bytes", iface);

    FILE *fileRx = fopen(path, "r");
    if (fileRx == NULL) {
        perror("Failed to open rx_bytes file");
        exit(EXIT_FAILURE);
    }
    fscanf(fileRx, "%lu", rx_bytes);
    fclose(fileRx);

    snprintf(path, sizeof(path), "/sys/class/net/%s/statistics/tx_bytes", iface);
    FILE *fileTx = fopen(path, "r");
    if (fileTx == NULL) {
        perror("Failed to open tx_bytes file");
        exit(EXIT_FAILURE);
    }
    fscanf(fileTx, "%lu", tx_bytes);
    fclose(fileTx);

    return 0;
}

int check_interface_status(const char *iface) {
    char path[128];
    snprintf(path, sizeof(path), "/sys/class/net/%s/operstate", iface);
    FILE *file = fopen(path, "r");
    if (!file) return 0;

    char status[16];
    if (fgets(status, sizeof(status), file)) {
        fclose(file);
        return (strncmp(status, "up", 2) == 0);
    }

    fclose(file);
    return 0;
}

/*
{
  "interfaces": {
    "ethernet": {
        "enabled": "true",
        "speed" : {
        "upload": "30",
        "download": "60"
        }
    },
    "wifi": {
        "enabled": "false",
        "speed" : {
        "upload": "30",
        "download": "10"
        }
    }
  }
}
*/
void write_json_file(const NetworkInterfaces netIf) {
    json_object *root = json_object_new_object();

    json_object *intefaces = json_object_new_object();
    json_object_object_add(root, "interfaces", intefaces);

    json_object *ethernet = json_object_new_object();
    json_object_object_add(intefaces, "ethernet", ethernet);
    json_object_object_add(ethernet, "enabled", json_object_new_boolean(netIf.ethernet.enabled)); 
    json_object *speed = json_object_new_object();
    
    json_object *uploadSpeeds = json_object_new_array();
    json_object *downloadSpeeds = json_object_new_array();
    for(int i = 0; i < BUFFER_SIZE; i++){
        json_object *up = json_object_new_int(netIf.ethernet.speed.upload[i]);
        json_object *dl = json_object_new_int(netIf.ethernet.speed.download[i]);
        json_object_array_add(uploadSpeeds, up);
        json_object_array_add(downloadSpeeds, dl);
    }

    json_object_object_add(speed, "upload", uploadSpeeds);
    json_object_object_add(speed, "download", downloadSpeeds);
    json_object_object_add(ethernet, "speed", speed);

    json_object *wifi= json_object_new_object();
    json_object_object_add(intefaces, "wifi", wifi);
    json_object_object_add(wifi, "enabled", json_object_new_boolean(netIf.wifi.enabled));
    json_object *speed2 = json_object_new_object();
    
    json_object *uploadSpeeds2 = json_object_new_array();
    json_object *downloadSpeeds2 = json_object_new_array();
    for(int i = 0; i < BUFFER_SIZE; i++){
        json_object *up = json_object_new_int(netIf.wifi.speed.upload[i]);
        json_object *dl = json_object_new_int(netIf.wifi.speed.download[i]);
        json_object_array_add(uploadSpeeds2, up);
        json_object_array_add(downloadSpeeds2, dl);
    }

    json_object_object_add(speed2, "upload", uploadSpeeds2);
    json_object_object_add(speed2, "download", downloadSpeeds2);
    json_object_object_add(wifi, "speed", speed2);

    FILE *file = fopen(OUTPUT_FILE, "w");
    if (file) {
        fprintf(file, "%s", json_object_to_json_string_ext(root, JSON_C_TO_STRING_PRETTY));
        fclose(file);
    }
    json_object_put(root);
}

int main() {
    struct timespec req = {1, 0}, rem;
    struct timespec t0, t1;
    timespec_get(&t0, TIME_UTC);

    NetworkInterfaces network = {0};

    get_ifc_speeds("eth0", &network.ethernet.prev_rx_bytes, &network.ethernet.prev_tx_bytes);
    get_ifc_speeds("wlan0", &network.wifi.prev_rx_bytes, &network.wifi.prev_tx_bytes);

    while (1) {
        nanosleep(&req, &rem);  // Sleep like 1 second
        timespec_get(&t1, TIME_UTC);
        double diff = (double)(t1.tv_sec - t0.tv_sec) + ((double)(t1.tv_nsec - t0.tv_nsec)/1000000000L);
        memcpy(&t0, &t1, sizeof(struct timespec));

        unsigned long rx_bytes, tx_bytes;
        double download_speed, upload_speed;

        int eth_status = check_interface_status("eth0");
        network.ethernet.enabled = (bool) eth_status;
        get_ifc_speeds("eth0", &rx_bytes, &tx_bytes);
        download_speed = (rx_bytes - network.ethernet.prev_rx_bytes) * 8.0 / 1e6 / diff;  // Mbps
        upload_speed = (tx_bytes - network.ethernet.prev_tx_bytes) * 8.0 / 1e6 / diff;    // Mbps
        add_to_buffer(&network.ethernet, upload_speed, download_speed);
        network.ethernet.prev_rx_bytes = rx_bytes;
        network.ethernet.prev_tx_bytes = tx_bytes; 

        int wlan_status = check_interface_status("wlan0");
        network.wifi.enabled = (bool) wlan_status;
        get_ifc_speeds("wlan0", &rx_bytes, &tx_bytes);
        download_speed = (rx_bytes - network.wifi.prev_rx_bytes) * 8.0 / 1e6 / diff;  // Mbps
        upload_speed = (tx_bytes - network.wifi.prev_tx_bytes) * 8.0 / 1e6 / diff;    // Mbps
        add_to_buffer(&network.wifi, upload_speed, download_speed);
        network.wifi.prev_rx_bytes = rx_bytes;
        network.wifi.prev_tx_bytes = tx_bytes; 

        write_json_file(network);       
    }

    return 0;
}