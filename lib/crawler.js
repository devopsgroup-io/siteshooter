'use strict';

var phantomAPI = require('phantom'),
    SimpleCrawler = require('simplecrawler'),
    chalk = require('chalk'),
    Q = require('q'),
    URL = require('url-parse');

var crawler;
var port = 80;

var uri;

var phantomBannedExtensions = /\.(png|jpg|jpeg|gif|ico|css|js|csv|doc|docx|pdf|cdn-cgi)$/i,
    phantomQueue = [];

var excludeExtensions = ['gif', 'png', 'jpg', 'jpeg', 'ico', 'bmp', 'ogg', 'webp',
    'mp4', 'webm', 'mp3', 'ttf', 'woff', 'json', 'rss', 'atom', 'gz', 'zip',
    'rar', '7z', 'css', 'js', 'gzip', 'exe', 'svg', 'pdf', 'pptx', 'cdn-cgi', '#'
];

// Events which end up being a bit noisy
var boringEvents = [
    'queueduplicate',
    'fetchstart',
    'discoverycomplete'
];

var queueBeingProcessed = false;


function getLinks(phantom, url, callback) {

    console.log(chalk.green('Phantom attempting to load ') + chalk.cyan('%s'), url);



    phantom.createPage().then(function(page) {

        // do we have stored credentials?
        if (uri.auth) {
            page.setting('userName', uri.username);
            page.setting('password', uri.password);
        }
        page.open(url).then(function(status) {

            console.log(chalk.green('Phantom opened URL with %s — ') + chalk.cyan('%s'), status, url);

            page.evaluate(function() {

                var selector = document.querySelectorAll('a, link, img');
                selector = [].slice.call(selector);

                return selector
                    .map(function(link) {
                        return link.href || link.onclick || link.href || link.src;
                    })
                    .filter(function(src) {
                        return !!src;
                    });

            }).then(function(result) {
                //console.log('result', result);
                result.forEach(function(url) {
                    crawler.queueURL(url);
                });
                callback();
            });
        });
    });
}

function processQueue(phantom, resume) {
    if (queueBeingProcessed) {
        return;
    }
    queueBeingProcessed = true;

    (function processor(item) {
        if (!item) {
            console.log(chalk.green('Phantom reached end of queue! ------------'));
            queueBeingProcessed = false;
            phantom.exit(0);
            return resume();
        }

        getLinks(phantom, item, function() {
            setTimeout(processor.bind(null, phantomQueue.shift()), 1000);
        });

    })(phantomQueue.shift());
}


function Crawler(options) {

    this.options = options;

    var exts = excludeExtensions.join('|');
    var regex = new RegExp('\.(' + exts + ')', 'i');

    this.uri = new URL(this.options.domain.name);

    this.crawler = new SimpleCrawler(this.uri.host);

    // check and set basic auth credentials
    if (this.options.domain.auth.user !== '' && this.options.domain.auth.pwd !== '') {

        this.uri.auth = true;
        this.uri.password = this.options.domain.auth.pwd;
        this.uri.username = this.options.domain.auth.user;

        this.crawler.needsAuth = true;
        this.crawler.authUser = this.options.domain.auth.user;
        this.crawler.authPass = this.options.domain.auth.pwd;
    }

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

}


Crawler.prototype.start = function() {

    var deferred = Q.defer();

    crawler = this.crawler;
    uri = this.uri;



    // Replace original emit so we can sample all events easily
    // and log them to console
    var originalEmit = crawler.emit;

    crawler.emit = function(name, queueItem) {

        var url = '';

        if (queueItem) {
            if (typeof queueItem === 'string') {
                url = queueItem;
            } else if (queueItem.url) {
                url = queueItem.url;
            }
        }

        function pad(string) {
            while (string.length < 20) {
                string += ' ';
            }
            return string;
        }

        if (boringEvents.indexOf(name) === -1) {
            //console.log(chalk.cyan('%s') + '%s', pad(name), url);
        }

        originalEmit.apply(crawler, arguments);
    };



    phantomAPI.create().then(function(phantom) {

        crawler.start();

        crawler.on('queueadd', function(queueItem) {
            if (!queueItem.url.match(phantomBannedExtensions)) {
                var resume = this.wait();
                phantomQueue.push(queueItem.url);
                processQueue(phantom, resume);
            }

        });

        crawler.on('complete', function() {

            console.log('crawler complete');

            //deferred.resolve();

        });
    });


    return deferred.promise;
};




module.exports = Crawler;
