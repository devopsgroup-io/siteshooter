# Siteshooter 
[![NPM version](https://img.shields.io/npm/v/siteshooter.svg)](https://www.npmjs.com/package/siteshooter) [![Build Status](https://img.shields.io/travis/stevebritton/siteshooter.svg?branch=master)](https://travis-ci.org/stevebritton/siteshooter)
[![dependencies](https://david-dm.org/stevebritton/siteshooter.svg)](https://david-dm.org/stevebritton/siteshooter#info=dependencies&view=tables)

> Automate full website screenshots and PDF generation by defined viewport(s)

## Features

* Generate entire website screenshots based on `sitemap.xml`
* Define multiple viewports
* Automated PDF generation
* Supports [HTTP basic authentication](https://en.wikipedia.org/wiki/Basic_access_authentication)


**In This Documentation**

1. [Getting Started](#getting-started)
2. [CLI Options](#cli-options)
3. [Troubleshooting & FAQ](#troubleshooting-and-faq)

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

[View full siteshooter.yml example](https://github.com/stevebritton/siteshooter/tree/master/siteshooter.yml)

Inside `siteshooter.yml`, add addtional options

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
-v --version           Print version number
-V --verbose           Verbose output

```

## Troubleshooting

If you're having issues with the Siteshooter Package, submit a [submit a GitHub Issue](https://github.com/stevebritton/siteshooter/issues/new).

* Make sure your `siteshooter.yml` file exists and is well formatted


