/* eslint-disable simple-import-sort/imports */
import receiptline from './receiptline';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sectionId = 'receiptline.designer';

const initialize = () => {
  const load = document.getElementById('load') as HTMLButtonElement;
  const loaddialog = document.getElementById('loaddialog') as HTMLElement;
  const loadbox = document.getElementById('loadbox') as HTMLElement;
  const loadview = document.getElementById('loadview') as HTMLTextAreaElement;
  const loadfile = document.getElementById('loadfile') as HTMLInputElement;
  const loadok = document.getElementById('loadok') as HTMLButtonElement;
  const loadcancel = document.getElementById('loadcancel') as HTMLInputElement;
  const save = document.getElementById('save') as HTMLButtonElement;
  const savedialog = document.getElementById('savedialog') as HTMLElement;
  const savebox = document.getElementById('savebox') as HTMLElement;
  const savetext = document.getElementById('savetext') as HTMLInputElement;
  const savesvg = document.getElementById('savesvg') as HTMLInputElement;
  const saveok = document.getElementById('saveok') as HTMLButtonElement;
  const savecancel = document.getElementById('savecancel') as HTMLElement;
  const zoom = document.getElementById('zoom') as HTMLInputElement;
  const img = document.getElementById('img') as HTMLButtonElement;
  const imgdialog = document.getElementById('imgdialog') as HTMLElement;
  const imgbox = document.getElementById('imgbox') as HTMLElement;
  const imgfile = document.getElementById('imgfile') as HTMLInputElement;
  const imgok = document.getElementById('imgok') as HTMLButtonElement;
  const imgcancel = document.getElementById('imgcancel') as HTMLElement;
  const imgview = document.getElementById('imgview') as HTMLCanvasElement;
  const bar = document.getElementById('bar') as HTMLButtonElement;
  const bardialog = document.getElementById('bardialog') as HTMLElement;
  const barbox = document.getElementById('barbox') as HTMLElement;
  const bardata = document.getElementById('bardata') as HTMLInputElement;
  const bartype = document.getElementById('bartype') as HTMLSelectElement;
  const barwidth = document.getElementById('barwidth') as HTMLInputElement;
  const barheight = document.getElementById('barheight') as HTMLInputElement;
  const barhri = document.getElementById('barhri') as HTMLInputElement;
  const barok = document.getElementById('barok') as HTMLButtonElement;
  const barcancel = document.getElementById('barcancel') as HTMLElement;
  const qr = document.getElementById('qr') as HTMLElement;
  const qrdialog = document.getElementById('qrdialog') as HTMLElement;
  const qrbox = document.getElementById('qrbox') as HTMLElement;
  const qrdata = document.getElementById('qrdata') as HTMLInputElement;
  const qrtype = document.getElementById('qrtype') as HTMLInputElement;
  const qrcell = document.getElementById('qrcell') as HTMLInputElement;
  const qrlevel = document.getElementById('qrlevel') as HTMLInputElement;
  const qrok = document.getElementById('qrok') as HTMLElement;
  const qrcancel = document.getElementById('qrcancel') as HTMLElement;
  const format = document.getElementById('format') as HTMLElement;
  const formatdialog = document.getElementById('formatdialog') as HTMLElement;
  const formatbox = document.getElementById('formatbox') as HTMLElement;
  const formatwidth = document.getElementById('formatwidth') as HTMLInputElement;
  const formatborder = document.getElementById('formatborder') as HTMLInputElement;
  const formattext = document.getElementById('formattext') as HTMLInputElement;
  const formatalign = document.getElementById('formatalign') as HTMLInputElement;
  const formatok = document.getElementById('formatok') as HTMLElement;
  const formatcancel = document.getElementById('formatcancel') as HTMLElement;
  const col = document.getElementById('col') as HTMLElement;
  const hr = document.getElementById('hr') as HTMLElement;
  const cut = document.getElementById('cut') as HTMLElement;
  const ul = document.getElementById('ul') as HTMLElement;
  const em = document.getElementById('em') as HTMLElement;
  const iv = document.getElementById('iv') as HTMLElement;
  const wh = document.getElementById('wh') as HTMLElement;
  const linewidth = document.getElementById('linewidth') as HTMLInputElement;
  const linespace = document.getElementById('linespace') as HTMLInputElement;
  const dots = document.getElementById('dots') as HTMLElement;
  const cpl = document.getElementById('cpl') as HTMLElement;
  const printerid = document.getElementById('printerid') as HTMLInputElement;
  const send = document.getElementById('send') as HTMLButtonElement;
  const main = document.getElementById('main') as HTMLElement;
  const edit = document.getElementById('edit') as HTMLTextAreaElement;
  const paper = document.getElementById('paper') as HTMLElement;
  const charWidth = 12;

  // register file button event listener
  load.onclick = (event) => {
    // set the position of the dialog box
    loadbox.style.left = `${event.pageX}px`;
    loadbox.style.top = `${event.pageY}px`;
    // open the dialog box
    loaddialog.style.display = 'block';
  };

  // register file preview event listener
  loadfile.onclick = () => {
    loadfile.value = '';
  };
  loadfile.onchange = (event) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const file = event.target?.files[0] as Blob;
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        // preview file
        loadview.value = reader.result as string;
      };
      reader.readAsText(file);
    }
  };

  // register file ok event listener
  loadok.onclick = () => {
    // open file
    edit.value = loadview.value;
    // update receipt
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    edit.oninput();
    // close the dialog box
    loaddialog.style.display = 'none';
  };

  // register file cancel event listener
  loadcancel.onclick = () => {
    loaddialog.style.display = 'none';
  };

  // register save button event listener
  save.onclick = (event) => {
    // set the position of the dialog box
    savebox.style.left = `${event.pageX}px`;
    savebox.style.top = `${event.pageY}px`;
    // open the dialog box
    savedialog.style.display = 'block';
  };

  // register save ok event listener
  saveok.onclick = () => {
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    // save text file
    if (savetext.checked) {
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([bom, edit.value], { type: 'text/plain' }));
      a.download = 'receiptline.txt';
      a.click();
    }
    // save svg file
    if (savesvg.checked) {
      const encoding = receiptline.getLangEncoding(window.navigator.language);
      const printer = {
        cpl: Number(cpl.textContent),
        encoding,
        spacing: linespace.checked,
      };
      const svg = receiptline.transform(edit.value, printer);
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([bom, svg], { type: 'image/svg+xml' }));
      a.download = 'receiptline.svg';
      a.click();
    }
    // close the dialog box
    savedialog.style.display = 'none';
  };

  // register save cancel event listener
  savecancel.onclick = () => (savedialog.style.display = 'none');

  // register zoom slide bar event listener
  zoom.oninput = () => (edit.style.fontSize = `${zoom.value}px`);

  // register image button event listener
  img.onclick = (event) => {
    // set the position of the dialog box
    imgbox.style.left = `${event.pageX}px`;
    imgbox.style.top = `${event.pageY}px`;
    // open the dialog box
    imgdialog.style.display = 'block';
  };

  // register image preview event listener
  let image = '';
  imgfile.onclick = () => {
    imgfile.value = '';
  };
  imgfile.onchange = (event) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const file = event.target?.files[0] as Blob;
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const im = new Image();
        im.onload = () => {
          // preview image
          imgview.width = im.width;
          imgview.height = im.height;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          imgview.getContext('2d').drawImage(im, 0, 0);
        };
        const result = reader.result as string;
        im.src = result;
        image = result.replace(/^data:image\/png;base64,(.*)$/, '$1');
      };
      reader.readAsDataURL(file);
    }
  };

  // register image ok event listener
  imgok.onclick = () => {
    // insert image
    insertText(edit, `{image:${image}}`, true);
    // close the dialog box
    imgdialog.style.display = 'none';
  };

  // register image cancel event listener
  imgcancel.onclick = () => (imgdialog.style.display = 'none');

  // register barcode button event listener
  bar.onclick = (event) => {
    // set the position of the dialog box
    barbox.style.left = `${event.pageX}px`;
    barbox.style.top = `${event.pageY}px`;
    // open the dialog box
    bardialog.style.display = 'block';
  };

  // register barcode ok event listener
  barok.onclick = () => {
    const code = bardata.value.replace(/[\\|{};]/g, '\\$&');
    const options = [bartype.value, barwidth.value, barheight.value, barhri.checked ? 'hri' : 'nohri'];
    // insert barcode
    insertText(edit, `{code:${code}; option:${options.join(',')}}`, true);
    // close the dialog box
    bardialog.style.display = 'none';
  };

  // register barcode cancel event listener
  barcancel.onclick = () => (bardialog.style.display = 'none');

  // register 2D code button event listener
  qr.onclick = (event) => {
    // set the position of the dialog box
    qrbox.style.left = `${event.pageX}px`;
    qrbox.style.top = `${event.pageY}px`;
    // open the dialog box
    qrdialog.style.display = 'block';
  };

  // register 2D code ok event listener
  qrok.onclick = () => {
    const code = qrdata.value.replace(/[\\|{};]/g, '\\$&');
    const options = [qrtype.value, qrcell.value, qrlevel.value];
    // insert 2D code
    insertText(edit, `{code:${code}; option:${options.join(',')}}`, true);
    // close the dialog box
    qrdialog.style.display = 'none';
  };

  // register 2D code cancel event listener
  qrcancel.onclick = () => (qrdialog.style.display = 'none');

  // register formatting button event listener
  format.onclick = (event) => {
    // set the position of the dialog box
    formatbox.style.left = `${event.pageX}px`;
    formatbox.style.top = `${event.pageY}px`;
    // open the dialog box
    formatdialog.style.display = 'block';
  };

  // register formatting ok event listener
  formatok.onclick = () => {
    const property = [];
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
    insertText(edit, `{${property.join(',')}}`, true);
    // close the dialog box
    formatdialog.style.display = 'none';
  };

  // register formatting cancel event listener
  formatcancel.onclick = () => (formatdialog.style.display = 'none');

  // register column button event listener
  col.onclick = () => insertText(edit, '|');

  // register horizontal rule button event listener
  hr.onclick = () => insertText(edit, '-', true);

  // register paper cut button event listener
  cut.onclick = () => insertText(edit, '=', true);

  // register underline button event listener
  ul.onclick = () => insertText(edit, '_');

  // register emphasis button event listener
  em.onclick = () => insertText(edit, '"');

  // register invert button event listener
  iv.onclick = () => insertText(edit, '`');

  // register scale up button event listener
  wh.onclick = () => insertText(edit, '^');

  // register width slidebar event listener
  linewidth.oninput = () => {
    const lineWidthNumber = parseFloat(linewidth.value);
    paper.style.width = `${lineWidthNumber}px`;
    dots.textContent = linewidth.value;
    cpl.textContent = `${lineWidthNumber / charWidth}`;
    // update receipt
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    edit.oninput();
  };

  // register spacing checkbox event listener
  linespace.onchange = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    edit.oninput();
  };

  // register input event listener (immediately invoked)
  (edit.oninput = () => {
    main.lang = window.navigator.language;
    const encoding = receiptline.getLangEncoding(window.navigator.language);
    const printer = {
      cpl: Number(cpl.textContent),
      encoding,
      spacing: linespace.checked,
    };
    const svg = receiptline.transform(edit.value, printer);
    const dom = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
    while (paper.hasChildNodes()) {
      paper.removeChild(paper.firstChild as ChildNode);
    }
    paper.appendChild(dom);
  })();

  // register printer text box event listener
  printerid.oninput = () => {
    if (/^\w+$/.test(printerid.value)) {
      printerid.classList.remove('invalid');
      send.disabled = false;
    } else {
      printerid.classList.add('invalid');
      send.disabled = true;
    }
  };

  // register send button event listener
  send.onclick = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', printerid.value);
    xhr.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');
    xhr.onload = () => alert(`${xhr.status} ${xhr.statusText} ${xhr.responseText}`);
    xhr.onabort = (e) => alert(e.type);
    xhr.onerror = (e) => alert(e.type);
    xhr.ontimeout = (e) => alert(e.type);
    xhr.timeout = 300000;
    xhr.send(edit.value);
  };

  // register before unload event listener
  window.onbeforeunload = (event) => (event.returnValue = '');
};

const insertText = (edit: HTMLTextAreaElement, text: string, lf?: boolean) => {
  // get focus
  edit.focus();
  // get caret
  const p = edit.selectionStart;
  const q = edit.selectionEnd;
  // text before and after the caret
  const r = edit.value.slice(0, p);
  const s = edit.value.slice(q);
  if (lf) {
    // add newline if caret is not at the top of the line
    if (/[^\n]$/.test(r)) {
      text = `\n${text}`;
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
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  edit.oninput();
};

const designer = { initialize, insertText };

export default designer;
