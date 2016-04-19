'use strict';

var asynEach = require('async-foreach').forEach,
    chalk = require('chalk'),
    fs = require('graceful-fs'),
    globby = require('globby'),
    path = require('path'),
    PDF = require('pdfkit'),
    Q = require('q'),
    sizeOf = require('image-size'),
    utils = require('./utils'),
    Website = require('./website');



function getDate() {

    var d = new Date(),
        date =
        d.getUTCFullYear() + '-' +
        (d.getUTCMonth() + 1) + '-' +
        d.getUTCDate();
    return date;
}

function getFiles(outputPath, size) {
    return globby.sync([path.join(outputPath, '**', '*' + size + '.png')]);
}

function createPDF(pdfShooter, arrImages, dimensions, domainName, outputPath, viewport, done) {

    utils.log.verbose('createPDF', arguments);

    var date = getDate(),
        page,
        pdfPath = path.resolve(outputPath, utils.urlToDir(domainName) + '-' + viewport + '-' + date + '.pdf'),
        writeStream;

    utils.log.verbose('pdfPath', pdfPath);

    var pdf = new PDF({
        layout: 'portrait',
        size: [dimensions.width, sizeOf(arrImages[0]).height],
        margin: 0
    });


    writeStream = fs.createWriteStream(pdfPath);

    pdf.pipe(writeStream);

    pdf.pipe(fs.createWriteStream(pdfPath));

    arrImages.forEach(function(png, i) {

        page = png.replace('screenshots/', '');

        // remove from last slash and remaining chars (e.g., /1600.png)
        page = page.substr(0, page.lastIndexOf('/'));

        // get page information stored in website collection
        // @todo: remove hard-coded http:// comparison
        page = pdfShooter.website.contentCollection.pages.filter(function(item, indx, arr) {
            return (item.loc === 'http://' + page);
        });


        if (i > 0) {
            pdf.addPage({
                size: [sizeOf(png).width, sizeOf(png).height],
                width: sizeOf(png).width,
                height: sizeOf(png).height
            });
        }

        if (page[0] !== undefined) {

            pdf.fontSize(20)
                .fillColor('blue')
                .text(page[0].loc, 5, 10);


            pdf.fontSize(20)
                .fillColor('black')
                .text('Meta Title: ' + page[0].meta.title, 5, 40);
        }

        pdf.image(png, 0, 60);
    });

    pdf.end();

    writeStream.on('finish', function() {

        done();

    });

}


/**
 * PDFShooter Object
 * @author Steven Britton
 * @date   2016-04-14
 * @param  {Object}  options [description]
 */
function PDFShooter(parameters) {

    utils.log.verbose('PDFShooter: constructor', parameters);

    this.options = parameters;
    this.website = new Website(this.options);

}


PDFShooter.prototype.start = function() {

    console.log(chalk.yellow.bold('\n ⤷ Generating PDFs'));

    var deferred = Q.defer(),
        domainName = this.options.domain.name,
        outputPath = this.options.paths.output,
        pdfs = [],
        pdfShooter = this;


    // load array of viewports and their respective .png files
    pdfs = this.options.viewports.map(function(item, i) {
        return {
            'viewport': item.viewport,
            'dimensions': { 'width': item.width, 'height': item.height },
            'files': getFiles(outputPath, item.width)
        };
    });




    pdfShooter.website.get()

    .then(function() {

        // create individual pdfs based on viewport
        return asynEach(pdfs, function(item, i) {

            var done = this.async();

            // make sure we have some screenshots
            if (item.files.length > 0) {
                createPDF(pdfShooter, item.files, item.dimensions, domainName, outputPath, item.viewport, function() {
                    done();
                });
            } else {

                console.log(chalk.red.bold('   ✗ '), chalk.red('Screenshots for viewport '), chalk.red.bold(item.viewport), chalk.red(' do not exist.'));

                done();
            }

        }, function(success, array) {
            if (success) {
                deferred.resolve(array);

            } else {
                deferred.reject(success);
            }
        });

    });


    return deferred.promise;
};

module.exports = PDFShooter;
