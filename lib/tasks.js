var ___ = require('lodash'),
    forEach = require('async-foreach').forEach,
    fs = require('graceful-fs'),
    path = require('path'),
    PDF = require('pdfkit'),
    phantom = require('phantom'),
    request = require('request'),
    sizeOf = require('image-size'),
    Q = require('q'),
    utils = require('./utils'),
    xml2js = require('xml2js');



function saveSitemap(data, cb) {

    utils.log.verbose('Saving local sitemap.xml');

    fs.writeFile('sitemap.xml', data, function(err) {
        if (err) {
            utils.log.error(err);
            throw err;
        }
        cb();
    });
}

function convertSitemap(data, cb) {

    utils.log.verbose('Converting XML sitemap to JSON');

    var parser = new xml2js.Parser(),
        pages = [];

    parser.parseString(data, function(err, result) {

        if (___.isArray(result.urlset.url)) {
            pages = result.urlset.url.map(function(item) {
                return item.loc[0];
            });

            cb(pages);
        }
    });
}

function getSitemap(options) {

    utils.log.verbose('getSitemap');

    var deferred = Q.defer(),
        url = options.sitemapURL;

    if (url === '') {
        deferred.reject('Missing Configuration Setting - sitemap is not defined');
        return deferred.promise;
    }


    // look for local sitemap.xml first
    fs.readFile('sitemap.xml', function(err, data) {
        if (err) {

            utils.log.verbose('Getting external sitemap');

            request(url, function(err, resp) {

                if (resp.statusCode === 200) {

                    utils.log.verbose('Response: ', resp.statusCode);

                    saveSitemap(resp.body, function() {

                        convertSitemap(resp.body, function(pages) {
                            deferred.resolve(pages);
                        });

                    });
                } else {

                    deferred.reject(resp.statusCode);
                }
            });
        }
        else {

            utils.log.verbose('Using local sitemap');

            convertSitemap(data, function(pages) {

                deferred.resolve(pages);

            });
        }
    });

    return deferred.promise;
}


function handleScreenshots(pages, options) {

    utils.log.verbose('handleScreenshots', pages);

    var d = Q.defer(),
        pngs = [];


    function renderPage(url, done) {

        var folder = utils.urlToDir(url),
            viewports = options.viewports,
            output, key;

        phantom.create().then(function(ph) {
            ph.createPage().then(function(page) {

                page.open(url).then(function() {

                    utils.log.note('   ⤷  Page ' + folder);

                    function renderView(n) {
                        if (!!n) {
                            key = n - 1;

                            page.property('viewportSize', { 'width': viewports[key].width, 'height': viewports[key].height });


                            output = path.join(options.paths.output, folder, utils.getFileName(viewports[key]));

                            pngs.push(output);

                            utils.log.note('       ⤷ Viewport ' + viewports[key].width + 'x' + viewports[key].height);

                            setTimeout(function() {
                                page.render(output).then(function() {
                                    renderView(key);
                                });
                            }, options.screenshot.delay);

                        } else {

                            ph.exit();
                            done();

                        }
                    }

                    renderView(viewports.length);

                });
            });
        });
    }


    forEach(pages, function(page) {
        var done = this.async();

        renderPage(page, function(err) {
            if (err) {
                done();
            }

            done();
        });

    }, function(success, array) {

        d.resolve(pngs);
    });


    return d.promise;
}



function createPDF(pngs, options) {


    utils.log.verbose('createPDF', pngs);

    var deferred = Q.defer();

    var heights = pngs.map(function(png) {
        return sizeOf(png).height;
    });

    function layout(width, height) {
        return width > height ? 'landscape' : 'portrait';
    }

    var tallest = Math.max.apply(Math, heights);

    var pdf = new PDF({
        layout: 'portrait',
        size: [1280, tallest],
        margin: 0
    });

    var pdfPath = path.resolve(options.paths.output, utils.urlToDir(options.domain.name) + '.pdf');

    utils.log.verbose('pdfPath', pdfPath);

    pdf.pipe(fs.createWriteStream(pdfPath));


    pngs.forEach(function(png, i) {

        if (i > 0) {
            pdf.addPage();
        }
        pdf.image(png);
    });


    pdf.end();

    deferred.resolve();

    return deferred.promise;
}



module.exports = {
    run: function(options) {

        var deferred = Q.defer();

        return utils.executeWhen(options.sitemapURL !== '', () => getSitemap(options), '⤷ Getting sitemap file: ' + options.sitemapURL)
            .then(function(pages) {
                return utils.executeWhen(true, () => handleScreenshots(pages, options), '   ⤷ Generating screenshots');
            })
            .then(function(pngs) {
                return utils.executeWhen(true, () => createPDF(pngs, options), '   ⤷ Generating PDFs');
            })
            .done(function() {
                    utils.log.success('Done generating screenshots');
                    deferred.resolve();
                },
                function(err) {
                    utils.log.error(err);
                    deferred.reject(err);
                });
    }
};
