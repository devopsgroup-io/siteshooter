var path = require('path'),
    phantom = require('phantom'),
    Q = require('q'),
    urlParse = require('url-parse'),
    utils = require('./utils'),
    Website = require('./website');


/*
@param ph phantom object
@param array of options
@param array of URLs to render
@param callbackPerUrl Function called after finishing each URL, including the last URL
@param callbackFinal Function called after finishing everything
*/
var renderUrlsToFile = function(ph, options, urls, callbackPerUrl, callbackFinal) {

    utils.log.verbose('');
    utils.log.verbose('Function: renderUrlsToFile');
    utils.log.verbose('');

    var key, outputFile, outputFilePath;

    outputFilePath = options.paths.output;

    var authSalesforce, getFileName, getUserAgent, nextPage, retrievePage, renderViewPort;


    authSalesforce = function(page, callbackAuthSalesforce) {

        var hostName;

        utils.log.log(utils.log.chalk.yellow.bold('\n   ⤷  Salesforce Detected.\n\n      3 Step Authentication Process Required:'));

        setTimeout(function() {

            utils.log.log(utils.log.chalk.green.bold('\n     ✔︎  STEP 1: Redirect'));

            page.evaluate(function() {

                hostName = window.location.hostname;

                console.log('hostName', hostName);
                console.log('INDEX OF', hostName.indexOf('my.salesforce.com'));

                if (hostName.indexOf('my.salesforce.com') > -1) {


                    var btnWrapper = document.getElementById('idp_section_buttons'),
                        btn = btnWrapper.querySelectorAll('button');

                    btn[0].click();
                }

            });
        }, 10000);


        setTimeout(function() {

            utils.log.log(utils.log.chalk.green.bold('     ✔︎  STEP 2: Login'));

            page.evaluate(function(user, password) {

                hostName = window.location.hostname;

                // Populate and submit Login form
                if (hostName.indexOf('smusxath') > -1) {

                    document.Login.USER.value = user;
                    document.Login.PASSWORD.value = password;
                    document.Login.submit();
                }

            }, options.domain.uri.username, options.domain.uri.password);
        }, 20000);

        setTimeout(function() {

            utils.log.log(utils.log.chalk.green.bold('     ✔︎  STEP 3: Success\n'));

            options.isLoggedIn = true;

            return callbackAuthSalesforce();

        }, 30000);

    };

    getFileName = function(folder) {

        var fileName = options.viewports[key].viewport + '.png',
            folderName = new urlParse(folder, true);

        if (folder.indexOf('visual.force') > -1) {

            utils.log.verbose('Function: getFileName');
            utils.log.verbose('Salesforce: folderName');
            utils.log.verbose(folderName);

            // Parse Salesforce URL and grab the 'name' get variable
            // Example URL: [domain]dm--cms.na15.visual.force.com/apex/Preview?sname=DevOpsGroup&name=index
            folder = folderName.query.name + folderName.hash;
        }
        else{
            // remove ? from folder name
            folder = folder.indexOf('?') > -1 ? folder.substring(0, folder.indexOf('?')) : folder;
        }

        if (folderName.query.pevent) {
            fileName = options.viewports[key].viewport + '-event-' + folderName.query.pevent + '.png';
        }

        return path.join(outputFilePath, folder, fileName);
    };

    getUserAgent = function(viewport) {

        var userAgent = '';

        switch (viewport) {

            case 'iPhone6':
                userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';
                break;
        }

        return userAgent;
    };



    nextPage = function(status, url, file) {
        utils.log.verbose('');
        utils.log.verbose('Function: nextPage');
        utils.log.verbose('');

        callbackPerUrl(status, url, file);
        return retrievePage();
    };

    renderViewPort = function(n, page, status, url) {

        if (!!n) {

            var folder = utils.urlToDir(url),
                pageExists = false,
                pageURL = '';

            key = n - 1;

            utils.log.log(utils.log.chalk.green.bold('    ✔︎  Viewport:'), utils.log.chalk.green(options.viewports[key].width + 'x' + options.viewports[key].height));

            page.property('viewportSize', {
                'width': options.viewports[key].width,
                'height': options.viewports[key].height
            });

            if( options.viewports[key].viewport === 'iPhone6' ){
                page.setting('userAgent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1');
            }

            outputFile = getFileName(folder);

            page.evaluate(function(key) {

                var data = {
                    headers: [],
                    images: [],
                    links: [],
                    meta: [],
                    scripts: [],
                };

                // collect page content once
                if( key === 0 ){

                    if (typeof(jQuery) !== 'undefined') {

                        data.meta = {
                            canonical: jQuery('link[rel=canonical]').attr('href'),
                            description: jQuery('meta[name=description]').attr('content'),
                            keywords: jQuery('meta[name=keywords]').attr('content'),
                            title: jQuery(document).find('title').text()
                        };

                        jQuery('h1, h2, h3, h4').map(function() {
                            data.headers.push({
                                class: jQuery(this).attr('class'),
                                src: jQuery(this).attr('src'),
                                text: jQuery(this).text(),
                                type: this.tagName
                            });
                        });

                        jQuery('img').map(function() {
                            data.images.push({
                                alt: jQuery(this).attr('alt'),
                                class: jQuery(this).attr('class'),
                                src: jQuery(this).attr('src')
                            });
                        });

                        jQuery('a[href]').map(function() {
                            data.links.push({
                                class: jQuery(this).attr('class'),
                                href: jQuery(this).attr('href'),
                                html: jQuery(this).html(),
                                rel: jQuery(this).attr('rel')
                            });
                        });

                        jQuery('script').map(function() {
                            data.scripts.push({
                                src: jQuery(this).attr('src'),
                                text: jQuery(this).html()
                            });
                        });
                    }
                }

                return data;

            }, key).then(function(data) {

                // collect page content once
                if( key === 0 ){

                    // strip potential page event(?pevent or &pevent) from URL
                    pageURL = url.substring(0).search(/([?&])\pevent/g) !== -1 ? url.substr(0, url.substring(0).search(/([?&])\pevent/g)) : url;

                    // check for page in content collection
                    pageExists = options.website.contentCollection.pages.find(function(page) {
                        return page.loc === pageURL;
                    });

                    // avoid duplicate pages in content collection
                    if (!pageExists) {

                        // add website content collection
                        options.website.contentCollection.pages.push({
                            body: {
                                headers: data.headers,
                                images: data.images,
                                links: data.links
                            },
                            loc: pageURL,
                            meta: data.meta,
                            scripts: data.scripts,
                        });
                    }
                }
            })
            .then(page.injectJs('inject.js'))
            .then(function() {

                setTimeout(function() {
                    page.render(outputFile).then(function() {
                        renderViewPort(key, page, status, url);
                    });
                }, 1000);


            }).catch(function(error) {
                console.log(error);
            });

        } else {

            page.close();

            return nextPage(status, url, outputFile);
        }
    };

    retrievePage = function() {

        utils.log.verbose('');
        utils.log.verbose('Function: retrievePage');
        utils.log.verbose('');

        var folder, url;

        if (urls.length > 0) {

            url = urls.shift();
            folder = utils.urlToDir(url);

            ph.createPage().then(function(page) {

                utils.log.verbose('Function: createPage');

                // do we have stored credentials?
                if (options.domain.uri.auth && options.isLoggedIn === false) {

                    utils.log.verbose('\n   ⤷  Setting Authentication');

                    page.setting('userName', options.domain.uri.username);
                    page.setting('password', options.domain.uri.password);
                }


                if (utils.log.isDebug()) {
                    // handles console messages from within an page.evaluate function or inject.js file
                    page.property('onConsoleMessage', function(msg) {
                        console.log(msg);
                    });
                }


                return page.open(url).then(function(pageStatus) {

                    utils.log.log('\n   ', utils.log.chalk.underline.yellow(folder));

                    page.property('onLoadFinished').then(function() {

                        // check for Salesforce parts in URL
                        if (url.indexOf('visual.force') > -1 && !options.isLoggedIn) {

                            var hostName = new urlParse(url, true);

                            outputFilePath = path.join(options.paths.output, hostName.host);

                            authSalesforce(page, function() {
                                renderViewPort(options.viewports.length, page, pageStatus, url);
                            });
                        } else if (pageStatus === 'success') {

                            renderViewPort(options.viewports.length, page, pageStatus, url);

                        } else {
                            return nextPage(pageStatus, url, outputFile);
                        }

                    });

                });


            });

        } else {
            return callbackFinal();
        }
    };

    return retrievePage();
};

