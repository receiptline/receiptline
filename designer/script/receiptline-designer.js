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
    const save = document.getElementById('save');
    const savedialog = document.getElementById('savedialog');
    const savebox = document.getElementById('savebox');
    const savetext = document.getElementById('savetext');
    const savesvg = document.getElementById('savesvg');
    const saveok = document.getElementById('saveok');
    const savecancel = document.getElementById('savecancel');
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
    const format = document.getElementById('format');
    const formatdialog = document.getElementById('formatdialog');
    const formatbox = document.getElementById('formatbox');
    const formatwidth = document.getElementById('formatwidth');
    const formatborder = document.getElementById('formatborder');
    const formattext = document.getElementById('formattext');
    const formatalign = document.getElementById('formatalign');
    const formatok = document.getElementById('formatok');
    const formatcancel = document.getElementById('formatcancel');
    const col = document.getElementById('col');
    const hr = document.getElementById('hr');
    const cut = document.getElementById('cut');
    const ul = document.getElementById('ul');
    const em = document.getElementById('em');
    const iv = document.getElementById('iv');
    const wh = document.getElementById('wh');
    const lang = document.getElementById('lang');
    const linewidth = document.getElementById('linewidth');
    const landscape = document.getElementById('landscape');
    const linespace = document.getElementById('linespace');
    const dots = document.getElementById('dots');
    const cpl = document.getElementById('cpl');
    const printerid = document.getElementById('printerid');
    const send = document.getElementById('send');
    const edit = document.getElementById('edit');
    const printarea = document.getElementById('printarea');
    const charWidth = 12;
    const encoding = {
        '-': 'multilingual', 'ja': 'shiftjis', 'zh-Hans': 'gb18030', 'zh-Hant': 'big5', 'ko': 'ksc5601', 'th': 'tis620'
    };

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

    // register save button event listener
    save.onclick = event => {
        // set the position of the dialog box
        savebox.style.left = event.pageX + 'px';
        savebox.style.top = event.pageY + 'px';
        // open the dialog box
        savedialog.style.display = 'block';
    };

    // register save ok event listener
    saveok.onclick = event => {
        const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
        // save text file
        if (savetext.checked) {
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(new Blob([ bom, edit.value ], { type: 'text/plain' }));
            a.download = 'receiptline.receipt';
            a.click();
        }
        // save svg file
        if (savesvg.checked) {
            const printer = {
                cpl: Number(cpl.textContent),
                encoding: encoding[lang.value],
                spacing: linespace.checked
            };
            const svg = receiptline.transform(edit.value, printer);
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(new Blob([ bom, svg ], { type: 'image/svg+xml' }));
            a.download = 'receiptline.svg';
            a.click();
        }
        // close the dialog box
        savedialog.style.display = 'none';
    };

    // register save cancel event listener
    savecancel.onclick = event => savedialog.style.display = 'none';

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
        const code = bardata.value.replace(/[\\|{};]/g, '\\$&');
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
        const code = qrdata.value.replace(/[\\|{};]/g, '\\$&');
        const option = [qrtype.value, qrcell.value, qrlevel.value];
        // insert 2D code
        insertText(edit, `{code:${code}; option:${option}}`, true);
        // close the dialog box
        qrdialog.style.display = 'none';
    };

    // register 2D code cancel event listener
    qrcancel.onclick = event => qrdialog.style.display = 'none';

    // register formatting button event listener
    format.onclick = event => {
        // set the position of the dialog box
        formatbox.style.left = event.pageX + 'px';
        formatbox.style.top = event.pageY + 'px';
        // open the dialog box
        formatdialog.style.display = 'block';
    };

    // register formatting ok event listener
    formatok.onclick = event => {
        let property = [];
        const width = formatwidth.value.replace(/[\\|{};]/g, '\\$&');
        const border = formatborder.value;
        const text = formattext.value;
        const align = formatalign.value;
        if (width.length > 0) {
            property.push(`width:${width}`);
        }
        if (border.length > 0) {
            property.push(`border:${border}`);
        }
        if (text.length > 0) {
            property.push(`text:${text}`);
        }
        if (align.length > 0) {
            property.push(`align:${align}`);
        }
        // insert formatting
        insertText(edit, `{${property.join('; ')}}`, true);
        // close the dialog box
        formatdialog.style.display = 'none';
    };

    // register formatting cancel event listener
    formatcancel.onclick = event => formatdialog.style.display = 'none';

    // register column button event listener
    col.onclick = event => insertText(edit, '|');

    // register horizontal rule button event listener
    hr.onclick = event => insertText(edit, '-', true);

    // register paper cut button event listener
    cut.onclick = event => insertText(edit, '=', true);

    // register underline button event listener
    ul.onclick = event => insertText(edit, '_');

    // register emphasis button event listener
    em.onclick = event => insertText(edit, '"');

    // register invert button event listener
    iv.onclick = event => insertText(edit, '`');

    // register scale up button event listener
    wh.onclick = event => insertText(edit, '^');

    // register language selectbox event listener
    lang.onchange = event => edit.oninput();

    // register width slidebar event listener
    linewidth.oninput = event => {
        if (landscape.checked) {
            printarea.style.width = '576px';
            printarea.style.height = linewidth.value + 'px';
        }
        else {
            printarea.style.width = linewidth.value + 'px';
            printarea.style.height = 'auto';
        }
        dots.textContent = linewidth.value;
        cpl.textContent = linewidth.value / charWidth;
        // update receipt
        edit.oninput();
    };

    // register landscape checkbox event listener
    landscape.onchange = event => {
        if (landscape.checked) {
            linewidth.min = 576;
            linewidth.max = 1152;
        }
        else {
            linewidth.min = 288;
            linewidth.max = 576;
        }
        // update width slidebar
        linewidth.value = 576;
        linewidth.oninput();
    };

    // register spacing checkbox event listener
    linespace.onchange = event => edit.oninput();

    // register input event listener
    edit.oninput = event => {
        const printer = {
            cpl: Number(cpl.textContent),
            encoding: encoding[lang.value],
            spacing: linespace.checked
        };
        const svg = receiptline.transform(edit.value, printer);
        const dom = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
        if (landscape.checked) {
            dom.style.transformOrigin = 'top left';
            dom.style.transform = `rotate(-90deg) translateX(-${linewidth.value}px)`;
        }
        while (printarea.hasChildNodes()) {
            printarea.removeChild(printarea.firstChild);
        }
        printarea.appendChild(dom);
    };

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

    // query string of URL
    const params = new URLSearchParams(window.location.search);
    // zoom
    const z = params.get('z');
    if (/^-?[0-5]$/.test(z)) {
        zoom.value = Number(z) * 2 + 20;
        zoom.oninput();
    }
    // language
    const l = params.has('l') ? params.get('l') : window.navigator.language;
    switch (l.slice(0, 2)) {
        case 'ja':
            lang.value = 'ja';
            break;
        case 'zh':
            lang.value = /^zh-(tw|hk|mo|hant)/i.test(l) ? 'zh-Hant' : 'zh-Hans';
            break;
        case 'ko':
            lang.value = 'ko';
            break;
        case 'th':
            lang.value = 'th';
            break;
        default:
            lang.value = '-';
            break;
    }
    // linespace
    if (params.get('s') === '1') {
        linespace.checked = true;
    }
    // landscape
    if (params.get('v') === '1') {
        landscape.checked = true;
        linewidth.min = 576;
        linewidth.max = 1152;
    }
    // linewidth
    const c = params.get('c');
    if (/^(2[4-9]|[3-8]\d|9[0-6])$/.test(c)) {
        linewidth.value = Number(c) * 12;
    }
    // printerid
    if (params.has('p')) {
        printerid.value = params.get('p');
        printerid.oninput();
    }
    // data
    if (params.has('d')) {
        edit.value = params.get('d');
    }
    // initialize receipt
    linewidth.oninput();
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
