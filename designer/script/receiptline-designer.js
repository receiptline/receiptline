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

function initialize() {
    const load = document.getElementById('load');
    const loaddialog = document.getElementById('loaddialog');
    const loadbox = document.getElementById('loadbox');
    const loadfile = document.getElementById('loadfile');
    const loadok = document.getElementById('loadok');
    const loadcancel = document.getElementById('loadcancel');
    const zoom = document.getElementById('zoom');
    const img = document.getElementById('img');
    const imgdialog = document.getElementById('imgdialog');
    const imgbox = document.getElementById('imgbox');
    const imgfile = document.getElementById('imgfile');
    const imgok = document.getElementById('imgok');
    const imgcancel = document.getElementById('imgcancel');
    const bar = document.getElementById('bar');
    const bardialog = document.getElementById('bardialog');
    const barbox = document.getElementById('barbox');
    const bardata = document.getElementById('bardata');
    const bartype = document.getElementById('bartype');
    const barwidth = document.getElementById('barwidth');
    const barheight = document.getElementById('barheight');
    const barhri = document.getElementById('barhri');    
    const barok = document.getElementById('barok');
    const barcancel = document.getElementById('barcancel');
    const qr = document.getElementById('qr');
    const qrdialog = document.getElementById('qrdialog');
    const qrbox = document.getElementById('qrbox');
    const qrdata = document.getElementById('qrdata');
    const qrtype = document.getElementById('qrtype');
    const qrcell = document.getElementById('qrcell');
    const qrlevel = document.getElementById('qrlevel');
    const qrok = document.getElementById('qrok');
    const qrcancel = document.getElementById('qrcancel');
    const hr = document.getElementById('hr');
    const cut = document.getElementById('cut');
    const ul = document.getElementById('ul');
    const em = document.getElementById('em');
    const rv = document.getElementById('rv');
    const wh = document.getElementById('wh');
    const linewidth = document.getElementById('linewidth');
    const dots = document.getElementById('dots');
    const cpl = document.getElementById('cpl');
    const printerid = document.getElementById('printerid');
    const send = document.getElementById('send');
    const edit = document.getElementById('edit');
    const paper = document.getElementById('paper');
    const charWidth = 12;

    // register file button event listener
    load.onclick = event => {
        // set the position of the dialog box
        loadbox.style.left = event.pageX + 'px';
        loadbox.style.top = event.pageY + 'px';
        // open the dialog box
        loaddialog.style.display = 'block';
    };

    // register file preview event listener
    loadfile.onclick = event => loadfile.value = '';
    loadfile.onchange = event => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = event => {
                // preview file
                loadview.value = reader.result;
            }
            reader.readAsText(file);
        }
    };

    // register file ok event listener
    loadok.onclick = event => {
        // open file
        edit.value = loadview.value;
        // update receipt
        edit.oninput();
        // close the dialog box
        loaddialog.style.display = 'none';
    };

    // register file cancel event listener
    loadcancel.onclick = event => loaddialog.style.display = 'none';

    // register zoom slide bar event listener
    zoom.oninput = event => edit.style.fontSize = zoom.value + 'px';

    // register image button event listener
    img.onclick = event => {
        // set the position of the dialog box
        imgbox.style.left = event.pageX + 'px';
        imgbox.style.top = event.pageY + 'px';
        // open the dialog box
        imgdialog.style.display = 'block';
    };

    // register image preview event listener
    let image = '';
    imgfile.onclick = event => imgfile.value = '';
    imgfile.onchange = event => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = event => {
                const im = new Image();
                im.onload = event => {
                    // preview image
                    imgview.width = im.width;
                    imgview.height = im.height;
                    imgview.getContext('2d').drawImage(im, 0, 0);
                };
                im.src = reader.result;
                image = reader.result.replace(/^data:image\/png;base64,(.*)$/, '$1');
            };
            reader.readAsDataURL(file);
        }
    };

    // register image ok event listener
    imgok.onclick = event => {
        // insert image
        insertText(edit, `{image:${image}}`, true);
        // close the dialog box
        imgdialog.style.display = 'none';
    };

    // register image cancel event listener
    imgcancel.onclick = event => imgdialog.style.display = 'none';

    // register barcode button event listener
    bar.onclick = event => {
        // set the position of the dialog box
        barbox.style.left = event.pageX + 'px';
        barbox.style.top = event.pageY + 'px';
        // open the dialog box
        bardialog.style.display = 'block';
    };

    // register barcode ok event listener
    barok.onclick = event => {
        const code = bardata.value.replace(/[\\{};]/g, '\\$&');
        const option = [bartype.value, barwidth.value, barheight.value, barhri.checked ? 'hri' : 'nohri'];
        // insert barcode
        insertText(edit, `{code:${code}; option:${option}}`, true);
        // close the dialog box
        bardialog.style.display = 'none';
    };

    // register barcode cancel event listener
    barcancel.onclick = event => bardialog.style.display = 'none';

    // register 2D code button event listener
    qr.onclick = event => {
        // set the position of the dialog box
        qrbox.style.left = event.pageX + 'px';
        qrbox.style.top = event.pageY + 'px';
        // open the dialog box
        qrdialog.style.display = 'block';
    };

    // register 2D code ok event listener
    qrok.onclick = event => {
        const code = qrdata.value.replace(/[\\{};]/g, '\\$&');
        const option = [qrtype.value, qrcell.value, qrlevel.value];
        // insert 2D code
        insertText(edit, `{code:${code}; option:${option}}`, true);
        // close the dialog box
        qrdialog.style.display = 'none';
    };

    // register 2D code cancel event listener
    qrcancel.onclick = event => qrdialog.style.display = 'none';

    // register horizontal rule button event listener
    hr.onclick = event => insertText(edit, '-', true);

    // register paper cut button event listener
    cut.onclick = event => insertText(edit, '=', true);

    // register underline button event listener
    ul.onclick = event => insertText(edit, '_');

    // register emphasis button event listener
    em.onclick = event => insertText(edit, '"');

    // register invert button event listener
    rv.onclick = event => insertText(edit, '`');

    // register scale up button event listener
    wh.onclick = event => insertText(edit, '^');

    // register width slidebar event listener
    linewidth.oninput = event => {
        paper.style.width = linewidth.value + 'px';
        dots.textContent = linewidth.value;
        cpl.textContent = linewidth.value / charWidth;
        // update receipt
        edit.oninput();
    };

    // register input event listener (immediately invoked)
    (edit.oninput = event => {
        const printer = {
            cpl: Number(cpl.textContent),
            encoding: /^ja/.test(window.navigator.language) ? 'cp932' : 'cp437'
        };
        const svg = receiptline.transform(edit.value, printer);
        const dom = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
        while (paper.hasChildNodes()) {
            paper.removeChild(paper.firstChild);
        }
        paper.appendChild(dom);
    })();

    // register printer text box event listener
    printerid.oninput = event => {
        if (/^\w+$/.test(printerid.value)) {
            printerid.classList.remove('invalid');
            send.disabled = false;
        }
        else {
            printerid.classList.add('invalid');
            send.disabled = true;
        }
    };

    // register send button event listener
    send.onclick = event => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", printerid.value);
        xhr.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
        xhr.onload = e => alert(`${xhr.status} ${xhr.statusText} ${xhr.responseText}`);
        xhr.onabort = e => alert(e.type);
        xhr.onerror = e => alert(e.type);
        xhr.ontimeout = e => alert(e.type);
        xhr.timeout = 300000;
        xhr.send(edit.value);
    };

    // reduce railroad diagram to 75%
    document.querySelectorAll('figure img').forEach(el => el.width *= .75);

    // register before unload event listener
    window.onbeforeunload = event => event.returnValue = '';
}

function insertText(edit, text, lf) {
    // get focus
    edit.focus();
    // get caret
    const p = edit.selectionStart;
    const q = edit.selectionEnd;
    // text before and after the caret
    let r = edit.value.slice(0, p);
    let s = edit.value.slice(q);
    if (lf) {
        // add newline if caret is not at the top of the line
        if (/[^\n]$/.test(r)) {
            text = '\n' + text;
        }
        // add newline if caret is not at the end of the line
        if (/^[^\n]/.test(s)) {
            text += '\n';
        }
    }
    // insert text at caret
    edit.value = r + text + s;
    // set caret
    edit.selectionStart = edit.selectionEnd = p + text.length;
    // update receipt
    edit.oninput();
}
