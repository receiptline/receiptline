// @ts-nocheck

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

import { Transform } from 'stream';
import { StringDecoder } from 'string_decoder';

type Encoding =
  | 'cp437'
  | 'cp852'
  | 'cp858'
  | 'cp860'
  | 'cp863'
  | 'cp865'
  | 'cp866'
  | 'cp1252'
  | 'cp932'
  | 'cp936'
  | 'cp949'
  | 'cp950'
  | 'multilingual'
  | 'shiftjis'
  | 'gb18030'
  | 'ksc5601'
  | 'big5';

interface Printer {
  cpl?: number;
  encoding?: Encoding;
  upsideDown?: boolean;
  spacing?: boolean;
  cutting?: boolean;
  gradient?: boolean;
  gamma?: number;
  threshold?: number;
  command?: keyof Commands | BaseCommand;
}

interface QRCode {
  data: string;
  type: string;
  cell: string;
  level: string;
}
interface Barcode {
  data: string;
  type: string;
  width: number;
  height: number;
  hri: boolean;
}
interface BarcodeModule {
  module: string;
  length: number;
  hri: string;
}

interface BaseCommand {
  charWidth: number;
  measureText(text: string, encoding: Encoding): number;
  open(printer: Printer): string;
  close(): string;
  area(left: number, width: number, right: number): string;
  align(align: number): string;
  absolute(position: number): string;
  relative(position: number): string;
  hr(width: number): string;
  vr(widths: number[], height: number): string;
  vrstart(widths: number[]): string;
  vrstop(widths: number[]): string;
  vrhr(widths1: number[], widths2: number[], d1: number, dr: number): string;
  vrlf(vr: boolean): string;
  cut(): string;
  ul(): string;
  em(): string;
  iv(): string;
  wh(wh: number): string;
  normal(): string;
  text(test: string, encoding: Encoding): string;
  lf(): string;
  command(command: string): string;
  image(image: string, align: number, left: number, width: number, right: number): string;
  qrcode(symbol: QRCode, encoding: Encoding): string;
  barcode(symbol: Barcode, encoding: Encoding): string;
}

interface SVGCommand extends BaseCommand {
  svgWidth: number;
  svgHeight: number;
  svgContent: string;
  lineMargin: number;
  lineAlign: number;
  lineWidth: number;
  lineHeight: number;
  textElement: string;
  textAttributes: Record<string, string>;
  textPosition: number;
  textScale: number;
  textEncoding: Encoding;
  feedMinimum: number;
  spacing: boolean;
  c128: {
    element: string[];
    starta: number;
    startb: number;
    startc: number;
    atob: number;
    atoc: number;
    btoa: number;
    btoc: number;
    ctoa: number;
    ctob: number;
    shift: number;
    stop: number;
  };
  code128(data: string): BarcodeModule;
  code128a(start: number, data: string, digits: number[]): void;
  code128b(start: number, data: string, digits: number[]): void;
  code128c(start: number, data: string, digits: number[]): void;
  c93: {
    escape: string[];
    code: Record<string, number>;
    element: string[];
    start: number;
    stop: number;
  };
  code93(data: string): BarcodeModule;
  nw7: Record<string, string>;
  codabar(data: string): BarcodeModule;
  i25: {
    element: string[];
    start: string;
    stop: string;
  };
  itf(data: string): BarcodeModule;
  c39: Record<string, string>;
  code39(data: string): BarcodeModule;
  ean: Record<string, string[]>;
  upca(data: string): BarcodeModule;
  upce(data: string): BarcodeModule;
  upcetoa(data: string): BarcodeModule;
  ean13(data: string): BarcodeModule;
  ean8(data: string): BarcodeModule;
}

interface GenericCommand extends BaseCommand {
  upsideDown: boolean;
  spacing: boolean;
  cutting: boolean;
  gradient: boolean;
  gamma: number;
  threshold: number;
}

interface PrinterCommand extends GenericCommand {
  codepage: Record<keyof Encoding, string>;
  multiconv(text: string): string;
  vrtable: Record<string, Record<string, string>>;
}

interface ThermalCommand extends PrinterCommand {
  split: number;
  qrlevel: {
    1: number;
    m: number;
    q: number;
    h: number;
  };
  bartype: {
    upc: number;
    ean: number;
    jan: number;
    code39: number;
    itf: number;
    codabar: number;
    nw7: number;
    code93: number;
    code128: number;
  };
  upce(data: string): string;
  c128: {
    special: number;
    codea: number;
    codeb: number;
    codec: number;
    shift: number;
  };
  code128(data: string): string;
  code128a(start: number, data: string, digits: number[]): void;
  code128b(start: number, data: string, digits: number[]): void;
  code128c(start: number, data: string, digits: number[]): void;
}

interface SIICommand extends Omit<ThermalCommand, 'c128'> {
  codabar(data: string): string;
  c93: {
    escape: string[];
    code: Record<string, number>;
    start: number;
    stop: number;
  };
  code93(data: string): string;
  c128: {
    starta: number;
    startb: number;
    startc: number;
    atob: number;
    atoc: number;
    btoa: number;
    btoc: number;
    ctoa: number;
    ctob: number;
    shift: number;
    stop: number;
  };
}

interface ImpactCommand extends PrinterCommand {
  font: number;
  style: number;
  color: number;
  margin: number;
  position: number;
  red: { data: string; index: number; length: number }[];
  black: { data: string; index: number; length: number }[];
}

interface StarCommand extends PrinterCommand {
  split: number;
  qrlevel: {
    1: number;
    m: number;
    q: number;
    h: number;
  };
  bartype: {
    upc: number;
    ean: number;
    jan: number;
    code39: number;
    itf: number;
    codabar: number;
    nw7: number;
    code93: number;
    code128: number;
  };
  upce(data: string): string;
  code128(data: string): string;
}

interface Commands {
  base: BaseCommand;
  svg: SVGCommand;
  escpos: ThermalCommand;
  sii: SIICommand;
  citizen: ThermalCommand;
  fit: ThermalCommand;
  impact: ImpactCommand;
  impactb: ImpactCommand;
  starsbcs: StarCommand;
  starmbcs: StarCommand;
  starmbcs2: StarCommand;
  starlinesbcs: StarCommand;
  starlinembcs: StarCommand;
  starlinembcs2: StarCommand;
  emustarlinesbcs: StarCommand;
  emustarlinembcs: StarCommand;
  emustarlinembcs2: StarCommand;
  stargraphic: GenericCommand;
}

declare global {
  interface Window {
    qrcode: unknown;
  }
}

// // not needed for browser
// // import { Transform } from 'node:stream';
// // function createTransform(printer: Printer): Transform;

let iconv: { encode: (arg0: any, arg1: any) => { (): any; new(): any; toString: { (arg0: string): string | any[]; new(): any; }; }; } | undefined;
let PNG: { sync: { read: (arg0: Buffer) => any; }; } | undefined;
let stream: { transform: Transform } | undefined;
let decoder: { StringDecoder: StringDecoder } | undefined;
let qrcode = require('./qrcode-generator/qrcode.js');

// TODO: resolve isomorphic issues
// // // Node.js
// if (typeof require !== 'undefined') {
//   iconv = require('iconv-lite');
//   PNG = require('pngjs').PNG;
//   stream = require('stream');
//   decoder = require('string_decoder');
// }

const getLangEncoding = (lang: typeof window.navigator.language): Encoding => {
  let encoding: Encoding = 'cp437';
  switch (lang.slice(0, 2)) {
    case 'ja':
      encoding = 'cp932';
      break;
    case 'zh':
      encoding = /^zh-(tw|hk)/i.test(lang) ? 'cp950' : 'cp936';
      break;
    case 'ko':
      encoding = 'cp949';
      break;
  }
  return encoding;
};

/**
 * Function - transform
 * Transform ReceiptLine document to printer commands or SVG images.
 * @param {string} doc ReceiptLine document
 * @param {object} printer printer configuration
 * @returns {string} printer command or SVG image
 */
function transform(doc: string, printer: Printer): string {
  // web browser
  qrcode = qrcode || window.qrcode;
  // initialize state variables
  const state = {
    wrap: true,
    border: 1,
    width: [],
    align: 1,
    option: {
      type: 'code128', width: 2, height: 72, hri: false, cell: 3, level: 'l',
    },
    line: 'waiting',
    rules: {
      left: 0, width: 0, right: 0, widths: [],
    },
  };
    // validate printer configuration
  const ptr = parseOption(printer);
  // append commands to start printing
  let result = ptr.command.open(ptr);
  // strip bom
  if (doc[0] === '\ufeff') {
    doc = doc.slice(1);
  }
  // parse each line and generate commands
  const res = doc.normalize().split(/\n|\r\n|\r/).map((line) => createLine(parseLine(line, state), ptr, state));
  // if rules is not finished
  switch (state.line) {
    case 'ready':
      // set state to cancel rules
      state.line = 'waiting';
      break;
    case 'running':
    case 'horizontal':
      // append commands to stop rules
      res.push(ptr.command.normal()
                + ptr.command.area(state.rules.left, state.rules.width, state.rules.right)
                + ptr.command.align(0)
                + ptr.command.vrstop(state.rules.widths)
                + ptr.command.vrlf(false));
      state.line = 'waiting';
      break;
    default:
      break;
  }
  // flip upside down
  if (ptr.upsideDown) {
    res.reverse();
  }
  // append commands
  result += res.join('');
  // append commands to end printing
  result += ptr.command.close();
  return result;
}

/**
 * Function - createTransform
 * Create transform stream that converts ReceiptLine document to printer commands or SVG images.
 * @param {object} printer printer configuration
 * @returns {stream.Transform} transform stream
 */
function createTransform(printer: Printer) {
  // initialize state variables
  const state = {
    wrap: true,
    border: 1,
    width: [],
    align: 1,
    option: {
      type: 'code128', width: 2, height: 72, hri: false, cell: 3, level: 'l',
    },
    line: 'waiting',
    rules: {
      left: 0, width: 0, right: 0, widths: [],
    },
  };
    // validate printer configuration
  const ptr = parseOption(printer);
  // create transform stream
  const transform = new stream.Transform({
    construct(callback) {
      // initialize
      this.bom = true;
      this.decoder = new decoder.StringDecoder('utf8');
      this.data = '';
      this.encoding = null;
      this._push = function (chunk) {
        if (chunk.length > 0) {
          if (!this.encoding) {
            this.encoding = /^<svg/.test(chunk) ? 'utf8' : 'binary';
          }
          this.push(chunk, this.encoding);
        }
      };
      this.buffer = [];
      // append commands to start printing
      this._push(ptr.command.open(ptr));
      callback();
    },
    transform(chunk, encoding, callback) {
      // append chunk
      this.data += this.decoder.write(chunk);
      // strip bom
      if (this.bom) {
        if (this.data[0] === '\ufeff') {
          this.data = this.data.slice(1);
        }
        this.bom = false;
      }
      // parse each line and generate commands
      const lines = this.data.split(/\n|\r\n|\r/);
      while (lines.length > 1) {
        const s = createLine(parseLine(lines.shift().normalize(), state), ptr, state);
        ptr.upsideDown ? this.buffer.push(s) : this._push(s);
      }
      this.data = lines.shift();
      callback();
    },
    flush(callback) {
      // parse last line and generate commands
      const s = createLine(parseLine(this.data.normalize(), state), ptr, state);
      ptr.upsideDown ? this.buffer.push(s) : this._push(s);
      // if rules is not finished
      switch (state.line) {
        case 'ready':
          // set state to cancel rules
          state.line = 'waiting';
          break;
        case 'running':
        case 'horizontal':
          // append commands to stop rules
          const s = ptr.command.normal()
                        + ptr.command.area(state.rules.left, state.rules.width, state.rules.right)
                        + ptr.command.align(0)
                        + ptr.command.vrstop(state.rules.widths)
                        + ptr.command.vrlf(false);
          ptr.upsideDown ? this.buffer.push(s) : this._push(s);
          state.line = 'waiting';
          break;
        default:
          break;
      }
      // flip upside down
      if (ptr.upsideDown) {
        this._push(this.buffer.reverse().join(''));
      }
      // append commands to end printing
      this._push(ptr.command.close());
      callback();
    },
  });
  return transform;
}

/**
 * Function - parseOption
 * Validate printer configuration.
 * @param {object} printer printer configuration
 * @returns {object} validated printer configuration
 */
function parseOption(printer: Printer) {
  // validate printer configuration
  const p = { ...printer };

  return {
    cpl: p.cpl || 48,
    // @ts-ignore
    encoding: /^(cp(437|85[28]|86[0356]|1252|93[26]|949|950)|multilingual|shiftjis|gb18030|ksc5601|big5)$/.test(p.encoding) ? p.encoding : 'cp437',
    upsideDown: !!p.upsideDown,
    spacing: !!p.spacing,
    cutting: 'cutting' in p ? !!p.cutting : true,
    gradient: 'gradient' in p ? !!p.gradient : true,
    gamma: p.gamma || 1.8,
    threshold: p.threshold || 128,
    // @ts-ignore
    command: { ...(typeof p.command !== 'object' ? commands[p.command] : p.command) || commands.svg },
  };
}

/**
 * Function - parseLine
 * Parse lines
 * @param {string} columns line text without line breaks
 * @param {object} state state variables
 * @returns {object} parsed line object
 */
