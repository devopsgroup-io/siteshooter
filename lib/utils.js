var ___ = require('lodash'),
    forEach = require('async-foreach').forEach,
    log = require('./log'),
    path = require('path'),
    Q = require('q'),
    fs = require('graceful-fs'),
    phantom = require('phantom'),
    request = require('request'),
    xml2js = require('xml2js');


var utils = {
    log: log,
    executeWhen: function(condition, func, successMsg, failureMsg) {
        if (Array.isArray(condition)) {
            condition = condition.reduce(function(acc, val) {
                return acc && val;
            }, true);
        }
        if (condition) {
            if (successMsg) {
                log.note(successMsg);
            }
            return func();
        } else {
            if (failureMsg) {
                log.note(failureMsg);
            }
            return (function() {
                var d = Q.defer();
                d.resolve('Short circuit');
                return d.promise;
            })();
        }
    },
    getDirectories: function(srcpath) {
        return fs.readdirSync(srcpath).filter(function(file) {
            return fs.statSync(path.join(srcpath, file)).isDirectory();
        });
    },
    getFileName: function(viewport) {
        var d = new Date();
        var date = [
            d.getUTCFullYear(),
            d.getUTCMonth() + 1,
            d.getUTCDate()
        ];
        var time = [
            d.getHours() <= 9 ? '0' + d.getHours() : d.getHours(),
            d.getMinutes() <= 9 ? '0' + d.getMinutes() : d.getMinutes(),
            d.getSeconds() <= 9 ? '0' + d.getSeconds() : d.getSeconds(),
            d.getMilliseconds()
        ];
        var resolution = viewport.width;

        return resolution + '.png';
    },
    getFiles: function(srcpath) {
        return fs.readdirSync(srcpath).filter(function(file) {
            return fs.statSync(path.join(srcpath, file)).isFile();
        });
    },
    rm: function(filename) {
        var deferred = Q.defer();
        fs.unlink(filename, function(err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    },
    getSitemap: function(url) {

        log.verbose('getSitemap:', arguments);

        var deferred = Q.defer(),
            pages = [];



        request(url, function(err, resp) {

            if (resp.statusCode === 200) {

                log.verbose('Response: ', resp.statusCode);

                var parser = new xml2js.Parser();

                parser.parseString(resp.body, function(err, result) {

                    if (___.isArray(result.urlset.url)) {
                        pages = result.urlset.url.map(function(item) {
                            return item.loc[0];
                        });
                    }
                    deferred.resolve(pages);
                });
            } else {

                deferred.reject(resp.statusCode);
            }
        });


        return deferred.promise;
    },
    handleScreenshots: function(pages, viewports) {

        log.verbose('handleScreenshots:', arguments);

        var d = Q.defer();


        function renderPage(url, done) {

            var folder = utils.urlToDir(url),
                output, key;

            phantom.create().then(function(ph) {
                ph.createPage().then(function(page) {

                    page.open(url).then(function() {

                        log.note('   ⤷  Page ' + folder);

                        function renderView(n) {
                            if (!!n) {
                                key = n - 1;

                                page.property('viewportSize', viewports[key].width +  viewports[key].height);

                                output = 'screenshots/' + folder + '/' + utils.getFileName(viewports[key]);

                                log.note('       ⤷ Viewport ' + viewports[key].width + 'x' + viewports[key].height);

                                setTimeout(function() {
                                    page.render(output).then(function() {
                                        renderView(key);
                                    });
                                }, 400);

                            } else {

                                ph.exit();
                                done();

                            }
                        }

                        renderView(viewports.length);

                    });
                });
            });
        }


        forEach(pages, function(page) {
            var done = this.async();

            renderPage(page, function(err) {
                if (err) {
                    done();
                }

                done();
            });

        }, function(success, array) {

            d.resolve();
        });


        return d.promise;
    },
    urlToDir: function(url) {
        var dir = url
            .replace(/^(http|https):\/\//, '')
            .replace(/\/$/, '');
        return dir;
    }
};

module.exports = utils;
