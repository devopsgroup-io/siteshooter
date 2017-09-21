'use strict';

var cli = require('./cli'),
    config = require('./config'),
    Crawler = require('./crawler'),
    PDFShooter = require('./pdf-shooter'),
    Q = require('q'),
    Screenshot = require('./screenshot'),
    sitemap = require('./sitemap'),
    utils = require('./utils'),
    Website = require('./website');


function execute(args) {

    return config.getSettings(args).then(function(options) {

        return Q.promise(function(promiseResolve, promiseReject) {

            if (options.commands.init) {
                utils.log.log(utils.log.chalk.green.bold(' ✔︎ siteshooter.yml file was successfully created'));
                return promiseResolve();
            }

            utils.log.log(utils.log.chalk.yellow.bold(' ⤷ Validating Setup:'));
            utils.log.log('');
            utils.log.log(utils.log.chalk.green.bold('  ✔︎  siteshooter.yml file exists'));
            utils.log.log(utils.log.chalk.green.bold('  ✔︎  Domain name is set: ' + utils.log.chalk.yellow.bold(options.domain.name)));
            utils.log.log('');

            if (options.commands.version) {
                cli.version();
            } else if (options.commands.help) {

                cli.help();

            } else if (options.commands.config) {

                cli.config(options);

            } else {

                utils.log.debugDir(options);

                // are we generating a sitemap?
                return utils.executeWhen(options.commands.sitemap, function() {

                    return new Crawler({
                        sitecrawler: options.sitecrawler_options,
                        uri: options.domain.uri
                    }).crawlHost();

                }).then(function() {

                    // are we screenshooting?
                    return utils.executeWhen(options.commands.screenshots, function() {

                        // get local sitemap links
                        return sitemap.get().then(function(data) {
                            return new Screenshot(data).start();
                        });

                    });

                }).then(function() {

                    // are we generating PDFs?
                    return utils.executeWhen(options.commands.pdf, function() {

                        // get local sitemap links
                        return sitemap.get().then(function(data) {

                            options.pages = data;

                            return new PDFShooter(options).start();

                        });

                    });

                }).then(function() {

                    // are we looking for website information
                    return utils.executeWhen(options.commands.website, function() {

                        return new Website(options).summary();

                    });

                }).catch(function(error) {
                    promiseReject(error);
                }).done(function() {
                    promiseResolve();
                });
            }
        });
    });
}

function fromCli(args) {

    args = cli.parse(args);

    if (!args.commands.debug || args.commands.quiet) {
        cli.help();
    }

    return execute(args);
}



module.exports = {
    cli: fromCli,
    execute: execute
};