function parseLine(columns: string, state: { wrap: any; border: any; width: any; align: any; option: any; line?: string; rules?: { left: number; width: number; right: number; widths: never[]; } | { left: number; width: number; right: number; widths: never[]; }; }) {
  // extract columns
  const line = columns
  // trim whitespace
    .replace(/^[\t ]+|[\t ]+$/g, '')
  // convert escape characters ('\\', '\{', '\|', '\}') to hexadecimal escape characters
    .replace(/\\[\\{|}]/g, (match) => `\\x${match.charCodeAt(1).toString(16)}`)
  // append a space if the first column does not start with '|' and is right-aligned
    .replace(/^[^|]*[^\t |]\|/, ' $&')
  // append a space if the last column does not end with '|' and is left-aligned
    .replace(/\|[^\t |][^|]*$/, '$& ')
  // remove '|' at the beginning of the first column
    .replace(/^\|(.*)$/, '$1')
  // remove '|' at the end of the last column
    .replace(/^(.*)\|$/, '$1')
  // separate text with '|'
    .split('|')
  // parse columns
    .map((column, index, array) => {
      // parsed column object
      const result = {} as BaseCommand;
      // trim whitespace
      const element = column.replace(/^[\t ]+|[\t ]+$/g, '');
      // determin alignment from whitespaces around column text
      result.align = 1 + /^[\t ]/.test(column) - /[\t ]$/.test(column);
      // parse properties
      if (/^\{[^{}]*\}$/.test(element)) {
        // extract members
        result.property = element
        // trim property delimiters
          .slice(1, -1)
        // convert escape character ('\;') to hexadecimal escape characters
          .replace(/\\;/g, '\\x3b')
        // separate property with ';'
          .split(';')
        // parse members
          .reduce((obj, member) => {
            // abbreviations
            const abbr = {
              a: 'align', b: 'border', c: 'code', i: 'image', o: 'option', t: 'text', w: 'width', x: 'command', _: 'comment',
            };
            // parse key-value pair
            if (!/^[\t ]*$/.test(member)
                            && member.replace(
                              /^[\t ]*([A-Za-z_]\w*)[\t ]*:[\t ]*([^\t ].*?)[\t ]*$/,
                              (match, key, value) => obj[key.replace(/^[abciotwx_]$/, (m) => abbr[m])] = parseEscape(value.replace(/\\n/g, '\n')),
                            ) === member) {
              // invalid members
              result.error = element;
            }
            return obj;
          }, {});
        // if the column is single
        if (array.length === 1) {
          // parse text property
          if ('text' in result.property) {
            const c = result.property.text.toLowerCase();
            state.wrap = !/^nowrap$/.test(c);
          }
          // parse border property
          if ('border' in result.property) {
            const c = result.property.border.toLowerCase();
            const border = { line: -1, space: 1, none: 0 };
            const previous = state.border;
            state.border = /^(line|space|none)$/.test(c) ? border[c.toLowerCase()] : /^\d+$/.test(c) && Number(c) <= 2 ? Number(c) : 1;
            // start rules
            if (previous >= 0 && state.border < 0) {
              result.vr = '+';
            }
            // stop rules
            if (previous < 0 && state.border >= 0) {
              result.vr = '-';
            }
          }
          // parse width property
          if ('width' in result.property) {
            const width = result.property.width.toLowerCase().split(/[\t ]+|,/);
            state.width = width.find((c) => /^auto$/.test(c)) ? [] : width.map((c) => (/^\*$/.test(c) ? -1 : /^\d+$/.test(c) ? Number(c) : 0));
          }
          // parse align property
          if ('align' in result.property) {
            const c = result.property.align.toLowerCase();
            const align = { left: 0, center: 1, right: 2 };
            state.align = /^(left|center|right)$/.test(c) ? align[c.toLowerCase()] : 1;
          }
          // parse option property
          if ('option' in result.property) {
            const option = result.property.option.toLowerCase().split(/[\t ]+|,/);
            state.option = {
              type: (option.find((c) => /^(upc|ean|jan|code39|itf|codabar|nw7|code93|code128|qrcode)$/.test(c)) || 'code128'),
              width: Number(option.find((c) => /^\d+$/.test(c) && Number(c) >= 2 && Number(c) <= 4) || '2'),
              height: Number(option.find((c) => /^\d+$/.test(c) && Number(c) >= 24 && Number(c) <= 240) || '72'),
              hri: !!option.find((c) => /^hri$/.test(c)),
              cell: Number(option.find((c) => /^\d+$/.test(c) && Number(c) >= 3 && Number(c) <= 8) || '3'),
              level: (option.find((c) => /^[lmqh]$/.test(c)) || 'l'),
            };
          }
          // parse code property
          if ('code' in result.property) {
            result.code = { data: result.property.code, ...state.option };
          }
          // parse image property
          if ('image' in result.property) {
            result.image = result.property.image;
          }
          // parse command property
          if ('command' in result.property) {
            result.command = result.property.command;
          }
          // parse comment property
          if ('comment' in result.property) {
            result.comment = result.property.comment;
          }
        }
      }
      // remove invalid property delimiter
      else if (/[{}]/.test(element)) {
        result.error = element;
      }
      // parse horizontal rule of special character in text
      else if (array.length === 1 && /^-+$|^=+$/.test(element)) {
        result.hr = element.slice(-1);
      }
      // parse text
      else {
        result.text = element
        // remove control codes and hexadecimal control codes
          .replace(/[\x00-\x1f\x7f]|\\x[01][\dA-Fa-f]|\\x7[Ff]/g, '')
        // convert escape characters ('\-', '\=', '\_', '\"', \`', '\^', '\~') to hexadecimal escape characters
          .replace(/\\[-=_"`^~]/g, (match) => `\\x${match.charCodeAt(1).toString(16)}`)
        // convert escape character ('\n') to LF
          .replace(/\\n/g, '\n')
        // convert escape character ('~') to space
          .replace(/~/g, ' ')
        // separate text with '_', '"', '`', '^'(1 or more), '\n'
          .split(/([_"`\n]|\^+)/)
        // convert escape characters to normal characters
          .map((text) => parseEscape(text));
      }
      // set current text wrapping
      result.wrap = state.wrap;
      // set current column border
      result.border = state.border;
      // set current column width
      if (state.width.length === 0) {
        // set '*' for all columns when the width property is 'auto'
        result.width = -1;
      } else if ('text' in result) {
        // text: set column width
        result.width = index < state.width.length ? state.width[index] : 0;
      } else if (state.width.find((c) => c < 0)) {
        // image, code, command: when the width property includes '*', set '*'
        result.width = -1;
      } else {
        // image, code, command: when the width property does not include '*', set the sum of column width and border width
        const w = state.width.filter((c) => c > 0);
        result.width = w.length > 0 ? w.reduce((a, c) => a + c, result.border < 0 ? w.length + 1 : (w.length - 1) * result.border) : 0;
      }
      // set line alignment
      result.alignment = state.align;
      return result;
    });
    // if the line is text and the width property is not 'auto'
  if (line.every((el) => 'text' in el) && state.width.length > 0) {
    // if the line has fewer columns
    while (line.length < state.width.length) {
      // fill empty columns
      line.push({
        align: 1, text: [''], wrap: state.wrap, border: state.border, width: state.width[line.length],
      });
    }
  }
  return line;
}

/**
 * Function - parseEscape
 * Parse escape characters
 * @param {string} chars string containing escape characters
 * @returns {string} unescaped string
 */
function parseEscape(chars) {
  return chars
  // remove invalid escape sequences
    .replace(/\\$|\\x(.?$|[^\dA-Fa-f].|.[^\dA-Fa-f])/g, '')
  // ignore invalid escape characters
    .replace(/\\[^x]/g, '')
  // convert hexadecimal escape characters to normal characters
    .replace(/\\x([\dA-Fa-f]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Function - createLine
 * Generate commands from line objects
 * @param {object} line parsed line object
 * @param {object} printer printer configuration
 * @param {object} state state variables
 * @returns {string} printer command fragment or SVG image fragment
 */
function createLine(line, printer, state) {
  const result = [];
  // text or property
  const text = line.every((el) => 'text' in el);
  // the first column
  const column = line[0];
  // remove zero width columns
  let columns = line.filter((el) => el.width !== 0);
  // remove overflowing columns
  if (text) {
    columns = columns.slice(0, Math.floor(column.border < 0 ? (printer.cpl - 1) / 2 : (printer.cpl + column.border) / (column.border + 1)));
  }
  // fixed columns
  const f = columns.filter((el) => el.width > 0);
  // variable columns
  const g = columns.filter((el) => el.width < 0);
  // reserved width
  const u = f.reduce((a, el) => a + el.width, 0);
  // free width
  let v = printer.cpl - u;
  // subtract border width from free width
  if (text && columns.length > 0) {
    v -= column.border < 0 ? columns.length + 1 : (columns.length - 1) * column.border;
  }
  // number of variable columns
  const n = g.length;
  // reduce the width of fixed columns when reserved width is too many
  while (n > v) {
    f.reduce((a, el) => (a.width > el.width ? a : el)).width--;
    v++;
  }
  // allocate free width among variable columns
  if (n > 0) {
    g.forEach((el, i) => el.width = Math.floor((v + i) / n));
    v = 0;
  }
  // print area
  const left = Math.floor(v * column.alignment / 2);
  const width = printer.cpl - v;
  const right = v - left;
  // process text
  if (text) {
    // wrap text
    const cols = columns.map((column) => wrapText(column, printer));
    // vertical line spacing
    const widths = columns.map((column) => column.width);
    // rules
    switch (state.line) {
      case 'ready':
        // append commands to start rules
        result.push(printer.command.normal()
                    + printer.command.area(left, width, right)
                    + printer.command.align(0)
                    + printer.command.vrstart(widths)
                    + printer.command.vrlf(true));
        state.line = 'running';
        break;
      case 'horizontal':
        // append commands to print horizontal rule
        const m = left - state.rules.left;
        const w = width - state.rules.width;
        const l = Math.min(left, state.rules.left);
        const r = Math.min(right, state.rules.right);
        result.push(printer.command.normal()
                    + printer.command.area(l, printer.cpl - l - r, r)
                    + printer.command.align(0)
                    + printer.command.vrhr(state.rules.widths, widths, m, m + w)
                    + printer.command.lf());
        state.line = 'running';
        break;
      default:
        break;
    }
    // save parameters to stop rules
    state.rules = {
      left, width, right, widths,
    };
    // maximum number of wraps
    const row = column.wrap ? cols.reduce((a, col) => Math.max(a, col.length), 1) : 1;
    // sort text
    for (let j = 0; j < row; j++) {
      // append commands to set print area and line alignment
      let res = printer.command.normal()
                + printer.command.area(left, width, right)
                + printer.command.align(0);
      // print position
      let p = 0;
      // process vertical rules
      if (state.line === 'running') {
        // maximum height
        const height = cols.reduce((a, col) => (j < col.length ? Math.max(a, col[j].height) : a), 1);
        // append commands to print vertical rules
        res += printer.command.normal()
                    + printer.command.absolute(p++)
                    + printer.command.vr(widths, height);
      }
      // process each column
      cols.forEach((col, i) => {
        // append commands to set print position of first column
        res += printer.command.absolute(p);
        // if wrapped text is not empty
        if (j < col.length) {
          // append commands to align text
          res += printer.command.relative(col[j].margin);
          // process text
          const { data } = col[j];
          for (let k = 0; k < data.length; k += 2) {
            // append commands to decorate text
            const ul = Number(data[k][0]);
            const em = Number(data[k][1]);
            const iv = Number(data[k][2]);
            const wh = Number(data[k][3]);
            res += printer.command.normal();
            if (ul) {
              res += printer.command.ul();
            }
            if (em) {
              res += printer.command.em();
            }
            if (iv) {
              res += printer.command.iv();
            }
            if (wh) {
              res += printer.command.wh(wh);
            }
            // append commands to print text
            res += printer.command.text(data[k + 1], printer.encoding);
          }
        }
        // if wrapped text is empty
        else {
          res += printer.command.normal() + printer.command.text(' ', printer.encoding);
        }
        // append commands to set print position of next column
        p += columns[i].width + Math.abs(column.border);
      });
      // append commands to feed new line
      res += printer.command.lf();
      result.push(res);
    }
  }
  // process horizontal rule or paper cut
  if ('hr' in column) {
    // process paper cut
    if (column.hr === '=') {
      switch (state.line) {
        case 'running':
        case 'horizontal':
          // append commands to stop rules
          result.push(printer.command.normal()
                        + printer.command.area(state.rules.left, state.rules.width, state.rules.right)
                        + printer.command.align(0)
                        + printer.command.vrstop(state.rules.widths)
                        + printer.command.vrlf(false));
          // append commands to cut paper
          result.push(printer.command.cut());
          // set state to start rules
          state.line = 'ready';
          break;
        default:
          // append commands to cut paper
          result.push(printer.command.cut());
          break;
      }
    }
    // process horizontal rule
    else {
      switch (state.line) {
        case 'waiting':
          // append commands to print horizontal rule
          result.push(printer.command.normal()
                        + printer.command.area(left, width, right)
                        + printer.command.align(0)
                        + printer.command.hr(width)
                        + printer.command.lf());
          break;
        case 'running':
          // set state to print horizontal rule
          state.line = 'horizontal';
          break;
        default:
          break;
      }
    }
  }
  // process rules
  if ('vr' in column) {
    // start rules
    if (column.vr === '+') {
      state.line = 'ready';
    }
    // stop rules
    else {
      switch (state.line) {
        case 'ready':
          // set state to cancel rules
          state.line = 'waiting';
          break;
        case 'running':
        case 'horizontal':
          // append commands to stop rules
          result.push(printer.command.normal()
                        + printer.command.area(state.rules.left, state.rules.width, state.rules.right)
                        + printer.command.align(0)
                        + printer.command.vrstop(state.rules.widths)
                        + printer.command.vrlf(false));
          state.line = 'waiting';
          break;
        default:
          break;
      }
    }
  }
  // process image
  if ('image' in column) {
    // append commands to print image
    result.push(printer.command.normal()
            + printer.command.image(column.image, column.align, left, width, right));
  }
  // process barcode or 2D code
  if ('code' in column) {
    // process 2D code
    if (column.code.type === 'qrcode') {
      // append commands to print 2D code
      result.push(printer.command.normal()
                + printer.command.area(left, width, right)
                + printer.command.align(column.align)
                + printer.command.qrcode(column.code, printer.encoding));
    }
    // process barcode
    else {
      // append commands to print barcode
      result.push(printer.command.normal()
                + printer.command.area(left, width, right)
                + printer.command.align(column.align)
                + printer.command.barcode(column.code, printer.encoding));
    }
  }
  // process command
  if ('command' in column) {
    // append commands to insert commands
    result.push(printer.command.normal()
            + printer.command.area(left, width, right)
            + printer.command.align(column.align)
            + printer.command.command(column.command));
  }
  // flip upside down
  if (printer.upsideDown) {
    result.reverse();
  }
  return result.join('');
}

/**
 * Function - wrapText
 * Wrap text
 * @param {object} column parsed column object
 * @param {object} printer printer configuration
 * @returns {Array<object>} wrapped text, text position, and text height
 */
function wrapText(column, printer) {
  const result = [];
  // remaining spaces
  let space = column.width;
  // text height
  let height = 1;
  // text data
  let res = [];
  // text decoration flags
  let ul = false;
  let em = false;
  let iv = false;
  let wh = 0;
  // process text and text decoration
  column.text.forEach((text, i) => {
    // process text
    if (i % 2 === 0) {
      // if text is not empty
      let t = Array.from(text);
      while (t.length > 0) {
        // measure character width
        let w = 0;
        let j = 0;
        while (j < t.length) {
          w = printer.command.measureText(t[j], printer.encoding) * (wh < 2 ? wh + 1 : wh - 1);
          // output before protruding
          if (w > space) {
            break;
          }
          space -= w;
          w = 0;
          j++;
        }
        // if characters fit
        if (j > 0) {
          // append text decoration information
          res.push((ul ? '1' : '0') + (em ? '1' : '0') + (iv ? '1' : '0') + wh);
          // append text
          res.push(t.slice(0, j).join(''));
          // update text height
          height = Math.max(height, wh < 3 ? wh : wh - 1);
          // remaining text
          t = t.slice(j);
        }
        // if character is too big
        if (w > column.width) {
          // do not output
          t = t.slice(1);
          continue;
        }
        // if there is no spece left
        if (w > space || space === 0) {
          // wrap text automatically
          result.push({ data: res, margin: space * column.align / 2, height });
          space = column.width;
          res = [];
          height = 1;
        }
      }
    }
    // process text decoration
    else {
      // update text decoration flags
      switch (text) {
        case '\n':
          // wrap text manually
          result.push({ data: res, margin: space * column.align / 2, height });
          space = column.width;
          res = [];
          height = 1;
          break;
        case '_':
          ul = !ul;
          break;
        case '"':
          em = !em;
          break;
        case '`':
          iv = !iv;
          break;
        default:
          const d = Math.min(text.length, 7);
          wh = wh === d ? 0 : d;
          break;
      }
    }
  });
  // output last text
  if (res.length > 0) {
    result.push({ data: res, margin: space * column.align / 2, height });
  }
  return result;
}

// shortcut
const $ = String.fromCharCode;

//
// Command base object
//
const _base = {

  // character width (dots per character)
  charWidth: 12,

  /**
     * Function - measureText
     * Measure character width
     * @param {string} text string to measure
     * @param {string} encoding codepage
     * @returns {number} string width
     */
  measureText(text, encoding) {
    let r = 0;
    const t = Array.from(text);
    switch (encoding) {
      case 'cp932':
      case 'shiftjis':
        r = t.map((c) => c.codePointAt(0)).reduce((a, d) => a + (d < 0x80 || d === 0xa5 || d === 0x203e || (d > 0xff60 && d < 0xffa0) ? 1 : 2), 0);
        break;
      case 'cp936':
      case 'gb18030':
      case 'cp949':
      case 'ksc5601':
      case 'cp950':
      case 'big5':
        r = t.map((c) => c.codePointAt(0)).reduce((a, d) => a + (d < 0x80 ? 1 : 2), 0);
        break;
      default:
        r = t.length;
        break;
    }
    return r;
  },

  /**
     * Function - open
     * Start printing
     * @param {object} printer printer configuration
     * @returns {string} commands
     */
  open: (printer) => '',

  /**
     * Function - close
     * Finish printing
     * @returns {string} commands
     */
  close: () => '',

  /**
     * Function - area
     * Set print area
     * @param {number} left left margin (unit: characters)
     * @param {number} width print area (unit: characters)
     * @param {number} right right margin (unit: characters)
     * @returns {string} commands
     */
  area: (left, width, right) => '',

  /**
     * Function - align
     * Set line alignment
     * @param {number} align line alignment (0: left, 1: center, 2: right)
     * @returns {string} commands
     */
  align: (align) => '',

  /**
     * Function - absolute
     * Set absolute print position
     * @param {number} position absolute position (unit: characters)
     * @returns {string} commands
     */
  absolute: (position) => '',

  /**
     * Function - relative
     * Set relative print position
     * @param {number} position relative position (unit: characters)
     * @returns {string} commands
     */
  relative: (position) => '',

  /**
     * Function - hr
     * Print horizontal rule
     * @param {number} width line width (unit: characters)
     * @returns {string} commands
     */
  hr: (width) => '',

  /**
     * Function - vr
     * Print vertical rules
     * @param {Array<number>} widths vertical line spacing
     * @param {number} height text height (1-6)
     * @returns {string} commands
     */
  vr: (widths, height) => '',

  /**
     * Function - vrstart
     * Start rules
     * @param {Array<number>} widths vertical line spacing
     * @returns {string} commands
     */
  vrstart: (widths) => '',

  /**
     * Function - vrstop
     * Stop rules
     * @param {Array<number>} widths vertical line spacing
     * @returns {string} commands
     */
  vrstop: (widths) => '',

  /**
     * Function - vrhr
     * Print vertical and horizontal rules
     * @param {Array<number>} widths1 vertical line spacing (stop)
     * @param {Array<number>} widths2 vertical line spacing (start)
     * @param {number} dl difference in left position
     * @param {number} dr difference in right position
     * @returns {string} commands
     */
  vrhr: (widths1, widths2, dl, dr) => '',

  /**
     * Function - vrlf
     * Set line spacing and feed new line
     * @param {boolean} vr whether vertical ruled lines are printed
     * @returns {string} commands
     */
  vrlf: (vr) => '',

  /**
     * Function - cut
     * Cut paper
     * @returns {string} commands
     */
  cut: () => '',

  /**
     * Function - ul
     * Underline text
     * @returns {string} commands
     */
  ul: () => '',

  /**
     * Function - em
     * Emphasize text
     * @returns {string} commands
     */
  em: () => '',

  /**
     * Function - iv
     * Invert text
     * @returns {string} commands
     */
  iv: () => '',

  /**
     * Function - wh
     * Scale up text
     * @param {number} width number of special character '^' (1-7)
     * @returns {string} commands
     */
  wh: (wh) => '',

  /**
     * Function - normal
     * Cancel text decoration
     * @returns {string} commands
     */
  normal: () => '',

  /**
     * Function - text
     * Print text
     * @param {string} text string to print
     * @param {string} encoding codepage
     * @returns {number} commands
     */
  text: (text, encoding) => '',

  /**
     * Function - lf
     * Feed new line
     * @returns {string} commands
     */
  lf: () => '',

  /**
     * Function - command
     * insert commands
     * @param {string} command commands to insert
     * @returns {string} commands
     */
  command: (command) => '',

  /**
     * Function - image
     * Print image
     * @param {string} image image data (base64 png format)
     * @param {number} align line alignment (0: left, 1: center, 2: right)
     * @param {number} left left margin (unit: characters)
     * @param {number} width print area (unit: characters)
     * @param {number} right right margin (unit: characters)
     * @returns {string} commands
     */
  image: (image, align, left, width, right) => '',

  /**
     * Function - qrcode
     * Print QR Code
     * @param {object} symbol QR Code information (data, type, cell, level)
     * @param {string} encoding codepage
     * @returns {number} commands
     */
  qrcode: (symbol, encoding) => '',

  /**
     * Function - barcode
     * Print barcode
     * @param {object} symbol barcode information (data, type, width, height, hri)
     * @param {string} encoding codepage
     * @returns {number} commands
     */
  barcode: (symbol, encoding) => '',
};

//
// SVG
//
const _svg = {
  svgWidth: 576,
  svgHeight: 0,
  svgContent: '',
  lineMargin: 0,
  lineAlign: 0,
  lineWidth: 48,
  lineHeight: 1,
  textElement: '',
  textAttributes: {},
  textPosition: 0,
  textScale: 1,
  textEncoding: '',
  feedMinimum: 24,
  // printer configuration
  spacing: false,
  // start printing:
  open(printer) {
    this.svgWidth = printer.cpl * this.charWidth;
    this.svgHeight = 0;
    this.svgContent = '';
    this.lineMargin = 0;
    this.lineAlign = 0;
    this.lineWidth = printer.cpl;
    this.lineHeight = 1;
    this.textElement = '';
    this.textAttributes = {};
    this.textPosition = 0;
    this.textScale = 1;
    this.textEncoding = printer.encoding;
    this.feedMinimum = Number(this.charWidth * (printer.spacing ? 2.5 : 2));
    this.spacing = printer.spacing;
    return '';
  },
  // finish printing:
  close() {
    const p = {
      font: 'monospace', size: this.charWidth * 2, style: '', lang: '',
    };
    switch (this.textEncoding) {
      case 'cp932':
      case 'shiftjis':
        p.font = '\'Kosugi Maru\', \'MS Gothic\', \'San Francisco\', \'Osaka-Mono\', monospace';
        p.style = '@import url("https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap");';
        p.lang = 'ja';
        break;
      case 'cp936':
      case 'gb18030':
        p.size -= 2;
        p.lang = 'zh-Hans';
        break;
      case 'cp949':
      case 'ksc5601':
        p.size -= 2;
        p.lang = 'ko';
        break;
      case 'cp950':
      case 'big5':
        p.size -= 2;
        p.lang = 'zh-Hant';
        break;
      default:
        p.font = '\'Courier Prime\', \'Courier New\', \'Courier\', monospace';
        p.size -= 2;
        p.style = '@import url("https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap");';
        break;
    }
    if (p.style.length > 0) {
      p.style = `<style type="text/css"><![CDATA[${p.style}]]></style>`;
    }
    if (p.lang.length > 0) {
      p.lang = ` xml:lang="${p.lang}"`;
    }
    return `<svg width="${this.svgWidth}px" height="${this.svgHeight}px" viewBox="0 0 ${this.svgWidth} ${this.svgHeight}" preserveAspectRatio="xMinYMin meet" `
            + `xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">${p.style}`
            + '<defs><filter id="receiptlineinvert" x="0" y="0" width="100%" height="100%"><feFlood flood-color="#000"/><feComposite in="SourceGraphic" operator="xor"/></filter></defs>'
            + `<g font-family="${p.font}" fill="#000" font-size="${p.size}" dominant-baseline="text-after-edge" text-anchor="middle"${p.lang}>${this.svgContent}</g></svg>\n`;
  },
  // set print area:
  area(left, width, right) {
    this.lineMargin = left;
    this.lineWidth = width;
    return '';
  },
  // set line alignment:
  align(align) {
    this.lineAlign = align;
    return '';
  },
  // set absolute print position:
  absolute(position) {
    this.textPosition = position;
    return '';
  },
  // set relative print position:
  relative(position) {
    this.textPosition += position;
    return '';
  },
  // print horizontal rule:
  hr(width) {
    const w = this.charWidth;
    const path = `<path d="M0,${w}h${w * width}" fill="none" stroke="#000" stroke-width="2"/>`;
    this.svgContent += `<g transform="translate(${this.lineMargin * w},${this.svgHeight})">${path}</g>`;
    return '';
  },
  // print vertical rules:
  vr(widths, height) {
    const w = this.charWidth; const u = w / 2; const
      v = (w + w) * height;
    const path = `<path d="${widths.reduce((a, width) => `${a}m${w * width + w},${-v}v${v}`, `M${u},0v${v}`)}" fill="none" stroke="#000" stroke-width="2"/>`;
    this.svgContent += `<g transform="translate(${this.lineMargin * w},${this.svgHeight})">${path}</g>`;
    return '';
  },
  // start rules:
  vrstart(widths) {
    const w = this.charWidth; const
      u = w / 2;
    const path = `<path d="${widths.reduce((a, width) => `${a}h${w * width}h${u}v${w}m0,${-w}h${u}`, `M${u},${w + w}v${-u}q0,${-u},${u},${-u}`).replace(/h\d+v\d+m0,-\d+h\d+$/, `q${u},0,${u},${u}v${u}`)}" fill="none" stroke="#000" stroke-width="2"/>`;
    this.svgContent += `<g transform="translate(${this.lineMargin * w},${this.svgHeight})">${path}</g>`;
    return '';
  },
  // stop rules:
  vrstop(widths) {
    const w = this.charWidth; const
      u = w / 2;
    const path = `<path d="${widths.reduce((a, width) => `${a}h${w * width}h${u}v${-w}m0,${w}h${u}`, `M${u},0v${u}q0,${u},${u},${u}`).replace(/h\d+v-\d+m0,\d+h\d+$/, `q${u},0,${u},${-u}v${-u}`)}" fill="none" stroke="#000" stroke-width="2"/>`;
    this.svgContent += `<g transform="translate(${this.lineMargin * w},${this.svgHeight})">${path}</g>`;
    return '';
  },
  // print vertical and horizontal rules:
  vrhr(widths1, widths2, dl, dr) {
    const w = this.charWidth; const
      u = w / 2;
    const path1 = `<path d="${widths1.reduce((a, width) => `${a}h${w * width}h${u}v${-w}m0,${w}h${u}`, `M${u},0${dl > 0 ? `v${u}q0,${u},${u},${u}` : `v${w}h${u}`}`).replace(/h\d+v-\d+m0,\d+h\d+$/, dr < 0 ? `q${u},0,${u},${-u}v${-u}` : `h${u}v${-w}`)}" fill="none" stroke="#000" stroke-width="2"/>`;
    this.svgContent += `<g transform="translate(${(this.lineMargin + Math.max(-dl, 0)) * w},${this.svgHeight})">${path1}</g>`;
    const path2 = `<path d="${widths2.reduce((a, width) => `${a}h${w * width}h${u}v${w}m0,${-w}h${u}`, `M${u},${w + w}${dl < 0 ? `v${-u}q0,${-u},${u},${-u}` : `v${-w}h${u}`}`).replace(/h\d+v\d+m0,-\d+h\d+$/, dr > 0 ? `q${u},0,${u},${u}v${u}` : `h${u}v${w}`)}" fill="none" stroke="#000" stroke-width="2"/>`;
    this.svgContent += `<g transform="translate(${(this.lineMargin + Math.max(dl, 0)) * w},${this.svgHeight})">${path2}</g>`;
    return '';
  },
  // set line spacing and feed new line:
  vrlf(vr) {
    this.feedMinimum = Number(this.charWidth * (!vr && this.spacing ? 2.5 : 2));
    return this.lf();
  },
  // cut paper:
  cut() {
    const path = `<path d="M12,12.5l-7.5,-3a2,2,0,1,1,.5,0M12,11.5l-7.5,3a2,2,0,1,0,.5,0" fill="none" stroke="#000" stroke-width="1"/><path d="M12,12l10,-4q-1,-1,-2.5,-1l-10,4v2l10,4q1.5,0,2.5,-1z" fill="#000"/><path d="M24,12h${this.svgWidth - 24}" fill="none" stroke="#000" stroke-width="2" stroke-dasharray="2"/>`;
    this.svgContent += `<g transform="translate(0,${this.svgHeight})">${path}</g>`;
    return this.lf();
  },
  // underline text:
  ul() {
    this.textAttributes['text-decoration'] = 'underline';
    return '';
  },
  // emphasize text:
  em() {
    this.textAttributes.stroke = '#000';
    return '';
  },
  // invert text:
  iv() {
    this.textAttributes.filter = 'url(#receiptlineinvert)';
    return '';
  },
  // scale up text:
  wh(wh) {
    const w = wh < 2 ? wh + 1 : wh - 1;
    const h = wh < 3 ? wh : wh - 1;
    this.textAttributes.transform = `scale(${w},${h})`;
    this.lineHeight = Math.max(this.lineHeight, h);
    this.textScale = w;
    return '';
  },
  // cancel text decoration:
  normal() {
    this.textAttributes = {};
    this.textScale = 1;
    return '';
  },
  // print text:
  text(text, encoding) {
    let p = this.textPosition;
    this.textAttributes.x = Array.from(text).map((c) => {
      const q = this.measureText(c, encoding) * this.textScale;
      const r = (p + q / 2) * this.charWidth / this.textScale;
      p += q;
      return r;
    }).join();
    const attr = Object.keys(this.textAttributes).reduce((a, key) => `${a} ${key}="${this.textAttributes[key]}"`, '');
    this.textElement += `<text${attr}>${text.replace(/[ &<>]/g, (r) => ({
      ' ': '&#xa0;', '&': '&amp;', '<': '&lt;', '>': '&gt;',
    }[r]))}</text>`;
    this.textPosition += this.measureText(text, encoding) * this.textScale;
    return '';
  },
  // feed new line:
  lf() {
    const h = this.lineHeight * this.charWidth * 2;
    if (this.textElement.length > 0) {
      this.svgContent += `<g transform="translate(${this.lineMargin * this.charWidth},${this.svgHeight + h})">${this.textElement}</g>`;
    }
    this.svgHeight += Math.max(h, this.feedMinimum);
    this.lineHeight = 1;
    this.textElement = '';
    this.textPosition = 0;
    return '';
  },
  // insert commands:
  command: (command) => '',
  // print image:
  image(image, align, left, width, right) {
    const png = typeof window !== 'undefined' ? window.atob(image) : Buffer.from(image, 'base64').toString('binary');
    let imgWidth = 0;
    let imgHeight = 0;
    png.replace(/^\x89PNG\x0d\x0a\x1a\x0a\x00\x00\x00\x0dIHDR(.{4})(.{4})/, (match, w, h) => {
      imgWidth = w.charCodeAt(0) << 24 | w.charCodeAt(1) << 16 | w.charCodeAt(2) << 8 | w.charCodeAt(3);
      imgHeight = h.charCodeAt(0) << 24 | h.charCodeAt(1) << 16 | h.charCodeAt(2) << 8 | h.charCodeAt(3);
    });
    const imgData = `<image xlink:href="data:image/png;base64,${image}" x="0" y="0" width="${imgWidth}" height="${imgHeight}"/>`;
    this.align(align);
    this.area(left, width, right);
    const margin = this.lineMargin * this.charWidth + (this.lineWidth * this.charWidth - imgWidth) * this.lineAlign / 2;
    this.svgContent += `<g transform="translate(${margin},${this.svgHeight})">${imgData}</g>`;
    this.svgHeight += imgHeight;
    return '';
  },
  // print QR Code:
  qrcode(symbol, encoding) {
    if (typeof qrcode !== 'undefined') {
      const qr = qrcode(0, symbol.level.toUpperCase());
      qr.addData(symbol.data);
      qr.make();
      qr.createSvgTag(symbol.cell, 0).replace(/width="(\d+)px".*height="(\d+)px".*(<path.*?>)/, (match, w, h, path) => {
        const margin = this.lineMargin * this.charWidth + (this.lineWidth * this.charWidth - Number(w)) * this.lineAlign / 2;
        this.svgContent += `<g transform="translate(${margin},${this.svgHeight})">${path}</g>`;
        this.svgHeight += Number(h);
      });
    }
    return '';
  },
  // print barcode:
  barcode(symbol, encoding) {
    let bar = {};
    const { data } = symbol;
    const h = symbol.height;
    let x = symbol.width;
    switch (symbol.type) {
      case 'upc':
        bar = data.length < 9 ? this.upce(data) : this.upca(data);
        break;
      case 'ean':
      case 'jan':
        bar = data.length < 9 ? this.ean8(data) : this.ean13(data);
        break;
      case 'code39':
        bar = this.code39(data);
        x = Math.floor((x + 1) / 2);
        break;
      case 'itf':
        bar = this.itf(data);
        x = Math.floor((x + 1) / 2);
        break;
      case 'codabar':
      case 'nw7':
        bar = this.codabar(data);
        x = Math.floor((x + 1) / 2);
        break;
      case 'code93':
        bar = this.code93(data);
        break;
      case 'code128':
        bar = this.code128(data);
        break;
      default:
        break;
    }
    if ('module' in bar) {
      const width = x * bar.length;
      const height = h + this.charWidth * (symbol.hri ? 2 : 0);
      // draw barcode
      let path = '<path d="';
      bar.module.split('').reduce((p, c, i) => {
        const w = x * parseInt(c, 16);
        if (i % 2 === 1) {
          path += `M${p},${0}h${w}v${h}h${-w}z`;
        }
        return p + w;
      }, 0);
      path += '" fill="#000"/>';
      // draw human readable interpretation
      if (symbol.hri) {
        const m = (width - bar.hri.length * this.charWidth) / 2;
        path += `<text x="${bar.hri.split('').map((c, i) => m + this.charWidth * i).join()}" y="${height}">${bar.hri.replace(/[ &<>]/g, (r) => ({
          ' ': '&#xa0;', '&': '&amp;', '<': '&lt;', '>': '&gt;',
        }[r]))}</text>`;
      }
      const margin = this.lineMargin * this.charWidth + (this.lineWidth * this.charWidth - width) * this.lineAlign / 2;
      this.svgContent += `<g transform="translate(${margin},${this.svgHeight})">${path}</g>`;
      this.svgHeight += height;
    }
    return '';
  },
  // CODE128 patterns:
  c128: {
    element: '212222,222122,222221,121223,121322,131222,122213,122312,132212,221213,221312,231212,112232,122132,122231,113222,123122,123221,223211,221132,221231,213212,223112,312131,311222,321122,321221,312212,322112,322211,212123,212321,232121,111323,131123,131321,112313,132113,132311,211313,231113,231311,112133,112331,132131,113123,113321,133121,313121,211331,231131,213113,213311,213131,311123,311321,331121,312113,312311,332111,314111,221411,431111,111224,111422,121124,121421,141122,141221,112214,112412,122114,122411,142112,142211,241211,221114,413111,241112,134111,111242,121142,121241,114212,124112,124211,411212,421112,421211,212141,214121,412121,111143,111341,131141,114113,114311,411113,411311,113141,114131,311141,411131,211412,211214,211232,2331112'.split(','),
    starta: 103,
    startb: 104,
    startc: 105,
    atob: 100,
    atoc: 99,
    btoa: 101,
    btoc: 99,
    ctoa: 101,
    ctob: 100,
    shift: 98,
    stop: 106,
  },
  // generate CODE128 data (minimize symbol width):
  code128(data) {
    const r = {};
    const s = data.replace(/((?!^[\x00-\x7f]+$).)*/, '');
    if (s.length > 0) {
      // generate HRI
      r.hri = s.replace(/[\x00- \x7f]/g, ' ');
      // minimize symbol width
      const d = [];
      const p = s.search(/[^ -_]/);
      if (/^\d{2}$/.test(s)) {
        d.push(this.c128.startc, Number(s));
      } else if (/^\d{4,}/.test(s)) {
        this.code128c(this.c128.startc, s, d);
      } else if (p >= 0 && s.charCodeAt(p) < 32) {
        this.code128a(this.c128.starta, s, d);
      } else if (s.length > 0) {
        this.code128b(this.c128.startb, s, d);
      } else {
        // end
      }
      // calculate check digit and append stop character
      d.push(d.reduce((a, c, i) => a + c * i) % 103, this.c128.stop);
      // generate modules
      r.module = `0${d.map((c) => this.c128.element[c]).join('')}`;
      r.length = d.length * 11 + 2;
    }
    return r;
  },
  // process CODE128 code set A:
  code128a(x, s, d) {
    if (x !== this.c128.shift) {
      d.push(x);
    }
    s = s.replace(/^((?!\d{4,})[\x00-_])+/, (m) => (m.split('').forEach((c) => d.push((c.charCodeAt(0) + 64) % 96)), ''));
    s = s.replace(/^\d(?=\d{4}(\d{2})*)/, (m) => (d.push((m.charCodeAt(0) + 64) % 96), ''));
    const t = s.slice(1);
    const p = t.search(/[^ -_]/);
    if (/^\d{4,}/.test(s)) {
      this.code128c(this.c128.atoc, s, d);
    } else if (p >= 0 && t.charCodeAt(p) < 32) {
      d.push(this.c128.shift, s.charCodeAt(0) - 32);
      this.code128a(this.c128.shift, t, d);
    } else if (s.length > 0) {
      this.code128b(this.c128.atob, s, d);
    } else {
      // end
    }
  },
  // process CODE128 code set B:
  code128b(x, s, d) {
    if (x !== this.c128.shift) {
      d.push(x);
    }
    s = s.replace(/^((?!\d{4,})[ -\x7f])+/, (m) => (m.split('').forEach((c) => d.push(c.charCodeAt(0) - 32)), ''));
    s = s.replace(/^\d(?=\d{4}(\d{2})*)/, (m) => (d.push(m.charCodeAt(0) - 32), ''));
    const t = s.slice(1);
    const p = t.search(/[^ -_]/);
    if (/^\d{4,}/.test(s)) {
      this.code128c(this.c128.btoc, s, d);
    } else if (p >= 0 && t.charCodeAt(p) > 95) {
      d.push(this.c128.shift, s.charCodeAt(0) + 64);
      this.code128b(this.c128.shift, t, d);
    } else if (s.length > 0) {
      this.code128a(this.c128.btoa, s, d);
    } else {
      // end
    }
  },
  // process CODE128 code set C:
  code128c(x, s, d) {
    if (x !== this.c128.shift) {
      d.push(x);
    }
    s = s.replace(/^\d{4,}/g, (m) => m.replace(/\d{2}/g, (c) => (d.push(Number(c)), '')));
    const p = s.search(/[^ -_]/);
    if (p >= 0 && s.charCodeAt(p) < 32) {
      this.code128a(this.c128.ctoa, s, d);
    } else if (s.length > 0) {
      this.code128b(this.c128.ctob, s, d);
    } else {
      // end
    }
  },
  // CODE93 patterns:
  c93: {
    escape: 'cU,dA,dB,dC,dD,dE,dF,dG,dH,dI,dJ,dK,dL,dM,dN,dO,dP,dQ,dR,dS,dT,dU,dV,dW,dX,dY,dZ,cA,cB,cC,cD,cE, ,sA,sB,sC,$,%,sF,sG,sH,sI,sJ,+,sL,-,.,/,0,1,2,3,4,5,6,7,8,9,sZ,cF,cG,cH,cI,cJ,cV,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,cK,cL,cM,cN,cO,cW,pA,pB,pC,pD,pE,pF,pG,pH,pI,pJ,pK,pL,pM,pN,pO,pP,pQ,pR,pS,pT,pU,pV,pW,pX,pY,pZ,cP,cQ,cR,cS,cT'.split(','),
    code: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%dcsp'.split('').reduce((a, c, i) => (a[c] = i, a), {}),
    element: '131112,111213,111312,111411,121113,121212,121311,111114,131211,141111,211113,211212,211311,221112,221211,231111,112113,112212,112311,122112,132111,111123,111222,111321,121122,131121,212112,212211,211122,211221,221121,222111,112122,112221,122121,123111,121131,311112,311211,321111,112131,113121,211131,121221,312111,311121,122211,111141,1111411'.split(','),
    start: 47,
    stop: 48,
  },
  // generate CODE93 data:
  code93(data) {
    const r = {};
    const s = data.replace(/((?!^[\x00-\x7f]+$).)*/, '');
    if (s.length > 0) {
      // generate HRI
      r.hri = s.replace(/[\x00- \x7f]/g, ' ');
      // calculate check digit
      const d = s.split('').map((c) => this.c93.escape[c.charCodeAt(0)]).join('').split('')
        .map((c) => this.c93.code[c]);
      d.push(d.reduceRight((a, c, i) => a + c * ((d.length - 1 - i) % 20 + 1)) % 47);
      d.push(d.reduceRight((a, c, i) => a + c * ((d.length - 1 - i) % 15 + 1)) % 47);
      // append start character and stop character
      d.unshift(this.c93.start);
      d.push(this.c93.stop);
      // generate modules
      r.module = `0${d.map((c) => this.c93.element[c]).join('')}`;
      r.length = d.length * 9 + 1;
    }
    return r;
  },
  // Codabar(NW-7) patterns:
  nw7: {
    0: '2222255',
    1: '2222552',
    2: '2225225',
    3: '5522222',
    4: '2252252',
    5: '5222252',
    6: '2522225',
    7: '2522522',
    8: '2552222',
    9: '5225222',
    '-': '2225522',
    $: '2255222',
    ':': '5222525',
    '/': '5252225',
    '.': '5252522',
    '+': '2252525',
    A: '2255252',
    B: '2525225',
    C: '2225255',
    D: '2225552',
  },
  // generate Codabar(NW-7) data:
  codabar(data) {
    const r = {};
    const s = data.replace(/((?!^[A-D][0-9\-$:/.+]+[A-D]$).)*/i, '');
    if (s.length > 0) {
      // generate HRI
      r.hri = s;
      // generate modules
      r.module = `0${s.toUpperCase().split('').map((c) => this.nw7[c]).join('2')}`;
      r.length = s.length * 25 - ((`${s}$`).match(/[\d\-$]/g).length - 1) * 3 - 2;
    }
    return r;
  },
  // Interleaved 2 of 5 patterns:
  i25: {
    element: '22552,52225,25225,55222,22525,52522,25522,22255,52252,25252'.split(','),
    start: '2222',
    stop: '522',
  },
  // generate Interleaved 2 of 5 data:
  itf(data) {
    const r = {};
    const s = data.replace(/((?!^(\d{2})+$).)*/, '');
    if (s.length > 0) {
      // generate HRI
      r.hri = s;
      // generate modules
      const d = data.replace(/((?!^(\d{2})+$).)*/, '', '').split('').map((c) => Number(c));
      let x = this.i25.start;
      let i = 0;
      while (i < d.length) {
        const b = this.i25.element[d[i++]];
        const s = this.i25.element[d[i++]];
        x += b.split('').map((c, j) => c + s[j]).join('');
      }
      x += this.i25.stop;
      r.module = `0${x}`;
      r.length = s.length * 16 + 17;
    }
    return r;
  },
  // CODE39 patterns:
  c39: {
    0: '222552522',
    1: '522522225',
    2: '225522225',
    3: '525522222',
    4: '222552225',
    5: '522552222',
    6: '225552222',
    7: '222522525',
    8: '522522522',
    9: '225522522',
    A: '522225225',
    B: '225225225',
    C: '525225222',
    D: '222255225',
    E: '522255222',
    F: '225255222',
    G: '222225525',
    H: '522225522',
    I: '225225522',
    J: '222255522',
    K: '522222255',
    L: '225222255',
    M: '525222252',
    N: '222252255',
    O: '522252252',
    P: '225252252',
    Q: '222222555',
    R: '522222552',
    S: '225222552',
    T: '222252552',
    U: '552222225',
    V: '255222225',
    W: '555222222',
    X: '252252225',
    Y: '552252222',
    Z: '255252222',
    '-': '252222525',
    '.': '552222522',
    ' ': '255222522',
    $: '252525222',
    '/': '252522252',
    '+': '252225252',
    '%': '222525252',
    '*': '252252522',
  },
  // generate CODE39 data:
  code39(data) {
    const r = {};
    let s = data.replace(/((?!^\*?[0-9A-Z\-. $/+%]+\*?$).)*/, '');
    if (s.length > 0) {
      // append start character and stop character
      s = s.replace(/^\*?([^*]+)\*?$/, '*$1*');
      // generate HRI
      r.hri = s;
      // generate modules
      r.module = `0${s.split('').map((c) => this.c39[c]).join('2')}`;
      r.length = s.length * 29 - 2;
    }
    return r;
  },
  // UPC/EAN/JAN patterns:
  ean: {
    a: '3211,2221,2122,1411,1132,1231,1114,1312,1213,3112'.split(','),
    b: '1123,1222,2212,1141,2311,1321,4111,2131,3121,2113'.split(','),
    c: '3211,2221,2122,1411,1132,1231,1114,1312,1213,3112'.split(','),
    g: '111,11111,111111,11,112'.split(','),
    p: 'aaaaaa,aababb,aabbab,aabbba,abaabb,abbaab,abbbaa,ababab,ababba,abbaba'.split(','),
    e: 'bbbaaa,bbabaa,bbaaba,bbaaab,babbaa,baabba,baaabb,bababa,babaab,baabab'.split(','),
  },
  // generate UPC-A data:
  upca(data) {
    const r = this.ean13(`0${data}`);
    if ('module' in r) {
      r.hri = r.hri.slice(1);
    }
    return r;
  },
  // generate UPC-E data:
  upce(data) {
    const r = {};
    const d = data.replace(/((?!^0\d{6,7}$).)*/, '').split('').map((c) => Number(c));
    if (d.length > 0) {
      // calculate check digit
      d[7] = 0;
      d[7] = (10 - this.upcetoa(d).reduce((a, c, i) => a + c * (3 - (i % 2) * 2), 0) % 10) % 10;
      // generate HRI
      r.hri = d.join('');
      // generate modules
      let m = this.ean.g[0];
      for (let i = 1; i < 7; i++) m += this.ean[this.ean.e[d[7]][i - 1]][d[i]];
      m += this.ean.g[2];
      r.module = `0${m}`;
      r.length = 51;
    }
    return r;
  },
  // convert UPC-E to UPC-A:
  upcetoa: (e) => {
    const a = e.slice(0, 3);
    switch (e[6]) {
      case 0: case 1: case 2:
        a.push(e[6], 0, 0, 0, 0, e[3], e[4], e[5]);
        break;
      case 3:
        a.push(e[3], 0, 0, 0, 0, 0, e[4], e[5]);
        break;
      case 4:
        a.push(e[3], e[4], 0, 0, 0, 0, 0, e[5]);
        break;
      default:
        a.push(e[3], e[4], e[5], 0, 0, 0, 0, e[6]);
        break;
    }
    a.push(e[7]);
    return a;
  },
  // generate EAN-13(JAN-13) data:
  ean13(data) {
    const r = {};
    const d = data.replace(/((?!^\d{12,13}$).)*/, '').split('').map((c) => Number(c));
    if (d.length > 0) {
      // calculate check digit
      d[12] = 0;
      d[12] = (10 - d.reduce((a, c, i) => a + c * ((i % 2) * 2 + 1)) % 10) % 10;
      // generate HRI
      r.hri = d.join('');
      // generate modules
      let m = this.ean.g[0];
      for (let i = 1; i < 7; i++) m += this.ean[this.ean.p[d[0]][i - 1]][d[i]];
      m += this.ean.g[1];
      for (let i = 7; i < 13; i++) m += this.ean.c[d[i]];
      m += this.ean.g[0];
      r.module = `0${m}`;
      r.length = 95;
    }
    return r;
  },
  // generate EAN-8(JAN-8) data:
  ean8(data) {
    const r = {};
    const d = data.replace(/((?!^\d{7,8}$).)*/, '').split('').map((c) => Number(c));
    if (d.length > 0) {
      // calculate check digit
      d[7] = 0;
      d[7] = (10 - d.reduce((a, c, i) => a + c * (3 - (i % 2) * 2), 0) % 10) % 10;
      // generate HRI
      r.hri = d.join('');
      // generate modules
      let m = this.ean.g[0];
      for (let i = 0; i < 4; i++) m += this.ean.a[d[i]];
      m += this.ean.g[1];
      for (let i = 4; i < 8; i++) m += this.ean.c[d[i]];
      m += this.ean.g[0];
      r.module = `0${m}`;
      r.length = 67;
    }
    return r;
  },
};

//
// multilingual conversion table (cp437, cp852, cp858, cp866, cp1252)
//
const multitable = {};
const multipage = {
  '\x00': 'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ',
  '\x10': '€�‚ƒ„…†‡ˆ‰Š‹Œ�Ž��‘’“”•–—˜™š›œ�žŸ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ',
  '\x11': 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмноп░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀рстуфхцчшщъыьэюяЁёЄєЇїЎў°∙·√№¤■ ',
  '\x12': 'ÇüéâäůćçłëŐőîŹÄĆÉĹĺôöĽľŚśÖÜŤťŁ×čáíóúĄąŽžĘę¬źČş«»░▒▓│┤ÁÂĚŞ╣║╗╝Żż┐└┴┬├─┼Ăă╚╔╩╦╠═╬¤đĐĎËďŇÍÎě┘┌█▄ŢŮ▀ÓßÔŃńňŠšŔÚŕŰýÝţ´­˝˛ˇ˘§÷¸°¨˙űŘř■ ',
  '\x13': 'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈ€ÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■ ',
};
const starpage = {
  '\x00': '\x01', '\x10': '\x20', '\x11': '\x0a', '\x12': '\x05', '\x13': '\x04',
};
for (const p of Object.keys(multipage)) {
  const s = multipage[p];
  for (let i = 0; i < 128; i++) {
    const c = s[i];
    if (!multitable[c]) {
      multitable[c] = p + $(i + 128);
    }
  }
}

//
// ESC/POS Common
//
const _escpos = {
  // printer configuration
  upsideDown: false,
  spacing: false,
  cutting: true,
  gradient: true,
  gamma: 1.8,
  threshold: 128,
  // ruled line composition
  vrtable: {
    ' ': {
      ' ': ' ', '\x90': '\x90', '\x95': '\x95', '\x9a': '\x9a', '\x9b': '\x9b', '\x9e': '\x9e', '\x9f': '\x9f',
    },
    '\x91': {
      ' ': '\x91', '\x90': '\x8f', '\x95': '\x91', '\x9a': '\x8f', '\x9b': '\x8f', '\x9e': '\x8f', '\x9f': '\x8f',
    },
    '\x95': {
      ' ': '\x95', '\x90': '\x90', '\x95': '\x95', '\x9a': '\x90', '\x9b': '\x90', '\x9e': '\x90', '\x9f': '\x90',
    },
    '\x98': {
      ' ': '\x98', '\x90': '\x8f', '\x95': '\x91', '\x9a': '\x93', '\x9b': '\x8f', '\x9e': '\x93', '\x9f': '\x8f',
    },
    '\x99': {
      ' ': '\x99', '\x90': '\x8f', '\x95': '\x91', '\x9a': '\x8f', '\x9b': '\x92', '\x9e': '\x8f', '\x9f': '\x92',
    },
    '\x9c': {
      ' ': '\x9c', '\x90': '\x8f', '\x95': '\x91', '\x9a': '\x93', '\x9b': '\x8f', '\x9e': '\x93', '\x9f': '\x8f',
    },
    '\x9d': {
      ' ': '\x9d', '\x90': '\x8f', '\x95': '\x91', '\x9a': '\x8f', '\x9b': '\x92', '\x9e': '\x8f', '\x9f': '\x92',
    },
  },
  // codepages: (ESC t n) (FS &) (FS C n) (ESC R n)
  codepage: {
    cp437: '\x1bt\x00',
    cp852: '\x1bt\x12',
    cp858: '\x1bt\x13',
    cp860: '\x1bt\x03',
    cp863: '\x1bt\x04',
    cp865: '\x1bt\x05',
    cp866: '\x1bt\x11',
    cp1252: '\x1bt\x10',
    cp932: '\x1bt\x01\x1cC1\x1bR\x08',
    cp936: '\x1bt\x00\x1c&',
    cp949: '\x1bt\x00\x1c&\x1bR\x0d',
    cp950: '\x1bt\x00\x1c&',
    shiftjis: '\x1bt\x01\x1cC1\x1bR\x08',
    gb18030: '\x1bt\x00\x1c&',
    ksc5601: '\x1bt\x00\x1c&\x1bR\x0d',
    big5: '\x1bt\x00\x1c&',
  },
  // convert to multiple codepage characters: (ESC t n)
  multiconv: (text) => {
    let p = ''; let
      r = '';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c > '\x7f') {
        const d = multitable[c];
        if (d) {
          const q = d[0];
          if (p === q) {
            r += d[1];
          } else {
            r += `\x1bt${d}`;
            p = q;
          }
        } else {
          r += '?';
        }
      } else {
        r += c;
      }
    }
    return r;
  },
};

//
// ESC/POS Thermal
//
const _thermal = {
  // start printing: ESC @ GS a n ESC M n FS ( A pL pH fn m ESC SP n FS S n1 n2 (ESC 2) (ESC 3 n) ESC { n FS .
  open(printer) {
    this.upsideDown = printer.upsideDown;
    this.spacing = printer.spacing;
    this.cutting = printer.cutting;
    this.gradient = printer.gradient;
    this.gamma = printer.gamma;
    this.threshold = printer.threshold;
    return `\x1b@\x1da\x00\x1bM0\x1c(A${$(2, 0, 48, 0)}\x1b \x00\x1cS\x00\x00${this.spacing ? '\x1b2' : '\x1b3\x00'}\x1b{${$(this.upsideDown)}\x1c.`;
  },
  // finish printing: GS r n
  close() {
    return `${this.cutting ? this.cut() : ''}\x1dr1`;
  },
  // set print area: GS L nL nH GS W nL nH
  area(left, width, right) {
    const m = left * this.charWidth;
    const w = width * this.charWidth;
    return `\x1dL${$(m & 255, m >> 8 & 255)}\x1dW${$(w & 255, w >> 8 & 255)}`;
  },
  // set line alignment: ESC a n
  align: (align) => `\x1ba${$(align)}`,
  // set absolute print position: ESC $ nL nH
  absolute(position) {
    const p = position * this.charWidth;
    return `\x1b$${$(p & 255, p >> 8 & 255)}`;
  },
  // set relative print position: ESC \ nL nH
  relative(position) {
    const p = position * this.charWidth;
    return `\x1b\\${$(p & 255, p >> 8 & 255)}`;
  },
  // print horizontal rule: FS C n FS . ESC t n ...
  hr: (width) => `\x1cC0\x1c.\x1bt\x01${'\x95'.repeat(width)}`,
  // print vertical rules: GS ! n FS C n FS . ESC t n ...
  vr(widths, height) {
    return widths.reduce((a, w) => `${a + this.relative(w)}\x96`, `\x1d!${$(height - 1)}\x1cC0\x1c.\x1bt\x01\x96`);
  },
  // start rules: FS C n FS . ESC t n ...
  vrstart: (widths) => `\x1cC0\x1c.\x1bt\x01${widths.reduce((a, w) => `${a + '\x95'.repeat(w)}\x91`, '\x9c').slice(0, -1)}\x9d`,
  // stop rules: FS C n FS . ESC t n ...
  vrstop: (widths) => `\x1cC0\x1c.\x1bt\x01${widths.reduce((a, w) => `${a + '\x95'.repeat(w)}\x90`, '\x9e').slice(0, -1)}\x9f`,
  // print vertical and horizontal rules: FS C n FS . ESC t n ...
  vrhr(widths1, widths2, dl, dr) {
    const r1 = ' '.repeat(Math.max(-dl, 0)) + widths1.reduce((a, w) => `${a + '\x95'.repeat(w)}\x90`, dl > 0 ? '\x9e' : '\x9a').slice(0, -1) + (dr < 0 ? '\x9f' : '\x9b') + ' '.repeat(Math.max(dr, 0));
    const r2 = ' '.repeat(Math.max(dl, 0)) + widths2.reduce((a, w) => `${a + '\x95'.repeat(w)}\x91`, dl < 0 ? '\x9c' : '\x98').slice(0, -1) + (dr > 0 ? '\x9d' : '\x99') + ' '.repeat(Math.max(-dr, 0));
    return `\x1cC0\x1c.\x1bt\x01${r2.split('').map((c, i) => this.vrtable[c][r1[i]]).join('')}`;
  },
  // set line spacing and feed new line: (ESC 2) (ESC 3 n)
  vrlf(vr) {
    return (vr === this.upsideDown && this.spacing ? '\x1b2' : '\x1b3\x00') + this.lf();
  },
  // cut paper: GS V m n
  cut: () => '\x1dVB\x00',
  // underline text: ESC - n FS - n
  ul: () => '\x1b-1\x1c-1',
  // emphasize text: ESC E n
  em: () => '\x1bE1',
  // invert text: GS B n
  iv: () => '\x1dB1',
  // scale up text: GS ! n
  wh: (wh) => `\x1d!${wh < 3 ? $((wh & 1) << 4 | wh >> 1 & 1) : $(wh - 2 << 4 | wh - 2)}`,
  // cancel text decoration: ESC - n FS - n ESC E n GS B n GS ! n
  normal: () => '\x1b-0\x1c-0\x1bE0\x1dB0\x1d!\x00',
  // print text:
  text(text, encoding) {
    return encoding === 'multilingual' ? this.multiconv(text) : this.codepage[encoding] + iconv.encode(text, encoding).toString('binary');
  },
  // feed new line: LF
  lf: () => '\x0a',
  // insert commands:
  command: (command) => command,
  // image split size
  split: 512,
  // print image: GS 8 L p1 p2 p3 p4 m fn a bx by c xL xH yL yH d1 ... dk GS ( L pL pH m fn
  image(image, align, left, width, right) {
    let r = this.upsideDown ? this.area(right, width, left) + this.align(2 - align) : this.area(left, width, right) + this.align(align);
    const img = PNG.sync.read(Buffer.from(image, 'base64'));
    const w = img.width;
    const d = Array(w).fill(0);
    let j = this.upsideDown ? img.data.length - 4 : 0;
    for (let z = 0; z < img.height; z += this.split) {
      const h = Math.min(this.split, img.height - z);
      const l = (w + 7 >> 3) * h + 10;
      r += `\x1d8L${$(l & 255, l >> 8 & 255, l >> 16 & 255, l >> 24 & 255, 48, 112, 48, 1, 1, 49, w & 255, w >> 8 & 255, h & 255, h >> 8 & 255)}`;
      for (let y = 0; y < h; y++) {
        let i = 0; let
          e = 0;
        for (let x = 0; x < w; x += 8) {
          let b = 0;
          const q = Math.min(w - x, 8);
          for (let p = 0; p < q; p++) {
            const f = Math.floor((d[i] + e * 5) / 16 + (((img.data[j] * 0.299 + img.data[j + 1] * 0.587 + img.data[j + 2] * 0.114 - 255) * img.data[j + 3] + 65525) / 65525) ** (1 / this.gamma) * 255);
            j += this.upsideDown ? -4 : 4;
            if (this.gradient) {
              d[i] = e * 3;
              e = f < this.threshold ? (b |= 128 >> p, f) : f - 255;
              if (i > 0) {
                d[i - 1] += e;
              }
              d[i++] += e * 7;
            } else if (f < this.threshold) {
              b |= 128 >> p;
            }
          }
          r += $(b);
        }
      }
      r += `\x1d(L${$(2, 0, 48, 50)}`;
    }
    return r;
  },
  // print QR Code: GS ( k pL pH cn fn n1 n2 GS ( k pL pH cn fn n GS ( k pL pH cn fn n GS ( k pL pH cn fn m d1 ... dk GS ( k pL pH cn fn m
  qrcode(symbol, encoding) {
    const d = iconv.encode(symbol.data, encoding === 'multilingual' ? 'ascii' : encoding).toString('binary').slice(0, 7089);
    return `\x1d(k${$(4, 0, 49, 65, 50, 0)}\x1d(k${$(3, 0, 49, 67, symbol.cell)}\x1d(k${$(3, 0, 49, 69, this.qrlevel[symbol.level])}\x1d(k${$(d.length + 3 & 255, d.length + 3 >> 8 & 255, 49, 80, 48)}${d}\x1d(k${$(3, 0, 49, 81, 48)}`;
  },
  // QR Code error correction level:
  qrlevel: {
    l: 48, m: 49, q: 50, h: 51,
  },
  // print barcode: GS w n GS h n GS H n GS k m n d1 ... dn
  barcode(symbol, encoding) {
    let d = iconv.encode(symbol.data, encoding === 'multilingual' ? 'ascii' : encoding).toString('binary');
    const b = this.bartype[symbol.type] + (/upc|[ej]an/.test(symbol.type) && symbol.data.length < 9);
    switch (b) {
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
    return `\x1dw${$(symbol.width)}\x1dh${$(symbol.height)}\x1dH${$(symbol.hri ? 2 : 0)}\x1dk${$(b, d.length)}${d}`;
  },
  // barcode types:
  bartype: {
    upc: 65, ean: 67, jan: 67, code39: 69, itf: 70, codabar: 71, nw7: 71, code93: 72, code128: 73,
  },
  // generate UPC-E data (convert UPC-E to UPC-A):
  upce: (data) => {
    let r = '';
    const s = data.replace(/((?!^0\d{6,7}$).)*/, '');
    if (s.length > 0) {
      r += s.slice(0, 3);
      switch (s[6]) {
        case '0': case '1': case '2':
          r += `${s[6]}0000${s[3]}${s[4]}${s[5]}`;
          break;
        case '3':
          r += `${s[3]}00000${s[4]}${s[5]}`;
          break;
        case '4':
          r += `${s[3] + s[4]}00000${s[5]}`;
          break;
        default:
          r += `${s[3] + s[4] + s[5]}0000${s[6]}`;
          break;
      }
    }
    return r;
  },
  // CODE128 special characters:
  c128: {
    special: 123, codea: 65, codeb: 66, codec: 67, shift: 83,
  },
  // generate CODE128 data (minimize symbol width):
  code128(data) {
    let r = '';
    const s = data.replace(/((?!^[\x00-\x7f]+$).)*/, '').replace(/{/g, '{{');
    if (s.length > 0) {
      const d = [];
      const p = s.search(/[^ -_]/);
      if (/^\d{2}$/.test(s)) {
        d.push(this.c128.special, this.c128.codec, Number(s));
      } else if (/^\d{4,}/.test(s)) {
        this.code128c(this.c128.codec, s, d);
      } else if (p >= 0 && s.charCodeAt(p) < 32) {
        this.code128a(this.c128.codea, s, d);
      } else if (s.length > 0) {
        this.code128b(this.c128.codeb, s, d);
      } else {
        // end
      }
      r = d.map((c) => $(c)).join('');
    }
    return r;
  },
  // process CODE128 code set A:
  code128a(x, s, d) {
    if (x !== this.c128.shift) {
      d.push(this.c128.special, x);
    }
    s = s.replace(/^((?!\d{4,})[\x00-_])+/, (m) => (m.split('').forEach((c) => d.push(c.charCodeAt(0))), ''));
    s = s.replace(/^\d(?=\d{4}(\d{2})*)/, (m) => (d.push(m.charCodeAt(0)), ''));
    const t = s.slice(1);
    const p = t.search(/[^ -_]/);
    if (/^\d{4,}/.test(s)) {
      this.code128c(this.c128.codec, s, d);
    } else if (p >= 0 && t.charCodeAt(p) < 32) {
      d.push(this.c128.special, this.c128.shift, s.charCodeAt(0));
      this.code128a(this.c128.shift, t, d);
    } else if (s.length > 0) {
      this.code128b(this.c128.codeb, s, d);
    } else {
      // end
    }
  },
  // process CODE128 code set B:
  code128b(x, s, d) {
    if (x !== this.c128.shift) {
      d.push(this.c128.special, x);
    }
    s = s.replace(/^((?!\d{4,})[ -\x7f])+/, (m) => (m.split('').forEach((c) => d.push(c.charCodeAt(0))), ''));
    s = s.replace(/^\d(?=\d{4}(\d{2})*)/, (m) => (d.push(m.charCodeAt(0)), ''));
    const t = s.slice(1);
    const p = t.search(/[^ -_]/);
    if (/^\d{4,}/.test(s)) {
      this.code128c(this.c128.codec, s, d);
    } else if (p >= 0 && t.charCodeAt(p) > 95) {
      d.push(this.c128.special, this.c128.shift, s.charCodeAt(0));
      this.code128b(this.c128.shift, t, d);
    } else if (s.length > 0) {
      this.code128a(this.c128.codea, s, d);
    } else {
      // end
    }
  },
  // process CODE128 code set C:
  code128c(x, s, d) {
    if (x !== this.c128.shift) {
      d.push(this.c128.special, x);
    }
    s = s.replace(/^\d{4,}/g, (m) => m.replace(/\d{2}/g, (c) => (d.push(Number(c)), '')));
    const p = s.search(/[^ -_]/);
    if (p >= 0 && s.charCodeAt(p) < 32) {
      this.code128a(this.c128.codea, s, d);
    } else if (s.length > 0) {
      this.code128b(this.c128.codeb, s, d);
    } else {
      // end
    }
  },
};

//
// SII
//
const _sii = {
  // start printing: ESC @ GS a n ESC M n ESC SP n FS S n1 n2 (ESC 2) (ESC 3 n) ESC { n FS .
  open(printer) {
    this.upsideDown = printer.upsideDown;
    this.spacing = printer.spacing;
    this.cutting = printer.cutting;
    this.gradient = printer.gradient;
    this.gamma = printer.gamma;
    this.threshold = printer.threshold;
    return `\x1b@\x1da\x00\x1bM0\x1b \x00\x1cS\x00\x00${this.spacing ? '\x1b2' : '\x1b3\x00'}\x1b{${$(this.upsideDown)}\x1c.`;
  },
  // finish printing: DC2 q n
  close() {
    return `${this.cutting ? this.cut() : ''}\x12q\x00`;
  },
  // set print area: GS L nL nH GS W nL nH
  area(left, width, right) {
    const m = (this.upsideDown ? right : left) * this.charWidth;
    const w = width * this.charWidth;
    return `\x1dL${$(m & 255, m >> 8 & 255)}\x1dW${$(w & 255, w >> 8 & 255)}`;
  },
  // image split size
  split: 1662,
  // print QR Code: DC2 ; n GS p 1 model e v mode nl nh dk
  qrcode(symbol, encoding) {
    const d = iconv.encode(symbol.data, encoding === 'multilingual' ? 'ascii' : encoding).toString('binary').slice(0, 7089);
    return `\x12;${$(symbol.cell)}\x1dp${$(1, 2, this.qrlevel[symbol.level], 0, 77, d.length & 255, d.length >> 8 & 255)}${d}`;
  },
  // QR Code error correction levels:
  qrlevel: {
    l: 76, m: 77, q: 81, h: 72,
  },
  // print barcode: GS w n GS h n GS H n GS k m n d1 ... dn
  barcode(symbol, encoding) {
    let d = iconv.encode(symbol.data, encoding === 'multilingual' ? 'ascii' : encoding).toString('binary');
    const b = this.bartype[symbol.type] + (/upc|[ej]an/.test(symbol.type) && symbol.data.length < 9);
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
    return `\x1dw${$(symbol.width)}\x1dh${$(symbol.height)}\x1dH${$(symbol.hri ? 2 : 0)}\x1dk${$(b, d.length)}${d}`;
  },
  // generate Codabar data:
  codabar: (data) => data.toUpperCase(),
  // CODE93 special characters:
  c93: {
    escape: 'cU,dA,dB,dC,dD,dE,dF,dG,dH,dI,dJ,dK,dL,dM,dN,dO,dP,dQ,dR,dS,dT,dU,dV,dW,dX,dY,dZ,cA,cB,cC,cD,cE, ,sA,sB,sC,$,%,sF,sG,sH,sI,sJ,+,sL,-,.,/,0,1,2,3,4,5,6,7,8,9,sZ,cF,cG,cH,cI,cJ,cV,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,cK,cL,cM,cN,cO,cW,pA,pB,pC,pD,pE,pF,pG,pH,pI,pJ,pK,pL,pM,pN,pO,pP,pQ,pR,pS,pT,pU,pV,pW,pX,pY,pZ,cP,cQ,cR,cS,cT'.split(','),
    code: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%dcsp'.split('').reduce((a, c, i) => (a[c] = i, a), {}),
    start: 47,
    stop: 48,
  },
  // generate CODE93 data:
  code93(data) {
    let r = '';
    const s = data.replace(/((?!^[\x00-\x7f]+$).)*/, '');
    if (s.length > 0) {
      const d = s.split('').map((c) => this.c93.escape[c.charCodeAt(0)]).join('').split('')
        .map((c) => this.c93.code[c]);
      d.push(this.c93.stop);
      r = d.map((c) => $(c)).join('');
    }
    return r;
  },
  // CODE128 special characters:
  c128: {
    starta: 103, startb: 104, startc: 105, atob: 100, atoc: 99, btoa: 101, btoc: 99, ctoa: 101, ctob: 100, shift: 98, stop: 105,
  },
  // generate CODE128 data (minimize symbol width):
  code128(data) {
    let r = '';
    const s = data.replace(/((?!^[\x00-\x7f]+$).)*/, '');
    if (s.length > 0) {
      const d = [];
      const p = s.search(/[^ -_]/);
      if (/^\d{2}$/.test(s)) {
        d.push(this.c128.startc, Number(s));
      } else if (/^\d{4,}/.test(s)) {
        this.code128c(this.c128.startc, s, d);
      } else if (p >= 0 && s.charCodeAt(p) < 32) {
        this.code128a(this.c128.starta, s, d);
      } else if (s.length > 0) {
        this.code128b(this.c128.startb, s, d);
      } else {
        // end
      }
      d.push(this.c128.stop);
      r = d.map((c) => $(c)).join('');
    }
    return r;
  },
  // process CODE128 code set A:
  code128a(x, s, d) {
    if (x !== this.c128.shift) {
      d.push(x);
    }
    s = s.replace(/^((?!\d{4,})[\x00-_])+/, (m) => (m.split('').forEach((c) => d.push((c.charCodeAt(0) + 64) % 96)), ''));
    s = s.replace(/^\d(?=\d{4}(\d{2})*)/, (m) => (d.push((m.charCodeAt(0) + 64) % 96), ''));
    const t = s.slice(1);
    const p = t.search(/[^ -_]/);
    if (/^\d{4,}/.test(s)) {
      this.code128c(this.c128.atoc, s, d);
    } else if (p >= 0 && t.charCodeAt(p) < 32) {
      d.push(this.c128.shift, s.charCodeAt(0) - 32);
      this.code128a(this.c128.shift, t, d);
    } else if (s.length > 0) {
      this.code128b(this.c128.atob, s, d);
    } else {
      // end
    }
  },
  // process CODE128 code set B:
  code128b(x, s, d) {
    if (x !== this.c128.shift) {
      d.push(x);
    }
    s = s.replace(/^((?!\d{4,})[ -\x7f])+/, (m) => (m.split('').forEach((c) => d.push(c.charCodeAt(0) - 32)), ''));
    s = s.replace(/^\d(?=\d{4}(\d{2})*)/, (m) => (d.push(m.charCodeAt(0) - 32), ''));
    const t = s.slice(1);
    const p = t.search(/[^ -_]/);
    if (/^\d{4,}/.test(s)) {
      this.code128c(this.c128.btoc, s, d);
    } else if (p >= 0 && t.charCodeAt(p) > 95) {
      d.push(this.c128.shift, s.charCodeAt(0) + 64);
      this.code128b(this.c128.shift, t, d);
    } else if (s.length > 0) {
      this.code128a(this.c128.btoa, s, d);
    } else {
      // end
    }
  },
  // process CODE128 code set c:
  code128c(x, s, d) {
    if (x !== this.c128.shift) {
      d.push(x);
    }
    s = s.replace(/^\d{4,}/g, (m) => m.replace(/\d{2}/g, (c) => (d.push(Number(c)), '')));
    const p = s.search(/[^ -_]/);
    if (p >= 0 && s.charCodeAt(p) < 32) {
      this.code128a(this.c128.ctoa, s, d);
    } else if (s.length > 0) {
      this.code128b(this.c128.ctob, s, d);
    } else {
      // end
    }
  },
};

//
// Citizen
//
const _citizen = {
  // image split size
  split: 1662,
};

//
// Fujitsu Isotec
//
const _fit = {
  // image split size
  split: 1662,
  // print image: GS 8 L p1 p2 p3 p4 m fn a bx by c xL xH yL yH d1 ... dk GS ( L pL pH m fn
  image(image, align, left, width, right) {
    let r = (this.upsideDown && align === 2 ? this.area(right, width, left) : this.area(left, width, right)) + this.align(align);
    const img = PNG.sync.read(Buffer.from(image, 'base64'));
    const w = img.width;
    const d = Array(w).fill(0);
    let j = 0;
    for (let z = 0; z < img.height; z += this.split) {
      const h = Math.min(this.split, img.height - z);
      const l = (w + 7 >> 3) * h + 10;
      r += `\x1d8L${$(l & 255, l >> 8 & 255, l >> 16 & 255, l >> 24 & 255, 48, 112, 48, 1, 1, 49, w & 255, w >> 8 & 255, h & 255, h >> 8 & 255)}`;
      for (let y = 0; y < h; y++) {
        let i = 0; let
          e = 0;
        for (let x = 0; x < w; x += 8) {
          let b = 0;
          const q = Math.min(w - x, 8);
          for (let p = 0; p < q; p++) {
            const f = Math.floor((d[i] + e * 5) / 16 + (((img.data[j] * 0.299 + img.data[j + 1] * 0.587 + img.data[j + 2] * 0.114 - 255) * img.data[j + 3] + 65525) / 65525) ** (1 / this.gamma) * 255);
            j += 4;
            if (this.gradient) {
              d[i] = e * 3;
              e = f < this.threshold ? (b |= 128 >> p, f) : f - 255;
              if (i > 0) {
                d[i - 1] += e;
              }
              d[i++] += e * 7;
            } else if (f < this.threshold) {
              b |= 128 >> p;
            }
          }
          r += $(b);
        }
      }
      r += `\x1d(L${$(2, 0, 48, 50)}`;
    }
    return r;
  },
};

//
// ESC/POS Impact
//
const _impact = {
  font: 0,
  style: 0,
  color: 0,
  margin: 0,
  position: 0,
  red: [],
  black: [],
  // start printing: ESC @ GS a n ESC M n (ESC 2) (ESC 3 n) ESC { n
  open(printer) {
    this.style = this.font;
    this.color = 0;
    this.margin = 0;
    this.position = 0;
    this.red = [];
    this.black = [];
    this.upsideDown = printer.upsideDown;
    this.spacing = printer.spacing;
    this.cutting = printer.cutting;
    this.gradient = printer.gradient;
    this.gamma = printer.gamma;
    this.threshold = printer.threshold;
    return `\x1b@\x1da\x00\x1bM${$(this.font)}${this.spacing ? '\x1b2' : '\x1b3\x12'}\x1b{${$(this.upsideDown)}\x1c.`;
  },
  // finish printing: GS r n
  close() {
    return `${this.cutting ? this.cut() : ''}\x1dr1`;
  },
  // set print area:
  area(left, width, right) {
    this.margin = left;
    return '';
  },
  // set line alignment: ESC a n
  align: (align) => `\x1ba${$(align)}`,
  // set absolute print position:
  absolute(position) {
    this.position = position;
    return '';
  },
  // set relative print position:
  relative(position) {
    this.position += Math.round(position);
    return '';
  },
  // print horizontal rule: ESC t n ...
  hr(width) {
    return `\x1b!${$(this.font)}${' '.repeat(this.margin)}\x1bt\x01${'\x95'.repeat(width)}`;
  },
  // print vertical rules: ESC ! n ESC t n ...
  vr(widths, height) {
    const d = `\x1b!${$(this.font + (height > 1 ? 16 : 0))}\x1bt\x01\x96`;
    this.black.push({ data: d, index: this.position, length: 1 });
    widths.forEach((w) => {
      this.position += w + 1;
      this.black.push({ data: d, index: this.position, length: 1 });
    });
    return '';
  },
  // start rules: ESC ! n ESC t n ...
  vrstart(widths) {
    return `\x1b!${$(this.font)}${' '.repeat(this.margin)}\x1bt\x01${widths.reduce((a, w) => `${a + '\x95'.repeat(w)}\x91`, '\x9c').slice(0, -1)}\x9d`;
  },
  // stop rules: ESC ! n ESC t n ...
  vrstop(widths) {
    return `\x1b!${$(this.font)}${' '.repeat(this.margin)}\x1bt\x01${widths.reduce((a, w) => `${a + '\x95'.repeat(w)}\x90`, '\x9e').slice(0, -1)}\x9f`;
  },
  // print vertical and horizontal rules: ESC ! n ESC t n ...
  vrhr(widths1, widths2, dl, dr) {
    const r1 = ' '.repeat(Math.max(-dl, 0)) + widths1.reduce((a, w) => `${a + '\x95'.repeat(w)}\x90`, dl > 0 ? '\x9e' : '\x9a').slice(0, -1) + (dr < 0 ? '\x9f' : '\x9b') + ' '.repeat(Math.max(dr, 0));
    const r2 = ' '.repeat(Math.max(dl, 0)) + widths2.reduce((a, w) => `${a + '\x95'.repeat(w)}\x91`, dl < 0 ? '\x9c' : '\x98').slice(0, -1) + (dr > 0 ? '\x9d' : '\x99') + ' '.repeat(Math.max(-dr, 0));
    return `\x1b!${$(this.font)}${' '.repeat(this.margin)}\x1bt\x01${r2.split('').map((c, i) => this.vrtable[c][r1[i]]).join('')}`;
  },
  // set line spacing and feed new line: (ESC 2) (ESC 3 n)
  vrlf(vr) {
    return (vr === this.upsideDown && this.spacing ? '\x1b2' : '\x1b3\x12') + this.lf();
  },
  // cut paper: GS V m n
  cut: () => '\x1dVB\x00',
  // underline text:
  ul() {
    this.style += 128;
    return '';
  },
  // emphasize text:
  em() {
    this.style += 8;
    return '';
  },
  // invert text:
  iv() {
    this.color = 1;
    return '';
  },
  // scale up text:
  wh(wh) {
    if (wh > 0) {
      this.style += wh < 3 ? 64 >> wh : 48;
    }
    return '';
  },
  // cancel text decoration:
  normal() {
    this.style = this.font;
    this.color = 0;
    return '';
  },
  // print text:
  text(text, encoding) {
    const t = iconv.encode(text, encoding === 'multilingual' ? 'ascii' : encoding).toString('binary');
    const d = `\x1b!${$(this.style)}${encoding === 'multilingual' ? this.multiconv(text) : this.codepage[encoding] + iconv.encode(text, encoding).toString('binary')}`;
    const l = t.length * (this.style & 32 ? 2 : 1);
    if (this.color > 0) {
      this.red.push({ data: d, index: this.position, length: l });
    } else {
      this.black.push({ data: d, index: this.position, length: l });
    }
    this.position += l;
    return '';
  },
  // feed new line: LF
  lf() {
    let r = '';
    if (this.red.length > 0) {
      let p = 0;
      r += `${this.red.sort((a, b) => a.index - b.index).reduce((a, c) => {
        const s = `${a}\x1b!${$(this.font)}${' '.repeat(c.index - p)}${c.data}`;
        p = c.index + c.length;
        return s;
      }, `\x1br\x01\x1b!${$(this.font)}${' '.repeat(this.margin)}`)}\x0d\x1br\x00`;
    }
    if (this.black.length > 0) {
      let p = 0;
      r += this.black.sort((a, b) => a.index - b.index).reduce((a, c) => {
        const s = `${a}\x1b!${$(this.font)}${' '.repeat(c.index - p)}${c.data}`;
        p = c.index + c.length;
        return s;
      }, `\x1b!${$(this.font)}${' '.repeat(this.margin)}`);
    }
    r += '\x0a';
    this.position = 0;
    this.red = [];
    this.black = [];
    return r;
  },
  // insert commands:
  command: (command) => command,
  // print image: ESC * 0 wL wH d1 ... dk ESC J n
  image(image, align, left, width, right) {
    let r = this.align(align);
    const img = PNG.sync.read(Buffer.from(image, 'base64'));
    const w = img.width;
    if (w < 1024) {
      const d = Array(w).fill(0);
      let j = this.upsideDown ? img.data.length - 4 : 0;
      for (let y = 0; y < img.height; y += 8) {
        const b = Array(w).fill(0);
        const h = Math.min(8, img.height - y);
        for (let p = 0; p < h; p++) {
          let i = 0; let
            e = 0;
          for (let x = 0; x < w; x++) {
            const f = Math.floor((d[i] + e * 5) / 16 + (((img.data[j] * 0.299 + img.data[j + 1] * 0.587 + img.data[j + 2] * 0.114 - 255) * img.data[j + 3] + 65525) / 65525) ** (1 / this.gamma) * 255);
            j += this.upsideDown ? -4 : 4;
            if (this.gradient) {
              d[i] = e * 3;
              e = f < this.threshold ? (this.upsideDown ? b[w - x - 1] |= 1 << p : b[x] |= 128 >> p, f) : f - 255;
              if (i > 0) {
                d[i - 1] += e;
              }
              d[i++] += e * 7;
            } else if (f < this.threshold) {
              this.upsideDown ? b[w - x - 1] |= 1 << p : b[x] |= 128 >> p;
            }
          }
        }
        r += `\x1b*\x00${$(w & 255, w >> 8 & 255)}${b.map((c) => $(c)).join('')}\x1bJ${$(h * 2)}`;
      }
    }
    return r;
  },
};

//
// ESC/POS Impact Font B
//
const _fontb = {
  font: 1,
};

//
// StarPRNT Common
//
const _star = {
  // printer configuration
  upsideDown: false,
  spacing: false,
  cutting: true,
  gradient: true,
  gamma: 1.8,
  threshold: 128,
  // start printing: ESC @ ESC RS a n ESC RS F n ESC SP n ESC s n1 n2 (ESC z n) (ESC 0) (SI) (DC2)
  open(printer) {
    this.upsideDown = printer.upsideDown;
    this.spacing = printer.spacing;
    this.cutting = printer.cutting;
    this.gradient = printer.gradient;
    this.gamma = printer.gamma;
    this.threshold = printer.threshold;
    return `\x1b@\x1b\x1ea\x00\x1b\x1eF\x00\x1b 0\x1bs00${this.spacing ? '\x1bz1' : '\x1b0'}${this.upsideDown ? '\x0f' : '\x12'}`;
  },
  // finish printing: ESC GS ETX s n1 n2
  close() {
    return `${this.cutting ? this.cut() : ''}\x1b\x1d\x03\x01\x00\x00`;
  },
  // set print area: ESC l n ESC Q n
  area: (left, width, right) => `\x1bl${$(0)}\x1bQ${$(left + width + right)}\x1bl${$(left)}\x1bQ${$(left + width)}`,
  // set line alignment: ESC GS a n
  align: (align) => `\x1b\x1da${$(align)}`,
  // set absolute print position: ESC GS A n1 n2
  absolute(position) {
    const p = position * this.charWidth;
    return `\x1b\x1dA${$(p & 255, p >> 8 & 255)}`;
  },
  // set relative print position: ESC GS R n1 n2
  relative(position) {
    const p = position * this.charWidth;
    return `\x1b\x1dR${$(p & 255, p >> 8 & 255)}`;
  },
  // set line spacing and feed new line: (ESC z n) (ESC 0)
  vrlf(vr) {
    return (this.upsideDown ? this.lf() : '') + (vr === this.upsideDown && this.spacing ? '\x1bz1' : '\x1b0') + (this.upsideDown ? '' : this.lf());
  },
  // cut paper: ESC d n
  cut: () => '\x1bd3',
  // underline text: ESC - n
  ul: () => '\x1b-1',
  // emphasize text: ESC E
  em: () => '\x1bE',
  // invert text: ESC 4
  iv: () => '\x1b4',
  // scale up text: ESC i n1 n2
  wh: (wh) => `\x1bi${wh < 3 ? $(wh >> 1 & 1, wh & 1) : $(wh - 2, wh - 2)}`,
  // cancel text decoration: ESC - n ESC F ESC 5 ESC i n1 n2
  normal: () => `\x1b-0\x1bF\x1b5\x1bi${$(0, 0)}`,
  // print text:
  text(text, encoding) {
    return encoding === 'multilingual' ? this.multiconv(text) : this.codepage[encoding] + iconv.encode(text, encoding).toString('binary');
  },
  // codepages: (ESC GS t n) (ESC $ n) (ESC R n)
  codepage: {
    cp437: '\x1b\x1dt\x01',
    cp852: '\x1b\x1dt\x05',
    cp858: '\x1b\x1dt\x04',
    cp860: '\x1b\x1dt\x06',
    cp863: '\x1b\x1dt\x08',
    cp865: '\x1b\x1dt\x09',
    cp866: '\x1b\x1dt\x0a',
    cp1252: '\x1b\x1dt\x20',
    cp932: '\x1b$1\x1bR8',
    cp936: '',
    cp949: '\x1bRD',
    cp950: '',
    shiftjis: '\x1b$1\x1bR8',
    gb18030: '',
    ksc5601: '\x1bRD',
    big5: '',
  },
  // convert to multiple codepage characters: (ESC GS t n)
  multiconv: (text) => {
    let p = ''; let
      r = '';
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c > '\x7f') {
        const d = multitable[c];
        if (d) {
          const q = d[0];
          if (p === q) {
            r += d[1];
          } else {
            r += `\x1b\x1dt${starpage[q]}${d[1]}`;
            p = q;
          }
        } else {
          r += '?';
        }
      } else {
        r += c;
      }
    }
    return r;
  },
  // feed new line: LF
  lf: () => '\x0a',
  // insert commands:
  command: (command) => command,
  // image split size
  split: 2400,
  // print image: ESC GS S m xL xH yL yH n [d11 d12 ... d1k]
  image(image, align, left, width, right) {
    const img = PNG.sync.read(Buffer.from(image, 'base64'));
    const w = img.width;
    const d = Array(w).fill(0);
    const l = w + 7 >> 3;
    const s = [];
    let j = 0;
    for (let z = 0; z < img.height; z += this.split) {
      const h = Math.min(this.split, img.height - z);
      let r = `\x1b\x1dS${$(1, l & 255, l >> 8 & 255, h & 255, h >> 8 & 255, 0)}`;
      for (let y = 0; y < h; y++) {
        let i = 0; let
          e = 0;
        for (let x = 0; x < w; x += 8) {
          let b = 0;
          const q = Math.min(w - x, 8);
          for (let p = 0; p < q; p++) {
            const f = Math.floor((d[i] + e * 5) / 16 + (((img.data[j] * 0.299 + img.data[j + 1] * 0.587 + img.data[j + 2] * 0.114 - 255) * img.data[j + 3] + 65525) / 65525) ** (1 / this.gamma) * 255);
            j += 4;
            if (this.gradient) {
              d[i] = e * 3;
              e = f < this.threshold ? (b |= 128 >> p, f) : f - 255;
              if (i > 0) {
                d[i - 1] += e;
              }
              d[i++] += e * 7;
            } else if (f < this.threshold) {
              b |= 128 >> p;
            }
          }
          r += $(b);
        }
      }
      s.push(r);
    }
    if (this.upsideDown) {
      s.reverse();
    }
    return this.area(left, width, right) + this.align(align) + s.join('');
  },
  // print QR Code: ESC GS y S 0 n ESC GS y S 1 n ESC GS y S 2 n ESC GS y D 1 m nL nH d1 d2 ... dk ESC GS y P
  qrcode(symbol, encoding) {
    const d = iconv.encode(symbol.data, encoding === 'multilingual' ? 'ascii' : encoding).toString('binary').slice(0, 7089);
    return `\x1b\x1dyS0${$(2)}\x1b\x1dyS1${$(this.qrlevel[symbol.level])}\x1b\x1dyS2${$(symbol.cell)}\x1b\x1dyD1${$(0, d.length & 255, d.length >> 8 & 255)}${d}\x1b\x1dyP`;
  },
  // QR Code error correction levels:
  qrlevel: {
    l: 0, m: 1, q: 2, h: 3,
  },
  // print barcode: ESC b n1 n2 n3 n4 d1 ... dk RS
  barcode(symbol, encoding) {
    let d = iconv.encode(symbol.data, encoding === 'multilingual' ? 'ascii' : encoding).toString('binary');
    const b = this.bartype[symbol.type] - (/upc|[ej]an/.test(symbol.type) && symbol.data.length < 9);
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
    return `\x1bb${$(b, symbol.hri ? 50 : 49, symbol.width + 47, symbol.height)}${d}\x1e`;
  },
  // barcode types:
  bartype: {
    upc: 49, ean: 51, jan: 51, code39: 52, itf: 53, codabar: 56, nw7: 56, code93: 55, code128: 54,
  },
  // generate UPC-E data (convert UPC-E to UPC-A):
  upce: (data) => {
    let r = '';
    const s = data.replace(/((?!^0\d{6,7}$).)*/, '');
    if (s.length > 0) {
      r += s.slice(0, 3);
      switch (s[6]) {
        case '0': case '1': case '2':
          r += `${s[6]}0000${s[3]}${s[4]}${s[5]}`;
          break;
        case '3':
          r += `${s[3]}00000${s[4]}${s[5]}`;
          break;
        case '4':
          r += `${s[3] + s[4]}00000${s[5]}`;
          break;
        default:
          r += `${s[3] + s[4] + s[5]}0000${s[6]}`;
          break;
      }
    }
    return r;
  },
  // generate CODE128 data:
  code128: (data) => data.replace(/((?!^[\x00-\x7f]+$).)*/, '').replace(/%/g, '%0').replace(/[\x00-\x1f]/g, (m) => `%${$(m.charCodeAt(0) + 64)}`).replace(/\x7f/g, '%5'),
};

//
// Star Line Mode
//
const _line = {
  // finish printing: ESC GS ETX s n1 n2 EOT
  close() {
    return `${this.cutting ? this.cut() : ''}\x1b\x1d\x03\x01\x00\x00\x04`;
  },
  // print image: ESC k n1 n2 d1 ... dk
  image(image, align, left, width, right) {
    const img = PNG.sync.read(Buffer.from(image, 'base64'));
    const w = img.width;
    const h = img.height;
    const d = Array(w).fill(0);
    const l = w + 7 >> 3;
    const s = [];
    let j = 0;
    for (let y = 0; y < h; y += 24) {
      let r = `\x1bk${$(l & 255, l >> 8 & 255)}`;
      for (let z = 0; z < 24; z++) {
        if (y + z < h) {
          let i = 0; let
            e = 0;
          for (let x = 0; x < w; x += 8) {
            let b = 0;
            const q = Math.min(w - x, 8);
            for (let p = 0; p < q; p++) {
              const f = Math.floor((d[i] + e * 5) / 16 + (((img.data[j] * 0.299 + img.data[j + 1] * 0.587 + img.data[j + 2] * 0.114 - 255) * img.data[j + 3] + 65525) / 65525) ** (1 / this.gamma) * 255);
              j += 4;
              if (this.gradient) {
                d[i] = e * 3;
                e = f < this.threshold ? (b |= 128 >> p, f) : f - 255;
                if (i > 0) {
                  d[i - 1] += e;
                }
                d[i++] += e * 7;
              } else if (f < this.threshold) {
                b |= 128 >> p;
              }
            }
            r += $(b);
          }
        } else {
          r += '\x00'.repeat(l);
        }
      }
      s.push(`${r}\x0a`);
    }
    if (this.upsideDown) {
      s.reverse();
    }
    return `\x1b0${this.area(left, width, right)}${this.align(align)}${s.join('')}${this.spacing ? '\x1bz1' : '\x1b0'}`;
  },
};

//
// Command Emulator Star Line Mode
//
const _emu = {
  // set line spacing and feed new line: (ESC z n) (ESC 0)
  vrlf(vr) {
    return (vr === this.upsideDown && this.spacing ? '\x1bz1' : '\x1b0') + this.lf();
  },
};

//
// Star SBCS
//
const _sbcs = {
  // print horizontal rule: ESC GS t n ...
  hr: (width) => `\x1b\x1dt\x01${'\xc4'.repeat(width)}`,
  // print vertical rules: ESC i n1 n2 ESC GS t n ...
  vr(widths, height) {
    return widths.reduce((a, w) => `${a + this.relative(w)}\xb3`, `\x1bi${$(height - 1, 0)}\x1b\x1dt\x01\xb3`);
  },
  // start rules: ESC GS t n ...
  vrstart: (widths) => `\x1b\x1dt\x01${widths.reduce((a, w) => `${a + '\xc4'.repeat(w)}\xc2`, '\xda').slice(0, -1)}\xbf`,
  // stop rules: ESC GS t n ...
  vrstop: (widths) => `\x1b\x1dt\x01${widths.reduce((a, w) => `${a + '\xc4'.repeat(w)}\xc1`, '\xc0').slice(0, -1)}\xd9`,
  // print vertical and horizontal rules: ESC GS t n ...
  vrhr(widths1, widths2, dl, dr) {
    const r1 = `${' '.repeat(Math.max(-dl, 0)) + widths1.reduce((a, w) => `${a + '\xc4'.repeat(w)}\xc1`, '\xc0').slice(0, -1)}\xd9${' '.repeat(Math.max(dr, 0))}`;
    const r2 = `${' '.repeat(Math.max(dl, 0)) + widths2.reduce((a, w) => `${a + '\xc4'.repeat(w)}\xc2`, '\xda').slice(0, -1)}\xbf${' '.repeat(Math.max(-dr, 0))}`;
    return `\x1b\x1dt\x01${r2.split('').map((c, i) => this.vrtable[c][r1[i]]).join('')}`;
  },
  // ruled line composition
  vrtable: {
    ' ': {
      ' ': ' ', À: '\xc0', Á: '\xc1', Ä: '\xc4', Ù: '\xd9',
    },
    '\xbf': {
      ' ': '\xbf', À: '\xc5', Á: '\xc5', Ä: '\xc2', Ù: '\xb4',
    },
    Â: {
      ' ': '\xc2', À: '\xc5', Á: '\xc5', Ä: '\xc2', Ù: '\xc5',
    },
    Ä: {
      ' ': '\xc4', À: '\xc1', Á: '\xc1', Ä: '\xc4', Ù: '\xc1',
    },
    Ú: {
      ' ': '\xda', À: '\xc3', Á: '\xc5', Ä: '\xc2', Ù: '\xc5',
    },
  },
};

//
// Star MBCS Japanese
//
const _mbcs = {
  // print horizontal rule: ESC $ n ...
  hr: (width) => `\x1b$0${'\x95'.repeat(width)}`,
  // print vertical rules: ESC i n1 n2 ESC $ n ...
  vr(widths, height) {
    return widths.reduce((a, w) => `${a + this.relative(w)}\x96`, `\x1bi${$(height - 1, 0)}\x1b$0\x96`);
  },
  // start rules: ESC $ n ...
  vrstart: (widths) => `\x1b$0${widths.reduce((a, w) => `${a + '\x95'.repeat(w)}\x91`, '\x9c').slice(0, -1)}\x9d`,
  // stop rules: ESC $ n ...
  vrstop: (widths) => `\x1b$0${widths.reduce((a, w) => `${a + '\x95'.repeat(w)}\x90`, '\x9e').slice(0, -1)}\x9f`,
  // print vertical and horizontal rules: ESC $ n ...
  vrhr(widths1, widths2, dl, dr) {
    const r1 = ' '.repeat(Math.max(-dl, 0)) + widths1.reduce((a, w) => `${a + '\x95'.repeat(w)}\x90`, dl > 0 ? '\x9e' : '\x9a').slice(0, -1) + (dr < 0 ? '\x9f' : '\x9b') + ' '.repeat(Math.max(dr, 0));
    const r2 = ' '.repeat(Math.max(dl, 0)) + widths2.reduce((a, w) => `${a + '\x95'.repeat(w)}\x91`, dl < 0 ? '\x9c' : '\x98').slice(0, -1) + (dr > 0 ? '\x9d' : '\x99') + ' '.repeat(Math.max(-dr, 0));
    return `\x1b$0${r2.split('').map((c, i) => this.vrtable[c][r1[i]]).join('')}`;
  },
  // ruled line composition
  vrtable: {
    ' ': {
      ' ': ' ', '\x90': '\x90', '\x95': '\x95', '\x9a': '\x9a', '\x9b': '\x9b', '\x9e': '\x9e', '\x9f': '\x9f',
    },
    '\x91': {
      ' ': '\x91', '\x90': '\x8f', '\x95': '\x91', '\x9a': '\x8f', '\x9b': '\x8f', '\x9e': '\x8f', '\x9f': '\x8f',
    },
    '\x95': {
      ' ': '\x95', '\x90': '\x90', '\x95': '\x95', '\x9a': '\x90', '\x9b': '\x90', '\x9e': '\x90', '\x9f': '\x90',
    },
    '\x98': {
      ' ': '\x98', '\x90': '\x8f', '\x95': '\x91', '\x9a': '\x93', '\x9b': '\x8f', '\x9e': '\x93', '\x9f': '\x8f',
    },
    '\x99': {
      ' ': '\x99', '\x90': '\x8f', '\x95': '\x91', '\x9a': '\x8f', '\x9b': '\x92', '\x9e': '\x8f', '\x9f': '\x92',
    },
    '\x9c': {
      ' ': '\x9c', '\x90': '\x8f', '\x95': '\x91', '\x9a': '\x93', '\x9b': '\x8f', '\x9e': '\x93', '\x9f': '\x8f',
    },
    '\x9d': {
      ' ': '\x9d', '\x90': '\x8f', '\x95': '\x91', '\x9a': '\x8f', '\x9b': '\x92', '\x9e': '\x8f', '\x9f': '\x92',
    },
  },
};

//
// Star MBCS Chinese Korean
//
const _mbcs2 = {
  // print horizontal rule: - ...
  hr: (width) => '-'.repeat(width),
  // print vertical rules: ESC i n1 n2 | ...
  vr(widths, height) {
    return widths.reduce((a, w) => `${a + this.relative(w)}|`, `\x1bi${$(height - 1, 0)}|`);
  },
  // start rules: + - ...
  vrstart: (widths) => widths.reduce((a, w) => `${a + '-'.repeat(w)}+`, '+'),
  // stop rules: + - ...
  vrstop: (widths) => widths.reduce((a, w) => `${a + '-'.repeat(w)}+`, '+'),
  // print vertical and horizontal rules: + - ...
  vrhr(widths1, widths2, dl, dr) {
    const r1 = ' '.repeat(Math.max(-dl, 0)) + widths1.reduce((a, w) => `${a + '-'.repeat(w)}+`, '+') + ' '.repeat(Math.max(dr, 0));
    const r2 = ' '.repeat(Math.max(dl, 0)) + widths2.reduce((a, w) => `${a + '-'.repeat(w)}+`, '+') + ' '.repeat(Math.max(-dr, 0));
    return r2.split('').map((c, i) => this.vrtable[c][r1[i]]).join('');
  },
  // ruled line composition
  vrtable: {
    ' ': { ' ': ' ', '+': '+', '-': '-' },
    '+': { ' ': '+', '+': '+', '-': '+' },
    '-': { ' ': '-', '+': '+', '-': '-' },
  },
};

//
// Star Graphic Mode
//
const _stargraphic = {
  // printer configuration
  upsideDown: false,
  spacing: false,
  cutting: true,
  gradient: true,
  gamma: 1.8,
  threshold: 128,
  // start printing: ESC RS a n ESC * r A ESC * r P n NUL (ESC * r E n NUL)
  open(printer: Printer) {
    this.upsideDown = printer.upsideDown;
    this.spacing = printer.spacing;
    this.cutting = printer.cutting;
    this.gradient = printer.gradient;
    this.gamma = printer.gamma;
    this.threshold = printer.threshold;
    return `\x1b\x1ea\x00\x1b*rA\x1b*rP0\x00${this.cutting ? '' : '\x1b*rE1\x00'}`;
  },
  // finish printing: ESC * r B ESC ACK SOH
  close() {
    return '\x1b*rB\x1b\x06\x01';
  },
  // cut paper: ESC FF NUL
  cut: () => '\x1b\x0c\x00',
  // feed new line: ESC * r Y n NUL
  lf() {
    return `\x1b*rY${this.charWidth * (this.spacing ? 2.5 : 2)}\x00`;
  },
  // insert commands:
  command: (command) => command,
  // print image: b n1 n2 data
  image(image, align, left, width, right) {
    let r = '';
    const img = PNG.sync.read(Buffer.from(image, 'base64'));
    const w = img.width;
    const d = Array(w).fill(0);
    const m = Math.max((this.upsideDown ? right : left) * this.charWidth + (width * this.charWidth - w) * (this.upsideDown ? 2 - align : align) >> 1, 0);
    const l = m + w + 7 >> 3;
    let j = this.upsideDown ? img.data.length - 4 : 0;
    for (let y = 0; y < img.height; y++) {
      let i = 0; let
        e = 0;
      r += `b${$(l & 255, l >> 8 & 255)}`;
      for (let x = 0; x < m + w; x += 8) {
        let b = 0;
        const q = Math.min(m + w - x, 8);
        for (let p = 0; p < q; p++) {
          if (m <= x + p) {
            const f = Math.floor((d[i] + e * 5) / 16 + (((img.data[j] * 0.299 + img.data[j + 1] * 0.587 + img.data[j + 2] * 0.114 - 255) * img.data[j + 3] + 65525) / 65525) ** (1 / this.gamma) * 255);
            j += this.upsideDown ? -4 : 4;
            if (this.gradient) {
              d[i] = e * 3;
              e = f < this.threshold ? (b |= 128 >> p, f) : f - 255;
              if (i > 0) {
                d[i - 1] += e;
              }
              d[i++] += e * 7;
            } else if (f < this.threshold) {
              b |= 128 >> p;
            }
          }
        }
        r += $(b);
      }
    }
    return r;
  },
};

// command set
const _commands = {
  base: { ..._base },
  svg: { ..._base, ..._svg },
  escpos: { ..._base, ..._escpos, ..._thermal },
  sii: {
    ..._base, ..._escpos, ..._thermal, ..._sii,
  },
  citizen: {
    ..._base, ..._escpos, ..._thermal, ..._citizen,
  },
  fit: {
    ..._base, ..._escpos, ..._thermal, ..._fit,
  },
  impact: { ..._base, ..._escpos, ..._impact },
  impactb: {
    ..._base, ..._escpos, ..._impact, ..._fontb,
  },
  starsbcs: { ..._base, ..._star, ..._sbcs },
  starmbcs: { ..._base, ..._star, ..._mbcs },
  starmbcs2: { ..._base, ..._star, ..._mbcs2 },
  starlinesbcs: {
    ..._base, ..._star, ..._line, ..._sbcs,
  },
  starlinembcs: {
    ..._base, ..._star, ..._line, ..._mbcs,
  },
  starlinembcs2: {
    ..._base, ..._star, ..._line, ..._mbcs2,
  },
  emustarlinesbcs: {
    ..._base, ..._star, ..._line, ..._emu, ..._sbcs,
  },
  emustarlinembcs: {
    ..._base, ..._star, ..._line, ..._emu, ..._mbcs,
  },
  emustarlinembcs2: {
    ..._base, ..._star, ..._line, ..._emu, ..._mbcs2,
  },
  stargraphic: { ..._base, ..._stargraphic },
};
const commands: Commands = Object.assign(Object.create(null), _commands);
const receiptline = {
  getLangEncoding, commands, createTransform, transform,
};

export default receiptline;
export type { Encoding };
