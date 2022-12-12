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

declare module 'receiptline' {
    import { Transform } from 'node:stream';
    /**
     * Encoding
     */
    type Encoding =
        'cp437' | 'cp852' | 'cp858' | 'cp860' | 'cp863' | 'cp865' |
        'cp866' | 'cp1252' | 'cp932' | 'cp936' | 'cp949' | 'cp950' |
        'multilingual' | 'shiftjis' | 'gb18030' | 'ksc5601' | 'big5' | 'tis620';
    /**
     * Printer configuration
     */
    type Printer = {
        /** characters per line (default: 48) */
        cpl?: number;
        /** character encoding (default: cp437) */
        encoding?: Encoding;
        /** true: photos, false: text, barcodes, and 2D codes (default: true) */
        gradient?: boolean;
        /** image gamma correction (range: 0.1 - 10.0, default: 1.8) */
        gamma?: number;
        /** image thresholding (range: 0 - 255, default: 128) */
        threshold?: number;
        /** upside down (default: false) */
        upsideDown?: boolean;
        /** line spacing (default: false) */
        spacing?: boolean;
        /** paper cuting (default: true) */
        cutting?: boolean;
        /** command set (default: svg) */
        command?: keyof Commands | BaseCommand;
        /** extra properties */
        [propName: string]: any;
    };
    /**
     * Commands
     */
    type Commands = {
        /** Base command set */
        base: BaseCommand;
        /** SVG */
        svg: BaseCommand;
        /** Text */
        text: BaseCommand;
        /** ESC/POS */
        escpos: BaseCommand;
        /** ESC/POS (Epson) */
        epson: BaseCommand;
        /** ESC/POS (Seiko Instruments) */
        sii: BaseCommand;
        /** ESC/POS (Citizen) */
        citizen: BaseCommand;
        /** ESC/POS (Fujitsu) */
        fit: BaseCommand;
        /** ESC/POS (TM-U220) */
        impact: BaseCommand;
        /** ESC/POS (TM-U220 Font B) */
        impactb: BaseCommand;
        /** ESC/POS (Generic) */
        generic: BaseCommand;
        /** StarPRNT (SBCS, Thai) */
        starsbcs: BaseCommand;
        /** StarPRNT (Japanese) */
        starmbcs: BaseCommand;
        /** StarPRNT (Chinese, Korean) */
        starmbcs2: BaseCommand;
        /** Star Line Mode (SBCS) */
        starlinesbcs: BaseCommand;
        /** Star Line Mode (Japanese) */
        starlinembcs: BaseCommand;
        /** Star Line Mode (Chinsese, Korean) */
        starlinembcs2: BaseCommand;
        /** Command Emulator Star Line Mode (SBCS) */
        emustarlinesbcs: BaseCommand;
        /** Command Emulator Star Line Mode (Japanese) */
        emustarlinembcs: BaseCommand;
        /** Command Emulator Star Line Mode (Chinsese, Korean) */
        emustarlinembcs2: BaseCommand;
        /** Star Graphic Mode (TSP100LAN) */
        stargraphic: BaseCommand;
        /** Star Mode on dot impact printers */
        starimpact: BaseCommand;
        /** Star Mode on dot impact printers (Font 5x9 2P-1) */
        starimpact2: BaseCommand;
        /** Star Mode on dot impact printers (Font 5x9 3P-1) */
        starimpact3: BaseCommand;
    };
    /**
     * QR Code
     */
    type QRCode = {
        /** 2D code data */
        data: string;
        /** 2D code type */
        type: 'qrcode';
        /** cell size (3-8 px) */
        cell: number;
        /** error correction level */
        level: 'l' | 'm' | 'q' | 'h';
    };
    /**
     * Barcode
     */
    type Barcode = {
        /** barcode data */
        data: string;
        /** barcode type */
        type: 'upc' | 'ean' | 'jan' | 'code39' | 'itf' | 'codabar' | 'nw7' | 'code93' | 'code128';
        /** barcode module width (2-4 px) */
        width: number;
        /** barcode module height (24-240 px) */
        height: number;
        /** human readable interpretation */
        hri: boolean;
        /** quiet zone for barcode generator */
        quietZone?: boolean;
    };
    /**
     * Barcode form
     */
    type BarcodeForm = {
        /** barcode length */
        length: number;
        /** barcode height */
        height: number;
        /** widths (quiet zone, bar, space, ... , bar, quiet zone) */
        widths: number[];
        /** human readable interpretation */
        hri: boolean;
        /** barcode text */
        text: string;
    };
    /**
     * Barcode generator
     */
    interface BarcodeGenerator {
        /**
         * Generate barcode.
         * @param {Barcode} symbol barcode information (data, type, width, height, hri, quietZone)
         * @returns {BarcodeForm} barcode form
         */
        generate(symbol: Barcode): BarcodeForm;
    }
    /**
     * Base command set
     */
    interface BaseCommand {
        /**
         * Character width.
         * @type {number} character width (dots per character)
         */
        charWidth: number;
        /**
         * Measure text width.
         * @param {string} text string to measure
         * @param {Encoding} encoding codepage
         * @returns {number} string width
         */
        measureText(text: string, encoding: Encoding): number;
        /**
         * Create character array from string (supporting Thai combining characters).
         * @param {string} text string
         * @param {Encoding} encoding codepage
         * @returns {string[]} array instance
         */
        arrayFrom(text: string, encoding: Encoding): string[];
        /**
         * Start printing.
         * @param {Printer} printer printer configuration
         * @returns {string} commands
         */
        open(printer: Printer): string;
        /**
         * Finish printing.
         * @returns {string} commands
         */
        close(): string;
        /**
         * Set print area.
         * @param {number} left left margin (unit: characters)
         * @param {number} width print area (unit: characters)
         * @param {number} right right margin (unit: characters)
         * @returns {string} commands
         */
        area(left: number, width: number, right: number): string;
        /**
         * Set line alignment.
         * @param {number} align line alignment (0: left, 1: center, 2: right)
         * @returns {string} commands
         */
        align(align: number): string;
        /**
         * Set absolute print position.
         * @param {number} position absolute position (unit: characters)
         * @returns {string} commands
         */
        absolute(position: number): string;
        /**
         * Set relative print position.
         * @param {number} position relative position (unit: characters)
         * @returns {string} commands
         */
        relative(position: number): string;
        /**
         * Print horizontal rule.
         * @param {number} width line width (unit: characters)
         * @returns {string} commands
         */
        hr(width: number): string;
        /**
         * Print vertical rules.
         * @param {number[]} widths vertical line spacing
         * @param {number} height text height (1-6)
         * @returns {string} commands
         */
        vr(widths: number[], height: number): string;
        /**
         * Start rules.
         * @param {number[]} widths vertical line spacing
         * @returns {string} commands
         */
        vrstart(widths: number[]): string;
        /**
         * Stop rules.
         * @param {number[]} widths vertical line spacing
         * @returns {string} commands
         */
        vrstop(widths: number[]): string;
        /**
         * Print vertical and horizontal rules.
         * @param {number[]} widths1 vertical line spacing (stop)
         * @param {number[]} widths2 vertical line spacing (start)
         * @param {number} dl difference in left position
         * @param {number} dr difference in right position
         * @returns {string} commands
         */
        vrhr(widths1: number[], widths2: number[], dl: number, dr: number): string;
        /**
         * Set line spacing and feed new line.
         * @param {boolean} vr whether vertical ruled lines are printed
         * @returns {string} commands
         */
        vrlf(vr: boolean): string;
        /**
         * Cut paper.
         * @returns {string} commands
         */
        cut(): string;
        /**
         * Underline text.
         * @returns {string} commands
         */
        ul(): string;
        /**
         * Emphasize text.
         * @returns {string} commands
         */
        em(): string;
        /**
         * Invert text.
         * @returns {string} commands
         */
        iv(): string;
        /**
         * Scale up text.
         * @param {number} wh number of special character '^' (1-7)
         * @returns {string} commands
         */
        wh(wh: number): string;
        /**
         * Cancel text decoration.
         * @returns {string} commands
         */
        normal(): string;
        /**
         * Print text.
         * @param {string} text string to print
         * @param {Encoding} encoding codepage
         * @returns {string} commands
         */
        text(text: string, encoding: Encoding): string;
        /**
         * Feed new line.
         * @returns {string} commands
         */
        lf(): string;
        /**
         * Insert commands.
         * @param {string} command commands to insert
         * @returns {string} commands
         */
        command(command: string): string;
        /**
         * Print image.
         * @param {string} image image data (base64 png format)
         * @returns {string} commands
         */
        image(image: string): string;
        /**
         * Print image.
         * @deprecated since v1.12.0
         * @param {string} image image data (base64 png format)
         * @param {number} align line alignment (0: left, 1: center, 2: right)
         * @param {number} left left margin (unit: characters)
         * @param {number} width print area (unit: characters)
         * @param {number} right right margin (unit: characters)
         * @returns {string} commands
         */
        image(image: string, align: number, left: number, width: number, right: number): string;
        /**
         * Print QR Code.
         * @param {QRCode} symbol QR Code information (data, type, cell, level)
         * @param {Encoding} encoding codepage
         * @returns {string} commands
         */
        qrcode(symbol: QRCode, encoding: Encoding): string;
        /**
         * Print barcode.
         * @param {Barcode} symbol barcode information (data, type, width, height, hri)
         * @param {Encoding} encoding codepage
         * @returns {string} commands
         */
        barcode(symbol: Barcode, encoding: Encoding): string;
        /**
         * Extra properties.
         */
        [propName: string]: any;
    }
    /**
     * Transform ReceiptLine document to printer commands or SVG images.
     * @param {string} doc ReceiptLine document
     * @param {Printer} [printer] printer configuration
     * @returns {string} printer command or SVG image
     */
    export function transform(doc: string, printer?: Printer): string;
    /**
     * Create transform stream that converts ReceiptLine document to printer commands or SVG images.
     * @param {Printer} [printer] printer configuration
     * @returns {Transform} transform stream
     */
    export function createTransform(printer?: Printer): Transform;
    /**
     * Command objects.
     * @type {Commands} commands
     */
    export const commands: Commands;
    /**
     * Barcode generator.
     * @type {BarcodeGenerator} barcode generator
     */
    export const barcode: BarcodeGenerator;
}
