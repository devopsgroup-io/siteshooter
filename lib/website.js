'use strict';

var fs = require('fs'),
    Q = require('q'),
    utils = require('./utils');


/**
 * Website Object
 * @author Steven Britton
 * @date   2016-04-14
 * @param  {Object}  options [description]
 */
var Website = function(parameters) {

    utils.log.verbose('Website: constructor', parameters);

    this.options = parameters;

    this.contentCollection = {
        pages: []
    };

    this.contentFile = 'content-collection.json';
    this.uri = this.options || null;

};


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

    var deferred = Q.defer(),
        website = this;



    fs.readFile(website.contentFile, function(err, data) {

        if (err) {

            // if content-collection.json does not exist, don't bomb out.
            if (err.code === 'ENOENT') {

                utils.log.log('');
                utils.log.log(utils.log.chalk.yellow.bold('     Warning: '), utils.log.chalk.yellow(website.contentFile, 'does not exist. Skipping website content collection.'));
                utils.log.log('');

                website.contentCollection = false;

                deferred.resolve();
            } else {
                deferred.reject(err);
            }
        } else {
            website.contentCollection = JSON.parse(data);

            deferred.resolve(data);
        }
    });


    return deferred.promise;
};

Website.prototype.summary = function() {

    var self = this,
        summary = {
            problem: {
                links: [],
                metaDescription:[],
                metaTitle:[],
            }
        };



    return self.get().then(function() {

        self.contentCollection.pages.forEach(function(page, i) {

            page.body.images.forEach(function(image, j) {

                if (image.alt === '') {

                    summary.problem.links.push({
                        image: image.src,
                        url: page.loc
                    });
                }

            });

            if (page.meta.title === '') {

                summary.problem.metaTitle.push({
                    url: page.loc
                });
            }

            if (page.meta.description === '') {

                summary.problem.metaDescription.push({
                    url: page.loc
                });
            }

        });

        Object.keys(summary.problem).forEach(function(key) {

            var item = summary.problem[key];

            if( item.length > 0 ){
                console.log(key, item.length);
            }

        });
    });

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


/**
 * Writes out site content collection
 * @author Steven Britton
 * @date   2016-04-12
 * @param  {Function} callback callback function
 * @return {Function} callback
 */
Website.prototype.writeContentCollection = function(callback) {
    fs.writeFile(this.contentFile, JSON.stringify(this.contentCollection), function(err) {
        if (typeof callback === 'function') {
            return callback(err);
        }
        return err;
    });
};

module.exports = Website;
