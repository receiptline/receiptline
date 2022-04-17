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

const receiptline = require('receiptline');
const express = require('express');
const app = express();

const printer = {
    cpl: 48,
    encoding: 'multilingual',
    upsideDown: true,
    spacing: true,
    command: 'escpos'
};

const order = () => `{width:*}
^^^Online Order
${new Date().toLocaleString('en')}
{width:4,*}
---
|^^^2|^^Hamburger
|    |Tomato, Onion, Meat sauce, Mayonnaise
|    |\`"~Mustard~
|^^^2|^^Clam chowder
|    |Oyster cracker
---
{code:1234567890; option:code128,2,72,hri}`;

let data = order();
setInterval(() => data = order(), 30000);

let jobid = 1;

app.use(express.urlencoded({ extended: true }));
app.post('/sdp', (req, res) => {
    switch (req.body.ConnectionType) {
        case 'GetRequest':
            if (data.length > 0) {
                const command = receiptline.transform(data, printer);
                // remove ESC @ (initialize printer) GS a 0 (disable automatic status back)
                const hex = Buffer.from(command, 'binary').toString('hex', 5);
                const xml = `<?xml version="1.0" encoding="utf-8"?>
                <PrintRequestInfo Version="2.00">
                    <ePOSPrint>
                        <Parameter>
                            <devid>local_printer</devid>
                            <timeout>60000</timeout>
                            <printjobid>${jobid++}</printjobid>
                        </Parameter>
                        <PrintData>
                            <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
                                <command>${hex}</command>
                            </epos-print>
                        </PrintData>
                    </ePOSPrint>
                </PrintRequestInfo>`;
                res.status(200).type('text/xml; charset=utf-8').send(xml);
                data = '';
            } else {
                res.end();
            }
            break;
        case 'SetResponse':
            console.log(req.body.ResponseFile);
            res.end();
            break;
        default:
            res.end();
            break;
    }
});
app.listen(8080, () => {
    // enable Server Direct Print and set the URL to "http://server-ip-address:8080/sdp"
    console.log('Server running at http://localhost:8080/');
});
