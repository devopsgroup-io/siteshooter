'use strict';

var chalk = require('chalk'),
    fs = require('graceful-fs'),
    path = require('path'),
    Q = require('q'),
    utils = require('./utils');


/**
 * Gets local content collection file
 * @author Steven Britton
 * @date   2016-04-12
 * @param  {String}   sitemapFile Sitemap file name
 * @param  {Function} callback    callback
 * @return {Function}             callback
 */
function getLocalFile(localFile, callback) {
    fs.readFile(localFile, function(err, data) {
        return callback(err, data);
    });
}


/**
 * Website Object
 * @author Steven Britton
 * @date   2016-04-14
 * @param  {Object}  options [description]
 */
function Website(parameters) {

    utils.log.verbose('Website: constructor', parameters);

    this.options = parameters;

    this.contentCollection = {
        pages: []
    };

    this.contentFile = 'content-collection.json';
    this.uri = this.options || null;

}


/**
 * getGoogleAnalyticsVersion
 * @author Steven Britton
 * @date   2016-04-26
 * @param  {String}   htmlHead
 * @return {String}   ga version
 */
function getGoogleAnalyticsVersion(htmlHead) {

    var version = 'Not Installed';

    if (htmlHead.indexOf('analytics.js') !== -1) {
        version = 'analytics';
    } else if (htmlHead.indexOf('ga.js') !== -1) {
        version = 'ga';
    }

    return version;
}

Website.prototype.get = function() {

    console.log(chalk.yellow.bold(' ⤷ Gathering Website Information'));

    var deferred = Q.defer(),
        website = this;


    getLocalFile(this.contentFile, function(err, data) {

        if (err) {
            utils.q.throwError(deferred, err);
        }

        website.contentCollection = JSON.parse(data);

        deferred.resolve(data);
    });


    return deferred.promise;
};

/**
 * Scrapes general metadata terms given Cheerio loaded html object
 * @author Steven Britton
 * @date   2016-04-26
 * @param  {Object}  chtml  cheerio object
 * @return {Object}         Metadata
 */
Website.prototype.metadata = function(chtml) {

    var clutteredMeta = {
        author: chtml('meta[name=author]').first().attr('content'),
        authorlink: chtml('link[rel=author]').first().attr('href'),
        canonical: chtml('link[rel=canonical]').first().attr('href'),
        description: chtml('meta[name=description]').attr('content'),
        gaVersion: getGoogleAnalyticsVersion(chtml('head').text()),
        keywords: chtml('meta[name=keywords]').attr('content'),
        publisher: chtml('link[rel=publisher]').first().attr('href'),
        robots: chtml('meta[name=robots]').first().attr('content'),
        shortlink: chtml('link[rel=shortlink]').first().attr('href'),
        title: chtml('title').first().text()
    };

    // Copy key-value pairs with defined values to meta
    var meta = {};
    var value;
    Object.keys(clutteredMeta).forEach(function(key) {
        value = clutteredMeta[key];
        if (value) {
            meta[key] = value;
        }
    });

    return meta;
};

module.exports = Website;
