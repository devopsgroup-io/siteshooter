'use strict';

var fs = require('fs'),
    json2csv = require('json2csv'),
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

    this.contentFile = '.siteshooter/content-collection.json';
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

function get404s(ignoreENOENT) {

    var deferred = Q.defer();

    fs.readFile('.siteshooter/urls_404.json', function(err, data) {

        if (err) {
            // file doesn't exist
            if (err.errno === -2 && ignoreENOENT) {
                deferred.resolve(false);
            } else {
                utils.q.throwError(deferred, err);
            }
        } else {
            deferred.resolve(JSON.parse(data.toString()));
        }

    });

    return deferred.promise;
}


function writeReport(fileName, arrFields, arrData, callback) {

    var d = new Date(),
        date = d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(),
        deferred = Q.defer();

    json2csv({
        data: arrData,
        fields: arrFields,
    }, function(err, csv) {

        fs.writeFile(fileName + date + '.csv', csv, function(err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
    });

    return deferred.promise;
}



Website.prototype.get = function() {

    return Q.promise(function(promiseResolve, promiseReject) {

        return fs.readFile('.siteshooter/content-collection.json', function(err, data) {

            if (err) {

                // if content-collection.json does not exist, don't bomb out.
                if (err.code === 'ENOENT') {

                    utils.log.log('');
                    utils.log.log(utils.log.chalk.yellow.bold('     Warning: '), utils.log.chalk.yellow('content-collection.json does not exist. Skipping website content collection.'));
                    utils.log.log('');

                    return promiseResolve(null);
                } else {
                    return promiseReject(err);
                }
            } else {
                return promiseResolve(JSON.parse(data));
            }

        });
    });

};



Website.prototype.summary = function() {

    var deferred = Q.defer(),
        self = this,
        summary = {
            console: {
                altTags: [],
                links: [],
                metaDescription: [],
                metaTitle: []
            },
            report: {
                issues: [],
                summary: []
            }
        };

    self.get().then(function(data) {

        return get404s(true).then(function(data404) {

            data.pages.forEach(function(page, i) {


                summary.report.summary.push({
                    'URL': page.loc,
                    'Page Title': page.meta.title,
                    'Page Description': page.meta.description
                });

                page.body.images.forEach(function(image, j) {

                    if (!image.alt || image.alt === '') {

                        summary.console.altTags.push({
                            image: image.src,
                            url: page.loc
                        });

                        summary.report.issues.push({
                            'URL': page.loc,
                            'Issue': 'Missing Alt Tag',
                            'SRC': self.options.domain.uri.href.replace(/\/$/, '') + '/' + image.src.replace(self.options.domain.uri.href, '').replace(/\//, '')
                        });

                    }

                });

                if (!page.meta.title || page.meta.title === '') {

                    summary.console.metaTitle.push({
                        url: page.loc
                    });

                    summary.report.issues.push({
                        'URL': page.loc,
                        'Issue': 'Missing Meta Title'
                    });
                }

                if (!page.meta.description || page.meta.description === '') {

                    summary.console.metaDescription.push({
                        url: page.loc
                    });

                    summary.report.issues.push({
                        'URL': page.loc,
                        'Issue': 'Missing Meta Description'
                    });
                }

            });

            var str404s = '',
                summaryReport = [
                    '',
                    utils.log.chalk.yellow.bold('=================================================='),
                    utils.log.chalk.yellow.bold('======== SUMMARY REPORT =========================='),
                    utils.log.chalk.yellow.bold('=================================================='),
                ];

            summaryReport.push(utils.log.chalk.green.bold('Number of webpages: ') + utils.log.chalk.green(data.pages.length));

            // Check for 404s
            if (data404) {

                str404s = utils.log.chalk.red.bold('✗ Number of 404s: ') + utils.log.chalk.red(data404.length);

                data404.forEach(function(item) {
                    summary.report.issues.push({
                        'URL': item.url,
                        'Issue': '404',
                        'SRC': item.referrer
                    });
                });
            } else {
                str404s = utils.log.chalk.green(utils.log.chalk.bold('✔︎ Number of 404s:') + ' 0');
            }

            summaryReport.push(str404s);

            Object.keys(summary.console).forEach(function(key) {

                var item = summary.console[key],
                    stringItem = '';

                stringItem = utils.log.chalk.bold('Missing ' + key + ': ') + item.length;

                if (item.length > 0) {
                    stringItem = utils.log.chalk.red.bold('✗ ') + utils.log.chalk.red(stringItem);
                } else {
                    stringItem = utils.log.chalk.green.bold('✔︎ ') + utils.log.chalk.green(stringItem);
                }

                summaryReport.push(stringItem);

            });

            utils.log.log(utils.log.chalk.white(summaryReport.join('\n  ')));


            return utils.executeWhen(summary.report.issues.length > 0, function() {

                    return writeReport('siteshooter-report-issues-', ['URL', 'Issue', 'SRC'], summary.report.issues);

                })
                .then(writeReport('siteshooter-report-summary-', ['URL', 'Page Title', 'Page Description'], summary.report.summary))
                .catch(function(error) {
                    deferred.reject(error);
                }).done(function() {
                    deferred.resolve();
                });

        });

    }).catch(function() {
        deferred.reject(utils.log.chalk.bold('Run the following command to collect website data: \n\n') + utils.log.chalk.yellow.bold(' $ siteshooter --screenshots \n\n'));
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


/**
 * Writes out site content collection
 * @author Steven Britton
 * @date   2016-04-12
 * @param  {Function} callback callback function
 * @return {Function} callback
 */
Website.prototype.writeContentCollection = function(callback) {

    return utils.writeFile('.siteshooter/content-collection.json', JSON.stringify(this.contentCollection)).then(function() {
        callback(null);
    }).catch(function(err) {
        callback(err);
    });

};

module.exports = Website;
