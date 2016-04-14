#!/usr/bin/env node

var siteshooter = require('../lib/siteshooter'),
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
