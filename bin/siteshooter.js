#!/usr/bin/env node

var siteshooter = require('../lib/siteshooter'),
    args = [].slice.call(process.argv, 2);

var exitCode = 0,
    isDebug = args.indexOf('--debug') !== -1;

siteshooter.cli(args).then(function() {
    process.exit(exitCode);
}).catch(function(err) {
    exitCode = 1;
    if(!isDebug) {
        console.error(err);
    } else {
        throw new Error(err);
    }
});

process.on('exit', function() {
    process.exit(exitCode);
});
