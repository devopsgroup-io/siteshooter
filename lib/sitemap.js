'use strict';

var ___ = require('lodash'),
    builder = require('xmlbuilder'),
    chalk = require('chalk'),
    cheerio = require('cheerio'),
    Crawler = require('simplecrawler'),
    fs = require('fs'),
    path = require('path'),
    Q = require('q'),
    URL = require('url-parse'),
    utils = require('./utils'),
    Website = require('./website'),
    xml2js = require('xml2js');


var excludeExtensions = ['gif', 'jpg', 'jpeg', 'png', 'ico', 'bmp', 'ogg', 'webp',
    'mp4', 'webm', 'mp3', 'ttf', 'woff', 'json', 'rss', 'atom', 'gz', 'zip',
    'rar', '7z', 'css', 'js', 'gzip', 'exe', 'svg', 'pdf', 'pptx'
];

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
        return callback(err, data);
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
    var exts = excludeExtensions.join('|');
    var regex = new RegExp('\.(' + exts + ')', 'i');
    var baseUrlRegex = new RegExp('^' + options.url + '.*');

    this.options = options;

    this.website = new Website();

    // sitemap file name based on user settings
    this.sitemapFile = getFileName(this.options);
    this.sitemapData = null;
    this.sitemapLinks = [];

    this.uri = new URL(this.options.url);
    this.crawler = new Crawler(this.uri.host);


    // check and set basic auth credentials
    if (this.options.auth.user !== '' && this.options.auth.pwd !== '') {

        this.uri.auth = true;
        this.uri.password = this.options.auth.pwd;
        this.uri.username = this.options.auth.user;

        this.crawler.needsAuth = true;
        this.crawler.authUser = this.options.auth.user;
        this.crawler.authPass = this.options.auth.pwd;
    }


    this.website.uri = this.uri;

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



Sitemap.prototype.toJSON = function() {


    console.log(chalk.yellow.bold(' ⤷ Converting local ' + this.sitemapFile + ' to JSON format. \n'));

    var deferred = Q.defer(),
        pages = [],
        parser = new xml2js.Parser();


    getLocalFile(this.sitemapFile, function(err, sitemapData) {

        if (err) {
            utils.q.throwError(deferred, err);
        }

        parser.parseString(sitemapData, function(err, result) {

            if (err) {

                utils.q.throwError(deferred, err);

            } else if (result.urlset && Array.isArray(result.urlset.url)) {

                pages = result.urlset.url.map(function(item) {
                    return item.loc[0];
                });

                deferred.resolve(pages);
            }
        });
    });

    return deferred.promise;

};


/**
 * Create the crawler instance.
 */
Sitemap.prototype.create = function() {

    console.log(chalk.yellow.bold(' ⤷ Crawling Host: '), chalk.underline.yellow(this.uri.host));

    var deferred = Q.defer(),
        error = [];

    this.crawler.on('fetchcomplete', function(item, data, res) {

        var $,
            images = [],
            links = [];


        this.sitemapLinks.push({
            loc: item.url,
            changefreq: 'weekly'
        });

        // check content type before selecting and storing content
        if (item.stateData.contentType.toLowerCase() === 'text/html; charset=utf-8') {

            $ = cheerio.load(data.toString('utf8'));

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

            this.website.contentCollection.pages.push({
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
        }

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
        console.log(chalk.red.bold('   ✗ ' + response.statusCode, response.statusMessage), ' ', chalk.red(item.url));

        if (response.statusCode === 401) {
            console.log(chalk.red('    Authentication required - please update your ', chalk.bold('siteshooter.yml'), ' file to include Auth user & pwd.'));
        }
    });


    this.crawler.on('complete', function() {

        if (___.isEmpty(this.sitemapLinks)) {

            error.push(chalk.red('Website ', chalk.underline(this.options.url), ' could not be found.'));
            utils.q.throwError(deferred, error);
        }

        // write sitemap.xml file
        this.writeSitemapXML(function(err) {
            if (err) {
                utils.q.throwError(deferred, err);
            } else {

                console.log(chalk.green.bold('\n ✔︎'), chalk.green(this.sitemapFile + ' successfully created.'));
                console.log(chalk.white(' Added %s URLs to sitemap, encountered %s %s.'),
                    this.sitemapLinks.length,
                    chalk.red(this.crawler.queue.errors()),
                    (this.crawler.queue.errors() === 1 ? chalk.red('error') : chalk.red('errors')));


                // write content collection file
                this.writeContentCollection(function(err) {
                    if (err) {
                        utils.q.throwError(deferred, err);
                    } else {
                        console.log(chalk.green.bold('\n ✔︎'), chalk.green('content-collection.json successfully saved.'));
                        console.log(chalk.white(' Added %s pages to content.xml\n'),
                            this.website.contentCollection.pages.length);

                        deferred.resolve();
                    }
                }.bind(this));

            }
        }.bind(this));


    }.bind(this));

    this.crawler.start();

    return deferred.promise;

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

    ___.forIn(this.sitemapLinks, function(value) {
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
 * Writes out site content collection
 * @author Steven Britton
 * @date   2016-04-12
 * @param  {Function} callback callback function
 * @return {Function} callback
 */
Sitemap.prototype.writeContentCollection = function(callback) {
    fs.writeFile(this.website.contentFile, JSON.stringify(this.website.contentCollection), function(err) {
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

    var deferred = Q.defer();

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
            utils.q.throwError(deferred, err);
        } else {
            console.log(chalk.green.bold('✔︎ '), chalk.yellow(sitemap, ' was successfully deleted.'));
            deferred.resolve();
        }
    });

    return deferred.promise;

};


module.exports = Sitemap;
