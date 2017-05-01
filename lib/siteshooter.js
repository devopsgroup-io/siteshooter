'use strict';

var chalk = require('chalk'),
    cli = require('./cli'),
    config = require('./config'),
    tasks = require('./tasks'),
    utils = require('./utils'),
    when = require('when');


function configValidate(options) {

    utils.log.log(chalk.yellow.bold(' ⤷ Validating Setup:'));

    var errorMessage = 'Missing setting in siteshooter.yml file \n',
        returnStatus = [];

    returnStatus.push('');

    function validate(setting, successMessage) {
        if (setting !== null) {
            returnStatus.push(successMessage);
        } else {
            throw new Error(errorMessage + setting);
        }

    }

    // loading siteshooter.yml return an error?
    if (options.Error) {

        if (options.Error.code === 'ENOENT') {
            throw new Error('Missing siteshooter.yml file. Run the following command to create one: \n $ siteshooter --init \n\n');
        } else {
            throw new Error('siteshooter.yml \n' + options.Error);
        }
    } else {
        returnStatus.push('siteshooter.yml file exists');
    }

    // do we have a domain name set?
    validate(options.domain.name, 'Domain name is set: ' + chalk.yellow.bold(options.domain.name));


    return returnStatus;
}


function execute(cliArgs) {

    return config.mergeOptions(cliArgs, function(options) {

        // promise function signiture: promiseResolve, promiseReject, promiseNotify
        return when.promise(function(promiseResolve, promiseReject) {

            if (!options.quiet || !options.debug) {
                cli.help();
            }

            if (cliArgs.version) {

                cli.version();

            } else if (cliArgs.help) {

                cli.help();

            } else if (cliArgs.config) {

                cli.config(options);

            } else if (cliArgs.init) {

                utils.createSiteshooterFile(options);

            } else {

                utils.log.debugDir(options);

                var validate = configValidate(options);

                utils.log.log(chalk.green.bold(validate.join('\n   ✔︎ ')), '\n');

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
