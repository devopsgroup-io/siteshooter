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



module.exports = Website;
