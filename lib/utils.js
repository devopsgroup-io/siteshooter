var log = require('./log'),
    path = require('path'),
    Q = require('q'),
    fs = require('graceful-fs');

var utils = {

    createSiteshooterFile: function(options) {

        var LOCAL_CONFIG_PATH = path.resolve(process.cwd(), 'siteshooter.yml');

        // first make sure file doesn't exist so that we don't overwrite it
        fs.stat(LOCAL_CONFIG_PATH, function(err, stat) {


            if (err) {

                // file does not exist-
                if (err.code === 'ENOENT') {


                    // grab siteshooter.yml template file from node module
                    fs.readFile(options.module.paths.src + '/siteshooter.yml', function(err, data) {

                        if (err) {

                            log.error(err);
                            throw err;
                        }

                        // noew create siteshooter.yml template file
                        fs.writeFile('siteshooter.yml', data, function(err) {

                            if (err) {
                                log.error(err);
                                throw err;
                            } else {
                                log.success('siteshooter.yml was successfully created');
                            }
                        });
                    });
                }

            } else {
                log.warn('sitshooter.yml file already exists. Skipping --init');
            }

        });


    },
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
    log: log,

    q: {
        aggregateProgress: function(num) {
            var total = 0;
            return function(progression, message) {
                total += progression;
                console.log('Progressed ', ((total / num) * 100).toFixed(2) + '%');
                console.log(message);
            };
        },
        throwError: function(q, error) {
            q.reject(Error(error));
            return q.promise;
        }
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

    urlCheckProtocol: function(url) {
        var pattern = /^((http|https|ftp):\/\/)/;

        if (!pattern.test(url)) {
            url = 'http://' + url;
        }

        return url;
    },

    urlToDir: function(url) {
        var dir = url
            .replace(/^(http|https):\/\//, '')
            .replace(/\/$/, '');
        return dir;
    }
};

module.exports = utils;
