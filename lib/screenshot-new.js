var chalk = require('chalk'),
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

    utils.log.verbose('');
    utils.log.verbose('Function: renderUrlsToFile');
    utils.log.verbose('');

    var key, outputFile;

    var authSalesforce, getFileName, nextPage, retrievePage, renderViewPort;



    authSalesforce = function(page, callbackAuthSalesforce) {

        var hostName;

        utils.log.log(chalk.yellow.bold('\n   ⤷  Salesforce Detected.\n\n      3 Step Authentication Process Required:'));

        setTimeout(function() {

            utils.log.log(chalk.green.bold('\n     ✔︎  STEP 1: Redirect'));

            page.evaluate(function() {

                hostName = window.location.hostname;

                console.log('hostName', hostName);
                console.log('INDEX OF', hostName.indexOf('my.salesforce.com'));

                if ( hostName.indexOf('my.salesforce.com') > -1 ) {


                    var btnWrapper = document.getElementById('idp_section_buttons'),
                        btn = btnWrapper.querySelectorAll('button');

                    btn[0].click();
                }

            });
        }, 10000);


        setTimeout(function() {

            utils.log.log(chalk.green.bold('     ✔︎  STEP 2: Login'));

            page.evaluate(function(options) {

                hostName = window.location.hostname;

                // Populate and submit Login form
                if ( hostName.indexOf('smusxath') > -1 ) {

                    document.Login.USER.value = options.domain.auth.user;
                    document.Login.PASSWORD.value = options.domain.auth.pwd;
                    document.Login.submit();
                }

            }, options);
        }, 20000);

        setTimeout(function() {

            utils.log.log(chalk.green.bold('     ✔︎  STEP 3: Success\n'));

            options.isLoggedIn = true;

            return callbackAuthSalesforce();

        }, 30000);

    };

    getFileName = function(folder){

        if( folder.indexOf('visual.force') > -1 ){

            var folderName = new urlParse(folder, true);

            utils.log.verbose('Function: getFileName');
            utils.log.verbose('Salesforce: folderName');
            utils.log.verbose(folderName);

            // Parse Salesforce URL and grab the 'name' get variable
            // Example URL: [domain]dm--cms.na15.visual.force.com/apex/Preview?sname=DevOpsGroup&name=index
            folder = folderName.query.name + folderName.hash;
        }
        return path.join(options.paths.output, folder, options.viewports[key].width + '.png');
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

            var folder = utils.urlToDir(url);

            key = n - 1;

            utils.log.log(chalk.green.bold('    ✔︎  Viewport:'), chalk.green(options.viewports[key].width + 'x' + options.viewports[key].height));

            page.property('viewportSize', {
                'width': options.viewports[key].width,
                'height': options.viewports[key].height
            });

            outputFile = getFileName(folder);

            page.injectJs('inject.js');


            setTimeout(function() {
                page.render(outputFile).then(function() {

                    renderViewPort(key, page, status, url);

                });
            }, options.screenshot.delay);

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
                if (options.domain.auth.user !== null && options.domain.auth.pwd !== null && options.isLoggedIn === false) {

                    utils.log.verbose('\n   ⤷  Setting Authentication');

                    page.setting('userName', options.domain.auth.user);
                    page.setting('password', options.domain.auth.pwd);
                }

                if( utils.log.isDebug() ){
                    // handles console messages from within an page.evaluate function or inject.js file
                    page.property('onConsoleMessage', function(msg) {
                        console.log(msg);
                    });
                }

                return page.open(url).then(function(status) {

                    utils.log.log('\n   ', chalk.underline.yellow(folder));

                    // check for Salesforce parts in URL
                    if( url.indexOf('visual.force') > -1 && !options.isLoggedIn ) {

                        var hostName = new urlParse(url, true);

                        options.paths.output = path.join(options.paths.output, hostName.host);

                        authSalesforce(page, function(){
                           renderViewPort(options.viewports.length, page, status, url);
                        });
                    }
                    else if (status === 'success') {

                        renderViewPort(options.viewports.length, page, status, url);

                    } else {
                        return nextPage(status, url, outputFile);
                    }
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

    utils.log.log(chalk.yellow.bold(' ⤷ Generating screenshots'));

    this.pages = parameters.pages;
    this.options = parameters.options;
    this.options.isLoggedIn = false;

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

            return d.resolve();
        });

    });

    return d.promise;
};

module.exports = Screenshot;
