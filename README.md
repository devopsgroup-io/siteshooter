# Siteshooter 
[![NPM version](https://img.shields.io/npm/v/siteshooter.svg)](https://www.npmjs.com/package/siteshooter) [![Build Status](https://img.shields.io/travis/devopsgroup-io/siteshooter.svg?branch=master)](https://travis-ci.org/devopsgroup-io/siteshooter)
[![dependencies](https://david-dm.org/devopsgroup-io/siteshooter.svg)](https://david-dm.org/devopsgroup-io/siteshooter#info=dependencies&view=tables)

> Automate full website screenshots and PDF generation with multiple viewports

### Features

* Crawls specified host and generates `sitemap.xml` on the fly
* Generates entire website screenshots based on `sitemap.xml`
* Define multiple viewports
* Automated PDF generation
* Includes crawled meta data in generated PDF
* Reports on broken website links (404 http response)
* Supports [HTTP basic authentication](https://en.wikipedia.org/wiki/Basic_access_authentication)
* Supports sitemaps with HTTP, HTTPS, and FTP protocol URLs
* Follows HTTP 301 redirects


**In This Documentation**

1. [Getting Started](#getting-started)
2. [Siteshooter Configuration File](#create-a-siteshooter-configuration-file)
2. [CLI Options](#cli-options)
3. [Tests](#tests)
4. [Troubleshooting & FAQ](#troubleshooting-and-faq)

## Getting Started

#### Dependencies

Install the following prerequisite on your development machine:

* [Node.js - **version >= 6.0.0**](http://nodejs.org)

#### NPM Libraries

Libraries **Siteshooter** depends on:

* [PDFKit](https://github.com/devongovett/pdfkit)
* [PhantomJS](https://github.com/ariya/phantomjs)
* [Simple web crawler](https://github.com/cgiffard/node-simplecrawler)


### Quick Start
```
$ npm install siteshooter --global
```
If siteshooter is installed, make sure you have the latest version by running:
```
$ npm update siteshooter --global
```
* You may need to run these commands with elevated privileges, e.g. `sudo`, you will be prompted to do so if needed.
* Installing with the `--global` flag affords you the `siteshooter` command on your machine's command line at any path.
* Read more about the `--global` flag [here](https://docs.npmjs.com/files/folders).

### Create a Siteshooter Configuration File
```
$ siteshooter --init
```

### Update Siteshooter Configuration File

[View the full siteshooter.yml example](https://github.com/devopsgroup-io/siteshooter/tree/master/siteshooter.yml)

Inside `siteshooter.yml`, add additional options. 

* All [Simple Web Crawler options](https://github.com/cgiffard/node-simplecrawler#configuration) can be added to `sitecrawler_options` and will pass through to the crawler process

```yml
domain:
  name: https://www.devopsgroup.io
  auth:
    user:
    pwd:

pdf_options:
 excludeMeta: true

screenshot:
  delay: 400

sitecrawler_options:
  exclude:
   - "pdf"
  stripQuerystring: false
  ignoreInvalidSSL: true

viewports:
 - viewport: desktop-large
   width: 1600
   height: 1200
 - viewport: iPhone6
   width: 375
   height: 667

```

### Custom JavaScript Inject File
 
 To interact with the DOM, prior to the screenshot process, add a `inject.js` file in the same directory as the `siteshooter.yml`. 

 **Example**
 ```js
/**
 * @file:            inject.js
 * @description:     used to inject custom JavaScript into a webpage prior to a screenshot. 
 */

console.log('Javascript injected into page.');

if ( typeof(jQuery) !== "undefined" ) {

    jQuery(document).ready(function() {
        console.log('jQuery loaded.');
    });
}
 ```

## CLI Options

```bash

$ siteshooter --help

Usage: siteshooter [options]

OPTIONS
_______________________________________________________________________________________
-c --config            Show configuration
-e --debug             Output exceptions
-h --help              Print this help
-i --init              Create siteshooter.yml template file
-p --pdf               Generate PDFs, by defined viewports, based on screenshots created via Siteshooter
-s --screenshots       Generate screenshots, by viewports, based on sitemap.xml file
-S --sitemap           Crawl domain name specified in siteshooter.yml file and generate a local sitemap.xml file
-v --version           Print version number
-V --verbose           Verbose output
-w --website           Report on website information based on Siteshooter crawled results
```

When running a `siteshooter' command without any options, the following will run by default (if a **siteshooter.yml** file exists in working directory):

* --sitemap
* --screenshots
* --pdf

## Tests

Tests are written with [Mocha](https://github.com/mochajs/mocha) and can be run with `npm test`.

## Troubleshooting

If you're having issues with Siteshooter, [submit a GitHub Issue](https://github.com/devopsgroup-io/siteshooter/issues/new).

* Make sure you have a `siteshooter.yml` file in your working directory and it's well formatted

## License
```
The MIT License (MIT)

Copyright (c) 2016 Steven Britton

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```


