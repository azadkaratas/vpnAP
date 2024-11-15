#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <unistd.h>
#include <time.h>
#include <sys/stat.h>

#define BUFFER_SIZE 60

typedef struct {
    float download[BUFFER_SIZE];
    float upload[BUFFER_SIZE];
    int index;
} CircularBuffer;

void add_to_buffer(CircularBuffer *buffer, float download_speed, float upload_speed) {
    buffer->download[buffer->index] = download_speed;
    buffer->upload[buffer->index] = upload_speed;
    buffer->index = (buffer->index + 1) % BUFFER_SIZE;
}

void save_buffer_to_file(CircularBuffer *buffer) {
    FILE *file = fopen("/tmp/network_speed_stats.txt", "w");
    if (file == NULL) {
        perror("fopen error");
        return;
    }

    for (int i = 0; i < BUFFER_SIZE; i++) {
        int idx = (buffer->index + i) % BUFFER_SIZE;
        fprintf(file, "%.2f,%.2f\n", buffer->download[idx], buffer->upload[idx]);
    }
    fclose(file);
}

int main() {
    struct timespec req = {1, 0};
    struct timespec rem;
    
    CircularBuffer wifi_buffer = { .index = 0 };
    FILE *file;
    unsigned long rx_bytes, tx_bytes;
    unsigned long prev_rx_bytes, prev_tx_bytes;
    double download_speed, upload_speed;
    
    file = fopen("/sys/class/net/wlan0/statistics/rx_bytes", "r");
    if (file == NULL) {
        perror("fopen error");
        return 1;
    }
    fscanf(file, "%lu", &prev_rx_bytes);
    fclose(file);

    file = fopen("/sys/class/net/wlan0/statistics/tx_bytes", "r");
    if (file == NULL) {
        perror("fopen error");
        return 1;
    }
    fscanf(file, "%lu", &prev_tx_bytes);
    fclose(file);

    while (1) {
        nanosleep(&req, &rem);  // Belirtilen süre boyunca bekle
        
        file = fopen("/sys/class/net/wlan0/statistics/rx_bytes", "r");
        if (file == NULL) {
            perror("fopen error");
            return 1;
        }
        fscanf(file, "%lu", &rx_bytes);
        fclose(file);

        file = fopen("/sys/class/net/wlan0/statistics/tx_bytes", "r");
        if (file == NULL) {
            perror("fopen error");
            return 1;
        }
        fscanf(file, "%lu", &tx_bytes);
        fclose(file);

        download_speed = (rx_bytes - prev_rx_bytes) * 8.0 / 1e6;  // Mbps
        upload_speed = (tx_bytes - prev_tx_bytes) * 8.0 / 1e6;  // Mbps

        add_to_buffer(&wifi_buffer, download_speed, upload_speed);
        save_buffer_to_file(&wifi_buffer);

        // Update previous values
        prev_rx_bytes = rx_bytes;
        prev_tx_bytes = tx_bytes;
    }

    return 0;
}
