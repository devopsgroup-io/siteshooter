var ___ = require('lodash'),
    asynEach = require('async-foreach').forEach,
    chalk = require('chalk'),
    fs = require('graceful-fs'),
    globby = require('globby'),
    path = require('path'),
    PDF = require('pdfkit'),
    phantom = require('phantom'),
    Q = require('q'),
    request = require('request'),
    Sitemap = require('./sitemap'),
    sizeOf = require('image-size'),
    utils = require('./utils'),
    xml2js = require('xml2js');



var pageContent = [];

/**
 * Handles:
 *   sitemap http request
 *   create local copy of sitemap
 *   converts xml to json
 * @author Steven Britton
 * @date   2016-03-24
 * @param  {Object}   options Produced from config process
 * @return {Function}         Promise
 */
function handleSitemap(options) {

    utils.log.verbose('getSitemap');

    var deferred = Q.defer(),
        failedAuthCounter = 0,
        siteMapName = options.domain.sitemap.url + '.' + options.domain.sitemap.type,
        url = utils.urlCheckProtocol(options.sitemapURL);


    if (url === '') {
        deferred.reject(new Error('Missing Configuration Setting - sitemap is not defined'));
        return deferred.promise;
    }


    /**
     * Saves a local copy of a sitemap.xml file
     * @author Steven Britton
     * @date   2016-03-22
     * @param  {String}     siteMapName   Sitemap name
     * @param  {String}     data          Sitemap body
     * @return {Function}   promise       resolve or reject
     */
    function saveSitemap(siteMapName, data) {

        var deferred = Q.defer();

        fs.writeFile(siteMapName, data, function(error) {

            if (error) {
                deferred.reject(new Error(error));
            } else {
                utils.log.note('⤷ Saving local ' + siteMapName + ' file');
                deferred.resolve();
            }

        });
        return deferred.promise;
    }

    /**
     * Converts XML formatted string to JSON
     * @author Steven Britton
     * @date   2016-03-22
     * @param  {buffer}    data     Sitemap body
     * @return {Function}  promise  resolve or reject
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


    /**
     * Chains saveSitemap and convertSitmap
     * @author Steven Britton
     * @date   2016-03-24
     * @param  {String}     siteMapName name of sitemap name to target
     * @param  {Object}     response    http response
     * @return {Function}   promise     resolve or reject
     */
    function processSitemap(siteMapName, response) {

        return saveSitemap(siteMapName, response.body)
            .then(function() {
                return convertSitemap(response.body);
            })
            .then(function(pages) {
                deferred.resolve(pages);
            }, function(error) {

                utils.log.note('⤷ Removing local ' + siteMapName + ' file');

                utils.rm(siteMapName);

                deferred.reject(error);
            });
    }

    /**
     * Recursive Request callback function
     * @author Steven Britton
     * @date   2016-03-24
     * @param  {object}     error    returned request error
     * @param  {object}     response returned request response
     * @return {Function}   promise  resolve or reject
     */
    function handleResponseStatus(error, response) {

        if (error) {
            return deferred.reject(error);
        }

        utils.log.verbose(response.statusCode);

        switch (response.statusCode) {


            case 200:

                processSitemap(siteMapName, response);

                break;


            case 301:

                var redirectLocation = response.headers.location;

                utils.log.note('    ⤷ 301 Redirecting to ' + redirectLocation);

                request.get(redirectLocation, {
                    'followRedirect': false,
                    'auth': {
                        'user': options.domain.auth.user,
                        'pass': options.domain.auth.pwd,
                        'sendImmediately': true
                    }
                }, handleResponseStatus);

                break;

            case 401:

                // allow only 1 authenication failure
                if (failedAuthCounter > 0) {
                    return deferred.reject(response.statusCode + ' Unauthorized - Please verify that your stored credentials are correct');
                }

                utils.log.note('  ⤷ 401 Authentication required');
                utils.log.note('    ⤷ Checking for stored credentials in siteshooter.yml file');



                // do we have stored credentials?
                if (options.domain.auth.user !== null && options.domain.auth.pwd !== null) {

                    utils.log.note('    ✔︎ Credentials are stored');
                    utils.log.note('    ⤷ Attempting to access sitemap with credentials');

                } else {
                    return deferred.reject('Missing settings in siteshooter.yml file \n domain.auth.user \n domain.auth.pwd');
                }

                request.get(url, {
                    'followRedirect': false,
                    'auth': {
                        'user': options.domain.auth.user,
                        'pass': options.domain.auth.pwd,
                        'sendImmediately': true
                    }
                }, handleResponseStatus);

                failedAuthCounter++;

                break;

            default:

                utils.log.verbose(response);

                // something is not accounted for
                return deferred.reject(new Error(response.statusCode + ' Page ' + response.statusMessage));

        }

    }


    // look for local sitemap.xml file first
    fs.readFile(siteMapName, function(err, data) {
        if (!err) {

            // local sitemap.xml file exists, so use it and move on

            utils.log.note('  ⤷ Using local ' + siteMapName);

            convertSitemap(data)
                .then(function(pages) {
                    deferred.resolve(pages);
                }, function(error) {

                    deferred.reject(error);
                });

        } else {

            utils.log.verbose('Getting external sitemap');

            /**
             * Recursive request call
             * @status 200 - process sitemap and resolve promise
             * @status 300 - redirect response information back to handleResponseStatus
             * @status 401 - include stored credentials and send request to handleResponseStatus
             */
            request(url, handleResponseStatus);

        }
    });

    return deferred.promise;
}


