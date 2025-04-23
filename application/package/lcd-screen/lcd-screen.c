#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/delay.h> 
#include "fbtft.h"

#define DRVNAME		"fb_st7796s"
#define WIDTH		320
#define HEIGHT		480

static int init_display(struct fbtft_par *par)
{
    par->fbtftops.reset(par);

    write_reg(par, 0x01); /* software reset */
    write_reg(par, 0x11); /* sleep out */
    mdelay(120);

    write_reg(par, 0x3A, 0x05); /* 16bit pixel */

    write_reg(par, 0xF0, 0xC3);
    write_reg(par, 0xF0, 0x96);

    write_reg(par, 0xB4, 0x01);
    write_reg(par, 0xB7, 0xC6);
    write_reg(par, 0xC0, 0x80, 0x45);

    write_reg(par, 0xC1, 0x13);

    write_reg(par, 0xC2, 0xA7);
    write_reg(par, 0xC5, 0x0A);

	write_reg(par, 0xE8, 0x0040, 0x008A, 0x0000, 0x0000, 0x0029, 0x0019, 0x00A5, 0x0033);

	write_reg(par, 0xE0, 0xD0, 0x08, 0x0F, 0x06, 0x06, 0x33, 0x30, 0x33, 0x47, 0x17, 0x13, 0x13, 0x2B, 0x31);
	write_reg(par, 0xE1, 0xD0, 0x0A, 0x11, 0x0B, 0x09, 0x07, 0x2F, 0x33, 0x47, 0x38, 0x15, 0x16, 0x2C, 0x32);

    write_reg(par, 0xF0, 0x3C);
    write_reg(par, 0xF0, 0x69);

    write_reg(par, 0x21);
    write_reg(par, 0x11); /* sleep out */
    mdelay(100);
    write_reg(par, 0x29); /* display on */
    return 0;
}

static void set_addr_win(struct fbtft_par *par, int xs, int ys, int xe, int ye)
{
    fbtft_par_dbg(DEBUG_SET_ADDR_WIN, par,
        "%s(xs=%d, ys=%d, xe=%d, ye=%d)\n", __func__, xs, ys, xe, ye);

    /* Column address set */
    write_reg(par, 0x2A,
        (xs >> 8) & 0xFF, xs & 0xFF, (xe >> 8) & 0xFF, xe & 0xFF);

    /* Row adress set */
    write_reg(par, 0x2B,
        (ys >> 8) & 0xFF, ys & 0xFF, (ye >> 8) & 0xFF, ye & 0xFF);

    /* Memory write */
    write_reg(par, 0x2C);
}

#define MEM_Y   (7) /* MY row address order */
#define MEM_X   (6) /* MX column address order */
#define MEM_V   (5) /* MV row / column exchange */
#define MEM_L   (4) /* ML vertical refresh order */
#define MEM_H   (2) /* MH horizontal refresh order */
#define MEM_BGR (3) /* RGB-BGR Order */

static int set_var(struct fbtft_par *par)
{
    switch (par->info->var.rotate) {
    case 0:
        write_reg(par, 0x36, (1 << MEM_X) | (par->bgr << MEM_BGR));
        break;
    case 270:
        write_reg(par, 0x36,
            (1<<MEM_V) | (1 << MEM_L) | (par->bgr << MEM_BGR));
        break;
    case 180:
        write_reg(par, 0x36, (1 << MEM_Y) | (par->bgr << MEM_BGR));
        break;
    case 90:
        write_reg(par, 0x36, (1 << MEM_Y) | (1 << MEM_X) |
                    (1 << MEM_V) | (par->bgr << MEM_BGR));
        break;
    }

    return 0;
}

static struct fbtft_display display = {
    .regwidth = 8,
    .width = WIDTH,
    .height = HEIGHT,
    .fbtftops = {
		.init_display = init_display,
        .set_addr_win = set_addr_win,
        .set_var = set_var,
    },
};
FBTFT_REGISTER_DRIVER(DRVNAME, "sitronix,st7796s", &display);

MODULE_ALIAS("spi:" DRVNAME);
MODULE_ALIAS("platform:" DRVNAME);
MODULE_ALIAS("spi:st7796s");
MODULE_ALIAS("platform:st7796s");

MODULE_DESCRIPTION("FB driver for the ST7796S LCD display controller");
MODULE_AUTHOR("Azad Karatas");
MODULE_LICENSE("GPL");