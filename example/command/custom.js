/*
Copyright 2022 Open Foodservice System Consortium

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// QR Code is a registered trademark of DENSO WAVE INCORPORATED.

const receiptline = require('receiptline');
const { PNG } = require('pngjs');

// shortcut
const $ = String.fromCharCode;
// custom command object based on escpos
const custom = Object.assign({}, receiptline.commands.escpos, {
    // image split size
    split: 2048,
    // print image: GS v 0 m xL xH yL yH d1 ... dk
    image: function (image) {
        const align = arguments[1] || this.alignment;
        const left = arguments[2] || this.left;
        const width = arguments[3] || this.width;
        const right = arguments[4] || this.right;
        let r = this.upsideDown ? this.area(right, width, left) + this.align(2 - align) : '';
        const img = PNG.sync.read(Buffer.from(image, 'base64'));
        const w = img.width;
        const d = Array(w).fill(0);
        let j = this.upsideDown ? img.data.length - 4 : 0;
        for (let z = 0; z < img.height; z += this.split) {
            const h = Math.min(this.split, img.height - z);
            const l = w + 7 >> 3;
            r += '\x1dv0' + $(0, l & 255, l >> 8 & 255, h & 255, h >> 8 & 255);
            for (let y = 0; y < h; y++) {
                let i = 0, e = 0;
                for (let x = 0; x < w; x += 8) {
                    let b = 0;
                    const q = Math.min(w - x, 8);
                    for (let p = 0; p < q; p++) {
                        const f = Math.floor((d[i] + e * 5) / 16 + Math.pow(((img.data[j] * .299 + img.data[j + 1] * .587 + img.data[j + 2] * .114 - 255) * img.data[j + 3] + 65525) / 65525, 1 / this.gamma) * 255);
                        j += this.upsideDown ? -4 : 4;
                        if (this.gradient) {
                            d[i] = e * 3;
                            e = f < this.threshold ? (b |= 128 >> p, f) : f - 255;
                            if (i > 0) {
                                d[i - 1] += e;
                            }
                            d[i++] += e * 7;
                        }
                        else {
                            if (f < this.threshold) {
                                b |= 128 >> p;
                            }
                        }
                    }
                    r += $(b);
                }
            }
        }
        return r;
    }
});

// test image
const source = '{image:iVBORw0KGgoAAAANSUhEUgAAAIAAAAAwAQMAAADjOuD9AAAABlBMVEUAAAD///+l2Z/dAAAAZklEQVQoz2P4jwYYRrrABwYGOwYG5gMMDBUMDPxAgQcMDDJAgQYGhgJcAv//yMj//9/8//+HerAZRAsAzUASAJoGMhRF4AC6ANCIAhQz8AkAXQoUOIDidBQBkG8hAj8gAqPJAa8AAGjulhOsX97yAAAAAElFTkSuQmCC}';
// transform with custom command object
const result = receiptline.transform(source, { command: custom });