function handleScreenshots(pages, options) {

    utils.log.verbose('handleScreenshots', pages);

    console.log(chalk.yellow.bold(' ⤷ Generating screenshots'));

    var d = Q.defer();



    function renderPage(url, done) {

        var folder = utils.urlToDir(url),
            viewports = options.viewports,
            output, key;

        phantom.create().then(function(ph) {
            ph.createPage().then(function(page) {


                // do we have stored credentials?
                if (options.domain.auth.user !== null && options.domain.auth.pwd !== null) {

                    //console.log(chalk.yellow.bold('\n   ⤷  Setting Authentication'));

                    page.setting('userName', options.domain.auth.user);
                    page.setting('password', options.domain.auth.pwd);
                }

                page.open(url).then(function(status) {

                    function renderView(n) {

                        if (!!n) {
                            key = n - 1;

                            var _pageContent = page.property('content');

                            console.log(chalk.green.bold('    ✔︎  Viewport:'), chalk.green(viewports[key].width + 'x' + viewports[key].height));

                            page.property('viewportSize', { 'width': viewports[key].width, 'height': viewports[key].height });


                            output = path.join(options.paths.output, folder, viewports[key].width + '.png');

                            setTimeout(function() {
                                page.render(output).then(function() {

                                    pageContent.push({
                                        'page': key,
                                        'content': _pageContent
                                    });
                                    renderView(key);

                                });
                            }, options.screenshot.delay);

                        } else {

                            ph.exit();

                            done();

                        }
                    }

                    if (status === 'success') {

                        console.log('\n   ', chalk.underline.yellow(folder));

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

        var pdf = new PDF({
            layout: 'portrait',
            size: [dimensions.width, sizeOf(arrImages[0]).height],
            margin: 0
        });

        pdf.pipe(fs.createWriteStream(pdfPath));

        arrImages.forEach(function(png, i) {

            if (i > 0) {
                pdf.addPage({
                    margin: 0,
                    size: [sizeOf(png).width, sizeOf(png).height],
                    width: sizeOf(png).width,
                    height: sizeOf(png).height
                });
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

        if (success) {
            deferred.resolve();
        }

    });

    return deferred.promise;
}



/**
 * Tasks Object
 * @author Steven Britton
 * @date   2016-04-12
 * @param  {Object}   options Contains configuration options and CLI arguments
 */
function Tasks(options) {


    var sitemap = new Sitemap({
        auth: {
            pwd: options.domain.auth.pwd,
            user: options.domain.auth.user
        },
        url: options.domain.name,
        filename: options.domain.sitemap.url + '.' + options.domain.sitemap.type
    });

    // are we working with sitemap functions?
    if (options.sitemap) {

        if (options.sitemap === 'create') {
            sitemap.create();
        } else if (options.sitemap === 'delete') {
            sitemap.delete();
        }
    }

    // are we working with sitemap functions?
    if (options.screenshots) {

        var deferred = Q.defer();

        // get local sitemap
        sitemap.toJSON(function(err, data) {

            utils.executeWhen(true, () => handleScreenshots(data, options), '')
                .done(function() {
                        console.log(chalk.green.bold('\n ✔︎'), chalk.green(' Done generating screenshots.\n'));
                        deferred.resolve();
                    },
                    function(err) {
                        utils.log.error(err);
                        deferred.reject(err);
                    });

        });
    }

    // are we working with PDF geaneration functions?
    if (options.pdf) {

        var deferred = Q.defer();

        utils.executeWhen(true, () => handlePDF(options), '')
            .done(function() {
                    console.log(chalk.green.bold('\n ✔︎'), chalk.green(' Done generating PDFs.\n'));
                    deferred.resolve();
                },
                function(err) {
                    utils.log.error(err);
                    deferred.reject(err);
                });
    }


}


module.exports = {
    init: Tasks,
    run: function(options) {

        var deferred = Q.defer();

        return utils.executeWhen(options.sitemapURL !== '', () => handleSitemap(options), '⤷ Getting sitemap file: ' + options.sitemapURL)
            .then(function(pages) {
                return utils.executeWhen(true, () => handleScreenshots(pages, options), '');
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
