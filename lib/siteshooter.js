'use strict';

var chalk = require('chalk'),
    cli = require('./cli'),
    config = require('./config'),
    tasks = require('./tasks'),
    utils = require('./utils'),
    when = require('when');


function configValidate(options) {

    console.log(chalk.yellow.bold(' ⤷ Validating Setup:'));

    var returnStatus = [];

    returnStatus.push('');

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
    if (options.domain.name !== null) {

        returnStatus.push('Domain name is set');

    } else {
        throw new Error('Missing setting in siteshooter.yml file \n domain.name');
    }

    if (options.domain.sitemap.url !== null) {

        returnStatus.push('Sitemap url is set');

    } else {
        throw new Error('Missing setting in siteshooter.yml file \n sitemap.url');
    }

    if (options.domain.sitemap.type !== null) {

        returnStatus.push('Sitemap type is set');

    } else {
        throw new Error('Missing setting in siteshooter.yml file \n sitemap.type');
    }

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

            cli.help();

            utils.log.debugDir(options);

            var validate = configValidate(options);

            console.log(chalk.green.bold(validate.join('\n   ✔︎ ')));

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
