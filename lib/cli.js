var chalk = require('chalk'),
    log = require('./log'),
    parseArgs = require('minimist'),
    pkg = require('../package.json'),
    version = pkg.version;



var bannerText = [
    'Siteshooter v' + version,
    '',
    'Usage: siteshooter [url/sitemap.xml] [options]',
    '',
    'OPTIONS',
    '_______________________________________________________________________________________',
    '-c --config            Show configuration',
    '-d --dry-run           Do not touch or write anything, but show the commands and interactivity',
    '-e --debug             Output exceptions',
    '-h --help              Print this help',
    '-v --version           Print version number',
    '-V --verbose           Verbose output',
].join('\n');


var aliases = {
    c: 'config',
    d: 'dry-run',
    e: 'debug',
    h: 'help',
    v: 'version',
    V: 'verbose'
};

module.exports = {
    banner: function() {
        log.log(chalk.yellow.bold(bannerText));
    },
    config: function() {
        log.log.apply(null, arguments);
    },
    help: function() {
        log.log(chalk.yellow.bold(bannerText));
    },
    parse: function(argv) {
        var options = parseArgs(argv, {
            boolean: true,
            alias: aliases
        });
        return options;
    },
    version: function() {
        log.log('v' + version);
    }
};
