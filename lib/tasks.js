var ___ = require('lodash'),
    asynEach = require('async-foreach').forEach,
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
 * Saves a local copy of a sitemap.xml file
 * @author Steven Britton
 * @date   2016-03-22
 * @param  {String}   siteMapName   Sitemap name
 * @param  {String}   data          Sitemap body
 * @return {Function}               Promise
 */
function saveSitemap(siteMapName, data) {

    var deferred = Q.defer();

    utils.log.verbose('Saving local ' + siteMapName);

    fs.writeFile(siteMapName, data, function(error) {

        if (error) {
            deferred.reject(new Error(error));
        } else {
            deferred.resolve();
        }

    });
    return deferred.promise;
}


/**
 * Converts XML formatted string to JSON
 * @author Steven Britton
 * @date   2016-03-22
 * @param  {buffer}   data Sitemap body
 * @return {Function}      Promise
 */
function convertSitemap(data) {

    utils.log.verbose('Converting XML sitemap to JSON');

    var deferred = Q.defer(),
        error = null,
        parser = new xml2js.Parser(),
        pages = [];

    parser.parseString(data, function(err, result) {

        if (err) {
            deferred.reject(new Error(err));
        }

        if (result.urlset && ___.isArray(result.urlset.url)) {
            pages = result.urlset.url.map(function(item) {
                return item.loc[0];
            });

            deferred.resolve(pages);
        }

        // check for multiple sitemaps returned
        else if (___.isArray(result.sitemapindex.sitemap)) {

            error = 'Multiple sitemaps returned \n';

            error += '\nPlease update your siteshooter.yml sitemap setting to 1 of the ' + result.sitemapindex.sitemap.length + ' listed sitemaps';

            result.sitemapindex.sitemap.map(function(item) {
                error += '\n' + item.loc[0];
            });

            deferred.reject(new Error(error));

        }
    });

    return deferred.promise;
}

function getSitemap(options) {

    utils.log.verbose('getSitemap');

    var deferred = Q.defer(),
        url = options.sitemapURL,
        siteMapName = options.domain.sitemap.url + '.' + options.domain.sitemap.type;


    if (url === '') {
        deferred.reject(new Error('Missing Configuration Setting - sitemap is not defined'));
        return deferred.promise;
    }


    function handleSitemap(siteMapName, response) {

        utils.log.note('⤷ Saving local ' + siteMapName + ' file');

        return saveSitemap(siteMapName, response.body)
            .then(function() {
                return convertSitemap(response.body);
            })
            .then(function(pages) {
                deferred.resolve(pages);
            }, function(error) {

                utils.rm(siteMapName);
                deferred.reject(error);
            });
    }


    // look for local sitemap.xml first
    fs.readFile(siteMapName, function(err, data) {
        if (err) {

            utils.log.verbose('Getting external sitemap');

            request(url, function(err, response) {

                if (err) {
                    return deferred.reject(new Error(err));
                }

                if (response.statusCode === 200) {

                    utils.log.verbose('Response: ', response.statusCode);

                    handleSitemap(siteMapName, response);

                } else if (response.statusCode === 401) {

                    utils.log.verbose(response.statusCode);

                    utils.log.note('  ⤷ Authentication required');
                    utils.log.note('    ⤷ Checking for stored credentials in siteshooter.yml file');

                    // do we have stored credentials?
                    if (options.domain.auth.user !== null && options.domain.auth.pwd !== null) {

                        utils.log.note('    ✔︎ Credentials are stored');
                        utils.log.note('    ⤷ Attempting to access sitemap with credentials');

                        request.get(url, {
                            'followRedirect': false,
                            'auth': {
                                'user': options.domain.auth.user,
                                'pass': options.domain.auth.pwd,
                                'sendImmediately': true
                            }
                        }, function(err, response) {

                            if (err) {
                                return deferred.reject(err);
                            }

                            // check for 301 redirect (possibly non-www to www)
                            if (response.statusCode === 301) {

                                var redirectLocation = response.headers.location;

                                utils.log.note('    ⤷ Redirecting to ' + redirectLocation);

                                request.get(redirectLocation, {
                                    'followRedirect': false,
                                    'auth': {
                                        'user': options.domain.auth.user,
                                        'pass': options.domain.auth.pwd,
                                        'sendImmediately': true
                                    }
                                }, function(err, response) {

                                    if (err) {
                                        return deferred.reject(err);
                                    }

                                    handleSitemap(siteMapName, response);

                                });
                            } else if (response.statusCode === 200) {

                                utils.log.note('    ✔︎ Successful authentication');
                                handleSitemap(siteMapName, response);

                            } else {
                                return deferred.reject(response.statusCode + ' Unauthorized - Please Verify Your Stored Credentials');
                            }

                        });

                    } else {
                        return deferred.reject('Missing settings in siteshooter.yml file \n domain.auth.user \n domain.auth.pwd');
                    }

                } else {

                    deferred.reject(response.statusCode);
                }
            });
        } else {

            utils.log.note('  ⤷ Using local ' + siteMapName);

            convertSitemap(data)
                .then(function(pages) {
                    deferred.resolve(pages);
                }, function(error) {

                    deferred.reject(error);
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
                if (options.domain.auth.user !== null && options.domain.auth.pwd !== null) {

                    utils.log.note('   ⤷  Setting Authentication');

                    page.setting('userName', options.domain.auth.user);
                    page.setting('password', options.domain.auth.pwd);
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

                    if (status === 'success') {

                        utils.log.note('   ⤷  Page ' + folder);

                        renderView(viewports.length);

                    } else {
                        ph.exit(1);

                        return done('Failed connection: ' + url);
                    }
                });


            });
        });
    }


    asynEach(pages, function(page) {
        var done = this.async();

        renderPage(page, function(err) {

            if (err) {
                utils.log.error(err);
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

    function createPDF(viewport, dimensions, arrImages, done) {

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

        done();

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
    asynEach(pdfs, function(item, i) {

        var done = this.async();

        // make sure we have some screenshots
        if (item.files.length > 0) {
            createPDF(item.viewport, item.dimensions, item.files, function() {

                done();

            });
        } else {
            utils.log.warn('Screenshots for viewport ' + item.viewport + ' do not exist.');

            done();
        }

    }, function(success, array) {

        if(success){
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
                    utils.log.success('Done taking screenshots and generating PDFs');
                    deferred.resolve();
                },
                function(err) {
                    utils.log.error(err);
                    deferred.reject(err);
                });
    }
};
