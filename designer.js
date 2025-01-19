/*
Copyright 2019 Open Foodservice System Consortium

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

const http = require('http');
const path = require('path');
const fs = require('fs');
const net = require('net');
const receiptline = require('receiptline');
const iconv = require('iconv-lite');
const PNG = require('pngjs').PNG;
const qrcode = require('./lib/qrcode-generator/qrcode.js');
const servers = require('./servers.json');
let puppeteer;
try {
    puppeteer = require('puppeteer');
}
catch (e) {
    // nothing to do
}
let sharp;
try {
    sharp = require('sharp');
}
catch (e) {
    // nothing to do
}

// Serial-LAN Converter
if ('serial' in servers) {
    const serialport = require('serialport');
    const serial = net.createServer(conn => {
        const parity = { n: 'none', e: 'even', o: 'odd' };
        const dev = /^([^:]*)(:((?:24|48|96|192|384|576|1152)00),?([neo]),?([78]),?([12]),?([nrx]?)$)?/i.exec(servers.serial.device);
        const opt = { baudRate: 9600, autoOpen: false };
        if (dev[2]) {
            opt.baudRate = Number(dev[3]);
            opt.parity = parity[dev[4].toLowerCase()];
            opt.dataBits = Number(dev[5]);
            opt.stopBits = Number(dev[6]);
            opt.rtscts = /r/i.test(dev[7]);
            opt.xon = opt.xonff = /x/i.test(dev[7]);
        }
        let port;
        if ('SerialPort' in serialport) {
            opt.path = dev[1];
            port = new serialport.SerialPort(opt);
        }
        else {
            port = new serialport(dev[1], opt);
        }
        port.on('error', err => {
            console.log(err);
            conn.destroy();
        });
        port.on('open', () => {
            conn.pipe(port).pipe(conn);
            conn.on('end', () => port.unpipe(conn));
            conn.on('close', had_error => port.drain(err => port.close()));
        });
        port.open();
    });
    serial.maxConnections = 1;
    serial.listen(servers.serial.port, () => {
        console.log(`Serial-LAN converter running at ${servers.serial.host}:${servers.serial.port}`);
    });
}

// Virtual Printer
if ('print' in servers) {
    const printer = net.createServer(conn => {
        conn.on('data', data => {
            console.log('Virtual printer received:');
            const hex = (data.toString('hex').replace(/../g, ' $&').replace(/.{24}/g, '$& ') + ' '.repeat(49)).match(/.{50}/g);
            const bin = (data.toString('binary').replace(/[^ -~]/g, '.') + ' '.repeat(15)).match(/.{16}/g);
            bin.forEach((b, i) => console.log(`${('0'.repeat(7) + (i << 4).toString(16)).slice(-8)} ${hex[i]} ${b}`));
            conn.write('\x00');
        });
    });
    printer.listen(servers.print.port, () => {
        console.log(`Virtual printer running at ${servers.print.host}:${servers.print.port}`);
    });
}

// ReceiptLine Server
if ('http' in servers) {
    const server = http.createServer((req, res) => {
        req.setEncoding('utf8');
        let pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
        switch (req.method) {
            case 'GET':
                if (pathname === '/') {
                    pathname = '/index.html';
                }
                fs.readFile(servers.http.root + pathname, (err, data) => {
                    if (err) {
                        res.writeHead(404);
                        res.end();
                    }
                    else {
                        res.writeHead(200, {'Content-Type': servers.http.mime[path.extname(pathname)] || servers.http.mime['.txt']});
                        res.end(data);
                    }
                });
                break;
            case 'POST':
                fs.readFile('./printers.json', 'utf8', (err, data) => {
                    if (err) {
                        res.writeHead(500);
                        res.end();
                    }
                    else {
                        let printers = {};
                        try {
                            printers = JSON.parse(data);
                        }
                        catch (e) {
                            // nothing to do
                        }
                        const pid = pathname.slice(1);
                        if (pid in printers) {
                            let text = '';
                            req.on('data', chunk => text += chunk);
                            req.on('end', () => {
                                const printer = printers[pid];
                                printer.resolution = printer.resolution === 180 ? 180 : 203;
                                const host = printer.host || '127.0.0.1';
                                const port = printer.port || 19100;
                                const sock = net.connect(port, host);
                                let drain = false;
                                sock.on('connect', () => {
                                    transform(text, printer).then(command => {
                                        drain = sock.write(command, /^(svg|text)$/.test(printer.command) ? 'utf8' : 'binary');
                                    });
                                });
                                sock.on('data', data => {
                                    if (drain) {
                                        sock.end();
                                        res.writeHead(200, {'Content-Type': 'text/plain'});
                                        res.end('success');
                                        drain = false;
                                    }
                                });
                                sock.on('drain', () => {
                                    drain = true;
                                });
                                sock.on('timeout', () => {
                                    sock.end();
                                    res.writeHead(200, {'Content-Type': 'text/plain'});
                                    res.end('failure');
                                });
                                sock.on('error', () => {
                                    res.writeHead(200, {'Content-Type': 'text/plain'});
                                    res.end('failure');
                                });
                                sock.setTimeout(servers.http.timeout);
                            });
                        }
                        else {
                            res.writeHead(404);
                            res.end();
                        }
                    }
                });
                break;
            default:
                res.end();
                break;
        }
    });
    server.listen(servers.http.port, servers.http.host, () => {
        console.log(`Server running at http://${servers.http.host}:${servers.http.port}/`);
    });
}

const transform = async (receiptmd, printer) => {
    // convert receiptline to png
    if (printer.command === 'png') {
        return await rasterize(receiptmd, printer, 'binary');
    }
    // convert receiptline to image command
    if (printer.asImage && (puppeteer || sharp)) {
        receiptmd = `|{i:${await rasterize(receiptmd, printer, 'base64')}}`;
        return receiptline.transform(receiptmd, printer);
    }
    // convert receiptline to command
    if (printer.landscape && /^(escpos|epson|sii|citizen|star[sm]bcs2?)$/.test(printer.command)) {
        // landscape orientation
        printer.command = Object.assign({}, receiptline.commands[printer.command], ...landscape[printer.command]);
    }
    return receiptline.transform(receiptmd, printer);
};

const rasterize = async (receiptmd, printer, encoding) => {
    // convert receiptline to png
    const c = receiptline.commands.svg.charWidth;
    if (puppeteer) {
        const display = Object.assign({}, printer, { command: 'svg' });
        const svg = receiptline.transform(receiptmd, display);
        const w = Number(svg.match(/width="(\d+)px"/)[1]);
        const h = Number(svg.match(/height="(\d+)px"/)[1]);
        const v = { width: w, height: h };
        let t = '';
        if (printer.landscape) {
            const m = printer.margin * c || 0;
            const n = printer.marginRight * c || 0;
            v.width = h;
            v.height = m + w + n;
            t = `svg{padding-left:${m}px;padding-right:${n}px;transform-origin:top left;transform:rotate(-90deg) translateX(-${v.height}px)}`;
            Object.assign(printer, { cpl: Math.ceil(h / 12), margin: 0, marginRight: 0 });
        }
        const browser = await puppeteer.launch({ defaultViewport: v, headless: 'new' });
        const page = await browser.newPage();
        await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;background:transparent}${t}</style></head><body>${svg}</body></html>`);
        const png = await page.screenshot({ encoding: encoding, omitBackground: true });
        await browser.close();
        return png;
    }
    else if (sharp) {
        const display = Object.assign({}, printer, { command: svgsharp });
        const svg = receiptline.transform(receiptmd, display);
        const h = Number(svg.match(/height="(\d+)px"/)[1]);
        const x = { background: 'transparent' };
        let r = 0;
        if (printer.landscape) {
            x.bottom = printer.margin * c || 0;
            x.top = printer.marginRight * c || 0;
            r = -90;
            Object.assign(printer, { cpl: Math.ceil(h / 12), margin: 0, marginRight: 0 });
        }
        return (await sharp(Buffer.from(svg)).rotate(r).extend(x).toFormat('png').toBuffer()).toString(encoding);
    }
    else {
        return '';
    }
};

const svgsharp = Object.assign({}, receiptline.commands.svg, {
    // print text:
    text: function (text, encoding) {
        let p = this.textPosition;
        const attr = Object.keys(this.textAttributes).reduce((a, key) => a + ` ${key}="${this.textAttributes[key]}"`, '');
        this.textElement += this.arrayFrom(text, encoding).reduce((a, c) => {
            const w = this.measureText(c, encoding);
            const q = w * this.textScale;
            const r = (p + q / 2) * this.charWidth / this.textScale;
            p += q;
            return a + `<text x="${r}"${attr}>${c.replace(/[ &<>]/g, r => ({' ': '&#xa0;', '&': '&amp;', '<': '&lt;', '>': '&gt;'}[r]))}</text>`;
        }, '');
        this.textPosition += this.measureText(text, encoding) * this.textScale;
        return '';
    },
    // feed new line:
    lf: function () {
        const h = this.lineHeight * this.charWidth * 2;
        if (this.textElement.length > 0) {
            this.svgContent += `<g transform="translate(${this.lineMargin * this.charWidth},${this.svgHeight + h * 5 / 6})">${this.textElement}</g>`;
        }
        this.svgHeight += Math.max(h, this.feedMinimum);
        this.lineHeight = 1;
        this.textElement = '';
        this.textPosition = 0;
        return '';
    }
});

// shortcut
const $ = String.fromCharCode;

//
// ESC/POS Thermal Landscape
//
const _escpos90 = {
    position: 0,
    content: '',
    height: 1,
    feed: 24,
    cpl: 48,
    buffer: '',
    // start printing: ESC @ GS a n ESC M n FS ( A pL pH fn m ESC SP n FS S n1 n2 FS . GS P x y ESC L ESC T n
    open: function (printer) {
        this.upsideDown = printer.upsideDown;
        this.spacing = printer.spacing;
        this.cutting = printer.cutting;
        this.gradient = printer.gradient;
        this.gamma = printer.gamma;
        this.threshold = printer.threshold;
        this.alignment = 0;
        this.left = 0;
        this.width = printer.cpl;
        this.right = 0;
        this.position = 0;
        this.content = '';
        this.height = 1;
        this.feed = this.charWidth * (printer.spacing ? 2.5 : 2);
        this.cpl = printer.cpl;
        this.margin = printer.margin;
        this.marginRight = printer.marginRight;
        this.buffer = '';
        const r = printer.resolution;
        return '\x1b@\x1da\x00\x1bM' + (printer.encoding === 'tis620' ? 'a' : '0') + '\x1c(A' + $(2, 0, 48, 0) + '\x1b \x00\x1cS\x00\x00\x1c.\x1dP' + $(r, r) + '\x1bL\x1bT' + $(printer.upsideDown ? 3 : 1);
    },
    // finish printing: ESC W xL xH yL yH dxL dxH dyL dyH FF GS r n
    close: function () {
        const w = this.position;
        const h = this.cpl * this.charWidth;
        const v = (this.margin + this.cpl + this.marginRight) * this.charWidth;
        const m = (this.upsideDown ? this.margin : this.marginRight) * this.charWidth;
        return '\x1bW' + $(0, 0, 0, 0, w & 255, w >> 8 & 255, v & 255, v >> 8 & 255) + ' \x1bW' + $(0, 0, m & 255, m >> 8 & 255, w & 255, w >> 8 & 255, h & 255, h >> 8 & 255) + this.buffer + '\x0c' + (this.cutting ? this.cut() : '') + '\x1dr1';
    },
    // set print area:
    area: function (left, width, right) {
        this.left = left;
        this.width = width;
        this.right = right;
        return '';
    },
    // set line alignment:
    align: function (align) {
        this.alignment = align;
        return '';
    },
    // set absolute print position: ESC $ nL nH
    absolute: function (position) {
        const p = (this.left + position) * this.charWidth;
        this.content += '\x1b$' + $(p & 255, p >> 8 & 255);
        return '';
    },
    // set relative print position: ESC \ nL nH
    relative: function (position) {
        const p = position * this.charWidth;
        this.content += '\x1b\\' + $(p & 255, p >> 8 & 255);
        return '';
    },
    // print horizontal rule: FS C n FS . ESC t n ...
    hr: function (width) {
        this.content += '\x1cC0\x1c.\x1bt\x01' + '\x95'.repeat(width);
        return '';
    },
    // print vertical rules: GS ! n FS C n FS . ESC t n ...
    vr: function (widths, height) {
        this.content += widths.reduce((a, w) => {
            const p = w * this.charWidth;
            return a + '\x1b\\' + $(p & 255, p >> 8 & 255) + '\x96';
        }, '\x1d!' + $(height - 1) + '\x1cC0\x1c.\x1bt\x01\x96');
        return '';
    },
    // start rules: FS C n FS . ESC t n ...
    vrstart: function (widths) {
        this.content += '\x1cC0\x1c.\x1bt\x01' + widths.reduce((a, w) => a + '\x95'.repeat(w) + '\x91', '\x9c').slice(0, -1) + '\x9d';
        return '';
    },
    // stop rules: FS C n FS . ESC t n ...
    vrstop: function (widths) {
        this.content += '\x1cC0\x1c.\x1bt\x01' + widths.reduce((a, w) => a + '\x95'.repeat(w) + '\x90', '\x9e').slice(0, -1) + '\x9f';
        return '';
    },
    // print vertical and horizontal rules: FS C n FS . ESC t n ...
    vrhr: function (widths1, widths2, dl, dr) {
        const r1 = ' '.repeat(Math.max(-dl, 0)) + widths1.reduce((a, w) => a + '\x95'.repeat(w) + '\x90', dl > 0 ? '\x9e' : '\x9a').slice(0, -1) + (dr < 0 ? '\x9f' : '\x9b') + ' '.repeat(Math.max(dr, 0));
        const r2 = ' '.repeat(Math.max(dl, 0)) + widths2.reduce((a, w) => a + '\x95'.repeat(w) + '\x91', dl < 0 ? '\x9c' : '\x98').slice(0, -1) + (dr > 0 ? '\x9d' : '\x99') + ' '.repeat(Math.max(-dr, 0));
        this.content += '\x1cC0\x1c.\x1bt\x01' + r2.split('').reduce((a, c, i) => a + this.vrtable[c][r1[i]], '');
        return '';
    },
    // set line spacing and feed new line:
    vrlf: function (vr) {
        this.feed = this.charWidth * (!vr && this.spacing ? 2.5 : 2);
        return this.lf();
    },
    // underline text: ESC - n FS - n
    ul: function () {
        this.content += '\x1b-2\x1c-2';
        return '';
    },
    // emphasize text: ESC E n
    em: function () {
        this.content += '\x1bE1';
        return '';
    },
    // invert text: GS B n
    iv: function () {
        this.content += '\x1dB1';
        return '';
    },
    // scale up text: GS ! n
    wh: function (wh) {
        this.height = Math.max(this.height, wh < 3 ? wh : wh - 1);
        this.content += '\x1d!' + (wh < 3 ? $((wh & 1) << 4 | wh >> 1 & 1) : $(wh - 2 << 4 | wh - 2));
        return '';
    },
    // cancel text decoration: ESC - n FS - n ESC E n GS B n GS ! n
    normal: function () {
        this.content += '\x1b-0\x1c-0\x1bE0\x1dB0\x1d!\x00';
        return '';
    },
    // print text:
    text: function (text, encoding) {
        switch (encoding) {
            case 'multilingual':
                this.content += this.multiconv(text);
                break;
            case 'tis620':
                this.content += this.codepage[encoding] + this.arrayFrom(text, encoding).reduce((a, c) => a + '\x00' + iconv.encode(c, encoding).toString('binary'), '');
                break;
            default:
                this.content += this.codepage[encoding] + iconv.encode(text, encoding).toString('binary');
                break;
        }
        return '';
    },
    // feed new line: GS $ nL nH ESC $ nL nH
    lf: function () {
        const h = this.height * this.charWidth * 2;
        const x = this.left * this.charWidth;
        const y = this.position + h * 21 / 24 - 1;
        this.buffer += '\x1d$' + $(y & 255, y >> 8 & 255) + '\x1b$' + $(x & 255, x >> 8 & 255) + this.content;
        this.position += Math.max(h, this.feed);
        this.height = 1;
        this.content = '';
        return '';
    },
    // print image: GS $ nL nH ESC $ nL nH GS 8 L p1 p2 p3 p4 m fn a bx by c xL xH yL yH d1 ... dk
    image: function (image) {
        const align = arguments[1] || this.alignment;
        const left = arguments[2] || this.left;
        const width = arguments[3] || this.width;
        const img = PNG.sync.read(Buffer.from(image, 'base64'));
        const w = img.width;
        const x = left * this.charWidth + align * (width * this.charWidth - w) / 2;
        const y = this.position;
        let r = '';
        const d = Array(w).fill(0);
        let j = 0;
        for (let z = 0; z < img.height; z += this.split) {
            const h = Math.min(this.split, img.height - z);
            const l = (w + 7 >> 3) * h + 10;
            r += '\x1d$' + $(y + h - 1 & 255, y + h - 1 >> 8 & 255) + '\x1b$' + $(x & 255, x >> 8 & 255) + '\x1d8L' + $(l & 255, l >> 8 & 255, l >> 16 & 255, l >> 24 & 255, 48, 112, 48, 1, 1, 49, w & 255, w >> 8 & 255, h & 255, h >> 8 & 255);
            for (let y = 0; y < h; y++) {
                let i = 0, e = 0;
                for (let x = 0; x < w; x += 8) {
                    let b = 0;
                    const q = Math.min(w - x, 8);
                    for (let p = 0; p < q; p++) {
                        const f = Math.floor((d[i] + e * 5) / 16 + Math.pow(((img.data[j] * .299 + img.data[j + 1] * .587 + img.data[j + 2] * .114 - 255) * img.data[j + 3] + 65525) / 65525, 1 / this.gamma) * 255);
                        j += 4;
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
        this.buffer += r;
        this.position += img.height;
        return '';
    },
    // print QR Code: GS $ nL nH ESC $ nL nH GS 8 L p1 p2 p3 p4 m fn a bx by c xL xH yL yH d1 ... dk
    qrcode: function (symbol, encoding) {
        if (typeof qrcode !== 'undefined' && symbol.data.length > 0) {
            const qr = qrcode(0, symbol.level.toUpperCase());
            qr.addData(symbol.data);
            qr.make();
            const img = qr.createASCII(2, 0).split('\n');
            const w = img.length * symbol.cell;
            const h = w;
            const x = this.left * this.charWidth + this.alignment * (this.width * this.charWidth - w) / 2;
            const y = this.position;
            let r = '\x1d$' + $(y + h - 1 & 255, y + h - 1 >> 8 & 255) + '\x1b$' + $(x & 255, x >> 8 & 255);
            const l = (w + 7 >> 3) * h + 10;
            r += '\x1d8L' + $(l & 255, l >> 8 & 255, l >> 16 & 255, l >> 24 & 255, 48, 112, 48, 1, 1, 49, w & 255, w >> 8 & 255, h & 255, h >> 8 & 255);
            for (let i = 0; i < img.length; i++) {
                let d = '';
                for (let j = 0; j < w; j += 8) {
                    let b = 0;
                    const q = Math.min(w - j, 8);
                    for (let p = 0; p < q; p++) {
                        if (img[i][Math.floor((j + p) / symbol.cell) * 2] === ' ') {
                            b |= 128 >> p;
                        }
                    }
                    d += $(b);
                }
                for (let k = 0; k < symbol.cell; k++) {
                    r += d;
                }
            }
            this.buffer += r;
            this.position += h;
        }
        return '';
    },
    // print barcode: GS $ nL nH ESC $ nL nH GS w n GS h n GS H n GS k m n d1 ... dn
    barcode: function (symbol, encoding) {
        const bar = receiptline.barcode.generate(symbol);
        if ('length' in bar) {
            const w = bar.length;
            const l = symbol.height;
            const h = l + (symbol.hri ? this.charWidth * 2 + 2 : 0);
            const x = this.left * this.charWidth + this.alignment * (this.width * this.charWidth - w) / 2;
            const y = this.position;
            let r = '\x1d$' + $(y + l - 1 & 255, y + l - 1 >> 8 & 255) + '\x1b$' + $(x & 255, x >> 8 & 255);
            let d = iconv.encode(symbol.data, encoding === 'multilingual' ? 'ascii' : encoding).toString('binary');
            const b = this.bartype[symbol.type] + Number(/upc|[ej]an/.test(symbol.type) && symbol.data.length < 9);
            switch (b) {
                case this.bartype.ean:
                    d = d.slice(0, 12);
                    break;
                case this.bartype.upc:
                    d = d.slice(0, 11);
                    break;
                case this.bartype.ean + 1:
                    d = d.slice(0, 7);
                    break;
                case this.bartype.upc + 1:
                    d = this.upce(d);
                    break;
                case this.bartype.code128:
                    d = this.code128(d);
                    break;
                default:
                    break;
            }
            d = d.slice(0, 255);
            r += '\x1dw' + $(symbol.width) + '\x1dh' + $(symbol.height) + '\x1dH' + $(symbol.hri ? 2 : 0) + '\x1dk' + $(b, d.length) + d;
            this.buffer += r;
            this.position += h;
        }
        return '';
    }
};

//
// SII Landscape
//
const _sii90 = {
    // start printing: ESC @ GS a n ESC M n ESC SP n FS S n1 n2 FS . GS P x y ESC L ESC T n
    open: function (printer) {
        this.upsideDown = printer.upsideDown;
        this.spacing = printer.spacing;
        this.cutting = printer.cutting;
        this.gradient = printer.gradient;
        this.gamma = printer.gamma;
        this.threshold = printer.threshold;
        this.alignment = 0;
        this.left = 0;
        this.width = printer.cpl;
        this.right = 0;
        this.position = 0;
        this.content = '';
        this.height = 1;
        this.feed = this.charWidth * (printer.spacing ? 2.5 : 2);
        this.cpl = printer.cpl;
        this.margin = printer.margin;
        this.marginRight = printer.marginRight;
        this.buffer = '';
        const r = printer.resolution;
        return '\x1b@\x1da\x00\x1bM0\x1b \x00\x1cS\x00\x00\x1c.\x1dP' + $(r, r) + '\x1bL\x1bT' + $(printer.upsideDown ? 3 : 1);
    },
    // finish printing: ESC W xL xH yL yH dxL dxH dyL dyH ESC $ nL nH FF DC2 q n
    close: function () {
        const w = this.position;
        const h = this.cpl * this.charWidth;
        const v = (this.margin + this.cpl + this.marginRight) * this.charWidth;
        const m = (this.upsideDown ? this.margin : this.marginRight) * this.charWidth;
        return '\x1bW' + $(0, 0, 0, 0, w & 255, w >> 8 & 255, v & 255, v >> 8 & 255) + ' \x1bW' + $(0, 0, m & 255, m >> 8 & 255, w & 255, w >> 8 & 255, h & 255, h >> 8 & 255) + this.buffer + '\x0c' + (this.cutting ? this.cut() : '') + '\x12q\x00';
    },
    // feed new line: GS $ nL nH ESC $ nL nH
    lf: function () {
        const h = this.height * this.charWidth * 2;
        const x = this.left * this.charWidth;
        const y = this.position + h;
        this.buffer += '\x1d$' + $(y & 255, y >> 8 & 255) + '\x1b$' + $(x & 255, x >> 8 & 255) + this.content;
        this.position += Math.max(h, this.feed);
        this.height = 1;
        this.content = '';
        return '';
    },
    // print image: GS $ nL nH ESC $ nL nH GS 8 L p1 p2 p3 p4 m fn a bx by c xL xH yL yH d1 ... dk
    image: function (image) {
        const align = arguments[1] || this.alignment;
        const left = arguments[2] || this.left;
        const width = arguments[3] || this.width;
        const img = PNG.sync.read(Buffer.from(image, 'base64'));
        const w = img.width;
        const x = left * this.charWidth + align * (width * this.charWidth - w) / 2;
        const y = this.position;
        let r = '';
        const d = Array(w).fill(0);
        let j = 0;
        for (let z = 0; z < img.height; z += this.split) {
            const h = Math.min(this.split, img.height - z);
            const l = (w + 7 >> 3) * h + 10;
            r += '\x1d$' + $(y + h & 255, y + h >> 8 & 255) + '\x1b$' + $(x & 255, x >> 8 & 255) + '\x1d8L' + $(l & 255, l >> 8 & 255, l >> 16 & 255, l >> 24 & 255, 48, 112, 48, 1, 1, 49, w & 255, w >> 8 & 255, h & 255, h >> 8 & 255);
            for (let y = 0; y < h; y++) {
                let i = 0, e = 0;
                for (let x = 0; x < w; x += 8) {
                    let b = 0;
                    const q = Math.min(w - x, 8);
                    for (let p = 0; p < q; p++) {
                        const f = Math.floor((d[i] + e * 5) / 16 + Math.pow(((img.data[j] * .299 + img.data[j + 1] * .587 + img.data[j + 2] * .114 - 255) * img.data[j + 3] + 65525) / 65525, 1 / this.gamma) * 255);
                        j += 4;
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
        this.buffer += r;
        this.position += img.height;
        return '';
    },
    // print QR Code: GS $ nL nH ESC $ nL nH GS 8 L p1 p2 p3 p4 m fn a bx by c xL xH yL yH d1 ... dk
    qrcode: function (symbol, encoding) {
        if (typeof qrcode !== 'undefined' && symbol.data.length > 0) {
            const qr = qrcode(0, symbol.level.toUpperCase());
            qr.addData(symbol.data);
            qr.make();
            const img = qr.createASCII(2, 0).split('\n');
            const w = img.length * symbol.cell;
            const h = w;
            const x = this.left * this.charWidth + this.alignment * (this.width * this.charWidth - w) / 2;
            const y = this.position;
            let r = '\x1d$' + $(y + h & 255, y + h >> 8 & 255) + '\x1b$' + $(x & 255, x >> 8 & 255);
            const l = (w + 7 >> 3) * h + 10;
            r += '\x1d8L' + $(l & 255, l >> 8 & 255, l >> 16 & 255, l >> 24 & 255, 48, 112, 48, 1, 1, 49, w & 255, w >> 8 & 255, h & 255, h >> 8 & 255);
            for (let i = 0; i < img.length; i++) {
                let d = '';
                for (let j = 0; j < w; j += 8) {
                    let b = 0;
                    const q = Math.min(w - j, 8);
                    for (let p = 0; p < q; p++) {
                        if (img[i][Math.floor((j + p) / symbol.cell) * 2] === ' ') {
                            b |= 128 >> p;
                        }
                    }
                    d += $(b);
                }
                for (let k = 0; k < symbol.cell; k++) {
                    r += d;
                }
            }
            this.buffer += r;
            this.position += h;
        }
        return '';
    },
    // print barcode: GS $ nL nH ESC $ nL nH GS w n GS h n GS H n GS k m n d1 ... dn
    barcode: function (symbol, encoding) {
        const bar = receiptline.barcode.generate(symbol);
        if ('length' in bar) {
            const w = bar.length + symbol.width * (/^(upc|ean|jan)$/.test(symbol.type) ? (data.length < 9 ? 14 : 18) : 20);
            const l = symbol.height;
            const h = l + (symbol.hri ? this.charWidth * 2 + 4 : 0);
            const x = this.left * this.charWidth + this.alignment * (this.width * this.charWidth - w) / 2;
            const y = this.position;
            let r = '\x1d$' + $(y + l & 255, y + l >> 8 & 255) + '\x1b$' + $(x & 255, x >> 8 & 255);
            let d = iconv.encode(symbol.data, encoding === 'multilingual' ? 'ascii' : encoding).toString('binary');
            const b = this.bartype[symbol.type] + Number(/upc|[ej]an/.test(symbol.type) && symbol.data.length < 9);
            switch (b) {
                case this.bartype.upc + 1:
                    d = this.upce(d);
                    break;
                case this.bartype.codabar:
                    d = this.codabar(d);
                    break;
                case this.bartype.code93:
                    d = this.code93(d);
                    break;
                case this.bartype.code128:
                    d = this.code128(d);
                    break;
                default:
                    break;
            }
            d = d.slice(0, 255);
            r += '\x1dw' + $(symbol.width) + '\x1dh' + $(symbol.height) + '\x1dH' + $(symbol.hri ? 2 : 0) + '\x1dk' + $(b, d.length) + d;
            this.buffer += r;
            this.position += h;
        }
        return '';
    }
};

//
// Citizen Landscape
//
const _citizen90 = {
    // print barcode: GS $ nL nH ESC $ nL nH GS w n GS h n GS H n GS k m n d1 ... dn
    barcode: function (symbol, encoding) {
        const bar = receiptline.barcode.generate(symbol);
        if ('length' in bar) {
            const w = bar.length;
            const l = symbol.height;
            const h = l + (symbol.hri ? this.charWidth * 2 + 2 : 0);
            const x = this.left * this.charWidth + this.alignment * (this.width * this.charWidth - w) / 2;
            const y = this.position;
            let r = '\x1d$' + $(y + l - 1 & 255, y + l - 1 >> 8 & 255) + '\x1b$' + $(x & 255, x >> 8 & 255);
            let d = iconv.encode(symbol.data, encoding === 'multilingual' ? 'ascii' : encoding).toString('binary');
            const b = this.bartype[symbol.type] + Number(/upc|[ej]an/.test(symbol.type) && symbol.data.length < 9);
            switch (b) {
                case this.bartype.ean:
                    d = d.slice(0, 12);
                    break;
                case this.bartype.upc:
                    d = d.slice(0, 11);
                    break;
                case this.bartype.ean + 1:
                    d = d.slice(0, 7);
                    break;
                case this.bartype.upc + 1:
                    d = this.upce(d);
                    break;
                case this.bartype.codabar:
                    d = this.codabar(d);
                    break;
                case this.bartype.code128:
                    d = this.code128(d);
                    break;
                default:
                    break;
            }
            d = d.slice(0, 255);
            r += '\x1dw' + $(symbol.width) + '\x1dh' + $(symbol.height) + '\x1dH' + $(symbol.hri ? 2 : 0) + '\x1dk' + $(b, d.length) + d;
            this.buffer += r;
            this.position += h;
        }
        return '';
    }
};

//
// Star Landscape
//
const _star90 = {
    alignment: 0,
    width: 48,
    left: 0,
    position: 0,
    content: '',
    height: 1,
    feed: 24,
    cpl: 48,
    marginRight: 0,
    buffer: '',
    // start printing: ESC @ ESC RS a n (ESC RS R n) ESC RS F n ESC SP n ESC s n1 n2 ESC GS P 0 ESC GS P 2 n
    open: function (printer) {
        this.upsideDown = printer.upsideDown;
        this.spacing = printer.spacing;
        this.cutting = printer.cutting;
        this.gradient = printer.gradient;
        this.gamma = printer.gamma;
        this.threshold = printer.threshold;
        this.alignment = 0;
        this.left = 0;
        this.width = printer.cpl;
        this.position = 0;
        this.content = '';
        this.height = 1;
        this.feed = this.charWidth * (printer.spacing ? 2.5 : 2);
        this.cpl = printer.cpl;
        this.margin = printer.margin;
        this.marginRight = printer.marginRight;
        this.buffer = '';
        return '\x1b@\x1b\x1ea\x00' + (printer.encoding === 'tis620' ? '\x1b\x1eR\x01': '') + '\x1b\x1eF\x00\x1b 0\x1bs00\x1b\x1dP0\x1b\x1dP2' + $(printer.upsideDown ? 3 : 1);
    },
    // finish printing: ESC GS P 3 xL xH yL yH dxL dxH dyL dyH ESC GS P 7 ESC GS ETX s n1 n2
    close: function () {
        const w = this.position;
        const h = this.cpl * this.charWidth;
        const v = (this.margin + this.cpl + this.marginRight) * this.charWidth;
        const m = (this.upsideDown ? this.margin : this.marginRight) * this.charWidth;
        return '\x1b\x1dP3' + $(0, 0, 0, 0, w & 255, w >> 8 & 255, v & 255, v >> 8 & 255) + ' \x1b\x1dP3' + $(0, 0, m & 255, m >> 8 & 255, w & 255, w >> 8 & 255, h & 255, h >> 8 & 255) + this.buffer + '\x1b\x1dP7' + (this.cutting ? this.cut() : '') + '\x1b\x1d\x03\x01\x00\x00';
    },
    // set print area:
    area: function (left, width, right) {
        this.left = left;
        this.width = width;
        return '';
    },
    // set line alignment:
    align: function (align) {
        this.alignment = align;
        return '';
    },
    // set absolute print position: ESC GS A n1 n2
    absolute: function (position) {
        const p = (this.left + position) * this.charWidth;
        this.content += '\x1b\x1dA' + $(p & 255, p >> 8 & 255);
        return '';
    },
    // set relative print position: ESC GS R n1 n2
    relative: function (position) {
        const p = position * this.charWidth;
        this.content += '\x1b\x1dR' + $(p & 255, p >> 8 & 255);
        return '';
    },
    // set line spacing and feed new line:
    vrlf: function (vr) {
        this.feed = this.charWidth * (!vr && this.spacing ? 2.5 : 2);
        return this.lf();
    },
    // underline text: ESC - n
    ul: function () {
        this.content += '\x1b-1';
        return '';
    },
    // emphasize text: ESC E
    em: function () {
        this.content += '\x1bE';
        return '';
    },
    // invert text: ESC 4
    iv: function () {
        this.content += '\x1b4';
        return '';
    },
    // scale up text: ESC i n1 n2
    wh: function (wh) {
        this.height = Math.max(this.height, wh < 3 ? wh : wh - 1);
        this.content += '\x1bi' + (wh < 3 ? $(wh >> 1 & 1, wh & 1) : $(wh - 2, wh - 2));
        return '';
    },
    // cancel text decoration: ESC - n ESC F ESC 5 ESC i n1 n2
    normal: function () {
        this.content += '\x1b-0\x1bF\x1b5\x1bi' + $(0, 0);
        return '';
    },
    // print text:
    text: function (text, encoding) {
        this.content += encoding === 'multilingual' ? this.multiconv(text) : this.codepage[encoding] + iconv.encode(text, encoding).toString('binary');
        return '';
    },
    // feed new line: ESC GS P 4 nL nH ESC GS A n1 n2
    lf: function () {
        const h = this.height * this.charWidth * 2;
        const x = this.left * this.charWidth;
        const y = this.position + h * 20 / 24;
        this.buffer += '\x1b\x1dP4' + $(y & 255, y >> 8 & 255) + '\x1b\x1dA' + $(x & 255, x >> 8 & 255) + this.content;
        this.position += Math.max(h, this.feed);
        this.height = 1;
        this.content = '';
        return '';
    },
    // print image: ESC GS P 4 nL nH ESC GS A n1 n2 ESC k n1 n2 d1 ... dk
    image: function (image) {
        const align = arguments[1] || this.alignment;
        const left = arguments[2] || this.left;
        const width = arguments[3] || this.width;
        const img = PNG.sync.read(Buffer.from(image, 'base64'));
        const w = img.width;
        const h = img.height;
        const x = left * this.charWidth + align * (width * this.charWidth - w) / 2;
        const y = this.position + this.charWidth * 40 / 24;
        const d = Array(w).fill(0);
        const l = w + 7 >> 3;
        let r = '\x1b0' + '\x1b\x1dP4' + $(y & 255, y >> 8 & 255);
        let j = 0;
        for (let y = 0; y < h; y += 24) {
            r += '\x1b\x1dA' + $(x & 255, x >> 8 & 255) + '\x1bk' + $(l & 255, l >> 8 & 255);
            for (let z = 0; z < 24; z++) {
                if (y + z < h) {
                    let i = 0, e = 0;
                    for (let x = 0; x < w; x += 8) {
                        let b = 0;
                        const q = Math.min(w - x, 8);
                        for (let p = 0; p < q; p++) {
                            const f = Math.floor((d[i] + e * 7) / 16 + Math.pow(((img.data[j] * .299 + img.data[j + 1] * .587 + img.data[j + 2] * .114 - 255) * img.data[j + 3] + 65525) / 65525, 1 / this.gamma) * 255);
                            j += 4;
                            if (this.gradient) {
                                d[i] = e * 3;
                                e = f < this.threshold ? (b |= 128 >> p, f) : f - 255;
                                if (i > 0) {
                                    d[i - 1] += e;
                                }
                                d[i++] += e * 5;
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
                else {
                    r += '\x00'.repeat(l);
                }
            }
            r += '\x0a';
        }
        r += (this.spacing ? '\x1bz1' : '\x1b0');
        this.buffer += r;
        this.position += h;
        return '';
    },
    // print QR Code: ESC GS P 4 nL nH ESC GS A n1 n2 ESC k n1 n2 d1 ... dk
    qrcode: function (symbol, encoding) {
        if (typeof qrcode !== 'undefined' && symbol.data.length > 0) {
            const qr = qrcode(0, symbol.level.toUpperCase());
            qr.addData(symbol.data);
            qr.make();
            const img = qr.createASCII(2, 0).split('\n');
            const w = img.length * symbol.cell;
            const h = w;
            const x = this.left * this.charWidth + this.alignment * (this.width * this.charWidth - w) / 2;
            const y = this.position + this.charWidth * 40 / 24;
            const l = w + 7 >> 3;
            let r = '\x1b0' + '\x1b\x1dP4' + $(y & 255, y >> 8 & 255);
            const s = [];
            for (let i = 0; i < img.length; i++) {
                let d = '';
                for (let j = 0; j < w; j += 8) {
                    let b = 0;
                    const q = Math.min(w - j, 8);
                    for (let p = 0; p < q; p++) {
                        if (img[i][Math.floor((j + p) / symbol.cell) * 2] === ' ') {
                            b |= 128 >> p;
                        }
                    }
                    d += $(b);
                }
                for (let k = 0; k < symbol.cell; k++) {
                    s.push(d);
                }
            }
            while (s.length % 24) {
                const d = '\x00'.repeat(l);
                s.push(d);
            }
            for (let k = 0; k < s.length; k += 24) {
                r += '\x1b\x1dA' + $(x & 255, x >> 8 & 255) + '\x1bk' + $(l & 255, l >> 8 & 255) + s.slice(k, k + 24).join('') + '\x0a';
            }
            r += (this.spacing ? '\x1bz1' : '\x1b0');
            this.buffer += r;
            this.position += h;
        }
        return '';
    },
    // print barcode: ESC GS P 4 nL nH ESC GS A n1 n2 ESC b n1 n2 n3 n4 d1 ... dk RS
    barcode: function (symbol, encoding) {
        const bar = receiptline.barcode.generate(symbol);
        if ('length' in bar) {
            let w = bar.length;
            switch (symbol.type) {
                case 'code39':
                    w += symbol.width;
                    break;
                case 'itf':
                    w += bar.widths.reduce((a, c) => (c === 8 ? a + 1 : a), 0);
                    break;
                case 'code128':
                    w += symbol.width * 11;
                    break;
                default:
                    break;
            }
            const x = this.left * this.charWidth + this.alignment * (this.width * this.charWidth - w) / 2;
            const y = this.position + symbol.height;
            const h = y + (symbol.hri ? this.charWidth * 2 + 2 : 0);
            let r = '\x1b\x1dP4' + $(y & 255, y >> 8 & 255) + '\x1b\x1dA' + $(x & 255, x >> 8 & 255);
            let d = iconv.encode(symbol.data, encoding === 'multilingual' ? 'ascii' : encoding).toString('binary');
            const b = this.bartype[symbol.type] - Number(/upc|[ej]an/.test(symbol.type) && symbol.data.length < 9);
            switch (b) {
                case this.bartype.upc - 1:
                    d = this.upce(d);
                    break;
                case this.bartype.code128:
                    d = this.code128(d);
                    break;
                default:
                    break;
            }
            const u = symbol.type === 'itf' ? [ 49, 56, 50 ][symbol.width - 2] : symbol.width + (/^(code39|codabar|nw7)$/.test(symbol.type) ? 50 : 47);
            r += '\x1bb' + $(b, symbol.hri ? 50 : 49, u, symbol.height) + d + '\x1e';
            this.buffer += r;
            this.position += h;
        }
        return '';
    }
};

//
// Star SBCS Landscape
//
const _sbcs90 = {
    // print horizontal rule: ESC GS t n ...
    hr: function (width) {
        this.content += '\x1b\x1dt\x01' + '\xc4'.repeat(width);
        return '';
    },
    // print vertical rules: ESC i n1 n2 ESC GS t n ...
    vr: function (widths, height) {
        this.content += widths.reduce((a, w) => {
            const p = w * this.charWidth;
            return a + '\x1b\x1dR' + $(p & 255, p >> 8 & 255) + '\xb3';
        }, '\x1bi' + $(height - 1, 0) + '\x1b\x1dt\x01\xb3');
        return '';
    },
    // start rules: ESC GS t n ...
    vrstart: function (widths) {
        this.content += '\x1b\x1dt\x01' + widths.reduce((a, w) => a + '\xc4'.repeat(w) + '\xc2', '\xda').slice(0, -1) + '\xbf';
        return '';
    },
    // stop rules: ESC GS t n ...
    vrstop: function (widths) {
        this.content += '\x1b\x1dt\x01' + widths.reduce((a, w) => a + '\xc4'.repeat(w) + '\xc1', '\xc0').slice(0, -1) + '\xd9';
        return '';
    },
    // print vertical and horizontal rules: ESC GS t n ...
    vrhr: function (widths1, widths2, dl, dr) {
        const r1 = ' '.repeat(Math.max(-dl, 0)) + widths1.reduce((a, w) => a + '\xc4'.repeat(w) + '\xc1', '\xc0').slice(0, -1) + '\xd9' + ' '.repeat(Math.max(dr, 0));
        const r2 = ' '.repeat(Math.max(dl, 0)) + widths2.reduce((a, w) => a + '\xc4'.repeat(w) + '\xc2', '\xda').slice(0, -1) + '\xbf' + ' '.repeat(Math.max(-dr, 0));
        this.content += '\x1b\x1dt\x01' + r2.split('').reduce((a, c, i) => a + this.vrtable[c][r1[i]], '');
        return '';
    }
};

//
// Star MBCS Japanese Landscape
//
const _mbcs90 = {
    // print horizontal rule: ESC $ n ...
    hr: function (width) {
        this.content += '\x1b$0' + '\x95'.repeat(width);
        return '';
    },
    // print vertical rules: ESC i n1 n2 ESC $ n ...
    vr: function (widths, height) {
        this.content += widths.reduce((a, w) => {
            const p = w * this.charWidth;
            return a + '\x1b\x1dR' + $(p & 255, p >> 8 & 255) + '\x96';
        }, '\x1bi' + $(height - 1, 0) + '\x1b$0\x96');
        return '';
    },
    // start rules: ESC $ n ...
    vrstart: function (widths) {
        this.content += '\x1b$0' + widths.reduce((a, w) => a + '\x95'.repeat(w) + '\x91', '\x9c').slice(0, -1) + '\x9d';
        return '';
    },
    // stop rules: ESC $ n ...
    vrstop: function (widths) {
        this.content += '\x1b$0' + widths.reduce((a, w) => a + '\x95'.repeat(w) + '\x90', '\x9e').slice(0, -1) + '\x9f';
        return '';
    },
    // print vertical and horizontal rules: ESC $ n ...
    vrhr: function (widths1, widths2, dl, dr) {
        const r1 = ' '.repeat(Math.max(-dl, 0)) + widths1.reduce((a, w) => a + '\x95'.repeat(w) + '\x90', dl > 0 ? '\x9e' : '\x9a').slice(0, -1) + (dr < 0 ? '\x9f' : '\x9b') + ' '.repeat(Math.max(dr, 0));
        const r2 = ' '.repeat(Math.max(dl, 0)) + widths2.reduce((a, w) => a + '\x95'.repeat(w) + '\x91', dl < 0 ? '\x9c' : '\x98').slice(0, -1) + (dr > 0 ? '\x9d' : '\x99') + ' '.repeat(Math.max(-dr, 0));
        this.content += '\x1b$0' + r2.split('').reduce((a, c, i) => a + this.vrtable[c][r1[i]], '');
        return '';
    }
};

//
// Star MBCS Chinese Korean Landscape
//
const _mbcs290 = {
    // print horizontal rule: - ...
    hr: function (width) {
        this.content += '-'.repeat(width);
        return '';
    },
    // print vertical rules: ESC i n1 n2 | ...
    vr: function (widths, height) {
        this.content += widths.reduce((a, w) => {
            const p = w * this.charWidth;
            return a + '\x1b\x1dR' + $(p & 255, p >> 8 & 255) + '|';
        }, '\x1bi' + $(height - 1, 0) + '|');
        return '';
    },
    // start rules: + - ...
    vrstart: function (widths) {
        this.content += widths.reduce((a, w) => a + '-'.repeat(w) + '+', '+');
        return '';
    },
    // stop rules: + - ...
    vrstop: function (widths) {
        this.content += widths.reduce((a, w) => a + '-'.repeat(w) + '+', '+');
        return '';
    },
    // print vertical and horizontal rules: + - ...
    vrhr: function (widths1, widths2, dl, dr) {
        const r1 = ' '.repeat(Math.max(-dl, 0)) + widths1.reduce((a, w) => a + '-'.repeat(w) + '+', '+') + ' '.repeat(Math.max(dr, 0));
        const r2 = ' '.repeat(Math.max(dl, 0)) + widths2.reduce((a, w) => a + '-'.repeat(w) + '+', '+') + ' '.repeat(Math.max(-dr, 0));
        this.content += r2.split('').reduce((a, c, i) => a + this.vrtable[c][r1[i]], '');
        return '';
    }
};

const landscape = {
    escpos: [ _escpos90 ],
    epson: [ _escpos90 ],
    sii: [ _escpos90, _sii90 ],
    citizen: [ _escpos90, _citizen90 ],
    starsbcs: [ _star90, _sbcs90 ],
    starmbcs: [ _star90, _mbcs90 ],
    starmbcs2: [ _star90, _mbcs290 ]
};
