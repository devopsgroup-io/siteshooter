var chalk = require('chalk'),
    log = require('./log'),
    parseArgs = require('minimist'),
    pkg = require('../package.json'),
    updateNotifier = require('update-notifier'),
    version = pkg.version;

updateNotifier({pkg}).notify();

var bannerText = [
    '================================================================================',
    '==      =====================      ===  ========================================',
    '=  ====  ===================  ====  ==  ========================================',
    '=  ====  =======  ==========  ====  ==  ====================  ==================',
    '==  =======  ==    ===   ====  =======  ======   ====   ===    ===   ===  =   ==',
    '====  ==========  ===  =  =====  =====    ===     ==     ===  ===  =  ==    =  =',
    '======  ===  ===  ===     =======  ===  =  ==  =  ==  =  ===  ===     ==  ======',
    '=  ====  ==  ===  ===  =====  ====  ==  =  ==  =  ==  =  ===  ===  =====  ======',
    '=  ====  ==  ===  ===  =  ==  ====  ==  =  ==  =  ==  =  ===  ===  =  ==  ======',
    '==      ===  ===   ===   ====      ===  =  ===   ====   ====   ===   ===  ======',
    '================================================================================',
    'Siteshooter                                                     v' + version,
    'Developed by                                                    ' +  pkg.author.name,
    '',
    'Usage: siteshooter [options]',
    '',
    'OPTIONS',
    '_______________________________________________________________________________________',
    '-c --config            Show configuration',
    '-e --debug             Output exceptions',
    '-h --help              Print this help',
    '-i --init              Create siteshooter.yml template file',
    '-p --pdf               Generate PDFs, by defined viewports, based on screenshots created via Siteshooter',
    '-s --screenshots       Generate screenshots, by defined viewports, based on local sitemap.xml file',
    '-S --sitemap           Crawl domain name specified in siteshooter.yml file and generate a local sitemap.xml file',
    '-v --version           Print version number',
    '-V --verbose           Verbose output',
    '-w --website           Report on website information based on Siteshooter crawled results',
    '',
].join('\n');


var aliases = {
    c: 'config',
    e: 'debug',
    h: 'help',
    i: 'init',
    p: 'pdf',
    s: 'screenshots',
    S: 'sitemap',
    v: 'version',
    V: 'verbose',
    w: 'website'
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
