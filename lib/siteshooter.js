'use strict';

var cli = require('./cli'),
    config = require('./config'),
    Q = require('q'),
    tasks = require('./tasks'),
    utils = require('./utils');


function configValidate(options) {

    utils.log.log(utils.log.chalk.yellow.bold(' ⤷ Validating Setup:'));

    var errorMessage = 'Missing setting in siteshooter.yml file: ',
        returnStatus = [];

    returnStatus.push('');

    function validate(setting, settingName, successMessage) {

        if (setting !== null) {
            returnStatus.push(successMessage);
        } else {
            throw new Error(errorMessage + settingName);
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
    validate(options.domain.name, 'Domain Name', 'Domain name is set: ' + utils.log.chalk.yellow.bold(options.domain.name));


    return returnStatus;
}


function execute(cliArgs) {

    return config.mergeOptions(cliArgs, function(options) {

        if (!options.quiet || !options.debug) {
            //cli.help();
        }

        // promise function signiture: promiseResolve, promiseReject, promiseNotify
        return Q.promise(function(promiseResolve, promiseReject) {

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

                utils.log.log(utils.log.chalk.green.bold(validate.join('\n   ✔︎ ')), '\n');

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
