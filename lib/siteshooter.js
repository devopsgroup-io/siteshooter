'use strict';

var cli = require('./cli'),
    config = require('./config'),
    //tasks = require('./tasks'),
    Q = require('q'),
    utils = require('./utils'),
    when = require('when');


function execute(cliArgs) {

    var options = config.mergeOptions(cliArgs);

    return when.promise(function() {

        if (cliArgs.version) {
            cli.version();
        } else if (cliArgs.help) {

            cli.help();

        } else if (cliArgs.config) {

            cli.config(options);

        } else {

            if (options.force) {
                utils.log.warn('Using --force, I sure hope you know what you are doing.');
            }

            if (options.debug) {
                require('when/monitor/console');
            }

            utils.log.debugDir(options);

            var deferred = Q.defer();

            utils.executeWhen(options.sitemapURL !=='', () => utils.getSitemap(options.sitemapURL), '⤷ Getting sitemap file: ' + options.sitemapURL)
                .then(function(pages) {
                    return utils.executeWhen(true, () => utils.handleScreenshots(pages, options.viewports), '   ⤷ Generating screenshots');
                })
                .done(function() {
                        console.log('✔︎ Done generating screenshots');
                        deferred.resolve();
                    },
                    function(err) {
                        console.log('✗ ERROR: ', err);
                        deferred.reject(err);
                    });

            return deferred.promise;

        }

    }).catch(function(error) {

        utils.log.error(error);

        if (options.debug) {
            throw error;
        }

    });
}

function fromCli(options) {
    return execute(cli.parse(options));
}

module.exports = {
    cli: fromCli,
    execute: execute
};
