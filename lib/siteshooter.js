'use strict';

var chalk = require('chalk'),
    cli = require('./cli'),
    config = require('./config'),
    pkg = require('../package.json'),
    tasks = require('./tasks'),
    updateNotifier = require('update-notifier'),
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

    // did attempting to load siteshooter.yml return an error?
    if (options.Error) {

        if (options.Error.code === 'ENOENT') {

            throw new Error('Missing siteshooter.yml file. Run the following command to create one: \n\n $ siteshooter --init');
        } else {
            throw new Error('siteshooter.yml \n' + options.Error);
        }
    } else {
        returnStatus.push('siteshooter.yml file exists');
    }

     // do we have a domain name set?
    validate(options.domain.name, 'Domain name is set');

    validate(options.domain.sitemap.url, 'Sitemap url is set');

    validate(options.domain.sitemap.type, 'Sitemap type is set');

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

                // check for new version of Siteshooter
                updateNotifier({pkg}).notify();
            }

            utils.log.debugDir(options);

            var validate = configValidate(options);

            console.log(chalk.green.bold(validate.join('\n   ✔︎ ')), '\n');

            // set sitemap URL
            options.sitemapURL = options.domain.name + '/' + options.domain.sitemap.url + '.' + options.domain.sitemap.type;

            return tasks.init(options)
                .done(function() {

                    console.log('\n', chalk.green.bold('✔︎'), chalk.yellow.bold('Siteshooter tasks complete\n'));
                    promiseResolve();
                }, function(err) {
                    promiseReject(err);
                });
        }

    }).catch(function(error) {

        var reportError = Array.isArray(error) ? error.join('\n') : error;

        if (!options.debug) {
            //utils.log.error(error);
            console.error(chalk.red.bold('✗ '), chalk.red(reportError.stack));
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
