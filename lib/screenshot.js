var config = require('./config'),
    globby = require('globby'),
    imagemin = require('imagemin'),
    imageminPngquant = require('imagemin-pngquant'),
    path = require('path'),
    phantom = require('phantom'),
    Q = require('q'),
    urlParse = require('url-parse'),
    utils = require('./utils');


/*
@param ph phantom object
@param array of options
@param array of URLs to render
@param callbackPerUrl Function called after finishing each URL, including the last URL
@param callbackFinal Function called after finishing everything
*/
var renderUrlsToFile = function(ph, options, urls, callbackPerUrl, callbackFinal) {

    utils.log.verbose('Function: renderUrlsToFile');

    // function declarations
    var authMicrosoftOnline, authSalesforce, collectWebsiteInformation, getFileName, getDocumentReadyState, getUserAgent, nextPage, retrievePage, renderViewPort, waitFor;

    var contentCollection = { 'pages': [] },
        isLoggedIn = false,
        outputFile, outputFilePath;

    var transparentBackground = options.screenshot_options.transparent_background || false;

    outputFilePath = options.paths.output;


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

            isLoggedIn = true;

            return callbackAuthSalesforce();

        }, 30000);

    };

    authMicrosoftOnline = function(page, callbackAuthMicrosoftOnline) {

        var hostName;

        utils.log.log(utils.log.chalk.yellow.bold('\n   ⤷  Microsoft Online Detected.\n\n      3 Step Authentication Process Required:'));

        setTimeout(function() {

            utils.log.log(utils.log.chalk.green.bold('\n     ✔︎  STEP 1: Redirect'));

            page.evaluate(function() {

                hostName = window.location.hostname;

                // make sure old login version is displayed
                document.getElementById('uxOptOutLink').click();

                console.log('hostName', hostName);
                console.log('INDEX OF', hostName.indexOf('.microsoftonline.com'));

            });

        }, 10000);

        setTimeout(function() {

            utils.log.log(utils.log.chalk.green.bold('     ✔︎  STEP 2: Populate user'));

            page.evaluate(function(user) {

                hostName = window.location.hostname;

                // Populate and submit Login form
                if (hostName.indexOf('.microsoftonline.com') > -1) {

                    document.getElementById('cred_userid_inputtext').value = user;
                    document.getElementById('cred_password_inputtext').click();
                }

            }, options.domain.uri.username, options.domain.uri.password);

        }, 20000);


        setTimeout(function() {

            utils.log.log(utils.log.chalk.green.bold('     ✔︎  STEP 3: Populate Password'));

            page.evaluate(function(password) {

                hostName = window.location.hostname;

                console.log(hostName);

                // Populate and submit Login form
                if (hostName.indexOf('login.live.com') > -1) {

                    document.getElementById('i0118').value = password;
                    document.getElementById('i0281').submit();
                }

            }, options.domain.uri.password);

        }, 30000);

        setTimeout(function() {

            utils.log.log(utils.log.chalk.green.bold('     ✔︎  STEP 4: Success\n'));

            isLoggedIn = true;

            return callbackAuthMicrosoftOnline();

        }, 40000);

    };

    collectWebsiteInformation = function(page, url) {

        var pageExists = false,
            pageURL;

        // strip potential page event(?pevent or &pevent) from URL
        pageURL = url.substring(0).search(/([?&])\pevent/g) !== -1 ? url.substr(0, url.substring(0).search(/([?&])\pevent/g)) : url;

        // check for page in content collection
        pageExists = contentCollection.pages.find(function(page) {
            return page.loc === pageURL;
        });

        // collect page content once
        return utils.executeWhen(!pageExists, function() {

            utils.log.verbose('Adding page to content collection: ', url);

            return page.evaluate(function() {

                var data = {
                    headers: [],
                    images: [],
                    links: [],
                    meta: [],
                    scripts: [],
                };

                if (!transparentBackground) {
                    document.body.bgColor = 'white';
                }

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

                    jQuery('img:not([src^="data:"])').map(function() {
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
                            //html: jQuery(this).html(),
                            rel: jQuery(this).attr('rel')
                        });
                    });

                    jQuery('script').map(function() {

                        if (jQuery(this).attr('src')) {
                            data.scripts.push({
                                src: jQuery(this).attr('src'),
                                text: jQuery(this).html()
                            });
                        }

                    });
                }

                return data;

            }).then(function(data) {

                // add website content collection
                contentCollection.pages.push({
                    body: {
                        headers: data.headers,
                        images: data.images,
                        links: data.links
                    },
                    loc: pageURL,
                    meta: data.meta,
                    scripts: data.scripts,
                });

            });
        });

    };

    getFileName = function(_folder, _viewportIndex) {

        var fileName = options.viewports[_viewportIndex].viewport + '.png',
            folderName = new urlParse(_folder, true);

        if (_folder.indexOf('visual.force') > -1) {

            // Parse Salesforce URL and grab the 'name' get variable
            // Example URL: [domain]dm--cms.na15.visual.force.com/apex/Preview?sname=DevOpsGroup&name=index
            _folder = folderName.query.name + folderName.hash;
        } else {
            // remove ? from folder name
            _folder = _folder.indexOf('?') > -1 ? _folder.substring(0, _folder.indexOf('?')) : _folder;
        }

        if (folderName.query.pevent) {
            fileName = options.viewports[_viewportIndex].viewport + '-event-' + folderName.query.pevent + '.png';
        }

        return path.join(outputFilePath, _folder, fileName);
    };

    getDocumentReadyState = function(page) {
        return page.evaluate(function() {
            return document.readyState === 'complete';
        });
    };

    getUserAgent = function(viewport) {

        var userAgent = '';

        switch (viewport) {

            case 'iPhone6':
                userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1';
                break;
            default:
                userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/538.1 (KHTML, like Gecko) Safari/538.1';
                break;
        }

        utils.log.verbose('Function: getUserAgent', userAgent);

        return userAgent;
    };


    nextPage = function(status, url, file) {

        utils.log.verbose('Function: nextPage');

        callbackPerUrl(status, url, file);

        return retrievePage();
    };

    renderViewPort = function(viewportCounter, page, status, url) {


        if (!!viewportCounter) {

            utils.log.verbose('Function: renderViewPort');

            var viewportIndex = viewportCounter - 1;

            utils.log.log(utils.log.chalk.green.bold('    ✔︎  Viewport:'), utils.log.chalk.green(options.viewports[viewportIndex].viewport + '(' + options.viewports[viewportIndex].width + 'x' + options.viewports[viewportIndex].height + ')'));

            outputFile = path.join(config.process.get('working_directory'), getFileName(utils.urlToDir(url), viewportIndex));

            waitFor(function() {
                return getDocumentReadyState(page);
            }, function() {
                return collectWebsiteInformation(page, url)
                    .then(function() {

                        utils.log.verbose('Injecting custom siteshooter JS object');

                        return page.evaluate(function(viewportsTotal, viewportsCurrent) {

                            // pass settings to the DOM
                            window.siteshooter = {};
                            window.siteshooter.viewportsTotal = viewportsTotal;
                            window.siteshooter.viewportsCurrent = viewportsCurrent;

                        }, options.viewports.length, viewportIndex);
                    })
                    .then(function() {

                        utils.log.verbose('Injecting inject.js file');

                        return page.injectJs(path.join(config.process.get('working_directory'), 'inject.js'));

                    })
                    .then(function(status) {
                        utils.log.debug('inject.js script loaded: ' + status);
                        utils.log.verbose('inject.js script loaded', status);
                    })
                    .then(function() {

                        setTimeout(function() {

                            utils.log.debug('Rendering page with a set delay of ', options.screenshot_options.delay, ' milliseconds');
                            utils.log.verbose('Rendering page with a set delay of', options.screenshot_options.delay, ' milliseconds');

                            return page.render(outputFile).then(function() {

                                if (viewportIndex !== 0) {

                                    utils.log.verbose('Multiple viewports detected. Setting up fresh page for next viewport.');

                                    page.setting('userAgent', getUserAgent(options.viewports[viewportIndex - 1].viewport));

                                    page.property('viewportSize', {
                                        'width': options.viewports[viewportIndex - 1].width,
                                        'height': options.viewports[viewportIndex - 1].height
                                    });


                                    page.on('onLoadFinished', function(status) {

                                        // reset function
                                        page.off('onLoadFinished');

                                        renderViewPort(viewportIndex, page, status, url);
                                    });

                                    page.open(url);

                                } else {
                                    renderViewPort(viewportIndex, page, status, url);
                                }

                            });

                        }, options.screenshot_options.delay);

                    });

            });

        } else {

            page.close();

            return nextPage(status, url, outputFile);
        }
    };

    retrievePage = function() {

        var folder, httpHeaders, url, viewportIndex;

        if (urls.length > 0) {

            utils.log.verbose('Function: retrievePage');


            httpHeaders = {
                'Connection':'keep-alive'
            };

            viewportIndex = options.viewports.length - 1;

            url = urls.shift();

            folder = utils.urlToDir(url);

            utils.log.log('\n   ', utils.log.chalk.underline.yellow(folder));

            ph.createPage().then(function(page) {

                utils.log.verbose('PhantomJS - createPage');

                // do we have stored credentials?
                if ( options.domain.uri.auth ) {

                    httpHeaders.Authorization = 'Basic ' + Buffer.from(options.domain.uri.username + ':'+ options.domain.uri.password, 'binary').toString('base64');

                    utils.log.verbose('Setting Authorization header:', httpHeaders.Authorization);
                }

                page.property('customHeaders', httpHeaders);

                page.setting('userAgent', getUserAgent(options.viewports[viewportIndex].viewport));

                page.property('viewportSize', {
                    'width': options.viewports[viewportIndex].width,
                    'height': options.viewports[viewportIndex].height
                });


                if (utils.log.isDebug()) {

                    // handles console messages from within an page.evaluate function or inject.js file
                    page.on('onConsoleMessage', function(msg) {
                        console.log(msg);
                    });

                    page.on('onResourceError', function(resourceError) {
                        console.log('    Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString);
                        console.log('    Unable to load resource: ' + resourceError.url);
                    });

                    page.on('onError', function(msg, trace) {
                        var msgStack = ['ERROR: ' + msg];

                        if (trace && trace.length) {
                            msgStack.push('TRACE:');
                            trace.forEach(function(t) {
                                msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function+'")' : ''));
                            });
                        }

                        console.error(msgStack.join('\n'));
                    });
                }

                page.on('onLoadFinished', function(pageStatus) {

                    utils.log.verbose('PhantomJS - onLoadFinished ', pageStatus);

                    // reset function
                    page.off('onLoadFinished');

                    // check for Salesforce parts in URL
                    if (url.indexOf('visual.force') > -1 && !isLoggedIn) {

                        var hostName = new urlParse(url, true);

                        outputFilePath = path.join(options.paths.output, hostName.host);

                        authSalesforce(page, function() {
                            renderViewPort(options.viewports.length, page, pageStatus, url);
                        });

                        // check for Microsoft Online parts in URL
                    } else if (options.domain.uri.password && options.domain.uri.auth && (url.indexOf('.sharepoint.com') > -1 || url.indexOf('.azurewebsites') > -1) && !isLoggedIn) {

                        authMicrosoftOnline(page, function() {
                            renderViewPort(options.viewports.length, page, pageStatus, url);
                        });

                    } else if (pageStatus === 'success') {
                        renderViewPort(options.viewports.length, page, pageStatus, url);

                    } else {
                        return nextPage(pageStatus, url, outputFile);
                    }

                });

                page.open(url).then(function(pageStatus) {
                    utils.log.verbose('PhantomJS - Open Page:', url, pageStatus);
                });

            });

        } else {
            return callbackFinal(contentCollection);
        }
    };

    waitFor = function(testFx, onReady, timeOutMillis) {



        var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 10000, //< Default Max Timout is 10s
            start = new Date().getTime(),
            condition = false,
            interval = setInterval(function() {

                utils.log.verbose('Document Ready:', condition);

                if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {

                    condition = testFx();

                    // is test a Promise? If so, check its status
                    if (Object.prototype.toString.call(condition) === '[object Promise]') {
                        condition.then(function(value) {
                            condition = value;
                        });
                    }

                } else {
                    if (!condition) {
                        console.log('\n\n condition kill');
                        //ph.exit(1);
                    } else {

                        clearInterval(interval);

                        return onReady();
                    }
                }
            }, 250); //< repeat check every 250ms
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
function Screenshot(pages) {

    utils.log.verbose('Screenshot: constructor', pages);

    utils.log.log('');
    utils.log.log(utils.log.chalk.yellow.bold(' ⤷ Generating screenshots'));

    this.pages = pages;


    var screenshotExclusions = ['pdf'];

    // format exclusions
    screenshotExclusions = screenshotExclusions.join('|');

    // regular expression for exclusions
    screenshotExclusions = new RegExp('\.(' + screenshotExclusions + ')', 'i');

    // remove trailing slashes, remove duplicates, and filter screenshotExclusions
    this.pages = this.pages.map(utils.urlRemoveTrailingSlash).filter(function(val, ind, pages) {
        return pages.indexOf(val) === ind;
    }).filter(function(page) {
        return !page.match(screenshotExclusions);
    });

}

Screenshot.prototype.start = function() {

    var d = Q.defer(),
        options = config.getOptions(),
        pages = this.pages,
        phantomOptions = [];

    if (options.sitecrawler_options.ignoreInvalidSSL) {
        phantomOptions.push('--ignore-ssl-errors=yes');
    }

    //phantomOptions.push('--local-to-remote-url-access=yes');
    
    //phantomOptions.push('--web-security=no');
    
    //phantomOptions.push('--local-to-remote-url-access=yes');
    
    


    phantom.create(phantomOptions).then(function(ph) {

        config.process.set('phantomjs', ph.process.pid);

        return Q.promise(function(promiseResolve, promiseReject) {
            return renderUrlsToFile(ph, options, pages, function(status, url, file) {

                utils.log.verbose('Function: callbackPerUrl');

                if (status !== 'success') {
                    return utils.log.verbose('Unable to render ', url);
                } else {
                    return utils.log.verbose('Rendered ', url, ' at ', file);
                }
            }, function(contentCollection) {

                utils.log.verbose('Function: callbackFinal');

                setTimeout(function() {
                    ph.exit();
                    promiseResolve(contentCollection);
                }, 2000);
            });
        });

    }).then(function(contentCollection) {

        return globby([path.join(config.process.get('working_directory'), options.paths.output, '**', '*.png')])
            .then(function(paths) {

                utils.log.verbose('Optimizing screenshot images');

                // optimize screenshot images
                return Q.promise(function(promiseResolve, promiseReject) {

                    var mapImages = paths.map(function(imagePath) {
                        return imagemin([imagePath], path.parse(imagePath).dir, { use: [imageminPngquant({ quality: options.screenshot_options.image_quality })] });
                    });

                    Q.all(mapImages).done(function() {
                        promiseResolve();
                    }, function(err) {
                        promiseReject(err);
                    });
                });

            }).then(function() {

                utils.log.log(utils.log.chalk.yellow.bold('\n ⤷ Collecting website content'));

                return utils.writeFile(path.join(config.process.get('working_directory'), '.siteshooter', 'content-collection.json'), JSON.stringify(contentCollection));

            }).then(function() {

                utils.log.log(utils.log.chalk.green.bold('\n   ✔︎ Successfully saved:'), utils.log.chalk.green('content-collection.json'));
                utils.log.log(utils.log.chalk.green.bold('   ✔︎ Pages added:'), utils.log.chalk.green(contentCollection.pages.length));

                d.resolve();

            }).catch(d.reject);

    }).catch(d.reject);



    return d.promise;
};

module.exports = Screenshot;
