var Crawler = require('./crawler'),
    PDFShooter = require('./pdf-shooter'),
    Q = require('q'),
    Screenshot = require('./screenshot'),
    sitemap = require('./sitemap'),
    utils = require('./utils'),
    Website = require('./website');




/**
 * Tasks Object
 * @author Steven Britton
 * @date   2016-04-12
 * @param  {Object}   options Contains configuration options and CLI arguments
 */
function Tasks(options) {

    var deferred = Q.defer();

    utils.executeWhen(options.commands.sitemap, function() {

        var crawler = new Crawler({
            sitecrawler: options.sitecrawler_options,
            uri: options.domain.uri
        });

        return crawler.crawlHost();

    }).then(function() {

        // are we screenshooting?
        return utils.executeWhen(options.commands.screenshots, function() {

            // get local sitemap links
            return sitemap.get().then(function(data) {

                // set screenshots object
                var screenshot = new Screenshot({
                    pages: data,
                    options: options
                });

                // run screenshots
                return screenshot.start();
            });
        });
    })
    .then(function() {

        // are we generating PDFs?
        return utils.executeWhen(options.commands.pdf, function() {

            // get local sitemap links
            return sitemap.get().then(function(data) {

                options.pages = data;

                var pdfShooter = new PDFShooter(options);

                return pdfShooter.start();
            });

        });
    })
    .then(function() {

        // are we looking for website information
        return utils.executeWhen(options.commands.website, function() {

            var website = new Website(options);

            return website.summary();

        });
    })
    .catch(function(error) {
        deferred.reject(error);
    })

    .done(function() {
        deferred.resolve();
    });


    return deferred.promise;

}


module.exports = {
    init: Tasks
};
