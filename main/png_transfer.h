#ifndef PNG_TRANSFER_H
#define PNG_TRANSFER_H

#include "stdbool.h"
#include "stdio.h"

int decode_png_to_rgba(const FILE *fp, uint8_t *buffer, uint32_t buffer_size);
uint32_t crc32_png_rgba(FILE *fp);

#endif