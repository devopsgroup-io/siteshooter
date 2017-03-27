#! /usr/bin/env node
'use strict';

var chalk = require('chalk'),
    pkg = require('../package.json');

var nodeVersion = process.version.replace('v',''),
    nodeVersionRequired = pkg.engines.node.replace('>=','');

// check node version compatibility
if(nodeVersion <= nodeVersionRequired){

    console.log();
    console.error(chalk.red.bold('✗ '), chalk.red.bold('Siteshooter requires node version ' + pkg.engines.node));
    console.log();

    process.exit(1);
}

var siteshooter = require('../index'),
    args = [].slice.call(process.argv, 2);

var exitCode = 0,
    isDebug = args.indexOf('--debug') !== -1;


siteshooter.cli(args).then(function() {

    if (isDebug) {
        console.log('CLI promise complete');
    }

    process.exit(exitCode);

}).catch(function(err) {
    exitCode = 1;
    if (!isDebug) {
        console.error(err.stack);
    }
    process.exit(exitCode);
});

process.on('exit', function() {

    if (isDebug) {
        console.log('EXIT', arguments);
    }
    process.exit(exitCode);
});
