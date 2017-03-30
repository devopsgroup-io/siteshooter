'use strict';

var ___ = require('lodash'),
    builder = require('xmlbuilder'),
    chalk = require('chalk'),
    cheerio = require('cheerio'),
    SimpleCrawler = require('simplecrawler'),
    fs = require('fs'),
    Q = require('q'),
    URL = require('url-parse'),
    utils = require('./utils'),
    Website = require('./website'),
    xml2js = require('xml2js');


var crawlerExclusions = ['gif', 'jpg', 'jpeg', 'png', 'ico', 'bmp', 'ogg', 'webp',
    'mp4', 'webm', 'mp3', 'ttf', 'woff', 'json', 'rss', 'atom', 'gz', 'zip',
    'rar', '7z', 'css', 'js', 'gzip', 'exe', 'svg', 'pptx', 'cdn-cgi', 'xmlrpc', 'wp-comments-post', 'oft', 'docx'
];

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
 * Public: Constructor for the crawler.
 * @author Steven Britton
 * @date   2016-04-12
 * @param  {Object}   options Contains configuration options and CLI arguments
 */
var Crawler = function(options) {

    utils.log.verbose('Crawler: constructor', options);

    // Data integrity checks
    if (options.url === '') {
        throw new Error('Missing parameter: url');
    }

    var baseUrlRegex,
        exclusions,
        regExclusions;

    this.options = options;


    this.website = new Website(this.options);

    // sitemap file name based on user settings
    this.sitemapFile = 'sitemap.xml';
    this.sitemapData = null;
    this.sitemapLinks = [];

    this.uri = new URL(this.options.url);
    this.crawler = new SimpleCrawler(this.uri.href);

    // only crawl regular links
    this.crawler.parseScriptTags = false;
    this.crawler.parseHTMLComments = false;


    // Set all user defined options
    Object.assign(this.crawler, this.options.sitecrawler);

    this.crawler.userAgent = 'devopsgroup.io/Siteshooter';

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

    // check siteshooter config file for cache boolen option
    if (this.options.sitecrawler.cache){
        // cache results
        this.crawler.cache = new SimpleCrawler.cache(process.cwd());
    }

    // Treat self-signed SSL certificates as valid
    if(this.crawler.ignoreInvalidSSL){
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    // look for user defined crawler exclusions
    if (Array.isArray(this.options.sitecrawler.exclude) && this.options.sitecrawler.exclude.length > 0) {
        crawlerExclusions = crawlerExclusions.concat(this.options.sitecrawler.exclude);
    }

    // format exclusions
    exclusions = crawlerExclusions.join('|');

    // regular expression for exclusions
    regExclusions = new RegExp('\.(' + exclusions + ')', 'i');

    this.crawler.addFetchCondition(function(parsedURL) {
        return !parsedURL.path.match(regExclusions);
    });

    /*
    this.crawler.discoverResources = function(buffer) {
        var $ = cheerio.load(buffer.toString('utf8'));

        return $('a[href]').map(function() {
            return $(this).attr('href');
        }).get();
    };*/

    if (this.options.baseurl) {

        baseUrlRegex = new RegExp('^' + options.url + '.*');

        this.crawler.addFetchCondition(function(parsedURL) {
            var currentUrl = parsedURL.protocol + '://' + parsedURL.host + parsedURL.uriPath;
            return currentUrl.match(baseUrlRegex);
        });
    }
};


/**
 * Returns local sitemap.xml - XML or JSON format
 * @author Steven Britton
 * @date   2016-04-25
 * @return {[type]}   [description]
 */
Crawler.prototype.getSitemap = function() {

    utils.log.verbose('Returning local ' + this.sitemapFile + ' in JSON format. \n');

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
 * Crawls specified host using Simplecrawler
 * @author Steven Britton
 * @date   2016-05-10
 * @return {[type]}   [description]
 */
Crawler.prototype.crawlHost = function() {

    console.log(chalk.yellow.bold(' ⤷ Crawling Host: '), chalk.underline.yellow(this.uri.host));

    var deferred = Q.defer(),
        error = [],
        sitemap = this;

    error.collector404 = [];

    this.crawler.on('fetchcomplete', function(item, data, res) {

        console.log(chalk.green.bold('   ✔︎ 200 '), chalk.green(item.url));

        var $,
            images = [],
            links = [],
            scripts = [];


        this.sitemapLinks.push({
            loc: item.url,
            changefreq: 'weekly'
        });

        // check content type before selecting and storing content
        if (item.stateData.contentType.replace(' ', '').toLowerCase() === 'text/html;charset=utf-8') {

            $ = cheerio.load(data.toString('utf8'), { normalizeWhitespace: false, xmlMode: false, decodeEntities: true });

            var meta = sitemap.website.metadata($);


            $('script').map(function() {
                scripts.push({
                    src: $(this).attr('src'),
                    text: $(this).html()
                });
            }).get();

            $('a[href]').map(function() {
                links.push({
                    href: $(this).attr('href'),
                    html: $(this).html(),
                    rel: $(this).attr('rel')
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
                    images: images,
                    links: links
                },
                loc: item.url,
                meta: meta,
                scripts: scripts,
            });
        }

    }.bind(this));

    // will be used to check robots.txt
    this.crawler.on('fetchdisallowed', function(item) {
        if (!this.options.silent) {
            console.log(chalk.red.bold('   ✗ 200 '), chalk.red(item.url, ' - Disallowed in robots.txt'));
        }
    }.bind(this));


    this.crawler.on('fetch404', function(item) {
        console.log(chalk.red.bold('   ✗ 404 '), chalk.red(item.url));

        error.collector404.push({'referrer':item.referrer, 'url':item.url});
    });

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

                console.log(chalk.white(' Added %s URLs to sitemap.'), this.sitemapLinks.length);

                /*
                    chalk.red(this.crawler.queue.errors()),
                    (this.crawler.queue.errors() === 1 ? chalk.red('error') : chalk.red('errors')));
                */

                if (error.collector404.length > 0) {
                    this.writeCollections('urls_404.json', error.collector404, function() {

                        console.log(chalk.white(' Added %s URLs to 404 collection file.'),
                            error.collector404.length
                        );

                    });
                }

                // write content collection file
                this.writeContentCollection(function(err) {
                    if (err) {
                        utils.q.throwError(deferred, err);
                    } else {
                        console.log(chalk.green.bold('\n ✔︎'), chalk.green('content-collection.json successfully saved.'));
                        console.log(chalk.white(' Added %s pages to content-collection.json\n'),
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
Crawler.prototype.writeSitemapXML = function(callback) {

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
Crawler.prototype.writeContentCollection = function(callback) {
    fs.writeFile(this.website.contentFile, JSON.stringify(this.website.contentCollection), function(err) {
        if (typeof callback === 'function') {
            return callback(err);
        }
        return err;
    });
};

Crawler.prototype.writeCollections = function(collectionName, collection, callback) {
    fs.writeFile(collectionName, JSON.stringify(collection), function(err) {
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
Crawler.prototype.sitemapDelete = function() {

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


module.exports = Crawler;
