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

            if (options.force) {
                utils.log.warn('Using --force, I sure hope you know what you are doing.');
            }

            if (options.debug) {
                require('when/monitor/console');
            }

            if (options.Error) {

                if (options.Error.code === 'ENOENT') {

                    throw new Error('Missing siteshooter.yml file. Run the following command to create one: \n\n $ siteshooter --init');
                }
            }

            if (options.domain.name !== null) {
                options.sitemapURL = options.domain.name + '/' + options.domain.sitemap.url + '.' + options.domain.sitemap.type;
            }
            else{
                throw new Error('Missing setting in siteshooter.yml file: domain.name');
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
