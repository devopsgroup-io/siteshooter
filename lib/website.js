'use strict';

var config = require('./config'),
    fs = require('fs'),
    https = require('https'),
    json2csv = require('json2csv'),
    Q = require('q'),
    urlParse = require('url-parse'),
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

    this.uri = this.options || null;

};

var API = {
    getGooglePageSpeed: function(page, strategy) {

        strategy = strategy || 'desktop';

        return Q.promise(function(promiseResolve, promiseReject) {
            return https.get('https://www.googleapis.com/pagespeedonline/v2/runPagespeed?prettyprint=false&strategy=' + strategy + '&url=https%3A%2F%2F' + page, function(response) {
                var body = '';
                response.on('data', function(d) {
                    body += d;
                });
                response.on('end', function() {
                    promiseResolve(JSON.parse(body));
                });
                response.on('error', function(err) {
                    promiseReject(err);
                });
            });
        });
    }

};


function analizeContentCollection(summary) {

    var host = config.getOptions().domain.uri,
        imageSource;

    summary.content.pages.forEach(function(page) {

        summary.report.summary.push({
            'URL': page.loc,
            'Page Title': page.meta.title,
            'Page Description': page.meta.description
        });

        page.body.images.forEach(function(image) {

            if (!image.alt || image.alt === '') {

                imageSource = urlParse(image.src);

                summary.console.altTags.push({
                    image: image.src,
                    url: page.loc
                });

                if( imageSource.host === '' ){
                    imageSource = host.origin + imageSource.href;
                }
                else if( imageSource.host ===  host.host ){
                    imageSource = host.origin + imageSource.pathname;
                }
                else{
                    imageSource = imageSource.host + imageSource.pathname + imageSource.query;
                }

                summary.report.issues.push({
                    'URL': page.loc,
                    'Issue': 'Missing Alt Tag',
                    'SRC': imageSource
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

    return summary;
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

function get404s() {

    return Q.promise(function(promiseResolve, promiseReject) {

        return fs.readFile('.siteshooter/urls_404.json', function(err, data) {

            if (err) {
                // file doesn't exist
                if (err.errno === -2) {
                    return promiseResolve(false);
                } else {
                    return promiseReject(err);
                }
            } else {
                return promiseResolve(JSON.parse(data.toString()));
            }

        });
    });
}


function writeCSV(fileName, arrFields, arrData) {

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



Website.prototype.getContentCollection = function() {

    return Q.promise(function(promiseResolve, promiseReject) {

        return fs.readFile('.siteshooter/content-collection.json', function(err, data) {

            if (err) {

                // if content-collection.json does not exist, don't bomb out.
                if (err.code === 'ENOENT') {

                    utils.log.log('');
                    utils.log.log(utils.log.chalk.yellow.bold('     Warning:'), utils.log.chalk.yellow('content-collection.json does not exist. Skipping website content collection.'));
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

    var self = this,
        summary = {
            console: {
                altTags: [],
                metaDescription: [],
                metaTitle: []
            },
            report: {
                issues: [],
                summary: []
            }
        };

    return Q.promise(function(promiseResolve, promiseReject) {

        self.getContentCollection().then(function(pages) {

                if (!pages) {

                    utils.log.log(utils.log.chalk.yellow.bold('     Run the following command to collect website data:'));
                    utils.log.log(utils.log.chalk.yellow.bold('\n     $ siteshooter --screenshots \n\n'));

                    summary.content = {
                        pages: []
                    };
                } else {
                    summary.content = pages;
                }
                return summary;
            })
            .then(analizeContentCollection)
            .then(function() {
                return API.getGooglePageSpeed(self.options.domain.name.replace(/^(http|https):\/\//, ''));
            })
            .then(function(googleSpeedDesktopData) {
                summary.googleSpeedDesktopData = googleSpeedDesktopData;
                return summary;
            })
            .then(get404s)
            .then(function(data404) {
                summary.data404 = data404;
                return summary;
            })
            .then(function() {

                return utils.executeWhen(summary.content.pages.length > 0, function() {

                    var summaryReport = [
                        '',
                        utils.log.chalk.yellow.bold('=================================================='),
                        utils.log.chalk.yellow.bold('======== SUMMARY REPORT =========================='),
                        utils.log.chalk.yellow.bold('=================================================='),
                    ];

                    summaryReport.push(utils.log.chalk.green.bold('Sitemap links: ') + utils.log.chalk.green(summary.content.pages.length));

                    // Check for 404s
                    if (summary.data404) {

                        summaryReport.push(utils.log.chalk.red.bold('404s: ') + utils.log.chalk.red(summary.data404.length));

                        summary.data404.forEach(function(item) {
                            summary.report.issues.push({
                                'URL': item.referrer,
                                'Issue': '404',
                                'SRC': item.url
                            });
                        });
                    } else {
                        summaryReport.push(utils.log.chalk.green(utils.log.chalk.bold('404s:') + ' 0'));
                    }

                    Object.keys(summary.console).forEach(function(key) {

                        var item = summary.console[key],
                            stringItem = '';

                        stringItem = utils.log.chalk.bold('Missing ' + key + ': ') + item.length;

                        if (item.length > 0) {
                            stringItem = utils.log.chalk.red(stringItem);
                        } else {
                            stringItem = utils.log.chalk.green(stringItem);
                        }

                        summaryReport.push(stringItem);

                    });

                    if (!summary.googleSpeedDesktopData.error) {
                        summaryReport.push('');
                        summaryReport.push(utils.log.chalk.yellow.bold('Google PageSpeed'));

                        if(summary.googleSpeedDesktopData.responseCode === 401){
                            summaryReport.push(utils.log.chalk.red.bold('401 Unauthorized'));
                        }
                        else{
                            summaryReport.push(utils.log.chalk.green.bold('Desktop Score: ') + utils.log.chalk.green(summary.googleSpeedDesktopData.ruleGroups.SPEED.score));
                        }
                    }

                    utils.log.log(utils.log.chalk.white(summaryReport.join('\n  ')));

                });

            })
            .then(function() {
                return utils.executeWhen(summary.report.issues.length > 0, function() {
                    return writeCSV('siteshooter-report-issues-', ['URL', 'Issue', 'SRC'], summary.report.issues);
                });
            })
            .then(function(){
                return writeCSV('siteshooter-report-summary-', ['URL', 'Page Title', 'Page Description'], summary.report.summary);
            })
            .catch(promiseReject)
            .done(promiseResolve);
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


module.exports = Website;
