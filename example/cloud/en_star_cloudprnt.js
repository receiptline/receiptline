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
    command: 'starsbcs'
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

app.post('/cloudprnt', (req, res) => {
    if (data.length > 0) {
        res.json({ jobReady: true, mediaTypes: [ 'application/vnd.star.starprnt' ], jobToken: `${jobid++}` });
    } else {
        res.json({ jobReady: false });
    }
})
app.get('/cloudprnt', (req, res) => {
    if (data.length > 0) {
        const command = receiptline.transform(data, printer);
        // remove ESC @ (command initialization) ESC GS a 0 (disable status transmission)
        const bin = Buffer.from(command.slice(6), 'binary');
        res.status(200).type('application/vnd.star.starprnt').send(bin);
        data = '';
    } else {
        res.status(404).end();
    }
});
app.delete('/cloudprnt', (req, res) => {
    console.log(req.query);
    res.end();
});
app.listen(8080, () => {
    // enable CloudPRNT and set the URL to "http://server-ip-address:8080/cloudprnt"
    console.log('Server running at http://localhost:8080/');
});