/**
 * Screenshot Object
 * @author Steven Britton
 * @date   2016-04-14
 * @param  {Array}   pages   list of links passed from sitemap.xml file
 * @param  {Object}  options [description]
 */
function Screenshot(parameters) {

    utils.log.verbose('Screenshot: constructor', parameters);

    utils.log.log(utils.log.chalk.yellow.bold(' ⤷ Generating screenshots'));

    this.pages = parameters.pages;
    this.options = parameters.options;
    this.options.isLoggedIn = false;

    this.options.website = new Website(this.options);

    var exclusions, regExclusions;
    var screenshotExclusions = ['pdf'];

    // format exclusions
    exclusions = screenshotExclusions.join('|');

    // regular expression for exclusions
    regExclusions = new RegExp('\.(' + exclusions + ')', 'i');

    // filter screenshotExclusions
    this.pages = this.pages.filter(function(page) {
        return !page.match(regExclusions);
    });

}

Screenshot.prototype.start = function() {

    var d = Q.defer(),
        options = this.options,
        pages = this.pages,
        phantomOptions = [];

    options.isLoggedIn = false;

    if (options.sitecrawler_options.ignoreInvalidSSL) {
        phantomOptions.push('--ignore-ssl-errors=yes');
    }

    phantom.create(phantomOptions).then(function(ph) {


        renderUrlsToFile(ph, options, pages, function(status, url, file) {

            utils.log.verbose('\nFunction: callbackPerUrl\n');

            if (status !== 'success') {
                return utils.log.verbose('Unable to render ', url);
            } else {
                return utils.log.verbose('Rendered ', url, ' at ', file);
            }
        }, function() {

            utils.log.verbose('\nFunction: callbackFinal\n');

            ph.exit();

            utils.log.log(utils.log.chalk.yellow.bold('\n ⤷ Collecting website content'));

            options.website.writeContentCollection(function(err) {
                if (err) {
                    d.reject(err);
                } else {

                    utils.log.log(utils.log.chalk.green.bold('\n   ✔︎ Successfully saved:'), utils.log.chalk.green('content-collection.json'));
                    utils.log.log(utils.log.chalk.green.bold('   ✔︎ Pages added:'), utils.log.chalk.green(options.website.contentCollection.pages.length));

                    d.resolve();
                }

            });

        });

    });

    return d.promise;
};

module.exports = Screenshot;
