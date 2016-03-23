var ___ = require('lodash'),
    forEach = require('async-foreach').forEach,
    fs = require('graceful-fs'),
    globby = require('globby'),
    path = require('path'),
    PDF = require('pdfkit'),
    phantom = require('phantom'),
    Q = require('q'),
    request = require('request'),
    sizeOf = require('image-size'),
    utils = require('./utils'),
    xml2js = require('xml2js');


/**
 * Saves a local copy of a sitemap.xml
 * @author Steven Britton
 * @date   2016-03-22
 * @param  {String}   data Sitemap body
 * @param  {Function} cb   Callback function
 * @return {Function}      Callback
 */
function saveSitemap(data, cb) {

    utils.log.verbose('Saving local sitemap.xml');

    fs.writeFile('sitemap.xml', data, function(err) {
        if (err) {
            utils.log.error(err);
            throw err;
        }
        return cb();
    });
}


/**
 * Converts XML formatted string to JSON
 * @author Steven Britton
 * @date   2016-03-22
 * @param  {String}   data Sitemap body
 * @param  {Function} cb   Callback function
 * @return {Function}      Callback
 */
function convertSitemap(data, cb) {

    utils.log.verbose('Converting XML sitemap to JSON');

    var parser = new xml2js.Parser(),
        pages = [];

    parser.parseString(data, function(err, result) {

        if (___.isArray(result.urlset.url)) {
            pages = result.urlset.url.map(function(item) {
                return item.loc[0];
            });

            return cb(pages);
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

            request(url, function(err, response) {

                if (response.statusCode === 200) {

                    utils.log.verbose('Response: ', response.statusCode);

                    saveSitemap(response.body, function() {

                        convertSitemap(response.body, function(pages) {
                            deferred.resolve(pages);
                        });

                    });
                } else if (response.statusCode === 401) {

                    // do we have stored credentials?
                    if (options.domain.auth.user !== '' && options.domain.auth.pwd !== '') {

                        request.get(url, {
                            'auth': {
                                'user': options.domain.auth.user,
                                'pass': options.domain.auth.pwd,
                                'sendImmediately': true
                            }
                        }, function(err, response) {

                            utils.log.verbose('Response: ', response);

                            if (response.statusCode === 200) {

                                saveSitemap(response.body, function() {

                                    convertSitemap(response.body, function(pages) {
                                        deferred.resolve(pages);
                                    });

                                });

                            } else {
                                deferred.reject(response.statusCode);
                            }

                        });

                    } else {
                        deferred.reject(response.statusCode);
                    }

                } else {

                    deferred.reject(response.statusCode);
                }
            });
        } else {

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

    var d = Q.defer();



    function renderPage(url, done) {

        var folder = utils.urlToDir(url),
            viewports = options.viewports,
            output, key;

        phantom.create().then(function(ph) {
            ph.createPage().then(function(page) {


                // do we have stored credentials?
                if (options.domain.auth.user !== '' && options.domain.auth.pwd !== '') {

                    utils.log.note('   ⤷  Setting Authentication');

                    page.setting('userName', options.domain.auth.user);
                    page.setting('password', options.domain.auth.pwd );
                }

                page.open(url).then(function(status) {


                    function renderView(n) {
                        if (!!n) {
                            key = n - 1;

                            page.property('viewportSize', { 'width': viewports[key].width, 'height': viewports[key].height });


                            output = path.join(options.paths.output, folder, utils.getFileName(viewports[key]));

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

                    if(status === 'success'){

                        utils.log.note('   ⤷  Page ' + folder);

                        renderView(viewports.length);
                    }
                    else{
                        ph.exit();

                        return done(status);
                    }
                });
            });
        });
    }


    forEach(pages, function(page) {
        var done = this.async();

        renderPage(page, function(err) {
            if (err) {

                utils.log.error(err);
                done();
            }

            done();
        });

    }, function(success, array) {

        d.resolve();
    });


    return d.promise;
}



function handlePDF(options) {


    utils.log.verbose('createPDF');

    var deferred = Q.defer(),
        date = utils.getDate(),
        pdfs = [];


    function getFiles(size) {
        return globby.sync([path.join(options.paths.output, '**', '*' + size + '.png')]);
    }

    function createPDF(viewport, dimensions, arrImages) {

        utils.log.verbose('createPDF', dimensions);

        var pdfPath = path.resolve(options.paths.output, utils.urlToDir(options.domain.name) + '-' + viewport + '-' + date + '.pdf');

        utils.log.verbose('pdfPath', pdfPath);

        var heights = arrImages.map(function(image) {
            return sizeOf(image).height;
        });

        var tallest = Math.max.apply(Math, heights);

        var pdf = new PDF({
            layout: 'portrait',
            size: [dimensions.width, tallest],
            margin: 0
        });

        pdf.pipe(fs.createWriteStream(pdfPath));

        arrImages.forEach(function(png, i) {

            if (i > 0) {
                pdf.addPage();
            }
            pdf.image(png);
        });


        pdf.end();

    }

    // load array of viewports and their respective .png files
    pdfs = options.viewports.map(function(item, i) {
        return {
            'viewport': item.viewport,
            'dimensions': { 'width': item.width, 'height': item.height },
            'files': getFiles(item.width)
        };
    });

    // create individual pdfs based on viewport
    pdfs.forEach(function(item, i) {

        // make sure we have some screenshots
        if (item.files.length > 0) {
            createPDF(item.viewport, item.dimensions, item.files);
        } else {
            utils.log.warn('Screenshots for viewport ' + item.viewport + ' do not exist.');
        }

        if ((i + 1) === pdfs.length) {
            deferred.resolve();
        }

    });

    return deferred.promise;
}



module.exports = {
    run: function(options) {

        var deferred = Q.defer();

        return utils.executeWhen(options.sitemapURL !== '', () => getSitemap(options), '⤷ Getting sitemap file: ' + options.sitemapURL)
            .then(function(pages) {
                return utils.executeWhen(true, () => handleScreenshots(pages, options), '   ⤷ Generating screenshots');
            })
            .then(function() {
                return utils.executeWhen(true, () => handlePDF(options), '   ⤷ Generating PDFs');
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
