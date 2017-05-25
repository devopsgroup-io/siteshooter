'use strict';

var cli = require('./cli'),
    config = require('./config'),
    Q = require('q'),
    tasks = require('./tasks'),
    utils = require('./utils');


function execute(cliArgs) {

    return config.mergeOptions(cliArgs).then(function(options) {

        if( !options.commands.debug || options.commands.quiet ){
            cli.help();
        }


        // promise function signiture: promiseResolve, promiseReject, promiseNotify
        return Q.promise(function(promiseResolve, promiseReject) {



            utils.log.log(utils.log.chalk.yellow.bold(' ⤷ Validating Setup:'));
            utils.log.log('');
            utils.log.log(utils.log.chalk.green.bold('  ✔︎  siteshooter.yml file exists'));
            utils.log.log(utils.log.chalk.green.bold('  ✔︎  Domain name is set: ' + utils.log.chalk.yellow.bold(options.domain.name)));
            utils.log.log('');

            if (options.commands.version) {
                cli.version();
            } else if (cliArgs.help) {

                cli.help();

            } else if (options.commands.config) {

                cli.config(options);

            } else if (options.commands.init) {

                utils.createSiteshooterFile(options);

            } else {

                utils.log.debugDir(options);

                return tasks.init(options).done(function() {
                    promiseResolve();
                }, function(err) {
                    promiseReject(err);
                });
            }

        });
    });
}

function fromCli(options) {
    return execute(cli.parse(options));
}



module.exports = {
    cli: fromCli,
    execute: execute
};
