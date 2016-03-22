var log = require('./log'),
    path = require('path'),
    Q = require('q'),
    fs = require('graceful-fs');

var utils = {
    log: log,
    createSiteshooterFile: function(options) {

        fs.readFile(options.module.paths.src + '/siteshooter.yml', function(err, data) {

            if (err) {

                utils.log.error(err);
                throw err;
            }

            fs.writeFile('siteshooter.yml', data, function(err) {

                if (err) {
                    utils.log.error(err);
                    throw err;
                }
                else{
                    log.success('siteshooter.yml was successfully created');
                }
            });
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
    getDirectories: function(srcpath) {
        return fs.readdirSync(srcpath).filter(function(file) {
            return fs.statSync(path.join(srcpath, file)).isDirectory();
        });
    },
    getDate: function(){

        var d = new Date(),
        date =
            d.getUTCFullYear() + '-' +
            (d.getUTCMonth() + 1) + '-' +
            d.getUTCDate();
        return date;

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
    urlToDir: function(url) {
        var dir = url
            .replace(/^(http|https):\/\//, '')
            .replace(/\/$/, '');
        return dir;
    }
};

module.exports = utils;
