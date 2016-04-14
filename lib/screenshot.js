'use strict';

var asynEach = require('async-foreach').forEach,
    chalk = require('chalk'),
    path = require('path'),
    phantom = require('phantom'),
    Q = require('q'),
    utils = require('./utils');




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
