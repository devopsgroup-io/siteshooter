#! /usr/bin/env node

'use strict';

var pkg = require('../package.json'),
    utils = require('../lib/utils');

var nodeVersion =  utils.getVersion(process.version.replace('v', '').split('.')),
    requiredNodeVersion = utils.getVersion(pkg.engines.node.replace('>=','').split('.'));


// check node version compatibility
if(nodeVersion.major < requiredNodeVersion.major){
    console.log();
    console.error(utils.log.chalk.red.bold('✗ '), utils.log.chalk.red.bold('NODE ' + process.version + ' was detected. Siteshooter requires node version ' + pkg.engines.node));
    console.log();
    process.exit(1);
}


var args = [].slice.call(process.argv, 2),
    exitCode = 0,
    siteshooter = require('../index'),
    updateNotifier = require('update-notifier');

var isDebug = args.indexOf('--debug') !== -1,
    isQuiet = args.indexOf('--quiet') !== -1;

process.on('exit', function() {
    if (isDebug) {
        console.log('EXIT', arguments);
    }
});

return siteshooter.cli(args).then(function() {


}).catch(function(error) {

    exitCode = 1;
    error = Array.isArray(error) ? error.join('\n') : error;

    console.error('\n\n', utils.log.chalk.red.bold('✗ '), utils.log.chalk.red(error));


}).done(function(){

    utils.log.log('\n', utils.log.chalk.green.bold('✔︎'), utils.log.chalk.green.bold('Siteshooter tasks complete\n'));

    if(!isQuiet){
        // check for new version of Siteshooter
        updateNotifier({pkg, updateCheckInterval: 1}).notify();
    }

    process.exit(exitCode);

});

