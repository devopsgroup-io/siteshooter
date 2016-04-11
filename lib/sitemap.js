'use strict';

var _ = require('lodash'),
    builder = require('xmlbuilder'),
    chalk = require('chalk'),
    cheerio = require('cheerio'),
    Crawler = require('simplecrawler'),
    fs = require('fs'),
    path = require('path'),
    URL = require('url-parse');

/**
 * Generator object, handling the crawler and file generation.
 *
 * @param  {String} url URL to parse
 */
function Sitemap(options) {
    var port = 80;
    var exclude = ['gif', 'jpg', 'jpeg', 'png', 'ico', 'bmp', 'ogg', 'webp',
        'mp4', 'webm', 'mp3', 'ttf', 'woff', 'json', 'rss', 'atom', 'gz', 'zip',
        'rar', '7z', 'css', 'js', 'gzip', 'exe', 'svg'
    ];
    var exts = exclude.join('|');
    var regex = new RegExp('\.(' + exts + ')', 'i');
    var baseUrlRegex = new RegExp('^' + options.url + '.*');

    this.options = options;
    this.chunk = [];

    this.uri = new URL(this.options.url);
    this.crawler = new Crawler(this.uri.host);

    this.crawler.needsAuth = true;
    this.crawler.authUser = this.options.auth.user;
    this.crawler.authPass = this.options.auth.pwd;
    this.crawler.initialPath = '/';
    //this.crawler.ignoreInvalidSSL = true;

    // only crawl regular links
    this.crawler.parseScriptTags = false;
    this.crawler.parseHTMLComments = false;
    this.crawler.respectRobotsTxt = true;

    if (process.env.NODE_ENV === 'development') {
        port = 8000;
    }
    this.crawler.initialPort = port;

    if (!this.uri.protocol) {
        this.uri.set('protocol', 'http:');
    }

    this.crawler.initialProtocol = this.uri.protocol.replace(':', '');
    this.crawler.userAgent = 'devopsgroup.io/Siteshooter';

    if (!this.options.query) {
        this.crawler.stripQuerystring = true;
    }

    this.crawler.addFetchCondition(function(parsedURL) {
        return !parsedURL.path.match(regex);
    });

    /*
    this.crawler.discoverResources = function(buffer) {
        var $ = cheerio.load(buffer.toString('utf8'));

        return $('a[href]').map(function() {
            return $(this).attr('href');
        }).get();
    };*/

    if (this.options.baseurl) {
        this.crawler.addFetchCondition(function(parsedURL) {
            var currentUrl = parsedURL.protocol + '://' + parsedURL.host + parsedURL.uriPath;
            return currentUrl.match(baseUrlRegex);
        });
    }
}

/**
 * Create the crawler instance.
 */
Sitemap.prototype.create = function() {

    console.log(chalk.yellow.bold(' ⤷ Crawling website: '), chalk.gray(this.uri.host));

    this.crawler.on('fetchcomplete', function(item, data, res) {

        this.chunk.push({
            loc: item.url,
        });

        if (!this.options.silent) {
            console.log(chalk.green.bold('   ✔︎'), chalk.gray(item.url));
        }
    }.bind(this));

    this.crawler.on('fetchdisallowed', function(item) {
        if (!this.options.silent) {
            console.log(chalk.bold.magenta('    Ignoring:'), chalk.gray(item.url));
        }
    }.bind(this));

    this.crawler.on('fetch404', function(item) {
        if (!this.options.silent) {
            console.log(chalk.red.bold('    Not found:'), chalk.gray(item.url));
        }
    }.bind(this));

    this.crawler.on('fetcherror', function(item) {
        console.log(chalk.red.bold('    Fetch error:'), chalk.gray(item.url));
    });


    this.crawler.on('complete', function() {
        if (_.isEmpty(this.chunk)) {
            console.error(chalk.red.bold('Error: Site "%s" could not be found.'), this.options.url);
            process.exit(1);
        }

        this.write(function(err) {
            if (err) {
                console.error(chalk.red.bold(err));
                process.exit(1);
            } else {
                console.log(chalk.white('Added %s URLs to sitemap, encountered %s %s.'),
                    this.chunk.length,
                    this.crawler.queue.errors(),
                    (this.crawler.queue.errors() === 1 ? 'error' : 'errors'));
                console.log(chalk.green.bold('✔︎ Sitemap successfully created.'));
                process.exit();
            }
        }.bind(this));
    }.bind(this));

    this.crawler.start();

};

/**
 * Write the XML file.
 *
 * @param  {Function} callback Callback function to execute
 */
Sitemap.prototype.write = function(callback) {
    var sitemap;
    var outputPath = '.';
    var fileName = 'sitemap';
    var xml = builder.create('urlset', { version: '1.0', encoding: 'UTF-8' })
        .att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

    _.forIn(this.chunk, function(value) {
        xml.ele('url')
            .ele(value);
    });

    sitemap = xml.end({ pretty: true, indent: '  ', newline: '\n' });

    if (this.options.path) {
        outputPath = this.options.path.replace(/\/+$/, '');
    }

    if (this.options.filename) {
        fileName = this.options.filename.replace(/\.xml$/i, '');
    }
    outputPath = path.join(outputPath, fileName + '.xml');

    fs.writeFile(outputPath, sitemap, function(err) {
        if (typeof callback === 'function') {
            return callback(err, outputPath);
        }
        return err;
    });
};

Sitemap.prototype.delete = function() {

    var outputPath = '.';
    var fileName = 'sitemap';

    if (this.options.path) {
        outputPath = this.options.path.replace(/\/+$/, '');
    }

    if (this.options.filename) {
        fileName = this.options.filename.replace(/\.xml$/i, '');
    }
    outputPath = path.join(outputPath, fileName + '.xml');

    fs.unlink(outputPath, function(err) {

        if (err) {
            console.log(chalk.red.bold(err));
        }
        else{
            console.log(chalk.green.bold('   ✔︎'), chalk.white(outputPath, ' was successfully deleted.'));
        }

    });
};


module.exports = Sitemap;
