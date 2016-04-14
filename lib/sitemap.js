'use strict';

var ___ = require('lodash'),
    builder = require('xmlbuilder'),
    chalk = require('chalk'),
    cheerio = require('cheerio'),
    Crawler = require('simplecrawler'),
    fs = require('fs'),
    path = require('path'),
    URL = require('url-parse'),
    xml2js = require('xml2js');




/**
 * Get sitemap file name based on user settings
 * @author Steven Britton
 * @date   2016-04-12
 * @param  {object}   options Contains configuration options, CLI arguments, and Sitemap Prototype
 * @return {String}   sitemap file name and extension
 */
function getFileName(options) {

    var outputPath = '.';
    var fileName = 'sitemap';

    if (options.path) {
        outputPath = options.path.replace(/\/+$/, '');
    }

    if (options.filename) {
        fileName = options.filename.replace(/\.xml$/i, '');
    }
    outputPath = path.join(outputPath, fileName + '.xml');

    return outputPath;
}


/**
 * Gets local generated sitemap.xml file
 * @author Steven Britton
 * @date   2016-04-12
 * @param  {String}   sitemapFile Sitemap file name
 * @param  {Function} callback    callback
 * @return {Function}             callback
 */
function getLocalFile(sitemapFile, callback) {
    fs.readFile(sitemapFile, function(err, data) {
        if (typeof callback === 'function') {
            return callback(err, data);
        }
        return err;
    });
}



/**
 * Sitemap Object
 * @author Steven Britton
 * @date   2016-04-12
 * @param  {Object}   options Contains configuration options and CLI arguments
 */
function Sitemap(options) {
    var port = 80;
    var exclude = ['gif', 'jpg', 'jpeg', 'png', 'ico', 'bmp', 'ogg', 'webp',
        'mp4', 'webm', 'mp3', 'ttf', 'woff', 'json', 'rss', 'atom', 'gz', 'zip',
        'rar', '7z', 'css', 'js', 'gzip', 'exe', 'svg'
    ];
    var exts = exclude.join('|');
    var regex = new RegExp('\.(' + exts + ')', 'i');
    var baseUrlRegex = new RegExp('^' + options.url + '.*');

    this.options = options;
    this.chunk = [];
    this.content = [];

    // sitemap file name based on user settings
    this.sitemapFile = getFileName(this.options);
    this.sitemapData = null;

    this.uri = new URL(this.options.url);
    this.crawler = new Crawler(this.uri.host);



    // check and set basic auth credentials
    if (this.options.auth.user !== '' && this.options.auth.pwd !== '') {
        this.crawler.needsAuth = true;
        this.crawler.authUser = this.options.auth.user;
        this.crawler.authPass = this.options.auth.pwd;
    }

    this.crawler.initialPath = '/';

    // only crawl regular links
    this.crawler.parseScriptTags = false;
    this.crawler.parseHTMLComments = false;
    this.crawler.respectRobotsTxt = true;

    if (process.env.NODE_ENV === 'development') {
        port = 8000;
    }
    this.crawler.initialPort = port;

    if (!this.uri.protocol) {
        this.uri.set('protocol', 'http:');
    }

    this.crawler.initialProtocol = this.uri.protocol.replace(':', '');
    this.crawler.userAgent = 'devopsgroup.io/Siteshooter';

    if (!this.options.query) {
        this.crawler.stripQuerystring = true;
    }

    this.crawler.addFetchCondition(function(parsedURL) {
        return !parsedURL.path.match(regex);
    });

    /*
    this.crawler.discoverResources = function(buffer) {
        var $ = cheerio.load(buffer.toString('utf8'));

        return $('a[href]').map(function() {
            return $(this).attr('href');
        }).get();
    };*/

    if (this.options.baseurl) {
        this.crawler.addFetchCondition(function(parsedURL) {
            var currentUrl = parsedURL.protocol + '://' + parsedURL.host + parsedURL.uriPath;
            return currentUrl.match(baseUrlRegex);
        });
    }
}



Sitemap.prototype.toJSON = function(callback) {

    if (typeof callback !== 'function') {
        console.error(chalk.red.bold('Error: sitemap.toJSON() expects a callback function.'));
        process.exit(1);
    }


    console.log(chalk.yellow.bold(' ⤷ Converting local ' + this.sitemapFile + ' to JSON format. \n'));

    var error = null,
        pages = [],
        parser = new xml2js.Parser();


    getLocalFile(this.sitemapFile, function(err, sitemapData) {

        if (err) {
            console.error(chalk.red.bold(err));
            process.exit(1);
        }

        parser.parseString(sitemapData, function(err, result) {

            if (err) {
                console.error(chalk.red.bold(err));
                process.exit(1);
            } else if (result.urlset && ___.isArray(result.urlset.url)) {

                pages = result.urlset.url.map(function(item) {
                    return item.loc[0];
                });


                return callback(err, pages);
            }
        });
    });

};


/**
 * Create the crawler instance.
 */
