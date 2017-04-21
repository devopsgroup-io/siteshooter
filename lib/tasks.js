var Crawler = require('./crawler'),
    PDFShooter = require('./pdf-shooter'),
    Q = require('q'),
    Screenshot = require('./screenshot-new'),
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

    var crawler = new Crawler({
            auth: {
                pwd: options.domain.auth.pwd,
                user: options.domain.auth.user
            },
            sitecrawler: options.sitecrawler_options,
            url: options.domain.name
        }),
        deferred = Q.defer(),
        hasCommand = checkForCommand(options),
        pdfShooter,
        screenshot,
        website;


    // if 0 commands were passed, run the following in sequence
    if (hasCommand.length === 0) {
        options.sitemap = true;
        options.screenshots = true;
        options.pdf = true;
    }

    utils.executeWhen(options.sitemap, () => crawler.crawlHost(), '')
        .then(function() {

            // are we screenshooting?
            return utils.executeWhen(options.screenshots, function() {

                // get local sitemap.xml and convert to JSON format
                return crawler.getSitemap()
                    .then(function(data) {

                        // set screenshots object
                        screenshot = new Screenshot({
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

                // get local sitemap.xml and convert to JSON format
                return crawler.getSitemap()
                    .then(function(data) {

                        options.pages = data;

                        pdfShooter = new PDFShooter(options);

                        return pdfShooter.start();
                    });

            });
        })
        .then(function() {

            // are we looking for website information
            return utils.executeWhen(options.website, function() {

                website = new Website(options);

                return website.get();

            });
        })

    .done(function() {
            deferred.resolve();
        },
        function(err) {
            deferred.reject(err);
        });


    return deferred.promise;

}


module.exports = {
    init: Tasks
};
