#! /usr/bin/env node
'use strict';

var pkg = require('../package.json'),
    updateNotifier = require('update-notifier'),
    utils = require('../lib/utils');

var nodeVersion = process.version.replace('v',''),
    nodeVersionRequired = pkg.engines.node.replace('>=','');


// check node version compatibility
if(nodeVersion <= nodeVersionRequired){
    console.log();
    console.error(utils.log.chalk.red.bold('✗ '), utils.log.chalk.red.bold('NODE ' + process.version + ' was detected. Siteshooter requires node version ' + pkg.engines.node));
    console.log();
    process.exit(1);
}
else{

    // check for new version of Siteshooter
    updateNotifier({ pkg }).notify();
}

var siteshooter = require('../index'),
    args = [].slice.call(process.argv, 2);

var exitCode = 0,
    isDebug = args.indexOf('--debug') !== -1;

process.on('exit', function() {
    if (isDebug) {
        console.log('EXIT', arguments);
    }
});

return siteshooter.cli(args).then(function() {

    if (isDebug) {
        console.log('CLI promise complete');
    }


}).catch(function(error) {
    exitCode = 1;

    var reportError = Array.isArray(error) ? error.join('\n') : error;

    console.log('\n\n', utils.log.chalk.red.bold('✗ '), utils.log.chalk.red(reportError));


}).done(function(){

    utils.log.log('\n', utils.log.chalk.green.bold('✔︎'), utils.log.chalk.yellow.bold('Siteshooter tasks complete\n'));

    process.exit(exitCode);

});

