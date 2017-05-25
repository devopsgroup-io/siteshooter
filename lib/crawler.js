'use strict';

var ___ = require('lodash'),
    SimpleCrawler = require('simplecrawler'),
    fs = require('fs'),
    Q = require('q'),
    sitemap = require('./sitemap'),
    utils = require('./utils');



var crawlerExclusions = ['gif', 'jpg', 'jpeg', 'png', 'ico', 'bmp', 'ogg', 'webp',
    'mp4', 'webm', 'mp3', 'ttf', 'woff', 'json', 'rss', 'atom', 'gz', 'zip',
    'rar', '7z', 'css', 'js', 'gzip', 'exe', 'svg', 'pptx', 'cdn-cgi', 'xmlrpc', 'wp-comments-post', 'oft', 'docx'
];



/**
 * Public: Constructor for the crawler.
 * @author Steven Britton
 * @date   2016-04-12
 * @param  {Object}   options Contains configuration options and CLI arguments
 */
var Crawler = function(options) {

    utils.log.verbose('Crawler: constructor', options);

    // shoudn't happen
    if (options.uri === '') {
        throw new Error('Missing parameter: uri');
    }

    var baseUrlRegex,
        exclusions,
        regExclusions;

    this.options = options;

    // sitemap file name based on user settings
    this.sitemapData = null;
    this.sitemapLinks = [];

    this.crawler = new SimpleCrawler(this.options.uri.href);

    // only crawl regular links
    this.crawler.parseScriptTags = false;
    this.crawler.parseHTMLComments = false;


    // Set all user defined options
    Object.assign(this.crawler, this.options.sitecrawler);

    this.crawler.userAgent = 'devopsgroup.io/Siteshooter';

    // check and set basic auth credentials
    if ( this.options.uri.auth ) {

        this.crawler.needsAuth = this.options.uri.auth;
        this.crawler.authUser = this.options.uri.username;
        this.crawler.authPass = this.options.uri.password;
    }

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


    if (this.options.baseurl) {

        baseUrlRegex = new RegExp('^' + options.url + '.*');

        this.crawler.addFetchCondition(function(parsedURL) {
            var currentUrl = parsedURL.protocol + '://' + parsedURL.host + parsedURL.uriPath;
            return currentUrl.match(baseUrlRegex);
        });
    }
};


/**
 * Crawls specified host using Simplecrawler
 * @author Steven Britton
 * @date   2016-05-10
 * @return {[type]}   [description]
 */
Crawler.prototype.crawlHost = function() {

    utils.log.log(utils.log.chalk.yellow.bold(' ⤷ Crawling Host: '), utils.log.chalk.underline.yellow(this.options.uri.host));

    var deferred = Q.defer(),
        error = [],
        self = this;

    if ( this.options.uri.host.indexOf('visual.force') > -1 ) {

        utils.log.log(utils.log.chalk.red.bold('\n   Salesforce Detected: --sitemap not supported.\n'));

        setTimeout(function(){
            deferred.resolve();
        }, 100);
    }
    else{

        error.collector404 = [];

        this.crawler.on('fetchcomplete', function(item, data, res) {

            utils.log.log(utils.log.chalk.green.bold('   ✔︎ 200 '), utils.log.chalk.green(item.url));

            this.sitemapLinks.push(item.url);

        }.bind(this));

        // will be used to check robots.txt
        this.crawler.on('fetchdisallowed', function(item) {
            if (!this.options.silent) {
                utils.log.log(utils.log.chalk.red.bold('   ✗ 200 '), utils.log.chalk.red(item.url, ' - Disallowed in robots.txt'));
            }
        }.bind(this));


        this.crawler.on('fetch404', function(item) {
            utils.log.log(utils.log.chalk.red.bold('   ✗ 404 '), utils.log.chalk.red(item.url));

            error.collector404.push({'referrer':item.referrer, 'url':item.url});
        });

        this.crawler.on('fetcherror', function(item, response) {
            utils.log.log(utils.log.chalk.red.bold('   ✗ ' + response.statusCode, response.statusMessage), ' ', utils.log.chalk.red(item.url));

            if (response.statusCode === 401) {
                utils.log.log(utils.log.chalk.red('    Authentication required - please update your ', utils.log.chalk.bold('siteshooter.yml'), ' file to include Auth user & pwd.'));
            }
        });


        this.crawler.on('complete', function() {

            if (___.isEmpty(this.sitemapLinks)) {

                error.push(utils.log.chalk.red('Website ', utils.log.chalk.underline(this.options.url), ' could not be found.'));
                utils.q.throwError(deferred, error);
            }


            // write sitemap.xml file
            sitemap.writeXML(this.sitemapLinks, function(err, sitemapFile) {

                if (err) {
                    utils.q.throwError(deferred, err);
                } else {


                    utils.log.log(utils.log.chalk.green.bold('   ✔︎ Successfully saved:'), utils.log.chalk.green(sitemapFile));
                    utils.log.log(utils.log.chalk.green.bold('   ✔︎ URLs added:'), utils.log.chalk.green(this.sitemapLinks.length));
                    utils.log.log('');

                    if (error.collector404.length > 0) {
                        this.writeCollections('urls_404.json', error.collector404, function() {
                            utils.log.log(utils.log.chalk.white(' Added %s URLs to 404 collection file.'), error.collector404.length);
                        });
                    }

                    deferred.resolve();
                }
            }.bind(this));


        }.bind(this));


        self.crawler.start();
    }

    return deferred.promise;

};


Crawler.prototype.writeCollections = function(collectionName, collection, callback) {
    fs.writeFile(collectionName, JSON.stringify(collection), function(err) {
        if (typeof callback === 'function') {
            return callback(err);
        }
        return err;
    });
};

module.exports = Crawler;
