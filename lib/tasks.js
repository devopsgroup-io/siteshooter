var PDFShooter = require('./pdf-shooter'),
    Q = require('q'),
    Screenshot = require('./screenshot'),
    Sitemap = require('./sitemap'),
    utils = require('./utils');


function checkForCommand(options) {

    var commands = [
            'pdf',
            'screenshots',
            'sitemap'
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
        hasCommand = checkForCommand(options),
        pdfShooter,
        screenshot,
        sitemap = new Sitemap({
            auth: {
                pwd: options.domain.auth.pwd,
                user: options.domain.auth.user
            },
            url: options.domain.name,
            filename: options.domain.sitemap.url + '.' + options.domain.sitemap.type
        });


    // if 0 commands were passed, run the following in sequence
    if (hasCommand.length === 0) {
        options.sitemap = 'create';
        options.screenshots = true;
        options.pdf = true;
    }

    utils.executeWhen(options.sitemap && options.sitemap === 'create', () => sitemap.create(), '')
        .then(function() {
            return utils.executeWhen(options.sitemap && options.sitemap === 'delete', () => sitemap.delete());
        })
        .then(function() {

            // are we screenshooting?
            return utils.executeWhen(options.screenshots, function() {

                // get local sitemap.xml and convert to JSON format
                return sitemap.toJSON()
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

                pdfShooter = new PDFShooter(options);

                return pdfShooter.start();

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
