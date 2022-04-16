/*
Copyright 2021 Open Foodservice System Consortium

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
const net = require('net');
const receiptline = require('receiptline');
const puppeteer = require('puppeteer');

// Convert SVG to PNG
const convert = async svg => {
    const w = Number(svg.match(/width="(\d+)px"/)[1]);
    const h = Number(svg.match(/height="(\d+)px"/)[1]);
    const browser = await puppeteer.launch({ defaultViewport: { width: w, height: h }});
    const page = await browser.newPage();
    await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;background:transparent}</style></head><body>${svg}</body></html>`);
    const png = await page.screenshot({ omitBackground: true });
    await browser.close();
    return png;
};

// ReceiptLine
const text = `{image:iVBORw0KGgoAAAANSUhEUgAAAQAAAAA8AgMAAAD004yXAAAACVBMVEVwAJsAAAD///+esS7BAAAAAXRSTlMAQObYZgAAAZtJREFUSMftlkGOwyAMRW0J76kE97GlZu9KcP+rzCekKak6bWdGmrZS6KIG/7yAbQhEe+tN6qUpDZ1KPHT8SnhpeaP6FlA2wicBsgOeBpTF6gDfZHgj9Jt1sAMeAYYE/RFQngYMuX49gD8fMObjkwB+++h+DeB3x/qdvfD/AP4QwPXX+ceAUdV6Y7K/3Vr7rWhv73ZN9XVHzOUdlm6v9ay3pM1eLT+Ppv63BWjz8jJU0vpUWgGs5yfihrN451G+lq7i2bkF8Bagw3Qv0hEQKGTPPjnGxJtZrSIcJy5ciJ3JStbarjrgwOtVK7Z1iLFOOgOSR3WstTqMqCcVFlITDnhhNhMKzJNIA3iEBr1uaAfArA7bSWdAkRrIsJSMrwXbJBowEhogwe9F+NilC8D1oIyg43fA+1WwKpoktXUmsiOCjxFMR+gEBfwcaJ7qDBBWNTVSxKsZZhwkUgkppEiJ1VOIQdCFtAmNBQg9QWj9POQWFW4Bh0HVipRIHlpEUVzUAmslpgQpVcS0SklcrBqf03u/UvVhLd8H5Hffil/ia4Io3warBgAAAABJRU5ErkJggg==}

Ichigaya Terminal
1-Y-X Kudan, Chiyoda-ku
02-07-2021 21:00
{border:line; width:30}
^RECEIPT
{border:space; width:*,2,10}
BEER                   | 2|     13.00
CHIDORI                | 2|    172.80
-------------------------------------
{width:*,20}
^TOTAL             |          ^185.80
CASH               |           200.00
CHANGE             |            14.20
{code:20210207210001; option:48,hri}`;
const svg = receiptline.transform(text, { cpl: 42, encoding: 'multilingual', spacing: true });

// HTML
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt</title>
<style type="text/css">
div {
    float: left;
    padding: 24px;
    box-shadow: 0 6px 12px rgba(0, 0, 0, .5);
    background: linear-gradient(lightblue, white);
    /*background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAADAQMAAACplL1tAAAABlBMVEWQ7pD///+SGxGEAAAAFElEQVQI12M4l/+AYf/mCQyFdwoAJNIF3T0xRTsAAAAASUVORK5CYII=);*/
}
</style>
</head>
<body>
<a href="/print">Print</a>
<hr>
<div>${svg}</div>
</body>
</html>`;

// Printer
const printer = {
    "host": "127.0.0.1",
    "port": 9100,
    "cpl": 42,
    "encoding": "multilingual",
    "spacing": true,
    "command": "escpos"
};

// Server
const server = http.createServer(async (req, res) => {
    switch (req.method) {
        case 'GET':
            const path = new URL(req.url, `http://${req.headers.host}`).pathname;
            if (path === '/') {
                const png = await convert(svg);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(html.replace(/<svg.*\/svg>/, `<img src="data:image/png;base64,${png.toString('base64')}">`));
            }
            else if (path === '/print') {
                const socket = net.connect(printer.port, printer.host, () => {
                    socket.end(receiptline.transform(text, printer), 'binary');
                });
                socket.on('error', err => {
                    console.log(err.message);
                });
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end();
            }
            else {
                res.writeHead(404);
                res.end();
            }
            break;
        default:
            res.writeHead(404);
            res.end();
            break;
    }
});
server.listen(8080, "127.0.0.1", () => {
    console.log('Server running at http://localhost:8080/');
});
