# vpnAP

### How to Build Project:

Simply execute below commands:
```
git submodule update --init --recursive
sudo apt-get install libncurses-dev
cd buildroot
make BR2_EXTERNAL=../application menuconfig  --- Enter menuconfig and press ESC to quit
cd ..
make vpn --- Build the project
```