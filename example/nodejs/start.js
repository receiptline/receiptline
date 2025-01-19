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
        let port;
        if ('SerialPort' in serialport) {
            port = new serialport.SerialPort({ path: servers.serial.device, baudRate: 9600, autoOpen: false });
        }
        else {
            port = new serialport(servers.serial.device, { autoOpen: false });
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
    // convert receiptline to receiptline image
    if (printer.asImage && (puppeteer || sharp)) {
        receiptmd = `|{i:${await rasterize(receiptmd, printer, 'base64')}}`;
    }
    // convert receiptline to command
    return receiptline.transform(receiptmd, printer);
};

const rasterize = async (receiptmd, printer, encoding) => {
    // convert receiptline to png
    if (puppeteer) {
        const display = Object.assign({}, printer, { command: 'svg' });
        const svg = receiptline.transform(receiptmd, display);
        const w = Number(svg.match(/width="(\d+)px"/)[1]);
        const h = Number(svg.match(/height="(\d+)px"/)[1]);
        const browser = await puppeteer.launch({ defaultViewport: { width: w, height: h }, headless: 'new' });
        const page = await browser.newPage();
        await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;background:transparent}</style></head><body>${svg}</body></html>`);
        const png = await page.screenshot({ encoding: encoding, omitBackground: true });
        await browser.close();
        return png;
    }
    else if (sharp) {
        const display = Object.assign({}, printer, { command: svgsharp });
        const svg = receiptline.transform(receiptmd, display);
        return (await sharp(Buffer.from(svg)).toFormat('png').toBuffer()).toString(encoding);
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
