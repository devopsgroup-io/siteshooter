# Siteshooter 
[![NPM version](https://img.shields.io/npm/v/siteshooter.svg)](https://www.npmjs.com/package/siteshooter) [![Build Status](https://img.shields.io/travis/devopsgroup-io/siteshooter.svg?branch=master)](https://travis-ci.org/devopsgroup-io/siteshooter)
[![dependencies](https://david-dm.org/devopsgroup-io/siteshooter.svg)](https://david-dm.org/devopsgroup-io/siteshooter#info=dependencies&view=tables)

> Automate full website screenshots and PDF generation with multiple viewports

## Features

* Crawls specified domain and generates `sitemap.xml` on the fly
* Generate entire website screenshots based on `sitemap.xml`
* Define multiple viewports
* Automated PDF generation
* Supports [HTTP basic authentication](https://en.wikipedia.org/wiki/Basic_access_authentication)
* Supports sitemaps with HTTP, HTTPS, and FTP protocol URLs
* Follows HTTP 301 redirects


**In This Documentation**

1. [Getting Started](#getting-started)
2. [CLI Options](#cli-options)
3. [Tests](#tests)
4. [Troubleshooting & FAQ](#troubleshooting-and-faq)

## Getting Started

### Dependencies

Install the following prerequisite on your development machine.

* [Node.js](http://nodejs.org)


### Quick Start

```
$ npm install siteshooter -g
```

### Create a Siteshooter Configuration File
```
$ siteshooter --init
```

### Update Siteshooter Configuration File

[View the full siteshooter.yml example](https://github.com/devopsgroup-io/siteshooter/tree/master/siteshooter.yml)

Inside `siteshooter.yml`, add additional options

```yml
domain:
  name: www.devopsgroup.io
  auth:
    user:
    pwd:
  sitemap:
   type: xml
   url: sitemap

viewports:
 - viewport: desktop-large
   width: 1600
   height: 1200
 - viewport: iPhone6
   width: 375
   height: 667

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
-s --sitemap           Sitemap options
-s --sitemap=create    Crawls domain name specified in siteshooter.yml file and generates a sitemap.xml file
-s --sitemap=delete    Deletes sitemap.xml file in working directory
-v --version           Print version number
-V --verbose           Verbose output

```


## Tests

Tests are written with [Mocha](http://visionmedia.github.com/mocha/) and can be
run with `npm test`.

## Troubleshooting

If you're having issues with the Siteshooter Package, submit a [submit a GitHub Issue](https://github.com/devopsgroup-io/siteshooter/issues/new).

* Make sure your `siteshooter.yml` file exists and is well formatted

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


