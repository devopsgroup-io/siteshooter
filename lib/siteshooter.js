'use strict';

var chalk = require('chalk'),
    cli = require('./cli'),
    config = require('./config'),
    tasks = require('./tasks'),
    utils = require('./utils'),
    when = require('when');


function configValidate(options) {

    console.log(chalk.yellow.bold(' ⤷ Validating Setup:'));

    var errorMessage = 'Missing setting in siteshooter.yml file \n',
        returnStatus = [];

    returnStatus.push('');

    function validate(setting, successMessage){
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
    validate(options.domain.name, 'Domain name is set');


    return returnStatus;
}


function execute(cliArgs) {

    var options = config.mergeOptions(cliArgs);

    // promise function signiture: promiseResolve, promiseReject, promiseNotify
    return when.promise(function(promiseResolve, promiseReject) {

        if (cliArgs.version) {

            cli.version();

        } else if (cliArgs.help) {

            cli.help();

        } else if (cliArgs.config) {

            cli.config(options);

        } else if (cliArgs.init) {

            utils.createSiteshooterFile(options);

        } else {

            if(!options.quiet){

                cli.help();
            }

            utils.log.debugDir(options);

            var validate = configValidate(options);

            utils.log.log(chalk.green.bold(validate.join('\n   ✔︎ ')), '\n');

            return tasks.init(options)
                .done(function() {

                    utils.log.log('\n', chalk.green.bold('✔︎'), chalk.yellow.bold('Siteshooter tasks complete\n'));

                    promiseResolve();
                }, function(err) {
                    promiseReject(err);
                });
        }

    }).catch(function(error) {

        var reportError = Array.isArray(error) ? error.join('\n') : error;

        if (!options.debug) {
            utils.log.log('\n\n', chalk.red.bold('✗ '), chalk.red(reportError.stack));
        } else {
            throw new Error(reportError);
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
