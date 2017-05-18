var Crawler = require('./crawler'),
    PDFShooter = require('./pdf-shooter'),
    Q = require('q'),
    Screenshot = require('./screenshot'),
    sitemap = require('./sitemap'),
    utils = require('./utils'),
    Website = require('./website');


function checkForCommand(options) {

    var commands = [
            'pdf',
            'screenshots',
            'sitemap',
            'website'
        ],
        hasCommand = commands.filter(function(item) {
            return (options[item]);
        });

    return hasCommand;
}

/**
 * Tasks Object
 * @author Steven Britton
 * @date   2016-04-12
 * @param  {Object}   options Contains configuration options and CLI arguments
 */
function Tasks(options) {

    var deferred = Q.defer(),
        hasCommand = checkForCommand(options);


    // if 0 commands were passed, run the following in sequence
    if (hasCommand.length === 0) {
        options.sitemap = true;
        options.screenshots = true;
        options.pdf = true;
    }

    utils.executeWhen(options.sitemap, function() {

        var URL = require('url-parse'),
            website = new URL(options.domain.name);

        if (website.protocol === '') {
            throw new Error('Missing http protocol. Please update your siteshooter.yml domain name setting.\n');
        }

        var crawler = new Crawler({
            auth: {
                pwd: options.domain.auth.pwd,
                user: options.domain.auth.user
            },
            sitecrawler: options.sitecrawler_options,
            url: website
        });

        return crawler.crawlHost();

    }).then(function() {

        // are we screenshooting?
        return utils.executeWhen(options.screenshots, function() {

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
        return utils.executeWhen(options.pdf, function() {

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
        return utils.executeWhen(options.website, function() {

            var website = new Website(options);

            return website.get();

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
