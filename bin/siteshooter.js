#! /usr/bin/env node
'use strict';

var chalk = require('chalk'),
    pkg = require('../package.json'),
    utils = require('../lib/utils');

var nodeVersion = process.version.replace('v',''),
    nodeVersionRequired = pkg.engines.node.replace('>=','');


// check node version compatibility
if(nodeVersion <= nodeVersionRequired){
    console.log();
    console.error(chalk.red.bold('✗ '), chalk.red.bold('NODE ' + process.version + ' was detected. Siteshooter requires node version ' + pkg.engines.node));
    console.log();
    process.exit(1);
}
else{

    // check for new version of Siteshooter
    var updater = require('update-notifier');

    updater({pkg: pkg}).notify({defer: true});
}

var siteshooter = require('../index'),
    args = [].slice.call(process.argv, 2);

var exitCode = 0,
    isDebug = args.indexOf('--debug') !== -1;

siteshooter.cli(args).then(function() {

    utils.log.log('\n', chalk.green.bold('✔︎'), chalk.yellow.bold('Siteshooter tasks complete\n'));

    if (isDebug) {
        console.log('CLI promise complete');
    }

    process.exit(exitCode);

}).catch(function(error) {
    exitCode = 1;

    var reportError = Array.isArray(error) ? error.join('\n') : error;

    utils.log.log('\n\n', chalk.red.bold('✗ '), chalk.red(reportError.stack));

});


process.on('exit', function() {
    if (isDebug) {
        console.log('EXIT', arguments);
    }
});
