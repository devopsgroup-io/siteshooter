'use strict';

var cli = require('./cli'),
    config = require('./config'),
    tasks = require('./tasks'),
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

        } else if (cliArgs.init) {

            utils.createSiteshooterFile(options);

        } else {

            cli.help();

            utils.log.note('⤷ Validating Setup:');

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
                }
                else{
                    throw new Error('siteshooter.yml \n' + options.Error);
                }
            } else {
                utils.log.note('  ✔︎ siteshooter.yml file exists');
            }

            // do we have a domain name set?
            if (options.domain.name !== null) {

                utils.log.note('  ✔︎ Domain name is set');

                options.sitemapURL = options.domain.name;
            } else {
                throw new Error('Missing setting in siteshooter.yml file \n domain.name');
            }

            if (options.domain.sitemap.url !== null) {

                utils.log.note('  ✔︎ Sitemap url is set');

                options.sitemapURL += '/' + options.domain.sitemap.url;
            } else {
                throw new Error('Missing setting in siteshooter.yml file \n sitemap.url');
            }

            if (options.domain.sitemap.type !== null) {

                utils.log.note('  ✔︎ Sitemap type is set \n');

                options.sitemapURL += '.' + options.domain.sitemap.type;
            } else {
                throw new Error('Missing setting in siteshooter.yml file \n sitemap.type');
            }

            utils.log.debugDir(options);

            return tasks.run(options);

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
