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

        }
        else if (cliArgs.init) {

            utils.createSiteshooterFile(options);

        } else {

            cli.help();

            if (options.force) {
                utils.log.warn('Using --force, I sure hope you know what you are doing.');
            }

            if (options.debug) {
                require('when/monitor/console');
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
