#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>
#include <unistd.h>
#include <time.h>
#include <cjson/cJSON.h>
#include "device_mon.h"
#include "network_mon.h"

// Parameter structure
typedef struct {
    char *name;
    int enabled;
    int monitoring_period;
    int signalling_enabled;
    struct {
        char *type;
        double value; // Not used for status_change
        char *message;
    } *thresholds;
    size_t threshold_count;
    int logging_enabled;
    char *log_file;
} Parameter;

// Read JSON file from /etc/monitor_params.json
char *read_json_file() {
    const char *filename = "/etc/monitor_params.json";
    FILE *fp = fopen(filename, "r");
    if (!fp) {
        fprintf(stderr, "Cannot open JSON file %s\n", filename);
        return NULL;
    }
    fseek(fp, 0, SEEK_END);
    long size = ftell(fp);
    fseek(fp, 0, SEEK_SET);
    char *buffer = malloc(size + 1);
    if (!buffer) {
        fclose(fp);
        return NULL;
    }
    size_t read_size = fread(buffer, 1, size, fp);
    if (read_size != (size_t)size) {
        free(buffer);
        fclose(fp);
        fprintf(stderr, "Failed to read entire JSON file %s\n", filename);
        return NULL;
    }
    buffer[size] = '\0';
    fclose(fp);
    return buffer;
}

// Write log to /var/log/<log_file>
void write_log(const char *log_file, const char *parameter, const char *value) {
    char full_path[256];
    snprintf(full_path, sizeof(full_path), "/var/log/%s", log_file);
    FILE *fp = fopen(full_path, "a");
    if (!fp) {
        fprintf(stderr, "Cannot open log file %s\n", full_path);
        return;
    }
    time_t now = time(NULL);
    struct tm *tm = localtime(&now);
    char timestamp[20];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", tm);
    fprintf(fp, "%s - %s: %s\n", timestamp, parameter, value);
    fclose(fp);
}

// Parameter monitoring thread
void *monitor_parameter(void *arg) {
    Parameter *param = (Parameter *)arg;
    char value_str[64];
    double last_value = -1.0;
    char *last_status = NULL;

    while (1) {
        double value = -1.0;
        const char *status = NULL;

        // Read values
        if (strcmp(param->name, "temperature") == 0) {
            value = read_temperature();
            snprintf(value_str, sizeof(value_str), "%.1f°C", value);
        } else if (strcmp(param->name, "cpu_usage") == 0) {
            value = read_cpu_usage();
            snprintf(value_str, sizeof(value_str), "%.1f%%", value);
        } else if (strcmp(param->name, "ethernet") == 0) {
            status = read_ethernet_status();
            snprintf(value_str, sizeof(value_str), "%s", status);
        } else {
            snprintf(value_str, sizeof(value_str), "unknown");
        }

        // Logging
        if (param->logging_enabled) {
            write_log(param->log_file, param->name, value_str);
        }

        // Threshold checking
        if (param->signalling_enabled) {
            for (size_t i = 0; i < param->threshold_count; i++) {
                if (strcmp(param->thresholds[i].type, "min") == 0 && value < param->thresholds[i].value) {
                    printf("%s: %s\n", param->name, param->thresholds[i].message);
                    // call_dbus(param->name, param->thresholds[i].message);
                } else if (strcmp(param->thresholds[i].type, "max") == 0 && value > param->thresholds[i].value) {
                    printf("%s: %s\n", param->name, param->thresholds[i].message);
                    // call_dbus(param->name, param->thresholds[i].message);
                } else if (strcmp(param->thresholds[i].type, "status_change") == 0 && status && last_status && strcmp(status, last_status) != 0) {
                    printf("%s: %s\n", param->name, param->thresholds[i].message);
                    // call_dbus(param->name, param->thresholds[i].message);
                }
            }
        }

        // Update last values
        if (value >= 0.0) last_value = value;
        if (status) {
            free(last_status);
            last_status = strdup(status);
        }

        sleep(param->monitoring_period);
    }
    free(last_status);
    return NULL;
}

int main() {
    // Read JSON file
    char *json_str = read_json_file();
    if (!json_str) {
        fprintf(stderr, "Cannot read /etc/monitor_params.json\n");
        return 1;
    }

    cJSON *root = cJSON_Parse(json_str);
    free(json_str);
    if (!root) {
        fprintf(stderr, "JSON parse error: %s\n", cJSON_GetErrorPtr());
        return 1;
    }

    // Get parameters
    cJSON *parameters = cJSON_GetObjectItem(root, "parameters");
    if (!cJSON_IsArray(parameters)) {
        fprintf(stderr, "Invalid JSON: 'parameters' is not an array\n");
        cJSON_Delete(root);
        return 1;
    }

    int param_count = cJSON_GetArraySize(parameters);
    Parameter *params = malloc(param_count * sizeof(Parameter));
    pthread_t *threads = malloc(param_count * sizeof(pthread_t));

    // Process parameters
    for (int i = 0; i < param_count; i++) {
        cJSON *param = cJSON_GetArrayItem(parameters, i);
        params[i].name = strdup(cJSON_GetObjectItem(param, "name")->valuestring);
        params[i].enabled = cJSON_IsTrue(cJSON_GetObjectItem(param, "enabled"));
        params[i].monitoring_period = cJSON_GetObjectItem(param, "monitoring_period")->valueint;

        cJSON *signalling = cJSON_GetObjectItem(param, "signalling");
        params[i].signalling_enabled = cJSON_IsTrue(cJSON_GetObjectItem(signalling, "enabled"));

        cJSON *thresholds = cJSON_GetObjectItem(signalling, "thresholds");
        params[i].threshold_count = cJSON_GetArraySize(thresholds);
        params[i].thresholds = malloc(params[i].threshold_count * sizeof(*params[i].thresholds));
        for (int j = 0; j < params[i].threshold_count; j++) {
            cJSON *thresh = cJSON_GetArrayItem(thresholds, j);
            params[i].thresholds[j].type = strdup(cJSON_GetObjectItem(thresh, "type")->valuestring);
            params[i].thresholds[j].message = strdup(cJSON_GetObjectItem(thresh, "message")->valuestring);
            cJSON *value = cJSON_GetObjectItem(thresh, "value");
            params[i].thresholds[j].value = value ? cJSON_GetNumberValue(value) : 0.0;
        }

        cJSON *logging = cJSON_GetObjectItem(param, "logging");
        params[i].logging_enabled = cJSON_IsTrue(cJSON_GetObjectItem(logging, "enabled"));
        params[i].log_file = strdup(cJSON_GetObjectItem(logging, "file")->valuestring);

        // Start thread
        if (params[i].enabled) {
            pthread_create(&threads[i], NULL, monitor_parameter, &params[i]);
        }
    }

    // Wait for threads
    for (int i = 0; i < param_count; i++) {
        if (params[i].enabled) {
            pthread_join(threads[i], NULL);
        }
    }

    // Cleanup
    for (int i = 0; i < param_count; i++) {
        free(params[i].name);
        for (int j = 0; j < params[i].threshold_count; j++) {
            free(params[i].thresholds[j].type);
            free(params[i].thresholds[j].message);
        }
        free(params[i].thresholds);
        free(params[i].log_file);
    }
    free(params);
    free(threads);
    cJSON_Delete(root);

    return 0;
}