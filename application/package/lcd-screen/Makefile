MODULE=lcd-screen
obj-m  := $(MODULE).o

KERNELDIR ?=  /home/azad/Desktop/projects/vpnAP/buildroot/output/build/linux-custom
CROSS_COMPILER=/home/azad/Desktop/projects/vpnAP/buildroot/output/host/bin/aarch64-buildroot-linux-gnu-gcc
PWD    := $(shell pwd)

all: build dtbo

build:
	$(MAKE) -C $(KERNELDIR) ARCH=arm64 CC=$(CROSS_COMPILER) M=$(PWD) modules

clean:
	$(MAKE) -C $(KERNELDIR) ARCH=arm CROSS_COMPILE=$(CROSS_COMPILER) M=$(PWD) clean
	rm -f *.o *.ko *.mod.* *.symvers *.order $(MODULE).dtbo

dtbo: $(MODULE).dts
	dtc -@ -I dts -O dtb -o $(MODULE).dtbo $(MODULE).dts
