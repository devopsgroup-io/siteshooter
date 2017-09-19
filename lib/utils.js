var fs = require('fs'),
    log = require('./log'),
    path = require('path'),
    Q = require('q');


var utils = {

    checkDirectory: function(directory, callback) {
        fs.stat(directory, function fsStat(err) {
            if (err) {
                if (err.code === 'ENOENT') {
                    fs.mkdir(directory, function() {
                        return callback(null, false);
                    });

                } else {
                    return callback(err);
                }
            }
            return callback(null, false);
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
    getArrayDuplicateValues: function(arry) {
        return arry.filter(function(value) {
            return arry.filter(function(valueCompare) {
                return value.replace(/\/+$/, '') === valueCompare.replace(/\/+$/, '');
            }).length > 1;
        });
    },
    getArrayRemoveDuplicateValues: function(arry) {
        return arry.filter(function(value) {
            return arry.filter(function(valueCompare) {
                return value === valueCompare;
            });
        });
    },
    getVersion: function(numbers) {
        return {
            major: parseInt(numbers[0], 10),
            minor: parseInt(numbers[1], 10),
            patch: parseInt(numbers[2], 10)
        };
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

    urlRemoveTrailingSlash: function(link) {
        return link.replace(/\/+$/, '');
    },

    urlToDir: function(url) {
        var dir = url
            .replace(/^(http|https):\/\//, '')
            .replace(/\/$/, '');
        return dir;
    },

    writeFile: function(fileName, data) {
        return Q.promise(function(promiseResolve, promiseReject) {
            return utils.checkDirectory(path.dirname(fileName), function(err) {
                if (err){
                    promiseReject(err);
                }
                fs.writeFile(fileName, data, function() {
                    promiseResolve(null);
                });
            });
        });
    }
};

module.exports = utils;
