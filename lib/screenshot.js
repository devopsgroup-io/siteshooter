'use strict';

var asynEach = require('async-foreach').forEach,
    chalk = require('chalk'),
    path = require('path'),
    phantom = require('phantom'),
    Q = require('q'),
    utils = require('./utils');


var screenshotExclusions = ['pdf'];

/**
 * Loops through defined viewports, rendering passed url, and taking screenshots using PhantomJS
 * @author Steven Britton
 * @date   2016-04-14
 * @param  {[type]}   options [description]
 * @param  {String}   url     [description]
 * @param  {Function} done    [description]
 * @return {[type]}           [description]
 */
function renderPage(options, url, done) {

    utils.log.verbose('Screenshot: renderPage');


    var folder = utils.urlToDir(url),
        phantomOutObj,
        phantomOutObj2,
        viewports = options.viewports,
        output, key;


    function handleMsgStack(msgStack){

        if(Array.isArray(msgStack) && msgStack.length > 0){
            console.log('\n    ', chalk.red.bold(msgStack.join('\n     ')), '\n');
        }
    }

    phantom.create().then(function(ph) {

        ph.createPage().then(function(page) {

            // do we have stored credentials?
            if (options.domain.auth.user !== null && options.domain.auth.pwd !== null) {

                utils.log.verbose('\n   ⤷  Setting Authentication');

                page.setting('userName', options.domain.auth.user);
                page.setting('password', options.domain.auth.pwd);
            }

            // Create an Output object to pass through Phantom since PhantomJS does not share any memory or variables with node
            phantomOutObj = ph.createOutObject();
            phantomOutObj2 = ph.createOutObject();

            // Create property to tracking messages while working with PhantomJS
            phantomOutObj.msgStackJS = [];
            phantomOutObj2.msgStackResources = [];

            /**
             * Callback function that's invoked when there is a JavaScript execution error
             * @author Steven Britton
             * @date   2016-05-12
             * @param  {String}   msg           error messages
             * @param  {Object}   trace         error trace
             * @param  {Array}    out           captures and returns error messages
             * @param  {Object}   phantomOutObj
             * @return {Object}   phantomOutObj
             */
            page.property('onError', function(msg, trace, out) {

                out.msgStackJS.push('JS ERROR:');
                out.msgStackJS.push('');
                out.msgStackJS.push(msg);

                if (trace && trace.length) {
                    trace.forEach(function(t) {
                        out.msgStackJS.push('File: ' + t.file);
                        out.msgStackJS.push('Line: ' + t.line);
                        out.msgStackJS.push('Function: ' + t.function);
                    });
                }
            }, phantomOutObj);

            /**
             * Callback function that's invoked when there is a resource load error
             * @author Steven Britton
             * @date   2016-05-12
             * @param  {String}   msg           error messages
             * @param  {Object}   trace         error trace
             * @param  {Array}    out           captures and returns error messages
             * @param  {Object}   phantomOutObj
             * @return {Object}   phantomOutObj
             */

            page.property('onResourceError', function(resourceError, out) {

                out.msgStackResources.push('ResourceError: ' + resourceError.url);
                out.msgStackResources.push('Error code: ' + resourceError.errorCode);
                out.msgStackResources.push('Error Description: ' + resourceError.errorString);

            }, phantomOutObj2);


            /**
             * PhantonJS Page Open function
             * @author Steven Britton
             */
            page.open(url).then(function(status) {

                function renderView(n) {

                    if (!!n) {
                        key = n - 1;

                        //var _pageContent = page.property('content');

                        console.log(chalk.green.bold('    ✔︎  Viewport:'), chalk.green(viewports[key].width + 'x' + viewports[key].height));

                        page.property('viewportSize', { 'width': viewports[key].width, 'height': viewports[key].height });

                        output = path.join(options.paths.output, folder, viewports[key].width + '.png');

                        setTimeout(function() {
                            page.render(output).then(function() {

                                /*
                                pageContent.push({
                                    'page': key,
                                    'content': _pageContent
                                });*/

                                renderView(key);

                            });
                        }, options.screenshot.delay);

                    } else {

                        ph.exit(0);

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



            /**
             * Callback functions for custom output properties
             * @author Steven Britton
             */
            phantomOutObj.property('msgStackJS').then(function(msgStack) {

                handleMsgStack(msgStack);
            });

             phantomOutObj2.property('msgStackResources').then(function(msgStack) {
                handleMsgStack(msgStack);
            });


        });
    });
}


/**
 * Screenshot Object
 * @author Steven Britton
 * @date   2016-04-14
 * @param  {Array}   pages   list of links passed from sitemap.xml file
 * @param  {Object}  options [description]
 */
function Screenshot(parameters) {

    utils.log.verbose('Screenshot: constructor', parameters);

    console.log(chalk.yellow.bold(' ⤷ Generating screenshots'));

    this.pages = parameters.pages;
    this.options = parameters.options;


    var exclusions, regExclusions;

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

    utils.log.verbose('Screenshot: start');

    var d = Q.defer(),
        options = this.options;

    asynEach(this.pages, function(page) {

        utils.log.verbose('Screenshot: start asynEach', page);

        var done = this.async();

        renderPage(options, page, function(err) {

            if (err) {
                utils.log.error(err);
            }

            done();
        });

    }, function(success, array) {

        if (success) {
            d.resolve(array);

        } else {
            d.reject(success);
        }

    });

    return d.promise;
};



module.exports = Screenshot;
