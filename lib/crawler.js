'use strict';

var ___ = require('lodash'),
    config = require('./config'),
    path = require('path'),
    Q = require('q'),
    SimpleCrawler = require('simplecrawler'),
    sitemap = require('./sitemap'),
    utils = require('./utils');



var sitemapExclusions = ['gif', 'jpg', 'jpeg', 'png', 'ico', 'bmp', 'ogg', 'webp',
    'mp4', 'webm', 'mp3', 'ttf', 'woff', 'json', 'rss', 'atom', 'gz', 'zip', 'eot',
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
        crawlerExclusions;

    this.options = options;

    // sitemap file name based on user settings
    this.sitemapData = null;
    this.sitemapLinks = [];

    this.crawler = new SimpleCrawler(this.options.uri.href);

    // only crawl regular links
    this.crawler.parseScriptTags = false;
    this.crawler.parseHTMLComments = false;
    this.crawler.respectRobotsTxt = true;


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

        var self = this;

         utils.checkDirectory(path.join(config.process.get('working_directory'), '.siteshooter'), function(){

            utils.checkDirectory(path.join(config.process.get('working_directory'), '.siteshooter', 'cache'), function(){
                // cache results
                self.crawler.cache = new SimpleCrawler.cache(path.join(config.process.get('working_directory'), '.siteshooter', 'cache'));
            });
        });
    }

    // Treat self-signed SSL certificates as valid
    if(this.crawler.ignoreInvalidSSL){
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    // look for user defined crawler exclusions
    if (Array.isArray(this.options.sitecrawler.exclude) && this.options.sitecrawler.exclude.length > 0) {
        crawlerExclusions = this.options.sitecrawler.exclude.join('|');

        crawlerExclusions = new RegExp('\.(' + crawlerExclusions + ')', 'i');

        this.crawler.addFetchCondition(function(parsedURL) {
            return !parsedURL.path.match(crawlerExclusions);
        });
    }

    // sitemap file exclusions
    this.sitemapExclusions = new RegExp('\.(' + sitemapExclusions.join('|') + ')', 'i');

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

    if ( self.options.uri.host.indexOf('visual.force') > -1 ) {

        utils.log.log(utils.log.chalk.red.bold('\n   Salesforce Detected: sitemap creation not supported.\n'));

        setTimeout(function(){
            deferred.resolve();
        }, 100);

    }
    else if ( self.options.uri.host.indexOf('.sharepoint.com') > -1 || self.options.uri.host.indexOf('.azurewebsites') > -1  ) {

        utils.log.log(utils.log.chalk.red.bold('\n   Microsoft Online Detected: sitemap creation not supported.\n'));

        setTimeout(function(){
            deferred.resolve();
        }, 100);

    }
    else{

        error.collector404 = [];

        self.crawler.on('fetchcomplete', function(queueItem, data, res) {

            utils.log.log(utils.log.chalk.green.bold('   ✔︎ 200 '), utils.log.chalk.green(queueItem.url));

            // only add web pages to sitemap-links array
            if(!queueItem.path.match(self.sitemapExclusions)){
                self.sitemapLinks.push(queueItem.url);
            }

        });

        // will be used to check robots.txt
        self.crawler.on('fetchdisallowed', function(item) {
            utils.log.log(utils.log.chalk.yellow.bold('   ✗ 200 '), utils.log.chalk.yellow(item.url, ' - Disallowed in robots.txt'));
        });


        self.crawler.on('fetch404', function(item) {
            utils.log.log(utils.log.chalk.red.bold('   ✗ 404 '), utils.log.chalk.red(item.url));

            error.collector404.push({'referrer':item.referrer, 'url':item.url});
        });

        self.crawler.on('fetcherror', function(item, response) {
            utils.log.log(utils.log.chalk.red.bold('   ✗ ' + response.statusCode, response.statusMessage), ' ', utils.log.chalk.red(item.url));

            if (response.statusCode === 401) {
                utils.log.log(utils.log.chalk.red('    Authentication required - please update your ', utils.log.chalk.bold('siteshooter.yml'), ' file to include Auth user & pwd.'));
            }
        });


        self.crawler.on('complete', function() {

            if (___.isEmpty(self.sitemapLinks)) {

                error.push(utils.log.chalk.red('Website ', utils.log.chalk.underline(self.options.url), ' could not be found.'));
                utils.q.throwError(deferred, error);
            }


            // write sitemap.xml file
            sitemap.writeXML(self.sitemapLinks, function(err) {

                if (err) {
                    utils.q.throwError(deferred, err);
                } else {

                    return utils.executeWhen(error.collector404.length > 0, function() {
                        return utils.writeFile(path.join(config.process.get('working_directory'), '.siteshooter', 'urls_404.json'), JSON.stringify(error.collector404));
                    })
                    .catch(function(error) {
                        deferred.reject(error);
                    }).done(function(){
                        deferred.resolve();
                    });
                }
            });

        });

        self.crawler.start();
    }

    return deferred.promise;

};




module.exports = Crawler;