Sitemap.prototype.create = function() {

    console.log(chalk.yellow.bold(' ⤷ Crawling Host: '), chalk.underline.yellow(this.uri.host));

    this.crawler.on('fetchcomplete', function(item, data, res) {

        var $ = cheerio.load(data.toString('utf8')),
            images = [],
            links = [];

        this.chunk.push({
            loc: item.url,
            changefreq: 'weekly'
        });

        $('a[href]').map(function() {
            links.push({
                href: $(this).attr('href'),
                html: $(this).html()
            });
        }).get();

        $('img').map(function() {
            images.push({
                alt: $(this).attr('alt'),
                class: $(this).attr('class'),
                src: $(this).attr('src')
            });
        }).get();

        this.content.push({
            body: {
                images: { image: images },
                links: { link: links }
            },
            loc: item.url,
            meta: {
                canonical: $('link[rel=canonical]').attr('href'),
                description: $('meta[name=description]').attr('content'),
                title: $('title').text()
            }

        });

        if (!this.options.silent) {
            console.log(chalk.green.bold('   ✔︎ 200 '), chalk.green(item.url));
        }
    }.bind(this));

    this.crawler.on('fetchdisallowed', function(item) {
        if (!this.options.silent) {
            console.log(chalk.bold.magenta('    Ignoring:'), chalk.gray(item.url));
        }
    }.bind(this));

    this.crawler.on('fetch404', function(item) {
        if (!this.options.silent) {
            console.log(chalk.red.bold('   ✗ 404 '), chalk.red(item.url));
        }
    }.bind(this));

    this.crawler.on('fetcherror', function(item, response) {
       console.log(chalk.red.bold('   ✗ ' + response.statusCode), '', chalk.red(item.url));
    });


    this.crawler.on('complete', function() {

        if (___.isEmpty(this.chunk)) {
            console.error(chalk.red.bold('Error: Site "%s" could not be found.'), this.options.url);
            process.exit(1);
        }

        // write sitemap.xml file
        this.writeSitemapXML(function(err) {
            if (err) {
                console.error(chalk.red.bold(err));
                process.exit(1);
            } else {

                console.log(chalk.green.bold('\n ✔︎'), chalk.green(this.sitemapFile + ' successfully created.'));
                console.log(chalk.white(' Added %s URLs to sitemap, encountered %s %s.'),
                    this.chunk.length,
                    this.crawler.queue.errors(),
                    (this.crawler.queue.errors() === 1 ? 'error' : 'errors'));


                // write content-index.xml file
                this.writeContentIndex(function(err) {
                    if (err) {
                        console.error(chalk.red.bold(err));
                        process.exit(1);
                    } else {
                        console.log(chalk.green.bold('\n ✔︎'), chalk.green('content-index.xml successfully saved.'));
                        console.log(chalk.white(' Added %s pages to content.xml\n'),
                            this.content.length);

                        process.exit();
                    }
                }.bind(this));

            }
        }.bind(this));


    }.bind(this));

    this.crawler.start();

};

/**
 * Write the XML file.
 *
 * @param  {Function} callback Callback function to execute
 */
Sitemap.prototype.writeSitemapXML = function(callback) {

    var sitemap,
        xml = builder.create('urlset', { version: '1.0', encoding: 'UTF-8' })
        .commentAfter('XML Sitemap generated by devopsgroup.io/Siteshooter')
        .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
        .att('xmlns:image', 'http://www.google.com/schemas/sitemap-image/1.1')
        .att('xsi:schemaLocation', 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd')
        .att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

    ___.forIn(this.chunk, function(value) {
        xml.ele('url')
            .ele(value);
    });

    sitemap = xml.end({ pretty: true, indent: '  ', newline: '\n' });

    fs.writeFile(this.sitemapFile, sitemap, function(err) {
        if (typeof callback === 'function') {
            return callback(err, this.sitemapFile);
        }
        return err;
    });
};

/**
 * Writes out site content
 * @author Steven Britton
 * @date   2016-04-12
 * @param  {Function} callback callback function
 * @return {Function} callback
 */
Sitemap.prototype.writeContentIndex = function(callback) {

    var content,
        xml = builder.create('pages', { version: '1.0', encoding: 'UTF-8' });

    ___.forIn(this.content, function(value) {
        xml.ele('page')
            .ele(value);
    });


    content = xml.end({ pretty: true, indent: '  ', newline: '\n'});

    fs.writeFile('content-index.xml', content, function(err) {
        if (typeof callback === 'function') {
            return callback(err);
        }
        return err;
    });
};


/**
 * Delete local sitemap.xml file
 * @author Steven Britton
 * @date   2016-04-12
 * @return {[type]}   [description]
 */
Sitemap.prototype.delete = function() {

    function sitemapDelete(sitemap, callback) {
        fs.unlink(sitemap, function(err) {

            if (typeof callback === 'function') {
                return callback(err, sitemap);
            }
            return err;
        });
    }

    sitemapDelete(this.sitemapFile, function(err, sitemap) {
        if (err) {
            console.log(chalk.red.bold(err));
            process.exit(1);
        } else {
            console.log(chalk.green.bold('✔︎ '), chalk.yellow(sitemap, ' was successfully deleted.'));
            process.exit();
        }
    });

};


module.exports = Sitemap;
