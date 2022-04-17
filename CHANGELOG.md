# Changelog

## [Unreleased]
### Added
- TypeScript typings

## [1.9.0] - 2022-04-16
### Added
- Support for image processing module "sharp"
- Thai character support

## [1.8.0] - 2022-03-08
### Added
- Transform stream API
- Support for Node SerialPort 10.x

### Changed
- convert-svg-to-png to puppeteer

### Fixed
- HTTP POST encoding to utf-8
- A bug in the image upside down printing on StarPRNT command objects

## [1.7.0] - 2022-02-03
### Added
- Custom command object
- Multilingual encoding for Chinese and Korean models

## [1.6.0] - 2021-12-19
### Added
- Multilingual encoding

## [1.5.3] - 2021-06-05
### Added
- Examples of cloud printing

## [1.5.2] - 2021-05-28
### Added
- Command Emulator Star Line Mode

### Changed
- HTTP port from 10080 to 8080

### Fixed
- Large image printing
- Print end process

## [1.5.1] - 2021-05-19
### Added
- An option to select whether to print with device fonts or as images

## [1.5.0] - 2021-05-16
### Added
- Chinese and Korean languages
- Star Graphic Mode (TSP100LAN)

### Changed
- Ruled line drawing
- SVG paper cut drawing from text to path

## [1.4.0] - 2021-04-18
### Added
- Image processing options
- Star Line Mode (TSP series)

### Changed
- SVG text-anchor from start to middle

## [1.3.2] - 2021-03-30
### Added
- Features to the ReceiptLine Designer (formatting, favicon, Open Graph tags)

### Changed
- Connection termination process of the serial-LAN converter
- MIME type from image/x-icon to image/vnd.microsoft.icon

### Fixed
- A bug that the edge of the image is not printed when cpl is odd
- Examples of displaying and printing receipts

## [1.3.1] - 2021-03-20
### Added
- Features to the ReceiptLine Designer (download, tooltip, column delimiter, spacing)
- Examples of displaying PNG receipts
- Examples of printing SVG receipts

## [1.3.0] - 2021-03-13
### Added
- Impact printer (TM-U220)

### Fixed
- SVG to avoid empty group elements
- URL parsing

## [1.2.1] - 2021-02-07
### Fixed
- Examples of displaying and printing receipts

## [1.2.0] - 2021-02-07
### Added
- Examples of displaying and printing receipts

### Changed
- SVG ruled line drawing from text to path

### Fixed
- Printing of transparent images

## [1.1.2] - 2020-12-18
### Fixed
- Escape processing of the barcode / 2D code dialog box

## [1.1.1] - 2020-11-18
### Changed
- SVG font for barcode text to web font

## [1.1.0] - 2020-11-09
### Added
- Printing options (line spacing and paper cutting)
- Serial-LAN converter

### Changed
- SVG font from OS standard font to web font

## [1.0.2] - 2020-07-23
### Fixed
- A bug that images are not displayed in SVG created in Node.js environment by [@eggplants](https://github.com/eggplants)

## [1.0.1] - 2020-07-11
### Added
- Link to official specifications to README
- Images of development tools and printers for README

### Changed
- Data validation of Codabar (NW-7)

## [1.0.0] - 2020-06-09
### Added
- First edition
