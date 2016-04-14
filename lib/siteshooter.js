'use strict';

var chalk = require('chalk'),
    cli = require('./cli'),
    config = require('./config'),
    tasks = require('./tasks'),
    utils = require('./utils'),
    when = require('when');


function execute(cliArgs) {

    var options = config.mergeOptions(cliArgs);

    // promise function signiture: promiseResolve, promiseReject, promiseNotify
    return when.promise(function(promiseResolve, promiseReject, promiseNotify) {

        if (cliArgs.version) {

            cli.version();

        } else if (cliArgs.help) {

            cli.help();

        } else if (cliArgs.config) {

            cli.config(options);

        } else if (cliArgs.init) {

            utils.createSiteshooterFile(options);

        } else {

            cli.help();

            console.log(chalk.yellow.bold(' ⤷ Validating Setup:'));

            if (options.force) {
                utils.log.warn('Using --force, I sure hope you know what you are doing.');
            }

            if (options.debug) {
                require('when/monitor/console');
            }

            // did attempting to load siteshooter.yml return an error?
            if (options.Error) {

                if (options.Error.code === 'ENOENT') {

                    throw new Error('Missing siteshooter.yml file. Run the following command to create one: \n\n $ siteshooter --init');
                } else {
                    throw new Error('siteshooter.yml \n' + options.Error);
                }
            } else {
                console.log(chalk.green.bold('   ✔︎ '), chalk.green('siteshooter.yml file exists'));
            }

            // do we have a domain name set?
            if (options.domain.name !== null) {

                console.log(chalk.green.bold('   ✔︎ '), chalk.green('Domain name is set'));

                options.sitemapURL = options.domain.name;
            } else {
                throw new Error('Missing setting in siteshooter.yml file \n domain.name');
            }

            if (options.domain.sitemap.url !== null) {

                console.log(chalk.green.bold('   ✔︎ '), chalk.green('Sitemap url is set'));

                options.sitemapURL += '/' + options.domain.sitemap.url;
            } else {
                throw new Error('Missing setting in siteshooter.yml file \n sitemap.url');
            }

            if (options.domain.sitemap.type !== null) {

                console.log(chalk.green.bold('   ✔︎ '), chalk.green('Sitemap type is set \n'));

                options.sitemapURL += '.' + options.domain.sitemap.type;
            } else {
                throw new Error('Missing setting in siteshooter.yml file \n sitemap.type');
            }

            utils.log.debugDir(options);

            return tasks.init(options)
                .done(function() {
                    promiseResolve();
                }, function(err) {
                    promiseReject(err);
                });
        }

    }).catch(function(error) {

        var reportError = Array.isArray(error) ? error.join('\n') : error;

        if (options.debug) {
           //utils.log.error(error);
           console.error(chalk.red.bold('✗ '), chalk.red(reportError.stack));
        }
        throw new Error(reportError);

    });
}

function fromCli(options) {
    return execute(cli.parse(options));
}

module.exports = {
    cli: fromCli,
    execute: execute
};
